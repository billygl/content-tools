param([string]$folder)

if (-not $folder) {
    $folder = Read-Host "Enter path of the folder"
}
$inputFiles = Get-ChildItem -Path $folder -Filter "input*_out*.mp*"
foreach ($file in $inputFiles) {
    $video_audio = Join-Path -Path $folder -ChildPath "$file"
    Write-Host "Processing file: $video_audio"
    & "C:\Users\billy\AppData\Roaming\Subtitle Edit\Whisper\Purfview-Whisper-Faster\faster-whisper-xxl.exe" --highlight_words true --max_line_count 4 --max_line_width 30 --max_line_count 1 --model large-v3-turbo --language es --output_dir "$folder" "$video_audio"

    python "$PSScriptRoot\get_srt.py" "$folder"
}