# GPU Acceleration & Sockets Framework

Written for University of San Francisco's CS-490: Senior Team Project by:

- William Chiang
- Timothy Castillo
- Rik Basu

Sponsored by Weidong Yang of Kinetech Arts.


### Purpose

> The goal of this project is being able to create a proof of concept demonstration with a sample computer that developers can connect and link their data to. The developer can specify a control unit, send data into the GPU through the API, and then have the API pipe back the results into as many visualizations as the developer wants to create with their input data set. All of this would be contained within one instance and the multiple developers would be able to have their own contained instances within the framework.

### Tech

This project uses a number of projects to work properly:

* Node.js
* Express
* Socket. io
* OpenCL
* Three.js
* D3.js
* WebGL

### Installation

The project requires Node.js to run.

All node components must first be installed.

After cloning the repository, 

```sh
$ cd twitter-visualizations
$ npm install
$ npm start
$ cd ../cljs_demo
$ npm install
$ cd graph
$ npm install
$ npm start
```
