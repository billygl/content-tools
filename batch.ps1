# Define the base folder
$FOLDER_ROOT = "D:\_workspaces\Content\"

function Create-RawFoldersFromBatch {
    param (
        [string]$BaseFolder
    )
    $BatchFilePath = "batch.txt"
    if (Test-Path $BatchFilePath) {
        $FolderLines = Get-Content -Path $BatchFilePath -Encoding UTF8 | Where-Object { $_.Trim() -ne "" }
        $Folders = @()
        foreach ($FolderLine in $FolderLines) {
            $Folder = ($FolderLine.Trim() -split '\|')
            $FolderName = $Folder[0]
            $MainFolder = Join-Path -Path $BaseFolder -ChildPath $FolderName
            $RawFolder = Join-Path -Path $MainFolder -ChildPath "raw"
            New-Item -ItemType Directory -Path $RawFolder -Force | Out-Null
            $Folders += ,$Folder
        }
        return ,$Folders
    } else {
        Write-Host "No se encontró el archivo batch.txt en $BaseFolder"
    }
}

$Folders = Create-RawFoldersFromBatch -BaseFolder $FOLDER_ROOT
#MOVE assets to raw folder

Write-Host "Please, copy assets to raw folders. Press any key when it's done..."
[void][System.Console]::ReadKey($true)

foreach ($Folder in $Folders) {
    $FolderName = $Folder[0]
    $FolderParams = $Folder[1]
    $raw_folder = Join-Path -Path $FOLDER_ROOT -ChildPath "$FolderName\raw"
    Write-Host "Processing folder: $raw_folder"

    if ($FolderParams -notmatch "-removesilence") {
        Write-Host "Removing silence from audio files in $raw_folder"
        & "$PSScriptRoot\remove_silence.ps1" -Folder $raw_folder
    }

    $inputFiles = Get-ChildItem -Path $raw_folder -Filter "input*_out*.mp*"
    foreach ($file in $inputFiles) {
        Write-Host "Processing file: $file"
        $video_audio = Join-Path -Path $raw_folder -ChildPath "$file"
        & "C:\Users\billy\AppData\Roaming\Subtitle Edit\Whisper\Purfview-Whisper-Faster\faster-whisper-xxl.exe" --highlight_words true --max_line_count 4 --max_line_width 30 --max_line_count 1 --model large-v3-turbo --language es --output_dir "$raw_folder" "$video_audio"

        python "$PSScriptRoot\get_srt.py" "$raw_folder"
    }
    
}
