# Introduction #

If you have posted videos on YouTube already you know that it is possible to analyze statistics and metrics of your video masterpiece through YouTube Insights. For those not familiar is a spectacular feature of YouTube that provides source data, demographic data and viewing-time data of your videos.

However, if you like to embed videos on your page or blog, you should have passed the frustration of not knowing how your video is viewed by your visitors, or at least how many people get through to the end of the video.

But in Google Analytics you can’t measure it?

Well, by default it’s a hard work, because a embedded YouTube video is a flash player which can not be edited.

Digging a little the Youtube Player API, we find ways to monitor events video, and with a little bit of brain work (and some parameters of the player), it is possible to monitor these events and send the information to Google Analytics with a simple javascript code.

# Details #

To use the library it’s simple:
  1. Add an element ID for the flash player embedded in the page
  1. Add the URL of the Youtube video parameters: &enablejsapi=1&playerapiid=FLASH\_ELEMENT\_ID
  1. Download the Library Javascript file and host at your server
  1. Include a call to the library in your page that contains videos

We have to concern ourselves only with one technical detail to enable this:

In Internet Explorer, some features of the YouTube API can not be performed with the player embedded directly as an HTML element (OBJECT / EMBED), then use the library SWFObject to embed the video player.

See how the code is a simple page for example:

```
<!--SWF Object Reference needed to cross-browser embedding the player-->
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js"></script>  

<!--YouTube Embedded Code - Video 1-->
<div id="flashdiv1"></div>
<script type="text/javascript">
var params = { allowScriptAccess: "always" };
var atts = { id: "myplayerid1" };
swfobject.embedSWF("http://www.youtube.com/v/gRvUpoTT-Bo&hl=pt-br&fs=1&enablejsapi=1&playerapiid=myplayerid1&version=3", "flashdiv1", "425", "344", "8", null, null, params, atts);
</script>

<!--Youtube tracking component-->
<script src="ga_dpc_youtube.js"></script>
<!--Initializing component-->
<script>
	try{
		var ytTracker = new YoutubeTracker();
	}catch(e){}
</script>
```

The library monitors the embedded video and triggers the following events interface for event tracking Google Analytics:
  * Cued (video ready)
  * Play
  * Paused
  * Ended
  * Fast-Forward
  * Rewind
  * View-Range (how much of the video was viewed)

For each of this triggered events, the library includes a label indicating which part of the video that event occurred. It is possible in example to know how many seconds of video visitors viewed when they stoped the video. Or whether they view as much as half of the video, or until the end, etc..

See what's the event topology for this tracking:
  1. The event categories are defined as youtube-video:YouTube-Video-ID
  1. Drill-down into a specific video, you will see that actions are nothing more than the events of the video (cued, play, paused, ended, fast-foward, rewind)
  1. And if you click on each action, you will see that each action is associated with a piece of video viewing time ranges

These time labels (called “buckets”) are defined by default as the visits-length report in Google Analytics in seconds (0-9, 10-29, 30-59, 60-179, 180-599, 600 +). It is possible, however customize these tracks passing the parameter opt\_bucket to the library initialization method in the page code. See example (defining tracks in seconds for 0-29, 30-59, 60-89, 90-119, 120 +):

```
<script>
	try{
		var ytTracker = new YoutubeTracker([30,60,90,120]);
	}catch(e){}
</script>
```


## Custom Google Analytics Implementations ##

By default, YoutubeTracker will try to use the two default _trackEvent implementations:
  1. Async_trackEvent : _gaq.push(['_trackEvent',category,action,label,value]);
  1. Sync _trackEvent : pageTracker._trackEvent(category,action,label,value);

If your site uses a custom implementation which renames the default tracker objects or fires custom code snippets, you will need to modify it accordingly. Take a look at the example, taking the track calls sent to a special my\_track\_function:

```
	function yt_callback(category,action,label,value){
 		my_track_function(category,action,label,value]);
	}
	var ytTracker = new YoutubeTracker(false, yt_callback, true);
```

http://www.directperformance.com.br/en/como-medir-videos-youtube-com-google-analytics