'use strict'

const express = require('express')
const request = require('request')
const db_utils = require('./db_utils.js');

const PAGE_TOKEN = "EAAZAyQZB2isvkBAKyiiwBj2H0iMxMKMENpGHdFtLnG9cOaZB7MtCBsUcX9VEOvH3HmOljVBRQmpUIyavm2JDLtBZASgOLg4f9glvqy8ZBIsZCD8LjDXKCtZCz2XVv3HPkHYfXinhBwfp3Q9afDEwznNuZAZCDzecdEFtMZAqWwSwxCYQZDZD";

const WEBHOOK_TOKEN = "a_test_token";

const HELP_MESSAGE = "-get entries: See all your past entries\n-get time: See your daily reminder time\n-set time HH:MM: Set a new reminder time in military time (it's 20:00 by default)\n\nType in anything else, and I'll automatically add it as something you're grateful for for the day\n\nP.S. type in 'help' at any time to bring this up again"

// Verifies this is the appropriate server to talk to bot

function facebookVerification(req, res){
	if (req.query['hub.verify_token'] === WEBHOOK_TOKEN) {
	 	res.send(req.query['hub.challenge'])
	 	console.log('Verified!')
	}
	else {
		res.send('Error, wrong token')	
	}
}

// Listener for incoming messages. Parses queue of messages.

function facebookWebhookListener(req, res){
	console.log('Received message!')
	if (!req.body || !req.body.entry[0] || !req.body.entry[0].messaging) {
			return console.error("no entries on received body");
	}
	console.log(req.body)
	let messaging_events = req.body.entry[0].messaging
	for (let messagingItem of messaging_events){
		let user_id = messagingItem.sender.id		
		console.log(messagingItem)
		getUserProfile(user_id, messagingItem);
	}
	res.sendStatus(200);
}

// Get user specific information

function getUserProfile(user_id, messagingItem){
	request({
		url: "https://graph.facebook.com/v2.6/"+user_id,
		qs: {access_token: PAGE_TOKEN},
		method: 'GET'

	}, function(error, response, body){
		if(error){
			console.log(error);
		} else {
			db_utils.doesUserExist(user_id);
			parseIncomingMSGSession(user_id, messagingItem, JSON.parse(body).first_name);
		}
	});
}

// Parses incoming messages

function parseIncomingMSGSession (user_id, messagingItem, name){
	let send_message = ""
	let received_message = ""
	if (messagingItem.postback){
		received_message = messagingItem.postback.payload
	}
	else {
		received_message = messagingItem.message.text	
	}
	if (received_message.toLowerCase() === "hi" ) {
		send_message = "Hi there, " + name + "!"
		console.log("About to send this message " + send_message)
		sendFacebookMessage(user_id, send_message)
	}
	else if (received_message.toLowerCase().split(" ").slice(0,2).join(" ")==="set time")
	{
		try {
			var hour = parseInt(received_message.split(" ")[2].split(":")[0],10)
			var minute = parseInt(received_message.split(" ")[2].split(":")[1],10)
			if (isNaN(hour) || isNaN(minute)){
				console.log(typeof hour)
				console.log(typeof minute)
				throw "1: Time format exception"
			}
			if ((hour < 0)||(hour > 23)){
				throw "3: Time format exception"
			}
			if ((minute < 0)||(minute > 59)){
				throw "4: Time format exception"
			}
			db_utils.setRecTime(user_id, hour, minute)
			send_message = "Great. You'll receive a daily reminder at " + hour + ":" + minute
			console.log("About to send this message " + send_message)
			sendFacebookMessage(user_id, send_message)	
		}
		catch (e) {
			console.log("Error in how user tried to set time! " + e)
			sendFacebookMessage(user_id, "Be sure to use the following format: 'set time HH:MM', where HH:MM is the military time of your desired reminder time.")
		}
		
	}
	else if (received_message.toLowerCase() === "get time")
	{
		var rec_timePromise = db_utils.getRecTime(user_id)
		rec_timePromise.then(function(rec_time){
			send_message = "You're currently receiving reminders at " + rec_time['hour'] + ":" + rec_time['minute']
			console.log("About to send this message " + send_message)
			sendFacebookMessage(user_id, send_message)
		}, function (err){
			console.log("A big error!!!");
		})
	}
	else if (received_message.toLowerCase() === "get entries"){
		var entriesPromise = db_utils.getEntries(user_id)
		entriesPromise.then(function(entries){
			send_message = "Here are a few of your past entries:\n\n-" + entries.join("\n-")
			console.log("All previous entries are: " + entries.join("\n"))
			sendFacebookMessage(user_id, send_message)
		})
	}
	else if (received_message.toLowerCase() === "delete all my entries"){
		db_utils.deleteEntries(user_id);
		console.log("Deleted all user entries");
		send_message = "This is a hidden feature! You've stumbled on it and have now deleted all of your old entries.";
		sendFacebookMessage(user_id, send_message)
	}
	else if (received_message == "USER_DEFINED_PAYLOAD"){
		send_message = "Hi there, " + name + "! \n\nThanks for showing interest in practicing more gratitude in your life. Here's a bit about what you can use this bot for:"
		sendFacebookMessage(user_id, send_message)
		sendFacebookMessage(user_id, HELP_MESSAGE+"\n\n")
		// sendFacebookMessage(user_id,"If you'd like to change your daily reminder time, feel free to do it at any time.")	
	}
	else if (received_message.toLowerCase() === "help"){
		console.log("Showing help");
		send_message = HELP_MESSAGE;
		sendFacebookMessage(user_id, send_message)
	}
	// For debugging only -- pull random entry
	else if (received_message.toLowerCase() === "ENTRYRANDOM123"){
		var randomEntryPromise = db_utils.getRandomEntry(user_id)
		randomEntryPromise.then(function(randomEntry){
			sendFacebookMessage(user_id, "A randoom past entry: " + randomEntry)
		}, function(err){
			console.log(err)
		})
	}
	// TODO: Add more (hardcoded) strings in response to things people ahve entered in
	else {
		send_message = "Great! I've saved that as something you're grateful for."
		db_utils.createEntry(user_id, received_message)
		console.log("About to send this message " + send_message)
		sendFacebookMessage(user_id, send_message)
	}
	
	
}

// Sends a text-based message back to the user

function sendFacebookMessage(user_id, messageText){
	let messageData = { text:messageText };

	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token: PAGE_TOKEN},
		method: 'POST',
		json: {
			recipient: {id:user_id},
			message: messageData
		}
	}, facebookCallbackResponse)
}

function facebookCallbackResponse(error, response, body){
	if (error){
		console.log('Error sending messages: ', error)
	} else if (response.body.error) {
		console.log('Error here: ', response.body.error)
	}
}

module.exports = {
	facebookVerification:facebookVerification,
	facebookWebhookListener:facebookWebhookListener,
	sendFacebookMessage:sendFacebookMessage
};