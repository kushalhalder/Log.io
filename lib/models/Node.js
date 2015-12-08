var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var nodeSchema = new Schema({
    name: {
    	type: String, 
    	index: true
    },
    streams: [],
    created_at: Date,
    updated_at: Date
});

nodeSchema.pre('save', function(next) {
    now = new Date();
    this.updated_at = now;
    if(!this.created_at) {
        this.created_at = now;
    }
    next();
});

nodeSchema.methods.saveNew = function(name, snames, callback) {
	var streams = snames.split(',');
	this.model('Node').findOneAndUpdate(
		{name: name},
		{name: name, streams: streams},
		{upsert: true},
		function(err, doc) {
			console.log(doc);
			if(callback)
				callback(err, doc);
		}
	);
};

module.exports = mongoose.model('Node', nodeSchema);