$FOLDER = Read-Host "Enter the name of the folder"
$IN = "D:\_workspaces\Content\$FOLDER\raw\input.mp4"
$OUT = "output.mp4"
$THRESH = -20
$DURATION = 0.18

# 1. Identify silence and get timestamps:
$ffmpegOutput = & ffmpeg -i $IN -af "silencedetect=n=${THRESH}dB:d=$DURATION" -f null - 2>&1

#$ffmpegOutput | ForEach-Object { Write-Output $_ }
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
Set-Content -Path "video_filter.txt" -Value $videoFilter

# 3. Prepare audio filter (aselect):
$audioFilter = "aselect='$expr',asetpts=N/SR/TB"
Set-Content -Path "audio_filter.txt" -Value $audioFilter

# 4. Apply filters:
& ffmpeg -i $IN -hide_banner -filter_script:v video_filter.txt -filter_script:a audio_filter.txt $OUT