"use strict";

var _ = require('lodash');
var Q = require('q');

var CLjs = require('../src/cl.js');
var cl = new CLjs();

var log = require('../src/logger.js');
var logger = log.createLogger('cljs:convolve');

var float_t = cl.types.float_t;
var int_t = cl.types.int_t;
var mem_t = cl.types.mem_t;

var pTime = new Date();

var f=function(){
    this.a=null;
    var g=function(){
        // console.log("test");
    }
    return {
        g:g
    }
};

var io=null;
var graph=null;

// data js array
var idsData=null;
var posData=null;
var velData=null;
var accData=null;
var sourceData=null;
var targetData=null;
var sourceAccData=null;
var targetAccData=null;
// Buffer to be send to GPU
var idsBuffer=null;
var posBuffer=null;
var velBuffer=null;
var accBuffer=null;
var sourceBuffer=null;
var targetBuffer=null;
var sourceAccBuffer=null;
var targetAccBuffer=null;

var numNode=0;
var numEdge=0;

 //default
var cRepulsion = 1.0;
var skip = 0; 
var cSpring = 0.03; 
var cGravity = 1.0;
var deltaT=0.1;
var damp = 0.9;
var it = 0;
var maxIt = 100;
var T = 0;
var lastSendTime=new Date();
var cliendReadyToReceive=true;
//done default

var setGraph = function(_io, _graph){
    io=_io;
    graph=_graph;
    // console.log("setGraph");

    var pos = _graph.position;
    var vel = _graph.velocity;
    var source = _graph.source;
    var target = _graph.target;

    cRepulsion = _graph.option.cRepulsion;
    cSpring = _graph.option.cSpring;
    cGravity = _graph.option.cGravity;
    damp = _graph.option.damp;
    deltaT = _graph.option.deltaT;
    maxIt = _graph.option.maxIt;
    T = _graph.option.T;
    it = 0;
    skip = _graph.option.skip;
    cliendReadyToReceive = true;

    // Nodes
    numNode = pos.length/3;
    numEdge = source.length;

    logger.debug("Nodes", numNode, "Edges", numEdge);
    
    posData = new Float32Array(numNode*4);
    velData = new Float32Array(numNode*4);
    accData = new Float32Array(numNode*4);
    idsData = new Int32Array(_.max(graph.ids) +1);

    for(var i=0; i<numNode; i++){
        for(var j=0; j<3; j++){
            posData[i*4+j] = pos[i*3+j];
            velData[i*4+j] = vel[i*3+j];
            accData[i*4+j] = 0;
        }
        posData[i*4+3] = 0;
        velData[i*4+3] = 0;
        accData[i*4+3] = 0;

        // map node id to sequence id
        idsData[graph.ids[i]] = i;
    }

    // logger.debug("init pos:", posData);
    // logger.debug("init vel:", velData);

    posBuffer = cl.createBuffer(posData);
    velBuffer = cl.createBuffer(velData);
    accBuffer = cl.createBuffer(accData);
    idsBuffer = cl.createBuffer(idsData);

// Edges
    sourceData = new Int32Array(numEdge);
    targetData = new Int32Array(numEdge);
    // We can't sum edge contribution easily on GPU, let's do it on CPU for now
    sourceAccData = new Float32Array(numEdge*4);
    targetAccData = new Float32Array(numEdge*4);
    for(var i=0; i<numEdge; i++){
        sourceData[i]=source[i];
        targetData[i]=target[i];
    }
    sourceBuffer = cl.createBuffer(sourceData);
    targetBuffer = cl.createBuffer(targetData);
    sourceAccBuffer = cl.createBuffer(sourceAccData);
    targetAccBuffer = cl.createBuffer(targetAccData);
};

var iterate=function(){
    it+=1;
    T *= (1 - (it / maxIt));

    pTime = new Date();
    repulsion()
    .then(function(){return spring();})
    .then(function(){return gravity();})
    .then(function(){return move();})
    .then(function(){return sendback();})
    .then(function(){
        if(it < maxIt && T > 1.0){
            return iterate();
        }
    })
};

var check = function(){
    // console.log("check");
};

var ready = function(){
    cliendReadyToReceive = true;
};

