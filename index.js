var exec = require('child_process').exec;
var path = require('path');


const DBUS_COMMAND = "bash "+__dirname+"/dbus.sh ";
const DBUS_DEST_DEFAULT = 'org.mpris.MediaPlayer2.omxplayer';

class OmxInterface {

	constructor(options) {
		this.options = options;

		if (options && options.layer) {
			this.dbusDest = DBUS_DEST_DEFAULT + '_layer' + options.layer;
			this.layer = options.layer;
			console.log('setup for layered mode');
		} else {
			this.dbusDest = DBUS_DEST_DEFAULT;
			this.layer = 1;
			console.log('not layered mode');
		}
		console.log('dbus name will be', this.dbusDest);

		exec('mkfifo omxpipe'+this.layer);

		this.defaults = null;
		this.progressHandler = null;
		this.cache = this.setDefault();

		this.playTryCount = 0;
		this.pauseTryCount = 0;
		this.stopTryCount = 0;
		this.quitTryCount = 0;
		this.togglePlayTryCount = 0;
		this.seekTryCount = 0;
		this.setPositionTryCount = 0;
		this.setVolumeTryCount = 0;

	}

	getLayer() {
		return this.layer;
	}

	setDefault () {
		this.defaults = {
			path:{
				value:'',
				time:new Date(),
				valid:false
			},
			position:{
				value:false,
				time:new Date(),
				valid:false
			},
			duration:{
				value:0,
				time:new Date(),
				valid:false
			},
			volume:{
				value:1.0,
				time:new Date(),
				valid:false
			},
			isPlaying:{
				value:0,
				time:new Date(),
				valid:false
			}
		};

		return this.defaults;
	}


	checkProgressHandler() {
		if (this.progressHandler) {
			clearInterval(this.progressHandler);
			console.log('progressHandler cancelled');
		}
	}

	dbusCommand (command)  {
		let merge = "bash " +__dirname+"/dbus.sh " + this.dbusDest + " " + command;
		if (command != 'getplaystatus' && command !='getvolume' && command != 'getposition') { console.log('merge:', merge); }
		return merge;
	}


	play () {
		this.checkProgressHandler();
		exec(this.dbusCommand('getplaystatus'), (error, stdout, stderr) => {
			if(error && (this.playTryCount < 3)){
				this.playTryCount++;
				this.play();
			} else if(error) {
				this.playTryCount = 0;
			} else {
				this.playTryCount = 0;
				if (stdout.indexOf("Paused")>-1) {
					this.togglePlay();
					this.cache.isPlaying.value = 1;
					this.cache.isPlaying.time = new Date();
					this.cache.isPlaying.valid = true;
				}
			}
		});
	}

	pause () {
		exec(this.dbusCommand('getplaystatus'), (error, stdout, stderr) => {
			if (error) {
				console.log('getplaystatus error:', error);
			} else {
				console.log('getplaystatus result:', stdout);
			}
			if(error && (this.stopTryCount < 3)){
				this.pauseTryCount++;
				this.pause();
			} else if(error) {
				this.pauseTryCount = 0;
			} else {
				this.pauseTryCount = 0;
				if (stdout.indexOf("Playing")>-1) {
					this.togglePlay();
	 				this.cache.isPlaying.value = 0;
	 				this.cache.isPlaying.time = new Date();
	 				this.cache.isPlaying.valid = true;
				}
			}
		});
	}

	stop () {
		exec(this.dbusCommand('stop'), (error, stdout, stderr) => {
			if(error && (this.stopTryCount < 3)){
				this.stopTryCount++;
				this.stop();
			} else if(error) {
				this.stopTryCount = 0;
			} else {
				this.stopTryCount = 0;
				this.cache = this.defaults;
			}
		});
		this.checkProgressHandler();
	}

	quit () {
		this.checkProgressHandler();
		exec(this.dbusCommand('quit'), (error, stdout, stderr) => {
			if(error && (this.quitTryCount < 3)){
				this.quitTryCount++;
				this.quit();
			} else if(error) {
				this.quitTryCount = 0;
			} else {
				this.quitTryCount = 0;
				this.cache = this.defaults;
			}
	  });
	}

	togglePlay () {
		exec(this.dbusCommand('toggleplay'), (error, stdout, stderr) => {
			if (error) {
				console.log('toggleplay error:', error);
			} else {
				console.log('toggleplay result:', stdout);
			}
			if(error && (this.togglePlayTryCount < 4)){
				this.togglePlayTryCount++;
				this.togglePlay();
			} else {
				this.togglePlayTryCount = 0;
			}
	  });
	}

	seek (offset) {
		//seek offset in seconds; relative from current position; negative values will cause a jump back;
		exec(this.dbusCommand('seek ' +Math.round(offset*1000000)), (error, stdout, stderr) => {
			if(error && (this.seekTryCount < 4)){
				this.seekTryCount++;
				this.seek(offset);
			} else {
				this.seekTryCount = 0;
				this.update_position();
			}
	  });
	}

	setPosition (position) {
		//position in seconds from start; //positions larger than the duration will stop the player;
		exec(this.dbusCommand('setposition '+Math.round(position*1000000)), (error, stdout, stderr) => {
			if(error && (this.setPositionTryCount < 4)){
				this.setPositionTryCount++;
				this.setPosition(position);
			} else {
				this.setPositionTryCount = 0;
				this.update_position();
			}
	  });
	}

