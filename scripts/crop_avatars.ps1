Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path "public\avatars" | Out-Null
$srcPath = "C:\Users\sherl\.gemini\antigravity\brain\2317007d-d598-4c0b-9fa6-ed40940bfdf1\.user_uploaded\media_1794085153439_31be208f.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

$crops = @(
    @{ id = 1; x = 10;  y = 15;  w = 240; h = 295 },
    @{ id = 2; x = 265; y = 25;  w = 235; h = 285 },
    @{ id = 3; x = 520; y = 15;  w = 230; h = 295 },
    @{ id = 4; x = 760; y = 35;  w = 240; h = 285 },
    @{ id = 5; x = 15;  y = 350; w = 240; h = 295 },
    @{ id = 6; x = 265; y = 345; w = 235; h = 295 },
    @{ id = 7; x = 515; y = 345; w = 235; h = 295 },
    @{ id = 8; x = 740; y = 335; w = 255; h = 305 }
)

foreach ($c in $crops) {
    $rect = New-Object System.Drawing.Rectangle($c.x, $c.y, $c.w, $c.h)
    $dest = New-Object System.Drawing.Bitmap(256, 256)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::FromArgb(245, 246, 248))
    
    $scale = [Math]::Min(230.0 / $c.w, 230.0 / $c.h)
    $dw = [int]($c.w * $scale)
    $dh = [int]($c.h * $scale)
    $dx = [int]((256 - $dw) / 2)
    $dy = [int]((256 - $dh) / 2)
    
    $destRect = New-Object System.Drawing.Rectangle($dx, $dy, $dw, $dh)
    $g.DrawImage($src, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    
    $outPath = "public\avatars\avatar-$($c.id).png"
    $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Output "Saved $outPath"
}

$src.Dispose()
Write-Output "Done"
