# get voice over
````
python .\get_vo.py .\data\input_script.txt vo
````

# remove silence
````
remove_silence.ps1
````

# remove background
````
python.exe -m backgroundremover.cmd.cli -i "input_out.mp4" -gb 2 -wn 2 -tv -mk -o "output.mov"
````

## use
- output(.mov)(as matte)  > matte/luma keyer > input_out (fit mask:stretch) > out


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