	setVolume (volume) {
		//volume should be set from 0.0 to 1.0; Above 1.0 is depreciated;
		exec(this.dbusCommand('setvolume '+volume), (error, stdout, stderr) => {
			if(error && (setPositionTryCount < 4)){
				this.setVolumeTryCount++;
				this.setVolume(volume);
			} else {
				this.setVolumeTryCount = 0;
				this.update_volume();
			}
	  });
	}

	setVisibility (visible) {
		let command = visible ? 'unhidevideo' : 'hidevideo';
		exec(this.dbusCommand(command), (err, stdout, stderr) => {
			console.log('result of setVisible:', command, ': error?', err);
		});
	}

	setAlpha (alpha) {
		exec(this.dbusCommand('setalpha ' + alpha), (err, stdout, stderr) => {
			console.log('result of setAlpha; error?', err);
		});
	}

	update_position () {
		exec(this.dbusCommand('getposition'), (error, stdout, stderr) => {
			if (error) return false;
			let position = parseInt(stdout);
			this.cache.position.value = position;
			this.cache.position.time = new Date();
			this.cache.position.valid = true;
	  });
	}

	update_status () {
		exec(this.dbusCommand('getplaystatus'), (error, stdout, stderr) => {
			if (error) return false;
			this.cache.isPlaying.value = ((stdout.indexOf("Playing")>-1) ? 1 : 0);
	 		this.cache.isPlaying.time = new Date();
			this.cache.isPlaying.valid = true;
	  });
	}

	update_duration () {
		exec( this.dbusCommand('getduration'), (error, stdout, stderr) => {
			if (error) return false;
    	let duration = Math.round(Math.max(0,Math.round(parseInt(stdout.substring((stdout.indexOf("int64")>-1 ? stdout.indexOf("int64")+6:0)))/10000)/100));
			this.cache.duration.value = duration;
			this.cache.duration.time = new Date();
			this.cache.duration.valid = true;
	  });
	}

	update_volume () {
		exec(this.dbusCommand('getvolume'), (error, stdout, stderr) => {
			if (error) return false;
    	let volume = parseFloat(stdout);
			this.cache.volume.value = volume;
			this.cache.volume.time = new Date();
			this.cache.volume.valid = true;
	  });
	}

	getCurrentPosition () {
		if((new Date()-this.cache.position.time)/1000 > 2) {
			this.cache.position.valid = false;
		}
		if(!this.cache.position.valid) {
			this.update_position();
		}
		if(this.cache.position.value > 0) {
			return Math.round(Math.max(0,Math.min(Math.round((this.cache.position.value + this.getCurrentStatus()*((new Date())-this.cache.position.time)*1000)/1000000),this.getCurrentDuration())));
		} else {
			return 0;
		}
	}

	getCurrentStatus () {
		if((new Date()-this.cache.isPlaying.time)/1000 > 2) {
			this.cache.isPlaying.valid = false;
		}
		if(!this.cache.isPlaying.valid) {
			this.update_status();
		}
		return this.cache.isPlaying.value;
	}

	getCurrentDuration () {
		if(this.cache.duration.value <= 0) {
			this.cache.duration.valid = false;
		}
		if(!this.cache.duration.valid) {
			this.update_duration();
		}
		return this.cache.duration.value;
	}

	getCurrentVolume () {
		if(!this.cache.volume.valid) {
			this.update_volume();
		}
		return this.cache.volume.value;
	}

	onProgress (callback) {
		console.log('add new progress handler')
		this.progressHandler = setInterval( () => {
			if(this.getCurrentStatus()){
				callback({position: this.getCurrentPosition(), duration: this.getCurrentDuration()});
			}
		}, 1000);
	}

	open (path) {
		console.log('OmxInterface open()');
		let settings = this.options || {};
		let args = [];
		let command = 'omxplayer';

		this.cache = this.setDefault();

		this.cache.path.value = path;
		this.cache.path.valid = true;

		args.push('"'+path+'"');

		if (['hdmi','local','both'].indexOf(settings.audioOutput) != -1) {
			args.push('-o');
			args.push(settings.audioOutput);
		}

		if (settings.blackBackground !== false) { // defaults to true
			args.push('-b');
		}

		if (settings.disableKeys === true) { //defaults to  false
			args.push('--no-keys')
		}

		if (settings.disableOnScreenDisplay === true) { //defaults to  false
			args.push('--no-osd')
		}

		if (settings.disableGhostbox === true) { //defaults to  false
			args.push('--no-ghost-box');
		}

		if (settings.loop === true) { // defaults to false
			args.push('--loop');
		}

		if (settings.subtitlePath && settings.subtitlePath != "" ){
			args.push('--subtitles');
			args.push('"'+settings.subtitlePath+'"');
		}

		if (settings.startAt){
			args.push('--pos');
			args.push(''+settings.startAt+'');
		}

		if (settings.layer) {
			args.push('--layer');
			args.push(settings.layer);
		}

		args.push('--dbus_name');
		args.push(this.dbusDest);

		let finalOpenCommand = command+' '+args.join(' ')+' < omxpipe'+this.layer;
		console.log('finalOpenCommand:', finalOpenCommand);

	  exec(finalOpenCommand, (error, stdout, stderr) => {
			this.update_duration();
			console.log('omxpipe done for layer', this.layer);
			setTimeout( () => {
				this.checkProgressHandler();
			}, 1000);
	  	console.log(stdout);
	  });
	  exec(' . > omxpipe'+this.layer);

	  this.update_duration();

	}

}

module.exports = OmxInterface;
