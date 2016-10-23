'use strict'

const express = require('express')
const request = require('request')
// const db_utils = require('./db_utils.js');

const PAGE_TOKEN = "EAAZAyQZB2isvkBAKyiiwBj2H0iMxMKMENpGHdFtLnG9cOaZB7MtCBsUcX9VEOvH3HmOljVBRQmpUIyavm2JDLtBZASgOLg4f9glvqy8ZBIsZCD8LjDXKCtZCz2XVv3HPkHYfXinhBwfp3Q9afDEwznNuZAZCDzecdEFtMZAqWwSwxCYQZDZD";

const WEBHOOK_TOKEN = "a_test_token";

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
		let messageText = "Echo: " + messagingItem.message.text.substring(0, 200)		
		parseIncomingMSGSession(user_id, messageText)
	}
	res.sendStatus(200);
}

// Parses incoming messages

function parseIncomingMSGSession (user_id, messageText){
	sendFacebookMessage(user_id, messageText)
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
	sendFacebookMessage:sendFacebookMessage,
	facebookVerification:facebookVerification,
	facebookWebhookListener:facebookWebhookListener
};