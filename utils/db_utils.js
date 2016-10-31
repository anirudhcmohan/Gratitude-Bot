'use strict'

const mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Schemas and Models

var userSchema = new Schema({
	_id : String,
	name: String,
	rec_time: {hour: Number, minute: Number},
	entries: [Schema.Types.ObjectId]
},
{
	timestamps: true
});

var entrySchema = new Schema({
	text: String,
	user_id: String
},
{
	timestamps: true
})

const User = mongoose.model('User', userSchema);
const Entry = mongoose.model('Entry', entrySchema)

// Check if user exists

function doesUserExist(user_id){
	User.findById(user_id, function(err, userObj){
		if (err){
			console.log(err);
		}
		else if (userObj){
			// add code
			console.log("This user exists! Id is " + userObj._id);
		}

		// Save a new user record

		else {
			getAndSetNewUser(user_id);
		}
	})
}

// Create a new journal entry

function createEntry(user_id, entryText){
	var entry = new Entry({
		"text": entryText,
		"user_id": user_id
	})

	var entryID = entry._id

	entry.save(function (err, entryObj){
		if (err){
			console.log(err);
		}
		else {
			console.log("New entry "+entry._id +" saved with text: "+ entryText)
		}
	})

	User.findById(user_id, function(err, userObj){
		if(err){
			console.log(err);
		}
		else if (userObj){
			userObj.entries.push(entryID);
		}
		else{
			getAndSetNewUser(user_id, {},"",entryID)
		}
	})
}


// Create a new user record

function getAndSetNewUser(user_id, rec_time_entry, name_entry, entryID_entry){
	var name_entry = (typeof name_entry !== 'undefined') ?  name_entry : "";

	var rec_time_entry = (typeof rec_time_entry !== 'undefined') ?  rec_time_entry : {};

	var entryID_entry = (typeof entryID_entry !== 'undefined') ?  entryID_entry : null;


	var user = new User({
		"_id": user_id,
		"name": name_entry,
		"rec_time": rec_time_entry,
		"entries":[entryID_entry]
	});

	user.save(function (err, userObj) {
		if (err){
			console.log(err);
		}
		else {
			console.log("New User "+user_id + ". saved new user: " + userObj);
		}
	});
}

// Update the rec_time

function setRecTime(user_id, hour, minute){
	var rec_time_to_set = {}
	rec_time_to_set['hour'] = hour
	rec_time_to_set['minute'] = minute
	User.findById(user_id, function(err, userObj){
		if (err){
			console.log(err);
		}
		else if (userObj){
			userObj.rec_time = rec_time_to_set
			userObj.save(function(err, userObj){
				if(err){
					console.log(err);
				}
				else {
					console.log("Updated the rec time for user with " + rec_time_to_set['hour'] + " " + rec_time_to_set['minute'])
				}
			})
		}
		else {
			getAndSetNewUser(user_id, rec_time_to_set);
		}
	})
}

// Get the rec_time

function getRecTime(user_id){
	return new Promise(function(resolve, reject){
		User.findById(user_id, function(err, userObj){
			if (err){
				reject(err);
			}
			else if (userObj){
				console.log("retrieved "+ userObj.rec_time);
				resolve(userObj.rec_time);
			}
			else {
				resolve(null);
			}
		})		
	});
}

// Get journal entries

function getEntries(user_id, limitNum){

	var limitNum = (typeof limitNum !== 'undefined') ?  limitNum : 10;

	return new Promise(function(resolve, reject){
		Entry.find({"user_id": user_id}).sort('-createdAt').limit(limitNum).exec(function(err, entries){
			if (err){
				reject(err);
			}
			else if (entries){
				console.log("retrieved entries "+ entries);
				var entryTexts = entries.map(function(entry){
					return entry.text
				});	
				resolve(entryTexts);
			}
			else {
				resolve(null);
			}
		})		
	});
}

// Notes from Yang
// Promise.race() -- pass 2 promise objects and returns one that wins race
// Promise.all() -- runs promises in parallel and resolves only if all promises resolve
// Look into Mongoose promise library

module.exports = {
    doesUserExist:doesUserExist,
    setRecTime:setRecTime,
    getRecTime:getRecTime,
    createEntry:createEntry,
    getEntries:getEntries
};