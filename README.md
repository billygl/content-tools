# batch
- write the folder names in batch.txt
- execute batch.ps1
- copy files into raw folder
- rename files to
  - input_rs* to remove silence
- rename files to
  - input_rb* to remove background

# get voice over
````
python .\get_vo.py .\data\input_script.txt vo
````

# remove silence
````
remove_silence.ps1
````

# remove background
- use .venv (with python 3.9)
````
.\backgroundremover\.venv\Scripts/Activate.ps1
python.exe -m backgroundremover.backgroundremover.cmd.cli -i "input_out.mp4" -gb 2 -wn 2 -tv -mk -o "output.mov"
````

## use
- output(.mov)
  - media / Add to media pool as matte
- in fusion page
  - ouput(.mov) -> matte/luma keyer -> input_out (settings/fit mask:stretch) > out

# cut video
````
ffmpeg -i "input.mp4" -ss 00:00:45 -to 00:01:18 -c copy "input_rs_2.mp4"
````

# EXTRACT AUDIO FROM MP4
````
ffmpeg -i "horizontal 1.mp4" -q:a 0 -map a sample.mp3
````

# issue with aac
`ffmpeg -i input.mp4 -vn -acodec pcm_s16le output.wav`

# remove some seconds from start
`ffmpeg -ss 30 -i input.mp4 -c copy output.mp4`

# subtitle edit
````
--highlight_words true --max_line_count 4 --max_line_width 30 --max_line_count 1
````

# others
- https://www.media.io/remove-background-noise-from-audio.html

# verify domain - tiktok 
````
docker cp tiktokSdTzSXnKxUAvuSWp1qhwhV0k6YTwIsVq.txt d347f5651267e229d984dc4424983563a96fc73e6562d5d972bc53f4983a86f6:/app/apps/frontend/public
````

# muse talk
````
python -m scripts.realtime_inference --inference_config configs\inference\realtime.yaml --result_dir results\realtime --unet_model_path models\musetalkV15\unet.pth --unet_config models\musetalkV15\musetalk.json --version v15 --fps 25 --ffmpeg_path ffmpeg-master-latest-win64-gpl-shared\bin

python -m scripts.inference --inference_config configs\inference\test.yaml --result_dir results\test --unet_model_path models\musetalkV15\unet.pth --unet_config models\musetalkV15\musetalk.json --version v15 --ffmpeg_path D:\Programs\ffmpeg-7.1-full_build\bin

python -m scripts.inference --inference_config configs\inference\content.yaml --result_dir results\content --unet_model_path models\musetalkV15\unet.pth --unet_config models\musetalkV15\musetalk.json --version v15 --ffmpeg_path D:\Programs\ffmpeg-7.1-full_build\bin
````

# gif to mp4
````
ffmpeg -i file.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" out.mp4
````