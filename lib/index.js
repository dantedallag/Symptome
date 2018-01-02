var APP_ID = "This.is.a.cool.application";

var Alexa = require('alexa-sdk');
var mysql = require('mysql');

var states = {
    SYMPTOME: '_SYMPTOME',
    SEVERITY: '_SEVERITY'
};

var connection;
var name;
var location = "Alviso";
var lon = -121.974303;
var lat = 37.421499;

var symptomes = [];
var symptomeArray = [];
var symptomeIds = [];
var patientIds = [];
var severity = [];


var SymptomesHandler = Alexa.CreateStateHandler(states.SYMPTOME, {

    'SymptomeIntent': function() {
    	// console.log("It got to symptome Intent alright")
    	var fullSymp = this.event.request.intent.slots.symptomeSlot;
        var reprompt1 = "Sorry I didn't get that. Could you repeat your symptom?";
        // console.log("Hello this is not working" + symp);
        if(typeof fullSymp === "undefined") {
            this.emit(':ask', "Sorry I didn't get that. Could you repeat your symptom?", reprompt1);
        } else {
            var index;
            var fullSympText = fullSymp.value;
            console.log("The full symptome text" + fullSympText);
            for (index in symptomes) {
                if(fullSympText.search(symptomes[index]) != -1) {
                    var symp = symptomes[index];
                    patientIds[patientIds.length] = symptomeIds[index];
                    break;
                }
                // console.log(symptomes[index]);
            }
            // console.log(index);
            // console.log(symptomes.length);
            if(index >= symptomes.length-1) {
                this.emit(':ask', "I don't recognize that symptom. Is there another way you could describe how you are feeling?", reprompt1);
            } else {
                var reprompt2 = "could you say how your " + symp + " rates in a scale from one to five?";
                var reprompt3 = "Please list another symptom, or if you are done say stop";
                symptomeArray[symptomeArray.length] = symp;
                this.handler.state = states.SEVERITY;
                this.emit(':ask', "How bad is your " + symp + " on a scale of one to five", reprompt2);
                // } else {
            	   // // this.emit(':tell', symptomeArray[symptomeArray.length - 1]);
            	   // this.emit(':ask', "Please list another symptom, or if you are done say stop", reprompt3);
            	   // //enter into database and check that the symptome is valid
                // }
            }
        }
    },

    'AMAZON.NoIntent': function () {
    	// console.log("SESSIONENDEDREQUEST");
        // console.log(symptomeArray.length);
     	//this.attributes['endedSessionCount'] += 1;

        //TODO: This is where I need to push everything to a database
        // console.log("pid: " + patientIds.length);
        // console.log("sev: " + severity.length);
        // var index;
        // for (index in patientIds) {
        //     console.log(patientIds[index] + " : " + severity[index]);
        // }
        var patientIdString = "";
        var patientSeverityString = "";
        for(var i = 0; i < patientIds.length - 1; i++)
        {
            patientIdString = patientIdString + patientIds[i] + ",";
            patientSeverityString = patientSeverityString + severity[i] + ",";
        }
        patientIdString += patientIds[patientIds.length - 1];
        patientSeverityString += severity[severity.length - 1];

        var self = this;
        var post = {name: name, location: location, lon: lon, lat: lat, symptoms: patientIdString, severities: patientSeverityString };
        var testQ = connection.query("INSERT INTO patients SET ?", post, function(error, result) {
            self.emit(':tell', "Thank you " + name  + " I have let a doctor know about your symptoms. I hhope you feel better soon!"});
      });
    },

    'Unhandled': function() {
     	// console.log("UNHANDLED in symptome handler");
        var message = "I don't recognize that symptom. Is there another way you could describe how you are feeling?";
        var reprompt = "Is there another way you could describe how you are feeling?";
        this.emit(':ask', message, reprompt);
    }
});


var SeverityHandler = Alexa.CreateStateHandler(states.SEVERITY, {
    'SeverityIntent': function() {
        // console.log(this.event.request.intent.slots.severity.value);
        var number = parseInt(this.event.request.intent.slots.severity.value);
        var reprompt = "What was the severity of your " + symptomeArray[symptomeArray.length - 1] + "?";
        if(number > 5) {
            number = 5;
        }
        severity[severity.length] = number;
        this.handler.state = states.SYMPTOME;
        this.emit(':ask', "your " + symptomeArray[symptomeArray.length - 1] + " was a " + number + " in severity. Do you have any other symptoms?");
    },

    'Unhandled': function() {
        // console.log("UNHANDLED in Security handler");
        var message = "Sorry, I didn't catch that. What was the severity of your " + symptomeArray[symptomeArray.length - 1];
        this.emit(':ask', message, message);
    }
});

var StartingHandler = {
    'LaunchRequest': function () {
        symptomeArray.length = 0;
        symptomeArray = [];
        symptomes.length = 0;
        var symptomes = [];
        symptomeIds.length = 0;
        var symptomeIds = [];
        patientIds.length = 0;
        var patientIds = [];
        severity.length = 0;
        var severity = [];

        

        connection = mysql.createConnection({
            host     : 'seto.io',
            user     : 'seto_h4h',
            password : 'UNM-7pu-kaU-bcA',
            database : 'seto_h4h',
        });
        connection.connect(function(err) {});

        var self = this;
        var db;    
        connection.query("select id,name from symptoms", function(error, results, fields) {
        if(error) {
            self.emit(':tell', "Database error");
            throw error;
        }
        db = results;
        for(var i = 0; i < db.length; i++)
        {
            symptomes[i] = JSON.parse(JSON.stringify(db))[i].name;
            symptomeIds[i] = JSON.parse(JSON.stringify(db))[i].id;
        }
        // for(var i = 0; i < symptomes.length; i++)
        // {
        //   console.log(symptomes[i] + " : " + symptomeIds[i]);
        // }

        var reprompt = "Could you let me know your name?";
        self.emit(':ask', "I'm sorry you don't feel well. What is your name?", reprompt);
      });
    },

    'NameIntent': function() {
        name = this.event.request.intent.slots.name.value;
        this.handler.state = states.SYMPTOME;
        var reprompt = "Could you let me know one of your systems?";
        this.emit(':ask', "alright " + name + " could you let me know one of your symptoms?", reprompt);
    },

    'Unhandled': function() {
        // console.log("UNHANDLED in starting handler");
        // console.log("symptome in Starting handler: " + this.event.reque);
        var message = "hey that didn't work. Could you repeat what you said?";
        this.emit(':ask', message, message);
    }
};


exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(StartingHandler, SymptomesHandler, SeverityHandler);
    alexa.execute();
};
