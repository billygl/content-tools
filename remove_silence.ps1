$FOLDER = Read-Host "Enter path of the folder"
$THRESH = -20
$DURATION = 0.18


$inputFiles = Get-ChildItem -Path $FOLDER -Filter "input*.mp4"
foreach ($file in $inputFiles) {
    Write-Host "Processing file: $($file.Name)"
    $IN = $file.FullName
    $OUT = [System.IO.Path]::Combine($file.DirectoryName, "$($file.BaseName)_out.mp4")

    # 1. Identify silence and get timestamps:
    $ffmpegOutput = & ffmpeg -i $IN -af "silencedetect=n=${THRESH}dB:d=$DURATION" -f null - 2>&1

    $timestamps = @()
    $prevEnd = 0
    foreach ($line in $ffmpegOutput) {
        if ($line -match 'silence_start: ([\d\.]+)') {
            $silenceStart = [double]$matches[1]
            if ($prevEnd -lt $silenceStart) {
                $timestamps += "between(t,$prevEnd,$silenceStart)"
            }
        }
        elseif ($line -match 'silence_end: ([\d\.]+)') {
            $prevEnd = [double]$matches[1]
        }
    }
    $expr = ($timestamps -join '+')

    # 2. Prepare video filter (select):
    $videoFilter = "select='$expr',setpts=N/FRAME_RATE/TB"
    Set-Content -Path "data/video_filter.txt" -Value $videoFilter

    # 3. Prepare audio filter (aselect):
    $audioFilter = "aselect='$expr',asetpts=N/SR/TB"
    Set-Content -Path "data/audio_filter.txt" -Value $audioFilter

    # 4. Apply filters:
    & ffmpeg -i $IN -hide_banner -filter_script:v "data/video_filter.txt" -filter_script:a "data/audio_filter.txt" -r 30 $OUT
    Write-Host "Output saved to: $OUT"
}
