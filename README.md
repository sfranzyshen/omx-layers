
# omx-layers (Node.js)
An interface for Node.js allowing you to layer multiple [omxplayer](https://github.com/popcornmix/omxplayer) instances and control them via D-Bus.

# How to Install
```
npm install omx-layers
```
# Requirements
Remember that the `omxplayer` only works on the Raspberry Pi (and similar hardware?). Performance is great on the Pi 3.

`omxplayer` is installed by default on the "Raspbian with Desktop" version of [Raspbian](https://www.raspberrypi.org/downloads/raspbian/) but if you have installed the "Lite" version (console only) then you might need to install it manually:
```
sudo apt-get install omxplayer
```


# Examples
## Single layer only
```
const omx = require('omx-layers');

let player = new omx({
	audioOutput: 'local',
	blackBackground: true,
	disableKeys: true,
	disableOnScreenDisplay: true,
});
```
Then play a clip like this:
```
player.open('myclip.mp4', () => {
	console.log('playback finished!');
});
```

## Multiple players, multiple layers
```
const omx = require('omx-layers');
let layers = [];
const numLayers = 2;

for (var i=0; i<numLayers; i++) {
	layers.push(
		new omx({
			audioOutput: 'local',
			blackBackground: true,
			disableKeys: true,
			disableOnScreenDisplay: true,
			layer: i+1
		})
	);
}

```
Find the clip with the layer you want, and play:
```
// Let's say you wanted to play a clip on layer 2...
if (layer[1].getLayer() == 2) {
	layer[1].open('foreground-clip.mp4');
}
```

# Options
* `audioOutput`: 'hdmi' | 'local' | 'both'
* `blackBackground`: boolean, false by default (careful enabling this when layering, or you might get strange intermittent screen blanking)
* `layer`: 1-infinity (2 is probably enough!); if omitted then clips will automatically player on layer 1
* `disableKeys`: boolean, false by default
* `disableOnScreenDisplay`:  boolean, false by default

# Track progress
An `onProgress` callback is called every second, with an object containing `position`, `duration` and `playStatus` (either `playing`, `paused` or `error`).

Example:
```
layer.onProgress( (info) => {
	console.log(`layer is at ${info.position} / ${info.duration}; currently ${info.status}`);
	// will output something like: layer is at 2500 / 10000; currently playing
})
```

# Properties
## Get duration of current track/movie in seconds
``layer.getCurrentDuration();``

## Get position of current track/movie in seconds
``layer.getCurrentPosition();``

Get current position via D-Bus (if currently playing) in milliseconds.

## Get volume as fraction of max (0.0 - 1.0)
``layer.getCurrentVolume();``

# Methods

## Jump to point in file/seek relative to current position (-Inf to +Inf)
``layer.seek(milliseconds);``

## Jump to point in file/seek relative to start point (absolute)
``layer.setPosition(milliseconds);``

## Stop playing
``layer.stop();``

## Quit omxplayer
``layer.quit();``

## Pause omxplayer
``layer.pause();``

Note: Unlike hitting the spacebar, this method pauses only when playing and remains paused when already paused.

## Resume playing
``layer.play();``

Note: Unlike hitting the spacebar, this method starts playing only when paused and remains playing when already playing.

## Toggle pause/play
``layer.togglePlay();``

Note: Same function as hitting spacebar in omxplayer.

## Volume up
``layer.volumeUp();``

Note: Same function as "+" key in omxplayer.

## Volume down
``layer.volumeDown();``

Note: Same function as "-" key in omxplayer.

## Set volume to a fraction of the max volume (0.0 - 1.0)
``layer.setVolume(vol);``
