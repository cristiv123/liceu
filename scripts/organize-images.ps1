param(
    [string]$SourceDir = "old",
    [string]$TargetDir = "assets/img",
    [string]$JsonIn = "colegi_public.json",
    [string]$JsonOut = "assets/data/colegi.json",
    [int]$MaxDim = 640,
    [int]$JpegQuality = 82
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $TargetDir)) { New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null }
$jsonOutDir = Split-Path $JsonOut -Parent
if (-not (Test-Path $jsonOutDir)) { New-Item -ItemType Directory -Path $jsonOutDir -Force | Out-Null }

# Build case-insensitive lookup of source files
$sourceFiles = @{}
Get-ChildItem -Path $SourceDir -File | ForEach-Object { $sourceFiles[$_.Name.ToLowerInvariant()] = $_.FullName }

function Save-OptimizedImage {
    param([string]$SrcPath, [string]$DstPath)

    $img = [System.Drawing.Image]::FromFile($SrcPath)
    try {
        $w = $img.Width
        $h = $img.Height
        $scale = [Math]::Min(1.0, $MaxDim / [Math]::Max($w, $h))
        $newW = [Math]::Max(1, [int]($w * $scale))
        $newH = [Math]::Max(1, [int]($h * $scale))

        $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
        try {
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            try {
                $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $g.DrawImage($img, 0, 0, $newW, $newH)
            } finally { $g.Dispose() }

            $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
            $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
            $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$JpegQuality)
            $bmp.Save($DstPath, $jpegCodec, $encParams)
        } finally { $bmp.Dispose() }
    } finally { $img.Dispose() }
}

$data = Get-Content $JsonIn -Raw | ConvertFrom-Json

$missing = New-Object System.Collections.Generic.List[string]
$copiedCount = 0

function Process-Persoane($persoane) {
    foreach ($persoana in $persoane) {
        $newPoze = New-Object System.Collections.Generic.List[string]
        $idx = 1
        foreach ($poza in $persoana.poze) {
            $key = $poza.ToLowerInvariant()
            if ($sourceFiles.ContainsKey($key)) {
                $srcPath = $sourceFiles[$key]
                $dstName = "$($persoana.id)-$idx.jpg"
                $dstPath = Join-Path $TargetDir $dstName
                try {
                    Save-OptimizedImage -SrcPath $srcPath -DstPath $dstPath
                    $newPoze.Add($dstName)
                    $script:copiedCount++
                    $idx++
                } catch {
                    Write-Warning "Failed to process $srcPath : $_"
                }
            } else {
                $missing.Add("$($persoana.id): $poza")
            }
        }
        $persoana | Add-Member -NotePropertyName "poze" -NotePropertyValue $newPoze -Force
    }
}

Process-Persoane $data.colegi
if ($data.profesori) { Process-Persoane $data.profesori }

$dataJson = $data | ConvertTo-Json -Depth 10
$dataJson | Set-Content -Path $JsonOut -Encoding UTF8

# Also emit a .js wrapper so pages can load data via <script> instead of fetch()
# (fetch() of local JSON is blocked by browsers when a page is opened via file://)
$jsOut = [System.IO.Path]::ChangeExtension($JsonOut, ".js")
"window.COLEGI_DATA = $dataJson;" | Set-Content -Path $jsOut -Encoding UTF8

$privatJsonIn = "colegi_complet_privat.json"
if (Test-Path $privatJsonIn) {
    $privatJson = Get-Content $privatJsonIn -Raw
    $privatJsOut = Join-Path $jsonOutDir "colegi-privat.js"
    "window.COLEGI_PRIVAT_DATA = $privatJson;" | Set-Content -Path $privatJsOut -Encoding UTF8
}

Write-Host "Copied/optimized $copiedCount images to $TargetDir"
Write-Host "Missing source files ($($missing.Count)):"
$missing | ForEach-Object { Write-Host "  $_" }
