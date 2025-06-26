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
- output > luma keyer > input_out (fit mask:stretch) > out