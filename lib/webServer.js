var fs = require('fs');
var net = require('net');
var http = require('http');
var https = require('https');
var io = require('socket.io');
var events = require('events');
var winston = require('winston');
var express = require('express');

var __slice = [].slice;

function WebServer(logServer, config) {
    var _ref1, _ref2;
    this.logServer = logServer;
    this.host = config.host;
    this.port = config.port;
    this.auth = config.auth;
    var _ref = this.logServer;
    this.logNodes = _ref.logNodes;
    this.logStreams = _ref.logStreams;
    this.restrictSocket = (_ref1 = config.restrictSocket) != null ? _ref1 : '*:*';
    this._log = (_ref2 = config.logging) != null ? _ref2 : winston;
    var app = this._buildServer(config);
    this.http = this._createServer(config, app);
}

WebServer.prototype._buildServer = function(config) {
    var ips, _ref,
        _this = this;
    var app = express();
    if (this.auth != null) {
        app.use(express.basicAuth(this.auth.user, this.auth.pass));
    }
    if (config.restrictHTTP) {
        ips = new RegExp(config.restrictHTTP.join('|'));
        app.all('/', function(req, res, next) {
            if (!req.ip.match(ips)) {
                return res.send(403, "Your IP (" + req.ip + ") is not allowed.");
            }
            return next();
        });
    }
    var staticPath = (_ref = config.staticPath) != null ? _ref : __dirname + '/../';
    return app.use(express["static"](staticPath));
};

WebServer.prototype._createServer = function(config, app) {
    if (config.ssl) {
        return https.createServer({
            key: fs.readFileSync(config.ssl.key),
            cert: fs.readFileSync(config.ssl.cert)
        }, app);
    } else {
        return http.createServer(app);
    }
};

WebServer.prototype.run = function() {
    var _emit, _on,
        _this = this;
    this._log.info('Starting Log.io Web Server...');
    this.logServer.run();
    io = io.listen(this.http.listen(this.port, this.host));
    io.set('log level', 1);
    io.set('origins', this.restrictSocket);
    this.listener = io.sockets;
    _on = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = _this.logServer).on.apply(_ref, args);
    };
    _emit = function(_event, msg) {
        _this._log.debug("Relaying: " + _event);
        return _this.listener.emit(_event, msg);
    };
    _on('add_node', function(node) {
        return _emit('add_node', node.toDict());
    });
    _on('add_stream', function(stream) {
        return _emit('add_stream', stream.toDict());
    });
    _on('add_stream_pair', function(stream, nname) {
        return _emit('add_pair', {
            stream: stream.name,
            node: nname
        });
    });
    _on('add_node_pair', function(node, sname) {
        return _emit('add_pair', {
            stream: sname,
            node: node.name
        });
    });
    _on('remove_node', function(node) {
        return _emit('remove_node', node.toDict());
    });
    _on('remove_stream', function(stream) {
        return _emit('remove_stream', stream.toDict());
    });
    _on('new_log', function(stream, node, level, message) {
        _emit('ping', {
            stream: stream.name,
            node: node.name
        });
        return _this.listener["in"]("" + stream.name + ":" + node.name).emit('new_log', {
            stream: stream.name,
            node: node.name,
            level: level,
            message: message
        });
    });
    this.listener.on('connection', function(wclient) {
        var n, node, s, stream, _ref, _ref1, _ref2, _ref3;
        _ref = _this.logNodes;
        for (n in _ref) {
            node = _ref[n];
            wclient.emit('add_node', node.toDict());
        }
        _ref1 = _this.logStreams;
        for (s in _ref1) {
            stream = _ref1[s];
            wclient.emit('add_stream', stream.toDict());
        }
        _ref2 = _this.logNodes;
        for (n in _ref2) {
            node = _ref2[n];
            _ref3 = node.pairs;
            for (s in _ref3) {
                stream = _ref3[s];
                wclient.emit('add_pair', {
                    stream: s,
                    node: n
                });
            }
        }
        wclient.emit('initialized');
        wclient.on('watch', function(pid) {
            return wclient.join(pid);
        });
        return wclient.on('unwatch', function(pid) {
            return wclient.leave(pid);
        });
    });
    return this._log.info('Server started, listening...');
};

module.exports = WebServer;