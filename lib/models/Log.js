var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var logSchema = new Schema({
	message: String,
	nodeName: Schema.Types.ObjectId,
	streamName: String,
	created_at: Date,
    updated_at: Date
});