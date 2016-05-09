"use strict";

var drawing;
var socket = io();

function createDrawing() {
var index = parseInt(location.search.split("?")[1]);

if(isNaN(index)) {
  index = 1;
}
/* Change these values to draw more nodes (numNodes) */
switch(index) {
  case 0:
    drawing = new Drawing.SimpleGraph({layout: '2d', selection: true, numNodes: 50, showStats: true, showInfo: true});
    break;
  case 1:
    drawing = new Drawing.SimpleGraph({layout: '3d', selection: false, numNodes: 600, graphLayout:{attraction: 7, repulsion: 0.4}, showStats: true, showInfo: true});
    break;
  case 2:
    drawing = new Drawing.SphereGraph({numNodes: 50, showStats: true, showInfo: true});
    break;
  default:
    drawing = new Drawing.SimpleGraph({layout: '3d', selection: true, numNodes: 50, showStats: true, showInfo: true});
}
document.getElementById("drawing_select").selectedIndex = index;
}


var layoutOption={
	cRepulsion:0.5,
	cSpring:500.0,
	cGravity:1.0,
	damp:0.99,
	deltaT:0.2,
	maxIt:10000,
	T:100,
	skip:0
};

var genGraph1=function(){
	var position=[
		1,0,0,
		-1,0,0,
		0, 1, 0,
		0, -1, 0,
		0, 0, 1,
		0, 0, -1
	];
	var velocity=[
		0,0,0,
		0,0,0,
		0,0,0,
		0,0,0,
		0,0,0,
		0,0,0
	];
	var source=[0, 2, 4];
	var target=[1, 3, 5];
	var ids=[0,1,2,3,4,5];

	return {
		position: position, 
		velocity: velocity, 
		ids: ids, 
		source: source, 
		target: target,
		option: layoutOption
	}
};
// testCL()

var testGraph1=function(){
	var g = genGraph1();
	socket.emit("graph", g);
}

var layoutTest=function(){
	var g = drawing.graph.serialize();
	g.option = layoutOption;

	socket.emit("graph", g);
	itCnt = 0;
	socket.emit("iterate", {});
};

var MaxIt=300;
var itCnt=0;

// avoid rendering multiple graphs in each render loop
var setToGraph=function(){
	var pos = gResult.position;
	var nodes=drawing.graph.nodes;
	for(var i=0; i<nodes.length; i++){
		var n=nodes[i];
		n.position.x=pos[i*3];
		n.position.y=pos[i*3+1];
		n.position.z=pos[i*3+2];
	}
};

var clearGraph=function(){
	var nodes=drawing.graph.nodes;

	for(var i=0; i<nodes.length; i++){
		var n=nodes[i];
		n.position.x=0;
		n.position.y=0;
		n.position.z=0;
	}	
};

var testCL=function(){
	var g=genGraph1();
	socket.emit("graph", g);
	socket.emit("iterate", g);
};

var checkCL=function(){
	socket.emit("check", {});
};

var iterateCL=function(){
	socket.emit('iterate', {});
};

socket.on('result', function(result){
	window.gResult = result;
	// console.log("received", gResult.position, gResult.velocity, gResult.acceleration);
	setToGraph();
	socket.emit('ready', {});
	// itCnt+=1;
	// if(itCnt<MaxIt){
	// 	iterateCL();
	// }

})
