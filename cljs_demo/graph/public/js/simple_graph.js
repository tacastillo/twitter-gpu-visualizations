// "use strict";

var Drawing = Drawing || {};
var bUsePointCloud=true;

Drawing.SimpleGraph = function(options) {
  var options = options || {};

  this.layout = options.layout || "2d";
  this.layout_options = options.graphLayout || {};
  this.show_stats = options.showStats || false;
  this.show_info = options.showInfo || false;
  this.show_labels = options.showLabels || false;
  this.selection = options.selection || false;
  this.limit = options.limit || 10;
  this.nodes_count = options.numNodes || 20;
  this.edges_count = options.numEdges || 10;

  var camera, controls, scene, renderer, interaction, geometry, object_selection;
  var stats;
  var info_text = {};
  this.graph = new Graph({limit: options.limit});

  var geometries = [];

  // use point cloud
  if(bUsePointCloud){
    var maxNumNode = 100000;
    var maxNumEdge = 200000;
    var pcPositions = new Float32Array( maxNumNode * 3 );
    var pcColors = new Float32Array( maxNumNode * 3 );
    var pcSizes = new Float32Array( maxNumNode );

    for(var i=0; i<maxNumNode; i++){
      var vertex = new THREE.Vector3(0,0,0);
      vertex.toArray(pcPositions, i*3);
      var pcColor = new THREE.Color(0x0000ff);
      // pcColor.setHSL(0.01 + 0.1 * ( i / maxNumNode ), 1.0, 0.5 );
      // pcColor.setRGB(255, 0, 0);
      pcColor.toArray(pcColors, i*3);
      pcSizes[i] = 0;
    }

    window.pcColors=pcColors;
    var pcGeometry = new THREE.BufferGeometry();
    pcGeometry.addAttribute('position', new THREE.BufferAttribute(pcPositions, 3 ));
    pcGeometry.addAttribute('customColor', new THREE.BufferAttribute(pcColors, 3 ));
    pcGeometry.addAttribute('size', new THREE.BufferAttribute(pcSizes, 1 ));

    var pcMaterial = new THREE.ShaderMaterial( {
      uniforms: {
        color:   { type: "c", value: new THREE.Color( 0xffffff ) },
        texture: { type: "t", value: new THREE.TextureLoader().load( "images/disc.png" ) }
      },
      vertexShader: document.getElementById( 'vertexshader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
      alphaTest: 0.9,
    } );

    var pointCloud = new THREE.Points(pcGeometry, pcMaterial);

    // edge cloud
    var lineGeometry = new THREE.Geometry();
    for(var i=0; i<2*maxNumEdge; i++){
      var p = new THREE.Vector3(0,0,0);
      lineGeometry.vertices.push(p);
    }
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, opacity: 1, linewidth: 0.5 });
    var edgeCloud = new THREE.LineSegments(lineGeometry, lineMaterial);

  }
  // end point cloud

  var that=this;

  init();
  createGraph();
  animate();

  function init() {
    // Three.js initialization
    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize( window.innerWidth, window.innerHeight );

    camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 1, 1000000);
    camera.position.z = 5000;

    controls = new THREE.TrackballControls(camera);

    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 5.2;
    controls.panSpeed = 1;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [ 65, 83, 68 ];

    controls.addEventListener('change', render);

    scene = new THREE.Scene();

    if(bUsePointCloud){
      scene.add(pointCloud);
      scene.add(edgeCloud);
    }

    // Node geometry
    if(that.layout === "3d") {
      geometry = new THREE.CubeGeometry( 25, 25, 25 );
    } else {
      geometry = new THREE.CubeGeometry( 50, 50, 0 );
    }

    // Create node selection, if set
    if(that.selection) {
      object_selection = new THREE.ObjectSelection({
        domElement: renderer.domElement,
        selected: function(obj) {
          // display info
          if(obj != null) {
            info_text.select = "Object " + obj.id;
          } else {
            delete info_text.select;
          }
        },
        clicked: function(obj) {
        }
      });
    }

    document.body.appendChild( renderer.domElement );

    // Stats.js
    if(that.show_stats) {
      stats = new Stats();
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '0px';
      document.body.appendChild( stats.domElement );
    }

    // Create info box
    if(that.show_info) {
      var info = document.createElement("div");
      var id_attr = document.createAttribute("id");
      id_attr.nodeValue = "graph-info";
      info.setAttributeNode(id_attr);
      document.body.appendChild( info );
    }
  }


  /**
   *  Creates a graph with random nodes and edges.
   *  Number of nodes and edges can be set with
   *  numNodes and numEdges.
   */
  function createGraph(){
    var node = new Node(0);
    node.data.title = "This is node " + node.id;
    that.graph.addNode(node);
    drawNode(node);

    var nodes = [];
    nodes.push(node);

    var steps = 1;
    while(nodes.length != 0 && steps < that.nodes_count) {
      var node = nodes.shift();

      var numEdges = randomFromTo(1, that.edges_count);
      for(var i=1; i <= numEdges; i++) {
        var target_node = new Node(i*steps);
        if(that.graph.addNode(target_node)) {
          target_node.data.title = "This is node " + target_node.id;

          drawNode(target_node);
          nodes.push(target_node);
          if(that.graph.addEdge(node, target_node)) {
            drawEdge(node, target_node);
          }
        }
      }
      steps++;
    }

    that.layout_options.width = that.layout_options.width || 2000;
    that.layout_options.height = that.layout_options.height || 2000;
    that.layout_options.iterations = that.layout_options.iterations || 100000;
    that.layout_options.layout = that.layout_options.layout || that.layout;
    that.graph.layout = new Layout.ForceDirected(that.graph, that.layout_options);
    that.graph.layout.init();
    info_text.nodes = "Nodes " + that.graph.nodes.length;
    info_text.edges = "Edges " + that.graph.edges.length;
  }


  /**
   *  Create a node object and add it to the scene.
   */
  function drawNode(node) {
    if(bUsePointCloud){
      if(that.show_labels) {
        if(node.data.title != undefined) {
          var label_object = new THREE.Label(node.data.title);
        } else {
          var label_object = new THREE.Label(node.id);
        }
        node.data.label_object = label_object;
        scene.add( node.data.label_object );
      }

      var area = 5000;

      node.position.x = Math.floor(Math.random() * (area + area + 1) - area);
      node.position.y = Math.floor(Math.random() * (area + area + 1) - area);
      node.position.z = Math.floor(Math.random() * (area + area + 1) - area);
    }else{

      var draw_object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {  color: Math.random() * 0xffffff, opacity: 0.5 } ) );

      if(that.show_labels) {
        if(node.data.title != undefined) {
          var label_object = new THREE.Label(node.data.title);
        } else {
          var label_object = new THREE.Label(node.id);
        }
        node.data.label_object = label_object;
        scene.add( node.data.label_object );
      }

      var area = 5000;
      draw_object.position.x = Math.floor(Math.random() * (area + area + 1) - area);
      draw_object.position.y = Math.floor(Math.random() * (area + area + 1) - area);

      if(that.layout === "3d") {
        draw_object.position.z = Math.floor(Math.random() * (area + area + 1) - area);
      }

      draw_object.id = node.id;
      node.data.draw_object = draw_object;
      node.position = draw_object.position;
      scene.add( node.data.draw_object );
    }
  }


  /**
   *  Create an edge object (line) and add it to the scene.
   */
  function drawEdge(source, target) {
    if(bUsePointCloud){

    }else{
      material = new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 1, linewidth: 0.5 });

      var tmp_geo = new THREE.Geometry();
      if(bUsePointCloud){
        tmp_geo.vertices.push(source.position);
        tmp_geo.vertices.push(target.position);
      }else{
        tmp_geo.vertices.push(source.data.draw_object.position);
        tmp_geo.vertices.push(target.data.draw_object.position);
      }
      line = new THREE.Line( tmp_geo, material, THREE.LinePieces );
      line.scale.x = line.scale.y = line.scale.z = 1;
      line.originalScale = 1;

      geometries.push(tmp_geo);

      scene.add( line );
    }
  }


  function animate() {
    requestAnimationFrame( animate );
    controls.update();
    render();
    if(that.show_info) {
      printInfo();
    }
  }

  function setToPointCloud(){
    // debugger
    var nodes = that.graph.nodes;
    var attributes = pcGeometry.attributes;
    for(var i=0; i< nodes.length; i++){
      var n = nodes[i];
      attributes.position.array[3*i]=n.position.x;
      attributes.position.array[3*i+1]=n.position.y;
      attributes.position.array[3*i+2]=n.position.z;
      attributes.size.array[i] = 200;

    }
    attributes.position.needsUpdate = true;
    attributes.size.needsUpdate = true;

    var edges = that.graph.edges;
    var vertices = edgeCloud.geometry.vertices;
    for(var i=0; i<edges.length; i++){
      vertices[2*i].copy(edges[i].source.position);
      vertices[2*i+1].copy(edges[i].target.position);
    }
    edgeCloud.geometry.verticesNeedUpdate = true;
  }

  function render() {
    // Generate layout if not finished
    if(!that.graph.layout.finished) {
      info_text.calc = "<span style='color: red'>Calculating layout...</span>";
      that.graph.layout.generate();
    } else {
      info_text.calc = "";
    }

    // Update position of lines (edges)
    for(var i=0; i<geometries.length; i++) {
      geometries[i].verticesNeedUpdate = true;
    }

    if(bUsePointCloud)
      setToPointCloud();
    pcGeometry.verticesNeedUpdate = true;
    // Show labels if set
    // It creates the labels when this options is set during visualization
    if(that.show_labels) {
      var length = that.graph.nodes.length;
      for(var i=0; i<length; i++) {
        var node = that.graph.nodes[i];
        if(node.data.label_object != undefined) {
          if(bUsePointCloud){
            node.data.label_object.position.x = node.position.x;
            node.data.label_object.position.y = node.position.y - 100;
            node.data.label_object.position.z = node.position.z;
            node.data.label_object.lookAt(camera.position);
          }else{
            node.data.label_object.position.x = node.data.draw_object.position.x;
            node.data.label_object.position.y = node.data.draw_object.position.y - 100;
            node.data.label_object.position.z = node.data.draw_object.position.z;
            node.data.label_object.lookAt(camera.position);
          }
        } else {
          if(node.data.title != undefined) {
            // var label_object = new THREE.Label(node.data.title, node.data.draw_object);
            var label_object = new THREE.Label(node.data.title);
          } else {
            // var label_object = new THREE.Label(node.id, node.data.draw_object);
            var label_object = new THREE.Label(node.id);
          }
          node.data.label_object = label_object;
          scene.add( node.data.label_object );
        }
      }
    } else {
      var length = that.graph.nodes.length;
      for(var i=0; i<length; i++) {
        var node = that.graph.nodes[i];
        if(node.data.label_object != undefined) {
          scene.remove( node.data.label_object );
          node.data.label_object = undefined;
        }
      }
    }

    // render selection
    if(that.selection) {
      object_selection.render(scene, camera);
    }

    // update stats
    if(that.show_stats) {
      stats.update();
    }

    // render scene
    renderer.render( scene, camera );
  }

  /**
   *  Prints info from the attribute info_text.
   */
  function printInfo(text) {
    var str = '';
    for(var index in info_text) {
      if(str != '' && info_text[index] != '') {
        str += " - ";
      }
      str += info_text[index];
    }
    document.getElementById("graph-info").innerHTML = str;
  }

  // Generate random number
  function randomFromTo(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
  }

  // Stop layout calculation
  this.stop_calculating = function() {
    that.graph.layout.stop_calculating();
  }
}
