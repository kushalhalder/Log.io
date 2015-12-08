_LogObject = function(logServer, name, _pairs) {
    var pname, _i, _len;
    this.logServer = logServer;
    this.name = name;
    if (_pairs === null) {
        _pairs = [];
    }
    this.logServer.emit("add_" + this._type, this);
    this.pairs = {};
    this.pclass = this._pclass();
    this.pcollection = this._pcollection();
    for (_i = 0, _len = _pairs.length; _i < _len; _i++) {
        pname = _pairs[_i];
        this.addPair(pname);
    }
};

_LogObject.prototype._type = 'object';

_LogObject.prototype._pclass = function() {};

_LogObject.prototype._pcollection = function() {};

_LogObject.prototype.addPair = function(pname) {
    var pair;
    if (!(pair = this.pairs[pname])) {
        if (!(pair = this.pcollection[pname])) {
            pair = this.pcollection[pname] = new this.pclass(this.logServer, pname);
        }
        pair.pairs[this.name] = this;
        this.pairs[pname] = pair;
        return this.logServer.emit("add_" + this._type + "_pair", this, pname);
    }
};

_LogObject.prototype.remove = function() {
    var name, p, _ref, _results;
    this.logServer.emit("remove_" + this._type, this);
    _ref = this.pairs;
    _results = [];
    for (name in _ref) {
        p = _ref[name];
        _results.push(delete p.pairs[this.name]);
    }
    return _results;
};

_LogObject.prototype.toDict = function() {
    var name, obj;
    return {
        name: this.name,
        pairs: (function() {
            var _ref, _results;
            _ref = this.pairs;
            _results = [];
            for (name in _ref) {
                obj = _ref[name];
                _results.push(name);
            }
            return _results;
        }).call(this)
    };
};

module.exports = _LogObject;