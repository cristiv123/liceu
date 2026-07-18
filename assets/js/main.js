(function () {
  "use strict";

  const IMG_BASE = "assets/img/";

  const grid = document.getElementById("colegi-grid");
  const profesoriGrid = document.getElementById("profesori-grid");
  const albumeGrid = document.getElementById("albume-grid");
  const videoGrid = document.getElementById("video-grid");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxPrev = document.getElementById("lightbox-prev");
  const lightboxNext = document.getElementById("lightbox-next");

  let activePersoana = null;
  let activeIndex = 0;

  function renderPersoane(container, persoane, subtitleField) {
    if (!container) return;
    container.innerHTML = "";
    persoane.forEach((persoana) => {
      const poze = persoana.poze && persoana.poze.length ? persoana.poze : null;
      const card = document.createElement("article");
      card.className = "coleg-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Vezi pozele lui ${persoana.nume}`);

      const photoWrap = document.createElement("div");
      photoWrap.className = "coleg-photo-wrap";
      if (persoana.decedat) photoWrap.classList.add("in-memoriam-frame");
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = persoana.nume;
      img.src = poze ? IMG_BASE + poze[0] : "";
      photoWrap.appendChild(img);

      const info = document.createElement("div");
      info.className = "coleg-info";
      const name = document.createElement("h3");
      name.className = "coleg-name";
      name.textContent = persoana.nume;
      info.appendChild(name);

      const subtitle = persoana[subtitleField];
      if (subtitle) {
        const subtitleEl = document.createElement("p");
        subtitleEl.className = "coleg-city";
        subtitleEl.textContent = subtitle;
        info.appendChild(subtitleEl);
      }

      if (persoana.decedat) {
        const memoriam = document.createElement("p");
        memoriam.className = "in-memoriam-label";
        memoriam.textContent = "In memoriam";
        info.appendChild(memoriam);
      }

      if (poze && poze.length > 1) {
        const count = document.createElement("span");
        count.className = "coleg-photo-count";
        count.textContent = `${poze.length} poze`;
        info.appendChild(count);
      }

      card.appendChild(photoWrap);
      card.appendChild(info);

      if (poze) {
        const open = () => openLightbox(persoana, 0);
        card.addEventListener("click", open);
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        });
      }

      container.appendChild(card);
    });
  }

  const ALBUM_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h3l2-3h8l2 3h3v13H3z"/><circle cx="12" cy="13" r="4"/></svg>`;

  function renderAlbume(albume) {
    if (!albumeGrid) return;
    albumeGrid.innerHTML = "";
    albume.forEach((album) => {
      const card = document.createElement("a");
      card.className = "album-card";
      card.href = album.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";

      const icon = document.createElement("div");
      icon.className = "album-icon";
      icon.innerHTML = ALBUM_ICON;

      const body = document.createElement("div");
      body.className = "album-body";
      const title = document.createElement("p");
      title.className = "album-title";
      title.textContent = album.titlu;
      const cta = document.createElement("span");
      cta.className = "album-cta";
      cta.textContent = "Deschide albumul ↗";
      body.appendChild(title);
      body.appendChild(cta);

      card.appendChild(icon);
      card.appendChild(body);
      albumeGrid.appendChild(card);
    });
  }

  const PLAY_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

  function extractYoutubeId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
    return match ? match[1] : null;
  }

  function renderVideo(video) {
    if (!videoGrid) return;
    videoGrid.innerHTML = "";
    video.forEach((v) => {
      const id = extractYoutubeId(v.url);
      if (!id) return;

      const card = document.createElement("article");
      card.className = "video-card";

      const thumb = document.createElement("div");
      thumb.className = "video-thumb";
      thumb.setAttribute("role", "button");
      thumb.tabIndex = 0;
      thumb.setAttribute("aria-label", `Redă video: ${v.titlu}`);

      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = v.titlu;
      img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

      const playBtn = document.createElement("div");
      playBtn.className = "video-play-btn";
      playBtn.innerHTML = PLAY_ICON;

      thumb.appendChild(img);
      thumb.appendChild(playBtn);

      const playVideo = () => {
        thumb.innerHTML = "";
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
        iframe.title = v.titlu;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        thumb.appendChild(iframe);
      };

      thumb.addEventListener("click", playVideo);
      thumb.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          playVideo();
        }
      });

      const info = document.createElement("div");
      info.className = "video-info";
      const title = document.createElement("h3");
      title.className = "video-title";
      title.textContent = v.titlu;
      info.appendChild(title);

      card.appendChild(thumb);
      card.appendChild(info);
      videoGrid.appendChild(card);
    });
  }

  function openLightbox(persoana, index) {
    activePersoana = persoana;
    activeIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    activePersoana = null;
  }

  function updateLightbox() {
    if (!activePersoana) return;
    const poze = activePersoana.poze;
    lightboxImg.src = IMG_BASE + poze[activeIndex];
    lightboxImg.alt = activePersoana.nume;
    lightboxCaption.textContent = `${activePersoana.nume}${poze.length > 1 ? ` (${activeIndex + 1}/${poze.length})` : ""}`;
    const multi = poze.length > 1;
    lightboxPrev.style.display = multi ? "" : "none";
    lightboxNext.style.display = multi ? "" : "none";
  }

  function step(delta) {
    if (!activePersoana) return;
    const len = activePersoana.poze.length;
    activeIndex = (activeIndex + delta + len) % len;
    updateLightbox();
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => step(-1));
  lightboxNext.addEventListener("click", () => step(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  const footerYear = document.getElementById("footer-year");
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  fetch("assets/data/colegi.json")
    .then((res) => res.json())
    .then((data) => {
      renderPersoane(grid, data.colegi || [], "oras");
      renderPersoane(profesoriGrid, data.profesori || [], "rol");
      renderAlbume(data.album_foto || []);
      renderVideo(data.video || []);
    })
    .catch((err) => {
      grid.innerHTML = '<p style="color:#a94f21">Nu am putut încărca lista colegilor.</p>';
      console.error("Eroare la încărcarea colegi.json:", err);
    });
})();
