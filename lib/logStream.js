var util = require('util');
var _LogObject = require('./logObject');

function LogStream() {
    return LogStream.parent.prototype.constructor.apply(this, arguments);
}

util.inherits(LogStream, _LogObject);

LogStream.prototype._type = 'stream';

LogStream.prototype._pclass = function() {
    return LogNode;
};

LogStream.prototype._pcollection = function() {
    return this.logServer.logNodes;
};

module.exports = LogStream;