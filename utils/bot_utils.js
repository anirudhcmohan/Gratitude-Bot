'use strict'

const express = require('express')
const request = require('request')
const db_utils = require('./db_utils.js');

const PAGE_TOKEN = "EAAZAyQZB2isvkBAKyiiwBj2H0iMxMKMENpGHdFtLnG9cOaZB7MtCBsUcX9VEOvH3HmOljVBRQmpUIyavm2JDLtBZASgOLg4f9glvqy8ZBIsZCD8LjDXKCtZCz2XVv3HPkHYfXinhBwfp3Q9afDEwznNuZAZCDzecdEFtMZAqWwSwxCYQZDZD";

const WEBHOOK_TOKEN = "a_test_token";

const HELP_MESSAGE = "-get entries: See all your past entries\n-get time: See your daily reminder is (8:00PM by default)\n-set time: Set a new reminder time\n\nType in anything else, and I'll automatically add it as something you're grateful for for the day\n\nP.S. type in 'help' at any time to bring this up again"

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
	if (received_message === "hi" ) {
		send_message = "Hi back " + name + ". Echo: " + received_message
		console.log("About to send this message " + send_message)
		sendFacebookMessage(user_id, send_message)
	}
	else if (received_message.split(" ").slice(0,2).join(" ")==="set time")
	{
		var hour = received_message.split(" ")[2].split(":")[0]
		var minute = received_message.split(" ")[2].split(":")[1]
		db_utils.setRecTime(user_id, hour, minute)
		send_message = "Awesome! Your new receive time is " + hour + ":" + minute
		console.log("About to send this message " + send_message)
		sendFacebookMessage(user_id, send_message)
	}
	else if (received_message === "get time")
	{
		var rec_timePromise = db_utils.getRecTime(user_id)
		rec_timePromise.then(function(rec_time){
			send_message = "The current receive time is " + rec_time['hour'] + ":" + rec_time['minute']
			console.log("About to send this message " + send_message)
			sendFacebookMessage(user_id, send_message)
		}, function (err){
			console.log("A big error!!!");
		})
	}
	else if (received_message === "get entries"){
		var entriesPromise = db_utils.getEntries(user_id,10)
		entriesPromise.then(function(entries){
			send_message = "All previous entries are:\n\n" + entries.join("\n")
			console.log("All previous entries are: " + entries.join("\n"))
			sendFacebookMessage(user_id, send_message)
		})
	}
	else if (received_message === "delete all my entries"){
		db_utils.deleteEntries(user_id);
		console.log("Deleted all user entries");
		send_message = "Deleted all the user entries";
		sendFacebookMessage(user_id, send_message)
	}
	else if (received_message == "USER_DEFINED_PAYLOAD"){
		send_message = "Welcome " + name + "! \n\nThis is a bot to help you practice a bit more gratitude in your life. Here's what you can type in:"
		sendFacebookMessage(user_id, send_message)
		sendFacebookMessage(user_id, HELP_MESSAGE+"\n\n Enjoy being grateful!")	
	}
	else if (received_message === "help"){
		console.log("Showing help");
		send_message = HELP_MESSAGE;
		sendFacebookMessage(user_id, send_message)
	}
	else {
		send_message = "Just gonna echo: " + received_message
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