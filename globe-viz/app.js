var express = require('express'),
    app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'kinevotedb.cjvcoatcfeke.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'kinevote2016',
    database: 'KineVote'
});

connection.connect();

app.use(express.static('.'))

io.on('connection', function(socket) {
    socket.on('getLocations', function(date) {
        //connection.query('SELECT * from locationList_valid LIMIT 3000', function(err, rows, fields) {
        connection.query('SELECT * from tweet_with_lon_lat LIMIT 10000', function(err, rows, fields) {
            // var json = rows.reduce(function(array, element) {
            //     return array.concat([element.latitude,element.longitude, 1]);
            // }, []);
            io.emit('sendLocations', err ? err: rows);
        });
    });
});

http.listen(8080, function() {
    console.log('listening on *:8080');
});