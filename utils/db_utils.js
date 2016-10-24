'use strict'

const mongoose = require('mongoose');

// Schemas and Models

var userSchema = mongoose.Schema({
	_id : String,
	name: String,
	rec_time: Date
})

const user = mongoose.Model('User', userSchema);
