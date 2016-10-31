var facebook_parser = require('./bot_utils.js')
var schedule = require('node-schedule')

var rule = new schedule.RecurrenceRule();
rule.second = [0, 15, 30, 45];

function recurTask(){
	console.log("got hit!")
	var j = schedule.scheduleJob(rule, function(){
		console.log("This is a test")
		facebook_parser.sendFacebookMessage("1089596007743017","This is a test")
	})
}

module.exports = {
	recurTask:recurTask
};