/** 
 * DPC GA for Youtube Embed
 * 
 * http://directperformance.com.br/
 * Copyright (c) 2009 Direct Performance
 * ga-dpc-youtube by Direct Performance (http://www.directperformance.com.br) is licensed under a Creative Commons Atribuição-Uso Não-Comercial-Compartilhamento pela mesma Licença 2.5 Brasil License (http://creativecommons.org/licenses/by-nc-sa/2.5/br/).
 *
 * $Date: 2009-10-01 17:52:42 -0300 (qui, 01 out 2009) $
 * @fileoverview  métodos para medição de interações com vídeos Youtube Embedded usando eventos no Google Analytics
 * @author DirectPerformance -  http://www.directperformance.com.br/ <contato@directperformance.com.br>
 * @version $Revision:  $
 *
 */
 
var YoutubeTrackerGlobal = window.YoutubeTrackerGlobal = {};
YoutubeTrackerGlobal.bucket_ = [];
YoutubeTrackerGlobal.objects = [];
YoutubeTrackerGlobal.timeout = -1;
YoutubeTrackerGlobal.seekTimeout = -1;
YoutubeTrackerGlobal.callbackTracker = function(video_code,action,bucket,time_seconds){};
 
 /**
 * @class Youtube Tracking Component
 * This class encapsulates all logic for tracking youtube videos on a page
 * To track Embedded Youtube Videos:
 * 1) Specify  a ID for the OBJECT or EMBED tag
 *     Ex: <object id="myytplayer"> or <embed id="myytplayer">
 * 2) Include Youtube JS API parameters in OBJECT or EMBED url: &enablejsapi=1&playerapiid=ytplayer
 *     Ex: http://www.youtube.com/v/gRvUpoTT-Bo&hl=pt-br&fs=1&enablejsapi=1&playerapiid=myytplayer
 * 3) Especificar atributo allowscriptaccess="always"
 *     Ex: <param name="allowscriptaccess" value="always"> or <embed allowscriptaccess="always">
 * @param {Number[]} [arg1=[10, 30, 60, 180, 600]] Array that represents the bucket
 * @constructor
 */
var YoutubeTracker = window.YoutubeTracker = function(opt_bucket,callback,debug) {
  if (opt_bucket) {
    YoutubeTrackerGlobal.bucket_ = opt_bucket.sort(YoutubeTrackerGlobal.sortNumber); 
  } else {
    YoutubeTrackerGlobal.bucket_ = YoutubeTracker.DEFAULT_BUCKET;
  }
  if (callback){
	YoutubeTrackerGlobal.callbackTracker = callback;
  } else if(pageTracker&&pageTracker._trackEvent) {
	YoutubeTrackerGlobal.callbackTracker = pageTracker._trackEvent;
  }
  if (debug){
	YoutubeTrackerGlobal.callbackTracker_ = YoutubeTrackerGlobal.callbackTracker;
	YoutubeTrackerGlobal.callbackTracker = function(video_code,action,bucket,time_seconds){
		YoutubeTrackerGlobal.callbackTracker_(video_code,action,bucket,time_seconds);
		if (console&&console.log){
			console.log(video_code + ', ' + action + ', ' + bucket + ', ' + time_seconds);//DEBUG
		}		
	};
  }
};

/**
 * Helper function to sort an Array of numbers
 * @public
 * @param {Number} arg1 The first number
 * @param {Number} arg2 The second number
 * @return The difference used to sort
 * @type Number
 */
YoutubeTrackerGlobal.sortNumber = function(a, b) {
  return (a - b);
};

/**
 * Sets the bucket for histogram generation in GA
 * @public
 * @param {Number[]} The bucket array
 */
YoutubeTrackerGlobal._setHistogramBuckets = function(buckets_array) {
  YoutubeTrackerGlobal.bucket_ = buckets_array.sort(this.sortNumber);
};


/**
 * @constant 
 * */
YoutubeTracker.DEFAULT_BUCKET = [10, 30, 60, 180, 600];

/**
 * Get the current bucket for a given time in seconds
 * @public
 * @param {Number[]} The bucket array
 */
YoutubeTrackerGlobal.getBucket = function(time){
	var i;
	var bucketString;
	//if (time==0) return "0";
	for(i = 0; i < YoutubeTrackerGlobal.bucket_.length; i++) {
		if (time < YoutubeTrackerGlobal.bucket_[i]) {
			if (i === 0) {
				bucketString = "0-" + (YoutubeTrackerGlobal.bucket_[0]);
				break;
			} else {
				bucketString = YoutubeTrackerGlobal.bucket_[i - 1] + "-" + (YoutubeTrackerGlobal.bucket_[i] - 1);
				break;
			}
		}
	}
	if (!bucketString) {
		bucketString = YoutubeTrackerGlobal.bucket_[i - 1] + "+";
	}
	return bucketString;
};

/**
 * Sends a event with the maximum time viewed for each video on the page
 * @public
 */
YoutubeTrackerGlobal.trackMaxTime = function(){
	var bucketString, cat_name, action_name, ytplayer;
	for (var i in YoutubeTrackerGlobal.objects){
		if (YoutubeTrackerGlobal.objects[i]){
			bucketString = YoutubeTrackerGlobal.getBucket(YoutubeTrackerGlobal.objects[i].maxTime);
			ytplayer = document.getElementById(YoutubeTrackerGlobal.objects[i].id);
			if (ytplayer){
				cat_name = ytplayer._YoutubeTracker_cod_video;			
				action_name = "max-time";
				YoutubeTrackerGlobal.callbackTracker(cat_name,action_name,bucketString,YoutubeTrackerGlobal.objects[i].maxTime);
			}
		}
	}
};

