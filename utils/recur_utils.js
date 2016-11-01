const facebook_parser = require('./bot_utils.js')
const db_utils = require('./db_utils.js');
const schedule = require('node-schedule')

var rule = new schedule.RecurrenceRule();
rule.hour = 16;
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

				// userRandomMessageRule.hour = Math.floor(Math.random()*23)

				userRandomMessageRule.hour = 16;
				userRandomMessageRule.minute = 3;

				// userReminderRule.second = [0,10,20,30,40,50]
				// Adding 1 day in MS


				var userReminderSend = schedule.scheduleJob({end: new Date(Date.now() + 86400000), rule: userReminderRule}, function(){
						console.log("Test! Id is: " + id + " and displaying a reminder")
						facebook_parser.sendFacebookMessage(id,"Reminder to type in what you're grateful for!")
				})

				var userMessageSend = schedule.scheduleJob({end: new Date(Date.now() + 86400000), rule: userRandomMessageRule}, function(){
						// Extract and send a random past message
						var userMessagePromise = db_utils.getRandomEntry()
						userMessagePromise.then(function(message){
							console.log("Sending a message from the past at a random time!!")
							facebook_parser.sendFacebookMessage(id,"Here's something from the past you were grateful for: "+message)
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