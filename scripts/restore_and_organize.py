import json
import os
import sys
import cv2
import numpy as np

SRC_DIR = "old"
TARGET_DIR = "assets/img"
JSON_IN = "colegi_public.json"
JSON_OUT = "assets/data/colegi.json"
MAX_DIM = 640
JPEG_QUALITY = 85
SAT_THRESHOLD = 22

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def is_bw_photo(img_bgr):
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    return hsv[:, :, 1].mean() < SAT_THRESHOLD


def detect_face_protect_mask(gray):
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    if len(faces) == 0:
        return None
    protect = np.zeros(gray.shape, dtype=np.uint8)
    for (x, y, w, h) in faces:
        mx = int(w * 0.25)
        my_top = int(h * 0.35)
        my_bot = int(h * 0.25)
        x0, y0 = max(0, x - mx), max(0, y - my_top)
        x1, y1 = min(gray.shape[1], x + w + mx), min(gray.shape[0], y + h + my_bot)
        protect[y0:y1, x0:x1] = 255
    return protect


def build_defect_mask(gray, protect_mask):
    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel_small)
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel_small)
    defect_map = cv2.add(blackhat, tophat)
    _, mask = cv2.threshold(defect_map, 35, 255, cv2.THRESH_BINARY)

    if protect_mask is not None:
        mask = cv2.bitwise_and(mask, cv2.bitwise_not(protect_mask))

    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    speck_mask = np.zeros_like(mask)
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        aspect = max(w, h) / max(1, min(w, h))
        if area <= 25 or (aspect >= 4 and area <= 400):
            speck_mask[labels == i] = 255

    return cv2.dilate(speck_mask, np.ones((3, 3), np.uint8), iterations=1)


def restore_bw(img_bgr):
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    protect = detect_face_protect_mask(gray)
    mask = build_defect_mask(gray, protect)
    inpainted = cv2.inpaint(gray, mask, 3, cv2.INPAINT_TELEA)
    denoised = cv2.fastNlMeansDenoising(inpainted, h=6, templateWindowSize=7, searchWindowSize=21)
    clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    blur = cv2.GaussianBlur(enhanced, (0, 0), 1.5)
    sharpened = cv2.addWeighted(enhanced, 1.3, blur, -0.3, 0)
    return cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)


def process_image(src_path, dst_path):
    img = cv2.imread(src_path, cv2.IMREAD_COLOR)
    if img is None:
        return False
    out = restore_bw(img) if is_bw_photo(img) else img

    h, w = out.shape[:2]
    scale = min(1.0, MAX_DIM / max(h, w))
    if scale < 1.0:
        out = cv2.resize(out, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    cv2.imwrite(dst_path, out, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    return True


def build_source_index():
    index = {}
    for name in os.listdir(SRC_DIR):
        index[name.lower()] = os.path.join(SRC_DIR, name)
    return index


def process_persoane(persoane, source_index, missing, restored_count, copied_count):
    for persoana in persoane:
        new_poze = []
        idx = 1
        for poza in persoana.get("poze", []):
            key = poza.lower()
            if key in source_index:
                src_path = source_index[key]
                dst_name = f"{persoana['id']}-{idx}.jpg"
                dst_path = os.path.join(TARGET_DIR, dst_name)
                try:
                    img = cv2.imread(src_path, cv2.IMREAD_COLOR)
                    bw = is_bw_photo(img) if img is not None else False
                    if process_image(src_path, dst_path):
                        new_poze.append(dst_name)
                        copied_count[0] += 1
                        if bw:
                            restored_count[0] += 1
                        idx += 1
                except Exception as e:
                    print(f"WARN: failed to process {src_path}: {e}")
            else:
                missing.append(f"{persoana['id']}: {poza}")
        persoana["poze"] = new_poze


def main():
    os.makedirs(TARGET_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)

    with open(JSON_IN, "r", encoding="utf-8") as f:
        data = json.load(f)

    source_index = build_source_index()
    missing = []
    restored_count = [0]
    copied_count = [0]

    process_persoane(data.get("colegi", []), source_index, missing, restored_count, copied_count)
    if data.get("profesori"):
        process_persoane(data["profesori"], source_index, missing, restored_count, copied_count)

    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Processed {copied_count[0]} images, restored (B&W pipeline) {restored_count[0]} of them.")
    print(f"Missing source files ({len(missing)}):")
    for m in missing:
        print(f"  {m}")


if __name__ == "__main__":
    main()
