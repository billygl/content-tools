# Define the base folder
$FOLDER_ROOT = "D:\_workspaces\Content\"
$FOLDER_RAW = "raw"
function Create-RawFoldersFromBatch {
    param (
        [string]$BaseFolder
    )
    $BatchFilePath = "data/batch.txt"
    if (Test-Path $BatchFilePath) {
        $FolderLines = Get-Content -Path $BatchFilePath -Encoding UTF8 | Where-Object { $_.Trim() -ne "" }
        $Folders = @()
        foreach ($FolderLine in $FolderLines) {
            $Folder = ($FolderLine.Trim() -split '\|')
            $FolderName = $Folder[0]
            $MainFolder = Join-Path -Path $BaseFolder -ChildPath $FolderName
            $RawFolder = Join-Path -Path $MainFolder -ChildPath $FOLDER_RAW
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
    $raw_folder = Join-Path -Path $FOLDER_ROOT -ChildPath "$FolderName\$FOLDER_RAW"
    Write-Host "Processing folder: $raw_folder"

    Write-Host "Removing silence from audio files in $raw_folder"
    & "$PSScriptRoot\remove_silence.ps1" -Folder $raw_folder
    [Console]::Beep(900, 2300)

    Write-Host "Removing background from audio files in $raw_folder"
    & "$PSScriptRoot\remove_background.ps1" -Folder $raw_folder
    [Console]::Beep(900, 2300)
    
    Write-Host "Subtitles in $raw_folder"
    & "$PSScriptRoot\get_subtitles.ps1" -Folder $raw_folder
}
