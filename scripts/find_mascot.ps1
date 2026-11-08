Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\sherl\.gemini\antigravity\brain\2317007d-d598-4c0b-9fa6-ed40940bfdf1\.user_uploaded\media_1794154762968_cdf01b92.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# Background color sampling at top-left (10, 10)
$bg = $src.GetPixel(10, 10)
Write-Output "Background color: R=$($bg.R), G=$($bg.G), B=$($bg.B)"

# Find bounds of the mascot (excluding text at the bottom)
# The mascot is located roughly in Y from 70 to 250, and X from 120 to 380
$minX = $src.Width
$maxX = 0
$minY = $src.Height
$maxY = 0

# Check only upper 60% of image to strictly avoid the text below
$limitY = [int]($src.Height * 0.62)

for ($y = 0; $y -lt $limitY; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $p = $src.GetPixel($x, $y)
        # Check difference from background
        $diff = [Math]::Abs($p.R - $bg.R) + [Math]::Abs($p.G - $bg.G) + [Math]::Abs($p.B - $bg.B)
        if ($diff -gt 35) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Mascot bounds: X=[$minX, $maxX], Y=[$minY, $maxY], Width=$($maxX - $minX), Height=$($maxY - $minY)"
$src.Dispose()

