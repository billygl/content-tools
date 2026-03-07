param (
    [string]$InputFile = "data/input.txt",
    [string]$GeminiOutputFile = "data/gemini_output.txt",
    [string]$FinalOutputFile = "data/final_output.txt",
    [string]$ImagesDir = "data/images"
)

function Run-GeminiStep {
    do {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "  STEP 1: Gemini AI Formatting" -ForegroundColor Cyan
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "Running Gemini to highlight text and add hashtags..."
        
        # Run the python script
        python main.py --action gemini --input $InputFile --output $GeminiOutputFile
        
        Write-Host "`nPlease open and review: '$GeminiOutputFile'" -ForegroundColor Yellow
        $response = Read-Host "Is the Gemini output OK? (Y=Yes, continue / N=No, retry / Q=Quit)"
        
        if ($response -match "^[Qq]") {
            Write-Host "Exiting pipeline." -ForegroundColor DarkGray
            exit
        }
        
        if ($response -match "^[Yy]") {
            $script:geminiApproved = $true
        } else {
            Write-Host "Retrying Gemini Step..." -ForegroundColor Red
            $script:geminiApproved = $false
        }
    } until ($script:geminiApproved)
}

function Run-FormatStep {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  STEP 2: Asterisks -> Unicode Bold" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    python main.py --action format --input $GeminiOutputFile --output $FinalOutputFile
    
    Write-Host "`nBold conversion complete. Please review: '$FinalOutputFile'" -ForegroundColor Yellow
}

function Run-PostStep {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  STEP 3: LinkedIn Post / Schedule" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    $response = Read-Host "Do you want to post/schedule these to LinkedIn now? (Y=Yes / N=No, exit)"
    
    if ($response -match "^[Yy]") {
        Write-Host "Publishing to LinkedIn..." -ForegroundColor Green
        python main.py --action post --input $FinalOutputFile --images $ImagesDir
        Write-Host "`nPipeline Complete!" -ForegroundColor Green
    } else {
        Write-Host "Skipped posting. Exiting pipeline without publishing." -ForegroundColor DarkGray
    }
}

# Main Execution Flow
Write-Host "Starting LinkedIn Batch Pipeline..." -ForegroundColor Green
Run-GeminiStep
Run-FormatStep
Run-PostStep
