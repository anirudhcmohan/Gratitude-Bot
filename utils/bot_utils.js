'use strict'

const express = require('express')
const request = require('request')
// const db_utils = require('./db_utils.js');

const PAGE_TOKEN = "EAAZAyQZB2isvkBALhezeOgxphjLutdqNVyfhivsmMxQ8PslbLM5KsxAMWtP8jKbbEhxOZAE10aZBpruSAZApPd0RgLRdwHZBKo5SKenS0jjCUoStYqHJWOPWrWsZBeKRjZC7aDnGTx0RHnUYwzHUPGlZBLZBVjST4miBOLTBjz8rmd3gZDZD"

const WEBHOOK_TOKEN = '&sXd7qzy4P>wpK'

function facebookVerification(req, res){
	if (req.query['hub.verify_token'] === WEBHOOK_TOKEN) {
	 	res.send(req.query['hub.challenge'])
	 	console.log('Verified!')
	}
	else {
		res.send('Error, wrong token')	
	}
}

function facebookWebhookListener(req, res){
	console.log('Received message!')
	if (!req.body || !req.body.entry[0] || !req.body.entry[0].messaging) {
			return console.error("no entries on received body");
	}
	let messaging_events = req.body.entry[0].messaging
	for (let messagingItem of messaging_events){
		let user_id = messagingItem.sender.id
		let messageText = "Echo: " + messagingItem.message.text.substring(0, 200)
		parseIncomingMSGSession(user_id, messageText)
	}
	res.sendStatus(200)
}

function parseIncomingMSGSession (user_id, messageText){
	sendFacebookMessage(user_id, messageText)
}

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