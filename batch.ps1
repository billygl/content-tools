# Define the base folder
$FOLDER = "D:\_workspaces\Content\"

function Create-RawFoldersFromBatch {
    param (
        [string]$BaseFolder
    )
    $BatchFilePath = "batch.txt"
    if (Test-Path $BatchFilePath) {
        $FolderNames = Get-Content -Path $BatchFilePath -Encoding UTF8 | Where-Object { $_.Trim() -ne "" }
        foreach ($FolderName in $FolderNames) {
            $MainFolder = Join-Path -Path $BaseFolder -ChildPath $FolderName
            $RawFolder = Join-Path -Path $MainFolder -ChildPath "raw"
            New-Item -ItemType Directory -Path $RawFolder -Force | Out-Null
        }
        return $FolderNames
    } else {
        Write-Host "No se encontró el archivo batch.txt en $BaseFolder"
    }
}

$FolderNames = Create-RawFoldersFromBatch -BaseFolder $FOLDER
#MOVE assets to raw folder

Write-Host "Please, copy assets to raw folders. Press any key when it's done..."
[void][System.Console]::ReadKey($true)

foreach ($FolderName in $FolderNames) {
    $raw_folder = Join-Path -Path $FOLDER -ChildPath "$FolderName\raw"
    Write-Host "Processing folder: $raw_folder"
    & "$PSScriptRoot\remove_silence.ps1" -Folder $raw_folder

    $inputFiles = Get-ChildItem -Path $raw_folder -Filter "input*_out*.mp*"
    foreach ($file in $inputFiles) {
        Write-Host "Processing file: $file"
        $video_audio = Join-Path -Path $raw_folder -ChildPath "$file"
        & "C:\Users\billy\AppData\Roaming\Subtitle Edit\Whisper\Purfview-Whisper-Faster\faster-whisper-xxl.exe" --highlight_words true --max_line_count 4 --max_line_width 30 --max_line_count 1 --model large-v3-turbo --language es --output_dir "$raw_folder" "$video_audio"

        python "$PSScriptRoot\get_srt.py" "$raw_folder"
    }
}
