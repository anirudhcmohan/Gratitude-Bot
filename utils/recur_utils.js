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

				var userRule = new schedule.RecurrenceRule();
				userRule.hour = hour
				userRule.minute = minute

				// userRule.second = [0,10,20,30,40,50]
				// Adding 1 day in MS

				var user_send = schedule.scheduleJob({end: new Date(Date.now() + 86400000), rule: userRule}, function(){
					console.log("Test! Id is: " + id + " and displaying a reminder")
					facebook_parser.sendFacebookMessage(id,"Reminder to type in your entries!")
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