function sendback(){
    var pTime1 = new Date();
    if(!cliendReadyToReceive){
    // if(pTime1 - lastSendTime < 100){
        //console.log("skip sending back it:", it, "maxIt:", maxIt, "T:", T);
        return
    }
    cliendReadyToReceive = false;
    //console.log("it:", it, "maxIt:", maxIt, "T:", T);
    lastSendTime = pTime1;
	logger.debug("******sending back********:", (pTime1 - pTime)/1000, "sec");
	var pos=[];
	var vel=[];
    var acc=[]

	posData=posBuffer.read(Float32Array);
	velData=velBuffer.read(Float32Array);
    accData=accBuffer.read(Float32Array);
    
    for(var i=0; i<numNode; i++){
    	for(var j=0; j<3; j++){
    		pos[i*3+j] = posData[i*4+j];
    		vel[i*3+j] = velData[i*4+j];
            acc[i*3+j] = accData[i*4+j];
    	}
    }
    // console.log(pos);
    // var graph={position:pos, velocity:vel, acceleration:acc}
    var graph={position:pos}
    // logger.debug("sending back graph", graph)
    io.emit('result', graph);
};

// positions => acceleration
function repulsion(){
    // console.log("numNode is ", numNode);
    // in, out, in; out has no memory of past
    var args = [posBuffer, accBuffer, cRepulsion, skip, numNode];
    var argTypes=[mem_t, mem_t, float_t, int_t, int_t];

    var kernel=cl.createKernel('cl/repulsion.cl', 'repulsion', argTypes);

    // logger.debug("start repulsion kernel");
    return kernel.run([numNode], null, args);
}

function gravity(){
    // console.log("starting gravity, cGravity", cGravity);
    var args = [posBuffer, accBuffer, cGravity, numNode];
    var argTypes=[mem_t, mem_t, float_t, int_t];

    var kernel=cl.createKernel('cl/gravity.cl', 'gravity', argTypes);
    return kernel.run([numNode], null, args)
}

// edges => edge accelerations
function spring(){
    // in, in, in, in, out, out, in; out has not memory of past
    var args = [posBuffer, sourceBuffer, targetBuffer, idsBuffer,
        sourceAccBuffer, targetAccBuffer, cSpring, numEdge];
    var argTypes=[mem_t, mem_t, mem_t, mem_t, mem_t, mem_t, float_t, int_t];

    var kernel=cl.createKernel('cl/spring.cl', 'spring', argTypes);
    return kernel.run([numEdge], null, args)
}

// from velocity, acceleration, sourceAcc, targetAcc to new position
function move(){
    var _accData=accBuffer.read(Float32Array);
    var srcAcc=sourceAccBuffer.read(Float32Array);
    var tgtAcc=targetAccBuffer.read(Float32Array);
    // debugger
    for(var i=0; i<numEdge; i++){
        var srcId = graph.source[i];
        var tgtId = graph.target[i];

        var src = idsData[srcId];
        var tgt = idsData[tgtId];

        _accData[4*src] += srcAcc[4*i];
        _accData[4*src+1] += srcAcc[4*i+1];
        _accData[4*src+2] += srcAcc[4*i+2];
        _accData[4*tgt] += tgtAcc[4*i];
        _accData[4*tgt+1] += tgtAcc[4*i+1];
        _accData[4*tgt+2] += tgtAcc[4*i+2];
    }

    // for(var i=0; i<numNode*4; i++){
    //     velData[i] += accData[i]*deltaT;
    //     velData[i] *= damp;
    //     posData[i] += velData[i]*deltaT;
    // }

    updatePosition(_accData);
    // posBuffer = cl.createBuffer(posData);
    // velBuffer = cl.createBuffer(velData);
}

function updatePosition(_accData){
    var thisAccBuffer = cl.createBuffer(_accData);
    var args=[thisAccBuffer, posBuffer, velBuffer, damp, deltaT, T, numNode];
    var argTypes=[mem_t, mem_t, mem_t, float_t, float_t, float_t, int_t];

    var kernel=cl.createKernel('cl/updatePosition.cl', 'updatePosition', argTypes);
    return kernel.run([numNode], null, args);
}

module.exports = {
    setGraph: setGraph,
    iterate: iterate,
    check: check,
    ready: ready
};