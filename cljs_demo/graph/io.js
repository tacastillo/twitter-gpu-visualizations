var ioBase = require('socket.io');
var force = require('./force');

var socketIo=function(server){
	var io = ioBase(server);
	io.on('connection', function(socket){
	  console.log('a user connnected');
	  socket.on('graph', function(graph){
	    // console.log(graph);
	    force.setGraph(io, graph);
	  });
	  socket.on('ready', function(){
	  	force.ready();
	  });
	  socket.on('check', function(){
	  	force.check();
	  });
	  socket.on('iterate', function(){
	  	force.iterate();
	  });
	});
	io.on('disconnect', function(socket){
	  console.log('a user disconnected');
	});
}

module.exports = socketIo;