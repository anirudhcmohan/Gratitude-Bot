'use strict'

const express = require('express')
const bodyParser = require('body-parser')
// var mongoose = require('mongoose');
const app = express()
var facebook_parser = require('./utils/bot_utils.js')

app.set('port', (process.env.PORT || 3000))
// const MONGO_HOST = (process.env.MONGO_HOST || 'localhost');
// app.set('mongo_url', (process.env.MONGODB_URL || 'mongodb://'+MONGO_HOST+'/local'));

// mongoose.connect(app.get('mongo_url'),function(err){
// 	if (err) {
// 		console.error(err);
// 		process.exit(1);
// 	}
// 	console.log("Connected to " + app.get('mongo_url'));
// });

// Process application/json
app.use(bodyParser.json())

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Index route via HTTP
app.get('/', function (req, res) {
    res.send('<h1>Hello world, I am a chat bot</h1>')
})

// Facebook verification
app.get('/webhook', facebook_parser.facebookVerification)


// Post data from Facebook Messenger -- i.e. messages to bot from a user
app.post('/webhook/', facebook_parser.facebookWebhookListener);


// app.post('/webhook/', function (req, res) {
//     let messaging_events = req.body.entry[0].messaging
//     for (let i = 0; i < messaging_events.length; i++) {
//         let event = req.body.entry[0].messaging[i]
//         let sender = event.sender.id
//         if (event.message && event.message.text) {
//             let text = event.message.text
//             console.log('successfully echoed!');
//             sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
//         }
//     }
//     res.sendStatus(200)
// })

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('Facebook Messenger Bot server started on port', app.get('port'))
})

