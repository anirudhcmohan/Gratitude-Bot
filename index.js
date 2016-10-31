'use strict'

const express = require('express')
const bodyParser = require('body-parser')
var mongoose = require('mongoose');
const app = express()
var facebook_parser = require('./utils/bot_utils.js')
var recurring_tasks = require('./utils/recur_utils.js')


app.set('port', (process.env.PORT || 3000))

const MONGO_HOST = (process.env.MONGO_HOST || 'localhost');

app.set('mongo_url', (process.env.MONGOLAB_URI || 'mongodb://'+MONGO_HOST+'/local'));

console.log(app.get('mongo_url'))

// Configure the Mongo app

mongoose.connect(app.get('mongo_url'),function(err){
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log("Connected to " + app.get('mongo_url'));
});


// Process application/json
app.use(bodyParser.json())

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Index route via HTTP
app.get('/', function (req, res) {
    res.send('<h1>Hello world, I am a chat bot</h1>')
})

// Facebook verification
app.get('/webhook/', facebook_parser.facebookVerification)

// Post data from Facebook Messenger -- i.e. messages to bot from a user
app.post('/webhook/', facebook_parser.facebookWebhookListener)


recurring_tasks.recurTask()

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('Facebook Messenger Bot server started on port', app.get('port'))
})

