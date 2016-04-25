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

var dateStart = new Date(2016, 1, 19).toISOString();
var dateFinish = new Date().toISOString();

var dateIncrement = new Date(2016, 1, 19);
var exploding = false;

connection.connect();

app.use(express.static('.'))

io.on('connection', function(socket) {
    socket.on('getLocations', function(date) {
        var query = 'SELECT * from tweet_with_lon_lat LIMIT 10000';
        console.log(query); 
        connection.query(query, function(err, rows, fields) {
            console.log(rows.length);
            io.emit('sendLocations', err ? err: rows);
        });
    });
    socket.on('changeDate', function(dates) {
        console.log('dates: ', dates);
        dateStart = dates['newStart'];
        dateFinish = dates['newFinish'];
        var args = {dateStart: dateStart, dateFinish: dateFinish}
        io.emit('refilterByDates', args);
    });
    socket.on('magicDateExplosion', function() {
        var end = new Date();
        if (!exploding) {
            exploding = true;  
            dateExplosion();
        }
        function dateExplosion() {
            if (dateIncrement > end) {
                exploding = false;
                dateIncrement = new Date(2016, 1, 19);
                return;
            }
            var query = "SELECT * from tweet_with_lon_lat WHERE date_simple='" + formatDate(dateIncrement) + "'";
            connection.query(query, function(err, rows, fields) {
                console.log(dateIncrement + ": " + rows.length);
                dateIncrement.setDate(dateIncrement.getDate() + 1);
                io.emit('sendLocations', err ? err: rows);
            });
            setTimeout(dateExplosion, 2000);
        }
    })


});

function formatDate(date) {
    var result = "";
    result = date.getFullYear() + "-";
    result += (+date.getMonth() < 10 ? "0" : "") + (+date.getMonth()+1) + "-";
    result += (+date.getDate() < 10 ? "0" : "") + date.getDate();
    return result;
}


http.listen(8080, function() {
    console.log('listening on *:8080');
});