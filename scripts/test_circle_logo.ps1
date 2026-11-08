Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\sherl\.gemini\antigravity\brain\2317007d-d598-4c0b-9fa6-ed40940bfdf1\.user_uploaded\media_1794164415428_52072544.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

$outSize = 512
$dest = New-Object System.Drawing.Bitmap($outSize, $outSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Source disc center and radii (leaving 3px margin inside so zero black is ever touched)
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
            # Outside circle: fully transparent
            $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Calculate source coordinate
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
                # Anti-aliasing boundary
                $alphaRatio = ($destRadius + 1.0 - $dist) / 2.0
                if ($alphaRatio -lt 0) { $alphaRatio = 0 }
                if ($alphaRatio -gt 1) { $alphaRatio = 1 }
                $a = [int](255 * $alphaRatio)
                $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $p.R, $p.G, $p.B))
            } else {
                $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
            }
        }
    }
}

$dest.Save("public\logo-test.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Dispose()
$src.Dispose()
Write-Output "Saved public\logo-test.png successfully"
