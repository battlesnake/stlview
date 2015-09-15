'use strict';

var STL = require('../node_modules/stl.js');
var fs = require('fs');
var path = require('path');

if (process.argv.length !== 3) {
	console.log('Syntax: node b2a.js binary-in.stl ascii-out.stl');
}

var bin = process.argv[1];
var asc = process.argv[2];

fs.createReadStream(bin)
	.pipe(new STL.ParseStream())
	.construct()
	.pipe(new STL.AsciiWriter())
	.pipe(fs.createWriteStream(asc));
