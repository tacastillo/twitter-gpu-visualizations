/**
  @author David Piegza

  Implements a simple graph drawing with force-directed placement in 2D and 3D.

  It uses the force-directed-layout implemented in:
  https://github.com/davidpiegza/Graph-Visualization/blob/master/layouts/force-directed-layout.js

  Drawing is done with Three.js: http://github.com/mrdoob/three.js

  To use this drawing, include the graph-min.js file and create a SimpleGraph object:

  <!DOCTYPE html>
  <html>
    <head>
      <title>Graph Visualization</title>
      <script type="text/javascript" src="path/to/graph-min.js"></script>
    </head>
    <body onload="new Drawing.SimpleGraph({layout: '3d', showStats: true, showInfo: true})">
    </bod>
  </html>

  Parameters:
  options = {
    layout: "2d" or "3d"

    showStats: <bool>, displays FPS box
    showInfo: <bool>, displays some info on the graph and layout
              The info box is created as <div id="graph-info">, it must be
              styled and positioned with CSS.


    selection: <bool>, enables selection of nodes on mouse over (it displays some info
               when the showInfo flag is set)


    limit: <int>, maximum number of nodes

    numNodes: <int> - sets the number of nodes to create.
    numEdges: <int> - sets the maximum number of edges for a node. A node will have
              1 to numEdges edges, this is set randomly.
  }


  Feel free to contribute a new drawing!

 */

// var Drawing = Drawing || {};

