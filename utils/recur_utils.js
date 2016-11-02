const facebook_parser = require('./bot_utils.js')
const db_utils = require('./db_utils.js');
const schedule = require('node-schedule')

var rule = new schedule.RecurrenceRule();
rule.hour = 1;
rule.minute = 0;

// rule.second = [0, 30];

function recurTask(){
	console.log("Starting cron tasks!")
	var daily_update = schedule.scheduleJob(rule, function(){
		console.log("Updating user facing " + Date.now())
		var usersPromise = db_utils.getUsers()
		usersPromise.then(function(users){
			for (var id in users){
				var hour = users[id].rec_time['hour']
				var minute = users[id].rec_time['minute']
				console.log(users[id].rec_time['hour'])

				var userReminderRule = new schedule.RecurrenceRule();
				userReminderRule.hour = hour
				userReminderRule.minute = minute

				var userRandomMessageRule = new schedule.RecurrenceRule();
				// Only show random messages between 9 AM and 9 PM
				var max = 21;
				var min = 9;

				userRandomMessageRule.hour = Math.floor(Math.random()*(max - min)) + min;

				// userRandomMessageRule.hour = 17;
				// userRandomMessageRule.minute = 21;


				// Adding 1 day in MS = 86400000


				var userReminderSend = schedule.scheduleJob({end: new Date(Date.now() + 86400000), rule: userReminderRule}, function(){
						console.log("Test! Id is: " + id + " and displaying a reminder")
						facebook_parser.sendFacebookMessage(id,"Hoping you had a lovely day! Even if you didn’t (and not all days are!), think back to everything you did today. What’s something you’re grateful for?")
						facebook_parser.sendFacebookMessage(id,"Enter in as many things as you'd like. I'll save them all!")
				})

				var userMessageSend = schedule.scheduleJob({end: new Date(Date.now() + 86400000), rule: userRandomMessageRule}, function(){
						// Extract and send a random past message
						var userMessagePromise = db_utils.getRandomEntry(id)
						userMessagePromise.then(function(message){
							console.log("Sending a message from the past at a random time!!")
							facebook_parser.sendFacebookMessage(id,"Hey there, hope you’re having a lovely day.")
							var send_message = "I wanted to remind you of something you were grateful for on "+message.createdAt.toDateString()+". You wrote the following: "
							facebook_parser.sendFacebookMessage(id, send_message)
							facebook_parser.sendFacebookMessage(id, message)
						}, function(err){
							console.log(err)
						})
				})
			}
		}, function(err){
			console.log(err);
		})

	})

}

module.exports = {
	recurTask:recurTask
};