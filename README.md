
# omx-players (Node.js)
An interface for Node.js allowing you to have multiple [omxplayer](https://github.com/popcornmix/omxplayer) instances and control them in-process via the low-latency interprocess communication protocol, D-Bus.

You don't have to know anything about D-Bus. Just send commands using JavaScript, and the library handles the communication and logic internally.

# How to Install
```
npm install omx-players
```
# Requirements
Remember that the `omxplayer` only works on the Raspberry Pi (and similar hardware?). Performance is great on the Pi 3.

`omxplayer` is installed by default on the "Raspbian with Desktop" version of [Raspbian](https://www.raspberrypi.org/downloads/raspbian/) but if you have installed the "Lite" version (console only) then you might need to install it manually:
```
sudo apt-get install omxplayer
```
## Update omxplayer
take advantage of newer functions available in the latest versions of the omxplayer. This requires removing the default Raspbian version of omxplayer and installing the latest version ... See [https://github.com/popcornmix/omxplayer](https://github.com/popcornmix/omxplayer#omxplayer1----raspberry-pi-command-line-omx-player)
```
sudo apt-get remove omxplayer
git clone https://github.com/popcornmix/omxplayer.git
cd omxplayer
./prepare-native-raspbian.sh
make ffmpeg
make -j$(nproc)
sudo make install
```
# Examples
## Single player only
```
const omx = require('omx-players');

let player = new omx({
	audioOutput: 'local',
	blackBackground: true,
	disableKeys: true,
	disableOnScreenDisplay: true,
});
```
Then play a clip like this:
```
player.open('foreground-clip.mp4', false);
```

## Multiple players, multiple layers
```
const omx = require('omx-players');
let players = [];
const numPlayers = 2;

for (var i=0; i<numPlayers; i++) {
	players.push(
		new omx({
			audioOutput: 'local',
			blackBackground: i === 0,
			disableKeys: true,
			disableOnScreenDisplay: true,
			player: i,
			layer: i
		})
	);
}

```
Find the clip with the player you want, and play:
```
// Assume that an array has been set up with 2 players.
// Let's say you wanted to play a clip on player 2 ...
players[1].open('foreground-clip.mp4', true);
```

## How many players can I open?
This seems to be very dependent on the resolutions and data rates for the video files. file sizes also plays a role.

If your player appears to quit video files without even trying to play them, you should try to increase the memory available to the GPU using `sudo rasp-config` > Advanced Options > Memory Split. 128MB should be good; 256MB might be better.

# Options
* `audioOutput`: 'hdmi' | 'local' | 'both'
* `blackBackground`: boolean, false by default
* `backgroundARGB`: a hexadecimal colour value for Alpha, Red, Green, Blue - this is an alternative to using the default black. 
* `startPos`: Start position (hh:mm:ss) if omitted clips will start at 00:00:00
* `loop`: boolean, false by default
* `layer`: 1 - ?, if omitted clips will automatically play on layer 0
* `alpha`: 0 - 255, if omitted clips will automatically play full alpha (255)
* `volume`: 0.0 to 1.0 millibels, if omitted clips will automatically play full volume (1.0)
* `disableKeys`: boolean, false by default
* `disableOnScreenDisplay`:  boolean, false by default
* `disableGhostbox`:  boolean, false by default
* `progressInterval`: milliseconds, 1000 by default
* `aspectMode`: type, letterbox, fill, stretch. Default: stretch if win is specified, letterbox otherwise

# Properties
## Get duration of current track/movie in seconds
`player.getCurrentDuration();`

## Get position of current track/movie in seconds
`player.getCurrentPosition();`

Get current position via D-Bus (if currently playing) in milliseconds.

## Get volume as fraction of max (0.0 - 1.0)
`player.getCurrentVolume();`

# Methods
## Open (play) a new clip
`player.open(path, holdMode)`
Open a clip at the given path and either start playing (default) or put in hold mode. 
Hold mode sets the alpha to 0 and playback in a paused state.

## Jump to point in file/seek relative to current position (-Inf to +Inf)
`player.seekRelative(milliseconds);`

## Jump to point in file/seek relative to start point (absolute)
`player.seekAbsolute(milliseconds);`

# Callbacks
## onStart
It may take a few milliseconds for the clip to actually start playing after you call `player.open`. The `onStart` callback is fired once the clip has been confirmed to have actually started playback.

## onDone
This is called when the clip finishes playing (and the omxplayer instance stops/quits).

## onProgress
The `onProgress` callback is called every second (by default) or however often you need (just set `progressInterval` in settings).

The callback sends a single object containing `position`, `duration` and `playStatus` (either `playing`, `paused` or `error`).

Example:
```
player.onProgress( (info) => {
	console.log(`player is at ${info.position} / ${info.duration}; currently ${info.status}`);
	// will output something like: player is at 2500 / 10000; currently playing
})
```

## Stop playing
`player.stop();`
This seems to be the same thing as quitting! See https://github.com/popcornmix/omxplayer/issues/564

## Quit omxplayer
`player.quit();`

## Pause omxplayer
`player.pause();`
Pauses the clip; ignored if already paused.

## Resume playing
`player.resume();`
Resumes a clip if paused; ignored if already playing, and will generate an error in the logs if clip is already stopped/done but is essentially ignored.

## Set volume
`player.setVolume(vol);`
Set volume to a fraction of the max volume (0.0 - 1.0)

