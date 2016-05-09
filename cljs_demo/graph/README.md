# graph layout using cljs
Has test code running on MBP with El Capiton

To run test:
cd graph
npm install
npm start

in brower,
localhost:3001,

open a debug console, output:
force.js loaded
graph.js:20 init pos [100, 101, 102, 200, 201, 202, 300, 301, 302, 400, 401, 402, 500, 501, 502]
graph.js:21 init vel [0, 1, 2, 0.1, 1.1, 2.1, 0.2, 1.2, 2.2, 0.3, 1.3, 2.3, 0.4, 1.4, 2.4]
graph.js:22 source: [0, 0, 0, 2]
graph.js:23 target: [1, 2, 3, 4]
graph.js:33 received [100, 101, 102, 200, 201, 202, 300, 301, 302, 400, 401, 402, 500, 501, 502]

To do:
Repulsion is fully done on GPU, each node runs on a gpu unit, accessing all other nodes and computer displacement.

Edge spring is done in parallel for each edge, but the the force is assembled on CPU. We can later optimize this.

Repulsion can be optimized later for workgroup.


hanging process use 
lsof -i:3001
then kill ...