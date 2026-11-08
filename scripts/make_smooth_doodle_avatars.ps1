Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path "public\avatars" | Out-Null
$srcPath = "C:\Users\sherl\.gemini\antigravity\brain\2317007d-d598-4c0b-9fa6-ed40940bfdf1\.user_uploaded\media_1794085153439_31be208f.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# 8 crops from the doodle sheet
$crops = @(
    @{ id = 1; x = 12;  y = 12;  w = 230; h = 300; bg = "#EBE8FF"; border = "#C7C0F8" },
    @{ id = 2; x = 270; y = 22;  w = 230; h = 290; bg = "#FFE4E6"; border = "#FDA4AF" },
    @{ id = 3; x = 525; y = 15;  w = 230; h = 300; bg = "#E0F7EF"; border = "#A7F3D0" },
    @{ id = 4; x = 765; y = 30;  w = 230; h = 290; bg = "#FEF3C7"; border = "#FDE68A" },
    @{ id = 5; x = 30;  y = 345; w = 220; h = 300; bg = "#E0F2FE"; border = "#BAE6FD" },
    @{ id = 6; x = 270; y = 340; w = 230; h = 300; bg = "#FCE7F3"; border = "#FBCFE8" },
    @{ id = 7; x = 525; y = 340; w = 230; h = 300; bg = "#EDE9FE"; border = "#DDD6FE" },
    @{ id = 8; x = 750; y = 330; w = 245; h = 315; bg = "#F1F5F9"; border = "#CBD5E1" }
)

$size = 384
$diam = 352
$offset = 16

foreach ($c in $crops) {
    # 1. Extract crop and isolate doodle ink
    $rawCrop = New-Object System.Drawing.Bitmap($c.w, $c.h)
    $rg = [System.Drawing.Graphics]::FromImage($rawCrop)
    $srcRect = New-Object System.Drawing.Rectangle($c.x, $c.y, $c.w, $c.h)
    $rg.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $c.w, $c.h)), $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $rg.Dispose()

    # Clean transparent ink
    $ink = New-Object System.Drawing.Bitmap($c.w, $c.h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($y = 0; $y -lt $c.h; $y++) {
        for ($x = 0; $x -lt $c.w; $x++) {
            $p = $rawCrop.GetPixel($x, $y)
            $lum = ($p.R * 0.299 + $p.G * 0.587 + $p.B * 0.114)
            if ($lum -gt 230) {
                # white background -> transparent
                $ink.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
            } elseif ($lum -gt 180) {
                $a = [int]((230 - $lum) / 50.0 * 255)
                $ink.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, 15, 18, 25))
            } else {
                $ink.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 15, 18, 25))
            }
        }
    }
    $rawCrop.Dispose()

    # 2. Render final smooth circular avatar
    $dest = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Circular path for clipping
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse($offset, $offset, $diam, $diam)

    # Fill circular background
    $bgColor = [System.Drawing.ColorTranslator]::FromHtml($c.bg)
    $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillPath($bgBrush, $path)
    $bgBrush.Dispose()

    # Clip to circle so drawing doesn't bleed outside
    $g.SetClip($path)

    # Scale character inside circle
    $scale = [Math]::Min(($diam * 0.92) / $c.w, ($diam * 0.92) / $c.h)
    $dw = [int]($c.w * $scale)
    $dh = [int]($c.h * $scale)
    $dx = [int](($size - $dw) / 2)
    $dy = [int]($size - $dh - 8) # slightly bottom-aligned for bust portrait

    $destRect = New-Object System.Drawing.Rectangle($dx, $dy, $dw, $dh)
    $g.DrawImage($ink, $destRect, 0, 0, $c.w, $c.h, [System.Drawing.GraphicsUnit]::Pixel)

    $g.ResetClip()

    # Draw smooth border ring
    $borderColor = [System.Drawing.ColorTranslator]::FromHtml($c.border)
    $pen = New-Object System.Drawing.Pen($borderColor, 4.0)
    $g.DrawEllipse($pen, $offset, $offset, $diam, $diam)
    $pen.Dispose()
    $path.Dispose()

    $g.Dispose()
    $ink.Dispose()

    $outPath = "public\avatars\avatar-$($c.id).png"
    $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Output "Rendered smooth circular $outPath"
}

$src.Dispose()
Write-Output "Done rendering all 8 doodle avatars."
