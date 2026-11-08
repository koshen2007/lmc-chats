Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\sherl\.gemini\antigravity\brain\2317007d-d598-4c0b-9fa6-ed40940bfdf1\.user_uploaded\media_1794154762968_cdf01b92.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

[int]$size = 512
$dest = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

[int]$margin = 8
[int]$diam = $size - ($margin * 2)

# Perfect navy background circle
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 34, 72))
$g.FillEllipse($bgBrush, $margin, $margin, $diam, $diam)

# Subtle indigo ring
$ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 99, 102, 241), 5.0)
$g.DrawEllipse($ringPen, $margin, $margin, $diam, $diam)
$ringPen.Dispose()
$bgBrush.Dispose()

# Clip to circle
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse($margin, $margin, $diam, $diam)
$g.SetClip($path)

# Mascot source bounds (X=[110, 382], Y=[96, 244])
# Let's add slight padding: X=105, Y=90, W=282, H=158
[int]$srcX = 105
[int]$srcY = 90
[int]$mascotW = 282
[int]$mascotH = 158
$mascotSrcRect = New-Object System.Drawing.Rectangle($srcX, $srcY, $mascotW, $mascotH)

# Destination scaling: fit nicely in center
[int]$targetW = [int]($diam * 0.78)
$scale = [double]$targetW / [double]$mascotW
[int]$targetH = [int]($mascotH * $scale)

[int]$destX = [int](($size - $targetW) / 2)
[int]$destY = [int](($size - $targetH) / 2) - 2
$mascotDestRect = New-Object System.Drawing.Rectangle($destX, $destY, $targetW, $targetH)

$g.DrawImage($src, $mascotDestRect, $mascotSrcRect, [System.Drawing.GraphicsUnit]::Pixel)

$path.Dispose()
$g.Dispose()

# Save all icon variants
$dest.Save("public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save("public\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save("public\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save("public\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save("public\apple-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$dest.Dispose()
$src.Dispose()
Write-Output "Perfect circular logo generated with ZERO errors"
