"use strict";

var _ = require('underscore');
var Q = require('q');

var CLjs = require('../src/cl.js');
var cl = new CLjs();

var log = require('../src/logger.js');
var logger = log.createLogger('cljs:convolve');

var int_t = cl.types.int_t;
var mem_t = cl.types.mem_t;

var pTime = new Date();

var force = function(io, graph){
	var pos = graph.position;
	var vel = graph.velocity;
	var source = graph.source;
	var target = graph.target;

// Nodes
    var numPos = pos.length/3;
    var numEdge = source.length;
    logger.debug("Nodes", numPos, "Edges", numEdge);
    
    var posData = new Float32Array(numPos*4);
    var velData = new Float32Array(numPos*4);
    var accData = new Float32Array(numPos*4);
    for(var i=0; i<numPos; i++){
    	for(var j=0; j<3; j++){
    		posData[i*4+j] = pos[i*3+j];
    		velData[i*4+j] = vel[i*3+j];
    		accData[i*4+j] = 0;
    	}
		posData[i*4+3] = 0;
		velData[i*4+3] = 0;
		accData[i*4+3] = 0;
    }

    // logger.debug("init pos:", posData);
    // logger.debug("init vel:", velData);

    var posBuffer = cl.createBuffer(posData);
    var velBuffer = cl.createBuffer(velData);
    var accBuffer = cl.createBuffer(accData);

// Edges
    var sourceData = new Int32Array(numEdge);
    var targetData = new Int32Array(numEdge);
    // We can't sum edge contribution easily on GPU, let's do it on CPU for now
    var sourceAccData = new Float32Array(numEdge*4);
    var targetAccData = new Float32Array(numEdge*4);
    for(var i=0; i<numEdge; i++){
    	sourceData[i]=source[i];
    	targetData[i]=target[i];
    }
    var sourceBuffer = cl.createBuffer(sourceData);
    var targetBuffer = cl.createBuffer(targetData);
    var sourceAccBuffer = cl.createBuffer(sourceAccData);
    var targetAccBuffer = cl.createBuffer(targetAccData);

// Run kernels
    pTime = new Date();
    repulsion(posBuffer, accBuffer, numPos)
    // .then(function(){return repulsion(posBuffer,velBuffer, numPos)})
    // .then(function(){return sendback(posBuffer, velBuffer, numPos, io);})
    // .then(function(){
    // 	return spring(posBuffer, sourceBuffer, targetBuffer, 
    // 		sourceAccBuffer, targetAccBuffer, numEdge)})
    .then(function(){return sendback(posBuffer, velBuffer, accBuffer, numPos, io);})

};

function sendback(posBuffer, velBuffer, accBuffer, numPos, io){
    var pTime1 = new Date();
	logger.debug("******sending back********:", (pTime1 - pTime)/1000, "sec");
	var pos=[];
	var vel=[];
    var acc=[]
	var posCl=posBuffer.read(Float32Array);
	var velCl=velBuffer.read(Float32Array);
    var accCl=accBuffer.read(Float32Array);
    for(var i=0; i<numPos; i++){
    	for(var j=0; j<3; j++){
    		pos[i*3+j] = posCl[i*4+j];
    		vel[i*3+j] = velCl[i*4+j];
            acc[i*3+j] = accCl[i*4+j];
    	}
    }
    // console.log(pos);
    var graph={position:pos, velocity:vel, acceleration:acc}
    // logger.debug("sending back graph", graph)
    io.emit('result', graph);
};

function repulsion(posBuffer, accBuffer, numPos){
    var argTypes=[mem_t, mem_t, int_t];

    var kernel=cl.createKernel('repulsion.cl', 'repulsion', argTypes);
    var args = [posBuffer, accBuffer, numPos];

    logger.debug("start repulsion kernel");
    return kernel.run([numPos], null, args);

}

function spring(posBuffer, sourceBuffer, targetBuffer, 
	sourceAccBuffer, targetAccBuffer, numEdge){
	var argTypes=[mem_t, mem_t, mem_t, mem_t, mem_t, int_t];

	var kernel=cl.createKernel('spring.cl', 'spring', argTypes);
	var args = [posBuffer, sourceBuffer, targetBuffer, 
		sourceAccBuffer, targetAccBuffer, numEdge];
	return kernel.run([numEdge], null, args)
		// .then(function(){
		// 	logger.debug("spring returned", sourceAccBuffer.read(Float32Array));
		// })
}

module.exports = force;