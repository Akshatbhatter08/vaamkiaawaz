Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("c:\Users\KIIT\Downloads\vaamkiaawaz\vaamkiaawaz\vaamkiaawaz\public\fbpage.png")
$bmp = new-object System.Drawing.Bitmap($img)
$bmp.Save("c:\Users\KIIT\Downloads\vaamkiaawaz\vaamkiaawaz\vaamkiaawaz\public\fbpage-og.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()
$img.Dispose()
