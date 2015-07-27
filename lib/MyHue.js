exports = module.exports = {}

var EchoCore = require('./EchoCore.js');
var util = require('util');

/* Amazon Echo and Philips Hue bridge library */

function MyHue() {

	this.supportedIntents = [ "TurnOnAtTime", "TurnOffAtTime" ];

	this.errorCodes = {
		'ERR_INVALID_INTENT' : "Intent Not supported",
		'ERR_SLOTS_MISSING'  : "Slots Missing From Intent",
	};

	this.cardTitles = {
		scheduleTimer :	"Turning %s %s at %s",
	};

	this.speechOutput = {
		scheduleTimer : "I'll turn %s %s at %s. See you then",
	}
};

MyHue.prototype.errorCodes = function() {
	return this.errorCodes;
}

MyHue.prototype.isIntentSupported = function( intent ) {
	if( this.supportedIntents.indexOf(intent.name) > -1 ) {
		return true;
	}
	return false;
}

/* Inspect the request and handle it based on intent */
MyHue.prototype.handleRequest = function( request, session, callback ) {
	

    if (request.type === "IntentRequest") {

    	/* If intent is invalid, an exception will be thrown */
        this.handleIntent(request,
                 	 session,
                 	 callback);
    } 
    /* 
	 * No handling (or need) for sessions or generic launch requests 

    else if (request.type === "SessionEndedRequest") {
        onSessionEnded(event.request, event.session);
        context.succeed();
    } else if (request.type === "LaunchRequest") {
        onLaunch(event.request,
                 event.session,
                 function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                 });
    } 
     *
     */
}


MyHue.prototype.handleIntent = function(request, session, callback) {

	if( !this.isIntentSupported(request.intent) ) {
		throw new Error(this.errorCodes['ERR_INVALID_INTENT']);
	}

    _debugLog("handleIntent requestId=" + request.requestId
                + ", sessionId=" + session.sessionId);

    var intent = request.intent,
        intentName = request.intent.name;

    // Dispatch to handler based on intent
    if ("TurnOnAtTime" === intentName) {
        this.Intent_scheduleTimer(intent, "on", session, callback);
    } else if ("TurnOffAtTime" === intentName) {
        this.Intent_scheduleTimer(intent, "off", session, callback);
    }
}



/***** HELPERS *****/

MyHue.prototype.buildResponseDateString = function(alarmTimeSlot) {

    var dateHours = parseInt(alarmTimeSlot.split(':')[0]),
        dateMinutes = parseInt(alarmTimeSlot.split(':')[1]);
       
    /** NEEDS IMPROVEMENT: 
    	a) Can alexa read dates like "9:04" as "nine oh four" ?
    	b) If so, repalce all this with simply showing the date like above, replacing military
    	   time with civilian time with a.m./p.m. suffix
    	c) If not, create a different method for formatting card title so that the phoenetic
    	   eversion for speechback does not show on the cards
    **/
    var dateString = "";
    if( dateHours === 0 ) {
        dateString = "12:";
    } else if( dateHours <= 12 ) {
        dateString = dateHours + ":";
    } else {
        dateString = (dateHours - 12) + ":";
    }
    

    if( dateMinutes < 10 ) {
    	dateString += "0" + dateMinutes;
    } else {
    	dateString += dateMinutes;
    }
    
    if( dateHours < 12 ) {
        dateString += " a.m.";
    } else {
        dateString += " p.m.";
    }

    return dateString;
}

/***** ACTIONS *****/

MyHue.prototype.Intent_scheduleTimer = function(intent, onOff, session, callback ) {

	// Validate that the required slots are defined
	var lightSlot, alarmTimeSlot, dateString;
	var cardTitle = "";
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

	try {
		lightSlot = intent.slots.Lights.value;
    	alarmTimeSlot = intent.slots.AlarmTime.value;

    	if( lightSlot.length == 0 || alarmTimeSlot.length == 0 ) {
    		throw new Error(this.errorCodes['ERR_SLOTS_MISSING']);
    	}

    	dateString = this.buildResponseDateString(alarmTimeSlot);
    	_debugLog("dateString = " + dateString);
	}
	catch( e ) {
		// if data was missing throw an exception. there is no state, so they can simply retry without needing to reprompt
		throw new Error(this.errorCodes['ERR_SLOTS_MISSING'] + e);
	}
	
    
    cardTitle = util.format(this.cardTitles.scheduleTimer, lightSlot, onOff, dateString);
    speechOutput = util.format(this.speechOutput.scheduleTimer, lightSlot, onOff, dateString);
    _debugLog(speechOutput);

    callback(sessionAttributes,
             EchoCore.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


function _debugLog(string, obj) {
	if( false ) {
		if( obj ) {
			console.log(string,obj);
		} else {
			console.log(string)
		}
	}
}





module.exports = exports = new MyHue();
