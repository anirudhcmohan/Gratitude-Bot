'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const mongoose = require('mongoose');
const User = mongoose.model('User', {_id: String, name: String, profile_image_url: String, phone_number: String, current_state: String, startTime:Date});


const app = express()

const my_token = '&sXd7qzy4P>wpK'

app.set('port', (process.env.PORT || 8000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === my_token) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            console.log('successfully echoed!');
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        }
    }
    res.sendStatus(200)
})

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

const token = "EAAZAyQZB2isvkBALhezeOgxphjLutdqNVyfhivsmMxQ8PslbLM5KsxAMWtP8jKbbEhxOZAE10aZBpruSAZApPd0RgLRdwHZBKo5SKenS0jjCUoStYqHJWOPWrWsZBeKRjZC7aDnGTx0RHnUYwzHUPGlZBLZBVjST4miBOLTBjz8rmd3gZDZD"
