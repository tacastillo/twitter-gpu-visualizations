demo = {};

demo.TreemapCSS3d = function() {

    "use strict";

    var _width          = 700,
        _height         = 700,
        _renderer       = null,
        _controls       = null,
        _scene          = new THREE.Scene(),
        _camera         = new THREE.PerspectiveCamera(45, _width/_height , 1, 10000),
        _zmetric        = "size",
        _colorScale     = d3.scale.category20c(),
        _zscaleSize     = d3.scale.linear().range([0,500]),
        _zscaleCost     = d3.scale.linear().range([0,500]),
        _buttonBarDiv   = null,
        _elements       = null;

    function TreemapCSS3d(selection) {
        _camera.setLens(100);
        _camera.position.set(-500, -3000, 4000);
        
        _renderer = new THREE.CSS3DRenderer();
        _renderer.setSize(_width, _height);
        _renderer.domElement.style.position = 'absolute';
        _renderer.domElement.style.top = '20px';
        
        selection.node().appendChild(_renderer.domElement);

        _buttonBarDiv = selection.append("div")
            .attr("class", "controls");
        _buttonBarDiv.append("button")
            .text("ZScale: 0")
            .on("click", function() {
                _zmetric = "base";
                transform();
            });
        _buttonBarDiv.append("button")
            .text("ZScale: Size")
            .on("click", function() {
                _zmetric = "size";
                transform();
            });
        _buttonBarDiv.append("button")
            .text("ZScale: Cost")
            .on("click", function() {
                _zmetric = "cost";
                transform();
            });
      
        function position() {
            this.style("width",  function(d) { return Math.max(0, d.dx) + "px"; })
                .style("height", function(d) { return Math.max(0, d.dy) + "px"; });
        }
        
        function enterHandler(d) {
            d3.select(this).append("div")
                .style("font-size", function(d) {
                    return Math.max(18, 0.18*Math.sqrt(d.area))+'px';  // compute font size based on sqrt(area)
                })
                .text(function(d) { 
                    return d.children ? null : d.name; 
                });
            var object = new THREE.CSS3DObject(this);
            object.position.x = d.x + (d.dx / 2);
            object.position.y = d.y + (d.dy / 2);
            object.position.z = 0;
            d.object = object;
            _scene.add(object);
        }
        
      
        function updateHandler(d) {
            var object = d.object;
            var duration = 1000;
            var zvalue = (_zmetric === "size" ? _zscaleSize(d.size) : (_zmetric === "cost" ? _zscaleCost(d.cost) : 50));
          
            d3.select(this).call(position).style("background-color", function(d) {
                return d.name == 'tree' ? '#fff' : _colorScale(d.name); 
            });
          
            var newMetrics = {
                x: d.x + (d.dx / 2) - _width / 2,
                y: d.y + (d.dy / 2) - _height / 2,
                z: zvalue/2
            };

            var coords = new TWEEN.Tween(object.position)
                .to({x: newMetrics.x, y: newMetrics.y, z: newMetrics.z}, duration)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();
          
            var update = new TWEEN.Tween(this)
                .to({}, duration)
                .onUpdate(_.bind(render, this))
                .start();
        }
      
        
        function exitHandler(d) {
            _scene.remove(d.object);
            this.remove();
        }
        
      
        function transform() {
            TWEEN.removeAll();
            _elements.each(updateHandler);
        }
        
      
        function render() {
            _renderer.render(_scene, _camera);
        }
        
        
        function animate() {
            requestAnimationFrame(animate);
            TWEEN.update();
            _controls.update();
        }
   
            
        TreemapCSS3d.load = function(data) {
            _zscaleSize.domain(d3.extent(data.children, function(d) { return d.size;}));
            _zscaleCost.domain(d3.extent(data.children, function(d) { return d.cost;}));

            var color = d3.scale.category20c();

            var treemap = d3.layout.treemap()
                .size([_width, _height])
                .sticky(true)
                .value(function(d) { 
                    return d.size; 
                });

            _elements = selection.datum(data).selectAll(".node")
                .data(treemap.nodes);
          
            _elements.enter()
                .append("div")
                .attr("class", "node")
                .each(enterHandler);

            _elements.each(updateHandler);

            _elements.exit().each(exitHandler).remove();
          
            render();
            animate();
            transform();
        };
        
        //_controls = new THREE.OrbitControls(_camera, _renderer.domElement);
        _controls = new THREE.TrackballControls(_camera, _renderer.domElement);
        _controls.staticMoving  = true;
        _controls.minDistance = 100;
        _controls.maxDistance = 6000;
        _controls.rotateSpeed = 1.5;
        _controls.zoomSpeed = 1.5;
        _controls.panSpeed = 0.5;
        _controls.addEventListener('change', render);
    }

    return TreemapCSS3d;
};

d3.json("http://www.billdwhite.com/wordpress/wp-content/data/treemap3d.json", function(error, data) {
    console.log(data);
    var treemapCSS3d = demo.TreemapCSS3d();
	 d3.select("#container_JoEQyb").append("div")
    	 .style("position", "relative")
    	 .call(treemapCSS3d);
    treemapCSS3d.load(data);

    window.addEventListener("resize", function() {
        var newWidth  = window.innerWidth,
            newHeight = window.innerHeight;
        _renderer.setSize(newWidth, newHeight);
        _camera.aspect = newWidth / newHeight;
        _camera.updateProjectionMatrix();
    });
});