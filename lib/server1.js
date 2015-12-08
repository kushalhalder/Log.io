var fs = require('fs');
var net = require('net');
var http = require('http');
var https = require('https');
var io = require('socket.io');
var events = require('events');
var winston = require('winston');
var express = require('express');

var __slice = [].slice;

function __bind(fn, me) {
	return function() {
		return fn.apply(me, arguments);
	};
}