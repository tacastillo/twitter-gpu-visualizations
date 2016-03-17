
var diameter = 960,
    format = d3.format(",d"),
    color = d3.scale.category20c();

var bubble = d3.layout.pack()
    .size([diameter, diameter])
    .padding(1.5);

var svg = d3.select("#svgDiv").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");
    
var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("color", "white")
    .style("padding", "8px")
    .style("background-color", "rgba(0, 0, 0, 0.75)")
    .style("border-radius", "6px")
    .style("font", "12px sans-serif")
    .text("tooltip");

var sortTweetsByFollowers = function(data) {
	var sorted = data.sort(function(a, b){
		return a.followers_count - b.followers_count;
	});

	return sorted;
}

var initDataForViz = function(data) {
	var sorted = sortTweetsByFollowers(data);

    sorted = sorted.map(function(d){ d.value = +d.followers_count; return d; });
	//setup the chart
    var bubbles = svg.append("g")
        .attr("transform", "translate(0,0)")
        .attr("id", "bubbleChart");

    var randNumInit = Math.floor((Math.random() * 50) + 1);
    generateBubbles(sorted, randNumInit);

    //setup our ui
    d3.select("#randomizeCount")
        .on("click", function(d,i) {
            var numOf = Math.floor((Math.random() * 50) + 1);
            generateBubbles(sorted, numOf);
        })  

}

var generateBubbles = function(nodes, numOf) {
	//Cuts off the top "n" values off the sorted array
	var nodesToDisplay = nodes.slice(-1 * numOf);
	var formattedNodes = bubble.nodes({children:nodesToDisplay}).filter(function(d) { return !d.children; });

	var bubbles = d3.select("#bubbleChart")
					   .selectAll(".bubble")
					   .data(formattedNodes)
					   .enter();

	//create the bubbles
    bubbles.append("circle")
        .attr("r", function(d){ return d.r; })
        .attr("cx", function(d){ return d.x; })
        .attr("cy", function(d){ return d.y; })
        .style("fill", function(d) { return color(d.value); })
		.on("mouseover", function(d) {
			tooltip.html("username: " + d.screen_name + "<br/>" + 
						 "<img src=\"" + d.profile_image_url + "\" onError=\"this.src = '/static/img/defaultuser_small.png'\"></img>" + "<br/>" + 
						 "followers: " + format(d.value) + "<br/>" + 
						 "tweet hashtags: " + d.hashtaglist); 
			tooltip.style("visibility", "visible");
		})
		.on("mousemove", function() {
		  return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
		})
		.on("mouseout", function(){return tooltip.style("visibility", "hidden");});


    //format the text for each bubble
    bubbles.append("text")
        .attr("x", function(d){ return d.x; })
        .attr("y", function(d){ return d.y + 5; })
        .attr("text-anchor", "middle")
        .text(function(d){ return d.screen_name.substring(0, d.r / 3); })
        .style({
            "fill":"white", 
            "font-family":"Helvetica Neue, Helvetica, Arial, san-serif",
            "font-size": "12px"
        });

}

d3.select(self.frameElement).style("height", diameter + "px");
