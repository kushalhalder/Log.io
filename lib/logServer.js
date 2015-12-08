var net = require('net');
var events = require('events');
var util = require('util');
var winston = require('winston');

var LogNode = require('./logNode');

var __slice = [].slice;

__bind = function(fn, me) {
    return function() {
        return fn.apply(me, arguments);
    };
};

function LogServer(config) {
    var _ref, _ref1;

    if (config === null) {
        config = {};
    }

    this._flush = __bind(this._flush, this);

    this._receive = __bind(this._receive, this);

    this.host = config.host;
    this.port = config.port;
    this._log = (_ref = config.logging) !== null ? _ref : winston;
    this._delimiter = (_ref1 = config.delimiter) !== null ? _ref1 : '\r\n';
    this.logNodes = {};
    this.logStreams = {};
}

util.inherits(LogServer, events.EventEmitter);

LogServer.prototype.run = function() {
    var _this = this;

    this.listener = net.createServer(function(socket) {
        socket._buffer = '';
        socket.on('data', function(data) {
            return _this._receive(data, socket);
        });
        socket.on('error', function() {
            return _this._tearDown(socket);
        });
        return socket.on('close', function() {
            return _this._tearDown(socket);
        });
    });
    return this.listener.listen(this.port, this.host);
};

LogServer.prototype._tearDown = function(socket) {
    this._log.error('Lost TCP connection...');
    if (socket.node) {
        this._removeNode(socket.node.name);
        return delete socket.node;
    }
};

LogServer.prototype._receive = function(data, socket) {
    var part;
    part = data.toString();
    socket._buffer += part;
    this._log.debug("Received TCP message: " + part);
    if (socket._buffer.indexOf(this._delimiter >= 0)) {
        return this._flush(socket);
    }
};

LogServer.prototype._flush = function(socket) {
    var msg, _i, _j, _len;
    socket.pause();
    var _ref = socket._buffer.split(this._delimiter);
    var msgs = 2 <= _ref.length ? __slice.call(_ref, 0, _i = _ref.length - 1) : (_i = 0, []);
    socket._buffer = _ref[_i++];

    socket.resume();
    var _results = [];
    for (_j = 0, _len = msgs.length; _j < _len; _j++) {
        msg = msgs[_j];
        _results.push(this._handle(socket, msg));
    }
    return _results;
};

LogServer.prototype._handle = function(socket, msg) {
    this._log.debug("Handling message: " + msg);
    var _ref = msg.split('|');
    var mtype = _ref[0];
    var args = 2 <= _ref.length ? __slice.call(_ref, 1) : [];

    switch (mtype) {
        case '+log':
            return this._newLog.apply(this, args);
        case '+node':
            return this._addNode.apply(this, args);
        case '+stream':
            return this._addStream.apply(this, args);
        case '-node':
            return this._removeNode.apply(this, args);
        case '-stream':
            return this._removeStream.apply(this, args);
        case '+bind':
            return this._bindNode.apply(this, [socket].concat(__slice.call(args)));
        default:
            return this._log.error("Invalid TCP message: " + msg);
    }
};

LogServer.prototype._addNode = function(nname, snames) {
    if (snames === null) {
        snames = '';
    }
    return this.__add(nname, snames, this.logNodes, LogNode, 'node');
};

LogServer.prototype._addStream = function(sname, nnames) {
    if (nnames == null) {
        nnames = '';
    }
    return this.__add(sname, nnames, this.logStreams, LogStream, 'stream');
};

LogServer.prototype._removeNode = function(nname) {
    return this.__remove(nname, this.logNodes, 'node');
};

LogServer.prototype._removeStream = function(sname) {
    return this.__remove(sname, this.logStreams, 'stream');
};

LogServer.prototype._newLog = function() {
    var sname = arguments[0];
    var nname = arguments[1];
    var logLevel = arguments[2];
    var message = 4 <= arguments.length ? __slice.call(arguments, 3) : [];

    message = message.join('|');
    this._log.debug("Log message: (" + sname + ", " + nname + ", " + logLevel + ") " + message);

    var node = this.logNodes[nname] || this._addNode(nname, sname);
    var stream = this.logStreams[sname] || this._addStream(sname, nname);
    
    return this.emit('new_log', stream, node, logLevel, message);
};

LogServer.prototype.__add = function(name, pnames, _collection, _objClass, objName) {
    var p, _i, _len;
    this._log.info("Adding " + objName + ": " + name + " (" + pnames + ")");
    pnames = pnames.split(',');
    var obj = _collection[name] = _collection[name] || new _objClass(this, name, pnames);
    var _results = [];
    for (_i = 0, _len = pnames.length; _i < _len; _i++) {
        p = pnames[_i];
        if (!obj.pairs[p]) {
            _results.push(obj.addPair(p));
        }
    }
    return _results;
};

LogServer.prototype.__remove = function(name, _collection, objType) {
    var obj;
    if (obj = _collection[name]) {
        this._log.info("Removing " + objType + ": " + name);
        obj.remove();
        return delete _collection[name];
    }
};

LogServer.prototype._bindNode = function(socket, obj, nname) {
    var node;
    if (node = this.logNodes[nname]) {
        this._log.info("Binding node '" + nname + "' to TCP socket");
        socket.node = node;
        return this._ping(socket);
    }
};

LogServer.prototype._ping = function(socket) {
    var _this = this;
    if (socket.node) {
        socket.write('ping');
        return setTimeout((function() {
            return _this._ping(socket);
        }), 2000);
    }
};

module.exports = LogServer;