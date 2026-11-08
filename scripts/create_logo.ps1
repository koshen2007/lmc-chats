Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\sherl\.gemini\antigravity\brain\2317007d-d598-4c0b-9fa6-ed40940bfdf1\.user_uploaded\media_1794154762968_cdf01b92.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1. Save full logo
$src.Save("public\logo-full.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Create circular icon 512x512
$size = 512
$dest = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::FromArgb(20, 28, 58)) # matching navy background

# Draw circular clip or rounded icon
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 28, 58))
$g.FillEllipse($brush, 0, 0, $size, $size)

# Draw the logo image centered
$scale = [Math]::Min(($size * 0.9) / $src.Width, ($size * 0.9) / $src.Height)
$w = [int]($src.Width * $scale)
$h = [int]($src.Height * $scale)
$x = [int](($size - $w) / 2)
$y = [int](($size - $h) / 2)

$destRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
$srcRect = New-Object System.Drawing.Rectangle(0, 0, $src.Width, $src.Height)
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()

$dest.Save("public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save("public\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save("public\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save("public\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save("public\apple-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$dest.Dispose()
$src.Dispose()
Write-Output "Logo icons created successfully"

