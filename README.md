
# omx-layers (Node.js)
An interface for Node.js allowing you to layer multiple omxplayer instances and control them via D-Bus.

# Example
```
var omx = require('omx-interface');

var options = {
	audioOutput:'hdmi',
	blackBackground:true,
	disableKeys:true,
	disableOnScreenDisplay:true
};

omx.open('test.mp4',options); //open file

omx.onProgress(function(track){ //subscribe for track updates (every second while not paused for now)
	console.log(track.position);
	console.log(track.duration);
});

omx.setPosition(60*5); //set position to 5 minutes into the movie
```

# Options
## general options
audioOutput:             'hdmi' | 'local' | 'both'

blackBackground:         boolean, true by default

## Communication options

disableKeys:             boolean, false by default (true when using remote)

disableOnScreenDisplay:  boolean, false by default (true when using remote)


# Properties
## Get duration of current track/movie in seconds
``omx.getCurrentDuration();``

## Get position of current track/movie in seconds
``omx.getCurrentPosition();``

This function can be called many times per second without bothering the DBus since the position is extrapolated from the short term cached paying status.

## Get volume as fraction of max (0.0 - 1.0)
``omx.getCurrentVolume();``

# Methods

## Jump to point in file/seek relative to current position (-Inf to +Inf)
``omx.seek(seconds);``

## Jump to point in file/seek relative to start point (absolute)
``omx.setPosition(seconds);``

## Stop playing
``omx.stop();``

## Quit omxplayer
``omx.quit();``

## Pause omxplayer
``omx.pause();``

Note: Unlike hitting the spacebar, this method pauses only when playing and remains paused when allready paused.

## Resume playing
``omx.play();``

Note: Unlike hitting the spacebar, this method starts playing only when paused and remains playing when allready playing.

## Toggle pause/play
``omx.togglePlay();``

Note: Same function as hitting spacebar in omxplayer.

## Volume up
``omx.volumeUp();``

Note: Same function as "+" key in omxplayer.

## Volume down
``omx.volumeDown();``

Note: Same function as "-" key in omxplayer.

## Set volume to a fraction of the max volume (0.0 - 1.0)
``omx.setVolume(vol);``
