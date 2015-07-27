
var applicationId = 'amzn1.echo-sdk-ams.app.testid';

var MyHue = require('./lib/MyHue.js');

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        
        console.log("event: ", event);
        console.log("event.request.intent.slots: ", event.request.intent.slots);
        console.log("context: ", context);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
         }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        MyHue.handleRequest(event.request, 
                            event.session,
                            function callback(sessionAttributes, speechletResponse) {
                            context.succeed(buildResponse(sessionAttributes, speechletResponse));
                         });

    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */


/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "No command specified";
    var speechOutput = "Sorry, I didn't understand that.";
    var repromptText = "Please try something like, turn on bedroom lights in five minutes.";
    var shouldEndSession = true;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Schedule a timer to turn on the requested light group
 */
function turnOnAtTime(intent, session, callback) {
    var cardTitle = intent.name;
    var lightsSlot = intent.slots.Lights;
    var alarmTimeSlot = intent.slots.AlarmTime;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var dateString = buildResponseDateString(alarmTimeSlot);
    console.log("dateString = " + dateString);
    speechOutput = "I will turn " + lightsSlot.value + " on at " + dateString + ". See you then";
    console.log(speechOutput);

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Schedule a timer to turn off the requested light group
 */
function turnOffAtTime(intent, session, callback) {
    var cardTitle = intent.name;
    var lightsSlot = intent.slots.Lights;
    var alarmTimeSlot = intent.slots.AlarmTime;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    speechOutput = "I will turn " + lightsSlot.value + " off at " + alarmTimeSlot.value + ". Goodnight";
    console.log(speechOutput);

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
             buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------

function buildResponseDateString(alartmTimeSlot) {

    var dateHours = parseInt(alarmTimeSlot.value.split(':')[0]),
        dateMinutes = parseInt(alarmTimeSlot.value.split(':')[1]);
        
    var dateString = "";
    if( dateHours === 0 ) {
        dateString = "12 ";
    }
    else if( dateHours <= 12 ) {
        dateString = dateParts[0] + " ";
    }
    else {
        dateString = (dateHours - 12) + " ";
    }
    
    if( dateMinutes > 0 && dateMinutes < 9 ) {
        dateString += "oh " + dateMinutes;
    }
    else {
        dateString += dateMinutes;
    }
    
    if( dateHours < 12 ) {
        dateString += " a.m.";
    }
    else {
        dateString += " p.m.";
    }

    return dateString;
}

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}










/*********************** SERVER STUFF 


// test to emulate execution by LAMDA
var express = require('express'), 
	service = new express(),
	port = 8081;

var context = function() {}
context.prototype.fail = function(msg) { console.log(msg); }

service.get( '/multitimer', function(request, response) {
	console.log("Got request: %j" + request);

});

service.listen(port);
console.log("Mock service running on %s", port);

/*

https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference

request format:
{
  "version": "string",
  "session": {
    "new": boolean,
    "sessionId": "string",
    "application": {
      "applicationId": "string"
    },
    "attributes": {
      "string": object
    },
    "user": {
      "userId": "string"
    }
  },
  "request": object, {
    "type": "LaunchRequest", // LaunchRequest|IntentRequest|SessionEndedRequest
    "requestId": "request.id.string",
    "timestamp": "string"
  }
}

structures for "request" object:

LaunchRequest: 
{
  "type": "LaunchRequest",
  "requestId": "string",  // Unique identifier for the specific request.
  "timestamp": "string"  // ISO-8601 formatted date when Alexa sent the request (i.e. 2015-05-13T12:34:56Z)
}

IntentRequest:
{
  "type": "IntentRequest",
  "requestId": "string",
  "timestamp": "string",
  "intent": {
    "name": "string",
    "slots": {  // can be empty. key-value pairs based in intent schema
      "string": {
        "name": "string",
        "value": "string" // literal strings are always lowercase
      }
    }
  }
}

SessionEndedRequest:
{
  "type": "SessionEndedRequest",
  "requestId": "string",
  "timestamp": "string",
  "reason": "string"
}

HTTP Header

HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Content-Length:

CONTENT LENGTH MUST MATCH SIZE OF RESPONSE!


Response Body Syntax
{
  "version": "string",
  "sessionAttributes": {
    "string": object
  },
  "response": {
    "outputSpeech": {
      "type": "string",
      "text": "string"
    },
    "card": {
      "type": "string",
      "title": "string",
      "content": "string"
    },
    "reprompt": {
      "outputSpeech": {
        "type": "string",
        "text": "string"
      }
    },
    "shouldEndSession": boolean
  }
}
*/