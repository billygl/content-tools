param([string]$folder)

if (-not $folder) {
    $folder = Read-Host "Enter path of the folder"
}
$FOLDER = $folder

$inputFiles = Get-ChildItem -Path $FOLDER -Filter "input*rb*out.mp4" | 
    Where-Object { $_.Name -notmatch "_mid\.mp4" }
foreach ($file in $inputFiles) {
    Write-Host "$(Get-Date -Format 'HH:mm:ss') Processing file: $($file.Name)"
    $IN = $file.FullName
    $OUT = [System.IO.Path]::Combine($file.DirectoryName, "$($file.BaseName)_out_nb.mov")

    $MID = [System.IO.Path]::Combine($file.DirectoryName, "$($file.BaseName)_mid.mp4")

    if (-not (Test-Path $MID)) {
        & ffmpeg -i $IN -c:v libx264 -c:a copy -r 30 $MID -loglevel quiet
    }

    $ouput = & backgroundremover\.venv\Scripts\python.exe -m backgroundremover.backgroundremover.cmd.cli -i "$IN" -gb 2 -wn 2 -tv -mk -o "$OUT"
    
    Write-Host "Output saved to: $OUT"
}
