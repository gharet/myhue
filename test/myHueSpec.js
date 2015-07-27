var util = require('util'),
	chai = require('chai'),
	expect = chai.expect,
	should = chai.should(),
	sinon = require('sinon'),
	MyHue = require('../lib/MyHue.js'),
	EchoCore = require('../lib/EchoCore.js');

var testRequests = {

	// for validating requests
	genericValidIntentRequest : {
		intent : { name : "TurnOnAtTime" },
		type : "IntentRequest",
		requestId : "request1234"
	},
	genericInvalidIntentRequest : { 
		intent : { name : "SomeOtherThing" }, 
		type : "IntentRequest", 
		requestId : "request9876"
	},

	
}


/** The actual tests! **/
describe( "MyHue", function() {

	// Reset test data
	beforeEach( function(done) {

		testRequests.genericSession = {
		    "new": false,
		    "sessionId": "session1234",
		    "attributes": {},
		    "user": {
		      "userId": null
		    },
		    "application": {
		      "applicationId": "amzn1.echo-sdk-ams.app.[unique-value-here]"
		    }
		};
		testRequests.turnOnRequest = {
		    "intent": {
		      "slots": {
		        "Lights": {
		          "name": "Lights",
		          "value": "garage lights"
		        },
		        "AlarmTime": {
		          "name": "AlarmTime",
		          "value": "17:04"
		        }
		      },
		      "name": "TurnOnAtTime"
		    },
		    "type": "IntentRequest",
		    "requestId": "request1234"
		 };

		testRequests.turnOffRequest = {
		    "intent": {
		      "slots": {
		        "Lights": {
		          "name": "Lights",
		          "value": "patio"
		        },
		        "AlarmTime": {
		          "name": "AlarmTime",
		          "value": "03:00"
		        }
		      },
		      "name": "TurnOffAtTime"
		    },
		    "type": "IntentRequest",
		    "requestId": "request0987"
		 };

		 done();

	});


	describe( "isIntentSupported()", function() {
		it("Should verify intent name is in list of configured intents", function() {
			// test with a valid intent
			var validated = MyHue.isIntentSupported( testRequests.genericValidIntentRequest.intent );
			expect(validated).to.equal(true);

			// test with invalid intent
			validated = MyHue.isIntentSupported( testRequests.genericInvalidIntentRequest.intent );
			expect(validated).to.equal(false);
		});
	});


	describe( "handleIntent()", function() {

		it("Should throw an exception if an invalid intent is provided", function() {
			// test with a valid intent
			var handleIntentWrapper = function() {
				MyHue.handleIntent( testRequests.genericInvalidIntentRequest );
			}
			expect(handleIntentWrapper).to.throw(MyHue.errorCodes['ERR_INVALID_INTENT']);
		});

		it("Should call the appropriate intent handler based on intent name", function() {
			// test with at least 2 different valid intent types
			var spy = sinon.spy(MyHue, "Intent_scheduleTimer");
			var emptyCallback = function() {}

			MyHue.handleIntent( testRequests.turnOnRequest, testRequests.genericSession, emptyCallback );
			MyHue.handleIntent( testRequests.turnOffRequest, testRequests.genericSession, emptyCallback );

			// As a forcing function, make sure that handleIntent is called as many times as there are intents, as a forcing function
			// to keep new intents tested here
			expect(spy.callCount).to.equal(MyHue.supportedIntents.length);

			// verify that the timer schedule intent was calld with different parameters
			expect(spy.calledTwice).to.be.true;
			expect(spy.getCall(0).calledWith(testRequests.turnOnRequest.intent, "on", testRequests.genericSession, emptyCallback)).to.be.true;
			expect(spy.getCall(1).calledWith(testRequests.turnOffRequest.intent, "off", testRequests.genericSession, emptyCallback)).to.be.true;
		});

	});


	describe( "Intent_scheduleTimer()", function() { 

		it("Should call the provided callback when complete", function() {
			var spyCallback = function(sessionAttributes, speechletResponse) {}
			var spy = sinon.spy(spyCallback);
			MyHue.Intent_scheduleTimer(testRequests.turnOnRequest.intent, "on", testRequests.genericSession, spy);
			expect(spy.called).to.be.true;
		});

		it("Should throw an exception if slots are missing", function() {
			var scheduleTimerWrapper = function() {
				var invalidIntent = testRequests.turnOnRequest.intent;
				invalidIntent.slots.Lights.value = "";
				MyHue.Intent_scheduleTimer( invalidIntent, "on", testRequests.genericSession, function() {} );	
			}
			expect(scheduleTimerWrapper).to.throw(MyHue.errorCodes['ERR_SLOTS_MISSING']);
		});

		it("Should generate the correct card title and speech output based on the slots and intent (on or off)", function() {

			// start with request for turn on intent
			var spy = sinon.spy(EchoCore, "buildSpeechletResponse"),
					  emptyCallback = function() {},
					  lights = testRequests.turnOnRequest.intent.slots.Lights.value,
					  alarmTime = testRequests.turnOnRequest.intent.slots.AlarmTime.value,
					  expectedTitle = util.format(MyHue.cardTitles.scheduleTimer, lights, "on", MyHue.buildResponseDateString(alarmTime)),
					  expectedSpeech = util.format(MyHue.speechOutput.scheduleTimer, lights, "on", MyHue.buildResponseDateString(alarmTime)),
					  expectedReprompt = "",
					  expectedSessionEnd = true;


			// start with turn on request
			MyHue.Intent_scheduleTimer( testRequests.turnOnRequest.intent, "on", testRequests.genericSession, emptyCallback );
			expect(spy.calledOnce).to.be.true;
			expect(spy.getCall(0).calledWith(expectedTitle, expectedSpeech, expectedReprompt, expectedSessionEnd)).to.be.true;


			// now update params for the turn off intent and call the method
			lights = testRequests.turnOffRequest.intent.slots.Lights.value;
			alarmTime = testRequests.turnOffRequest.intent.slots.AlarmTime.value;
			expectedTitle = util.format(MyHue.cardTitles.scheduleTimer, lights, "off", MyHue.buildResponseDateString(alarmTime)),
			expectedSpeech = util.format(MyHue.speechOutput.scheduleTimer, lights, "off", MyHue.buildResponseDateString(alarmTime)),

			MyHue.Intent_scheduleTimer( testRequests.turnOffRequest.intent, "off", testRequests.genericSession, emptyCallback );
			expect(spy.calledTwice).to.be.true;
			expect(spy.getCall(1).calledWith(expectedTitle, expectedSpeech, expectedReprompt, expectedSessionEnd)).to.be.true;
		});

	});


});