/**
 * Update all the current status and time values for all the video objects
 * @public
 */
YoutubeTrackerGlobal.updatetimer = function(){
	var currTime, ytplayer, cat_name, action_name, actualBucket;
	for (var i in YoutubeTrackerGlobal.objects){
		if (YoutubeTrackerGlobal.objects[i]){
			ytplayer = document.getElementById(YoutubeTrackerGlobal.objects[i].id);
			if (ytplayer&&ytplayer.getCurrentTime){
				currTime = parseInt(ytplayer.getCurrentTime(),10);
				ytplayer._YoutubeTracker_last_posicao = currTime;
				if (currTime>YoutubeTrackerGlobal.objects[i].maxTime) {YoutubeTrackerGlobal.objects[i].maxTime = currTime;}
				//check if viewing time changes the bucket while playing
				if (ytplayer.getPlayerState()==1){
					actualBucket = YoutubeTrackerGlobal.getBucket(currTime);
					if (actualBucket!=ytplayer._YoutubeTracker_lastBucket){
						cat_name = ytplayer._YoutubeTracker_cod_video;
						action_name = "view-range";
						YoutubeTrackerGlobal.callbackTracker(cat_name,action_name,actualBucket,currTime);
						ytplayer._YoutubeTracker_lastBucket = actualBucket;
					}
				}
			}
		}
	}
};

/**
 * Captures Youtube JS API Event
 * @public
 * @playerId {String[]}  Object ID passed in &playerapiid
 */
window.onYouTubePlayerReady = function(playerId) {
	//identificação do vídeo
	var ytplayer = document.getElementById(playerId);		
	//cria método de envio de ações no vídeo
	if (ytplayer){
		var re = /(v=|v\/|p\/)([^&?]+)/.exec(ytplayer.getVideoUrl());
		var cod_video=((re&&re[2])?re[2]:ytplayer.getVideoUrl())||playerId;
		ytplayer._YoutubeTracker_cod_video = "youtube-video:" + cod_video;
		YoutubeTrackerGlobal.objects.push({id:playerId,maxTime:0,cod:cod_video});
		ytplayer._YoutubeTracker_sendaction = function(newState){
			var cat_name = this._YoutubeTracker_cod_video;					
			posicao = parseInt(this.getCurrentTime(),10);
			var action_name = newState;
			switch (newState){
				case -1: action_name="nunstarted"; break;
				case 0: action_name="ended"; break;
				case 1: action_name="playing";break;
				case 2: action_name="paused";break;
				case 3: action_name="buffering"; break;
				case 5: action_name="cued"; break;
			}
			//detect rewind and forward
			if (posicao<(ytplayer._YoutubeTracker_last_posicao-1)){
				action_name="rewind";				
			}else if(posicao>(ytplayer._YoutubeTracker_last_posicao+1)){
				action_name="fast-forward";
			}
			//detect rewind and forward after paused
			var seekAfterPause = false;
			if (action_name=="playing"){
				if (posicao<(ytplayer._YoutubeTracker_last_posicao_paused-1)){
					action_name="rewind";
					seekAfterPause = true;
				}else if(posicao>(ytplayer._YoutubeTracker_last_posicao_paused+1)){
					action_name="fast-forward";
					seekAfterPause = true;
				}
			}
			//don't track buffering state (3) or repeated events
			if ((action_name!="buffering")&&(action_name!=ytplayer._YoutubeTracker_last_action)){
				ytplayer._YoutubeTracker_last_action = action_name;
				var last_posicao_ = ytplayer._YoutubeTracker_last_posicao;
				if (seekAfterPause){ last_posicao_ = ytplayer._YoutubeTracker_last_posicao_paused;}
				ytplayer._YoutubeTracker_last_posicao = posicao;
				var bucketString;
				//avoid track paused if its just used to track seeking events
				if (action_name=="paused"){
					ytplayer._YoutubeTracker_last_posicao_paused = posicao;
					bucketString = YoutubeTrackerGlobal.getBucket(posicao);
					YoutubeTrackerGlobal.seekTimeout = setTimeout("YoutubeTrackerGlobal.callbackTracker('"+cat_name+"','"+action_name+"','"+bucketString+"',0"+posicao+");",300);
				} else {
					//seeking events
					if ((action_name=="rewind")||(action_name=="fast-forward")){
						clearTimeout(YoutubeTrackerGlobal.seekTimeout); //cancel previou paused events
						//track both from and to positions for seeking events
						bucketString = YoutubeTrackerGlobal.getBucket(last_posicao_);
						YoutubeTrackerGlobal.callbackTracker(cat_name,action_name+':from',bucketString,last_posicao_);
						bucketString = YoutubeTrackerGlobal.getBucket(posicao);
						YoutubeTrackerGlobal.callbackTracker(cat_name,action_name+":to",bucketString,posicao);
					} else {
						// other events
						bucketString = YoutubeTrackerGlobal.getBucket(posicao);
						YoutubeTrackerGlobal.callbackTracker(cat_name,action_name,bucketString,posicao);
					}					
				}
			}
		};
		ytplayer.addEventListener("onStateChange", "document.getElementById('"+playerId+"')._YoutubeTracker_sendaction");
		//tratamento de erros no vídeo
		ytplayer._YoutubeTracker_senderror = function(errCode){
			var cat_name = this._YoutubeTracker_cod_video;
			YoutubeTrackerGlobal.callbackTracker(cat_name,"error",errCode);
		};
		ytplayer.addEventListener("onError", "document.getElementById('"+playerId+"')._YoutubeTracker_senderror");
	}
	// atualiza posição a cada segundo
	YoutubeTrackerGlobal.timeout = setInterval(YoutubeTrackerGlobal.updatetimer,500);
};