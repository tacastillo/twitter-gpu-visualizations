"use strict";

console.log("force.js loaded");
var socket = io();

var numPos = 1000;
var position=[];
var velocity=[];
var source=[0, 0, 0, 2];
var target=[1, 2, 3, 4];

for(var iPos=0; iPos<numPos; iPos++){
	for(var i=0; i<3; i++){
		// console.log(iPos*3+i, iPos*10+i)
		position[iPos*3+i]=(iPos+1)*100+i;
		velocity[iPos*3+i]=iPos/10.0 + i;
	}
}

console.log("init pos", position);
console.log("init vel", velocity);
console.log("source:", source);
console.log("target:", target);
var graph={
	position: position,
	velocity: velocity,
	source: source,
	target: target
}
socket.emit("graph", graph);

socket.on('result', function(graph){
	window.graph = graph;
	console.log("received", graph.acceleration);
})