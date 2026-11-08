Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\sherl\.gemini\antigravity\brain\2317007d-d598-4c0b-9fa6-ed40940bfdf1\.user_uploaded\media_1794164415428_52072544.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

$outSize = 512
$master = New-Object System.Drawing.Bitmap($outSize, $outSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Precise disc center & radius (sampled inside the blue circle so zero black border is touched)
$srcCx = 305.5
$srcCy = 279.5
$srcRx = 301.0
$srcRy = 275.0

$destRadius = 252.0
$destCenter = 255.5

for ($y = 0; $y -lt $outSize; $y++) {
    for ($x = 0; $x -lt $outSize; $x++) {
        $dx = $x - $destCenter
        $dy = $y - $destCenter
        $dist = [Math]::Sqrt($dx * $dx + $dy * $dy)

        if ($dist -gt ($destRadius + 1.0)) {
            $master.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $normX = $dx / $destRadius
            $normY = $dy / $destRadius
            $sx = [int][Math]::Round($srcCx + $normX * $srcRx)
            $sy = [int][Math]::Round($srcCy + $normY * $srcRy)

            if ($sx -lt 0) { $sx = 0 }
            if ($sx -ge $src.Width) { $sx = $src.Width - 1 }
            if ($sy -lt 0) { $sy = 0 }
            if ($sy -ge $src.Height) { $sy = $src.Height - 1 }

            $p = $src.GetPixel($sx, $sy)

            if ($dist -gt ($destRadius - 1.0)) {
                $alphaRatio = ($destRadius + 1.0 - $dist) / 2.0
                if ($alphaRatio -lt 0) { $alphaRatio = 0 }
                if ($alphaRatio -gt 1) { $alphaRatio = 1 }
                $a = [int](255 * $alphaRatio)
                $master.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $p.R, $p.G, $p.B))
            } else {
                $master.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
            }
        }
    }
}
$src.Dispose()

# Save 512x512 targets
$master.Save("public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$master.Save("public\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$master.Save("public\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$master.Save("app\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved 512x512 logo and icons"

# Function to resize with high quality bicubic
function Resize-Bitmap($source, $width, $height, $path) {
    $res = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($res)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($source, (New-Object System.Drawing.Rectangle(0, 0, $width, $height)), 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $res.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $res.Dispose()
    Write-Output "Saved $path ($($width)x$($height))"
}

Resize-Bitmap $master 192 192 "public\icon-192.png"
Resize-Bitmap $master 180 180 "public\apple-icon.png"
Resize-Bitmap $master 180 180 "app\apple-icon.png"

$master.Dispose()
Remove-Item "public\logo-test.png" -ErrorAction SilentlyContinue
Write-Output "All circular logo images updated successfully!"
