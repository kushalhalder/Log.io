var util = require('util');
var _LogObject = require('./logObject');

function LogNode() {
	return LogNode.parent.prototype.constructor.apply(this, arguments);
}

util.inherits(LogNode, _LogObject);

LogNode.prototype._type = 'node';

LogNode.prototype._pclass = function() {
	return LogStream;
};

LogNode.prototype._pcollection = function() {
	return this.logServer.logStreams;
};

module.exports = LogNode;