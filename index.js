var express = require('express'),
	app = express(),
	mysql = require('mysql');

var connection = mysql.createConnection({
	host: '',
	user: '',
	password: '',
	database: ''
});

connection.connect();

connection.query('SELECT * from hashtagsLog LIMIT 500', function (err, rows, fields) {
	if (err) {
		console.log('Error while querying.');
	} else {
		console.log("Result: \n", rows);
	}
})