// Drawing.SimpleGraph = function(options) {
  var initialized = false;
  var options;

  this.layout;
  this.layout_options;
  this.show_stats;
  this.show_info;
  this.show_labels;
  this.selection;
  this.limit;
  this.nodes_count;
  this.edges_count;

  var camera, controls, scene, renderer, interaction, geometry, object_selection;
  var stats;
  var info_text = {};
  var graph;

  var geometries = [];

  var that=this;

  //GLOBAL VARIABLES FOR DYNAMIC GRAPH
  var hashtagCombos = {};
  var popularCombos = [];
  var popularHashtagsNodes = {};
  var totalHashtagCount = 0;
  var addedNodes = [];

  hashtagCombosByDate = {};

  // init();
  // //createGraph();


  function init(inputOptions) {
    options = inputOptions || {};

    this.layout = options.layout || "2d";
    this.layout_options = options.graphLayout || {};
    this.show_stats = options.showStats || false;
    this.show_info = options.showInfo || false;
    this.show_labels = options.showLabels || false;
    this.selection = options.selection || false;
    this.limit = options.limit || 10;
    this.nodes_count = options.numNodes || 20;
    this.edges_count = options.numEdges || 10;
    graph = new Graph({limit: options.limit});
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
    //initializeDynamicGraph();
    appendTweets(options.data);
    initGraphSettings();
    animate();
  }

  this.clearTweets = function() {

  }

  this.appendTweets = function(newTweets) {
    //With each new tweet, create its hashtag combinations and add it to the original mapping.
    var tweets = newTweets;

            }
    for(var i = 0; i < tweets.length; i++) {
      var currTweet = tweets[i];
      var hashtagsArray = currTweet.hashtaglist.split(" ");
      currTweet.hashtagsArray = hashtagsArray;

      for(var j = 0; j < hashtagsArray.length; j++) {
        var currHashtag = hashtagsArray[j];
        //If this hashtag is popular enough
        for(var k = 0; k < hashtagsArray.length; k++) {
          var nextHashTag = hashtagsArray[k];
          if(currHashtag != nextHashTag) {
            //Checks via alphabetical order(so double repeats dont show up)
            if(currHashtag < nextHashTag) {
              var swap = currHashtag;
              currHashtag = nextHashTag;
              nextHashTag = swap;
            }

            var connection = currHashtag + "-" + nextHashTag;
            //If indexOf == -1, then this connection was not found
            if(hashtagCombos[connection] == null) {
              hashtagCombos[connection] = {
                combo: connection,
                count: 1,
                source: currHashtag,
                destination: nextHashTag
              }
            } else {
              hashtagCombos[connection].count++;
            }
          }
        }
      }
    }

    for(var key in hashtagCombos) {
      var hashCombo = hashtagCombos[key];
      //First, iterate through all existing hashCombos
        if(popularHashtagsNodes[hashCombo.source] == null) {
          var nodeToAdd = new Node(totalHashtagCount);
          nodeToAdd.data.title = hashCombo.source;
          popularHashtagsNodes[hashCombo.source] = nodeToAdd;
          totalHashtagCount++;
        }
        if(popularHashtagsNodes[hashCombo.destination] == null) {
          var nodeToAdd = new Node(totalHashtagCount);
          nodeToAdd.data.title = hashCombo.destination;
          popularHashtagsNodes[hashCombo.destination] = nodeToAdd;
          totalHashtagCount++;
        }

        var newCombo = {
          combo: hashCombo.combo,
          count: hashCombo.count,
          src: hashCombo.source,
          dest: hashCombo.destination,
          srcNode: popularHashtagsNodes[hashCombo.source],
          destNode: popularHashtagsNodes[hashCombo.destination]
        }
        if(popularCombos.indexOf(newCombo.combo) == -1) {
          popularCombos.push(newCombo);
        }
      }
    }

    for(i = 0; i < popularCombos.length; i++) {
      var combo = popularCombos[i];
      if(addedNodes.indexOf(combo.src) == -1) {
        addedNodes.push(combo.src);
      }
      if(addedNodes.indexOf(combo.dest) == -1) {
        addedNodes.push(combo.dest);
      }

    }

    if(initialized) {
      graph.layout.updateGraph(graph);
      info_text.nodes = "Nodes " + graph.nodes.length;
      info_text.edges = "Edges " + graph.edges.length;
    }
  }

  function initGraphSettings() {
    initialized = true;
    that.layout_options.width = that.layout_options.width || 2000;
    that.layout_options.height = that.layout_options.height || 2000;
    that.layout_options.iterations = that.layout_options.iterations || 100000;
    that.layout_options.layout = that.layout_options.layout || that.layout;
    graph.layout = new Layout.ForceDirected(graph, that.layout_options);
    graph.layout.init();
    info_text.nodes = "Nodes " + graph.nodes.length;
    info_text.edges = "Edges " + graph.edges.length;
  }

  function createGraphByAllHashtagCombinations() {
    var tweets = that.data;
    var hashtagNodes = {};
    var popularHashtags = [];
    var popularHashtagsNodes = {};
    var edgedHashtags = [];
    var totalHashtagCount = 0;

    for(var i = 0; i < tweets.length; i++) {
      var currTweet = tweets[i];
      var hashtagsArray = currTweet.hashtaglist.split(" ");
      currTweet.hashtagsArray = hashtagsArray;

      for(var j = 0; j < hashtagsArray.length; j++) {
        var currHashtag = hashtagsArray[j];
        if(hashtagNodes[currHashtag] == null) {
          var nodeToAdd = new Node(totalHashtagCount);
          nodeToAdd.data.title = currHashtag;
          hashtagNodes[currHashtag] = {
            count: 1,
            node: nodeToAdd
          }
          totalHashtagCount++;

        }
        else {
          hashtagNodes[currHashtag].count++;

        }
      }
    }

    for(var key in hashtagNodes) {
      var currNode = hashtagNodes[key];
      if(currNode.count > 50) {
        popularHashtags.push(key);
        popularHashtagsNodes[key] = {
          hashtag: key,
          count: currNode.count,
          node: currNode.node
        };
        graph.addNode(currNode.node);
        drawNode(currNode.node);
      }
    }

    for(var i = 0; i < tweets.length; i++) {
      //Doubly nested for-loop to cross-compare all other hashtags to current one(by string, since people can hashtag the same thing together)
      var hashtagsArray = tweets[i].hashtagsArray;
      for(var j = 0; j < hashtagsArray.length; j++) {
        var currHashtag = hashtagsArray[j];
        //If this hashtag is popular enough
        if(popularHashtags.indexOf(currHashtag) != -1) {
          for(var k = 0; k < hashtagsArray.length; k++) {
            var nextHashTag = hashtagsArray[k];
            if((currHashtag != nextHashTag) && (popularHashtags.indexOf(nextHashTag) != -1)) { //Must not already exist AND be popular
              //Checks via alphabetical order(so double repeats dont show up)
              if(currHashtag < nextHashTag) {
                var swap = currHashtag;
                currHashtag = nextHashTag;
                nextHashTag = swap;
              }

              var connection = currHashtag + "-" + nextHashTag;
              //If indexOf == -1, then this connection was not found
              if(edgedHashtags.indexOf(connection) == -1) {
                edgedHashtags.push(connection);
                var currNode = popularHashtagsNodes[currHashtag].node;
                var nextNode = popularHashtagsNodes[nextHashTag].node;

                graph.addEdge(currNode, nextNode);
                drawEdge(currNode, nextNode);
              }
            }
          }
        }
        else {
          continue;
        }
      }
    }

    that.layout_options.width = that.layout_options.width || 2000;
    that.layout_options.height = that.layout_options.height || 2000;
    that.layout_options.iterations = that.layout_options.iterations || 100000;
    that.layout_options.layout = that.layout_options.layout || that.layout;
    graph.layout = new Layout.ForceDirected(graph, that.layout_options);
    graph.layout.init();
    info_text.nodes = "Nodes " + graph.nodes.length;
    info_text.edges = "Edges " + graph.edges.length;
  }

  /**
   *  Create a node object and add it to the scene.
   */
  function drawNode(node) {
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


  /**
   *  Create an edge object (line) and add it to the scene.
   */
  function drawEdge(source, target) {

      var tmp_geo = new THREE.Geometry();
      tmp_geo.vertices.push(source.data.draw_object.position);
      tmp_geo.vertices.push(target.data.draw_object.position);

      line = new THREE.Line( tmp_geo, material, THREE.LinePieces );
      line.scale.x = line.scale.y = line.scale.z = 1;
      line.originalScale = 1;

      geometries.push(tmp_geo);

      scene.add( line );
  }


  function animate() {
    requestAnimationFrame( animate );
    controls.update();
    render();
    if(that.show_info) {
      printInfo();
    }
  }


  function render() {
    // Generate layout if not finished
    if(!graph.layout.finished) {
      info_text.calc = "<span style='color: red'>Calculating layout...</span>";
      graph.layout.generate();
    } else {
      info_text.calc = "";
    }

    // Update position of lines (edges)
    for(var i=0; i<geometries.length; i++) {
      geometries[i].verticesNeedUpdate = true;
    }


    // Show labels if set
    // It creates the labels when this options is set during visualization
    if(that.show_labels) {
      var length = graph.nodes.length;
      for(var i=0; i<length; i++) {
        var node = graph.nodes[i];
        if(node.data.label_object != undefined) {
          node.data.label_object.position.x = node.data.draw_object.position.x;
          node.data.label_object.position.y = node.data.draw_object.position.y - 100;
          node.data.label_object.position.z = node.data.draw_object.position.z;
          node.data.label_object.lookAt(camera.position);
        } else {
          if(node.data.title != undefined) {
            var label_object = new THREE.Label(node.data.title, node.data.draw_object);
          } else {
            var label_object = new THREE.Label(node.id, node.data.draw_object);
          }
          node.data.label_object = label_object;
          scene.add( node.data.label_object );
        }
      }
    } else {
      var length = graph.nodes.length;
      for(var i=0; i<length; i++) {
        var node = graph.nodes[i];
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
    graph.layout.stop_calculating();
  }

  this.toggleText = function(checked) {
    that.show_labels = checked;
  }
//}
