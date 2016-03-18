
var diameter = 960,
    format = d3.format(",d"),
    color = d3.scale.category20();

var bubble = d3.layout.pack()
    .size([diameter, diameter])
    .value(function(d) {return d.followers_count;})
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

    var randNumInit = Math.floor((Math.random() * 100) + 10);
    generateBubbles2(sorted, randNumInit);

    //setup our ui
    d3.select("#randomizeCount")
        .on("click", function(d,i) {
            var numOf = Math.floor((Math.random() * 100) + 10);
            generateBubbles2(sorted, numOf);
        })  

}


var generateBubbles2 = function(nodeData, numOf) {
    //Cuts off the top "n" values off the sorted array
    var nodesToDisplay = nodeData.slice(-1 * numOf);
    var formattedNodes = bubble.nodes({children:nodesToDisplay}).filter(function(d) { return !d.children; });

    var viz = svg.select("#bubbleChart").selectAll('.bubbleTweet').data(formattedNodes);

    var duration = 500;
    var delay = 0;

    svg.selectAll(".bubbleTweetText").remove();
    
    // update - this is created before enter.append. it only applies to updating nodes.
    viz.transition()
        .duration(duration)
        .delay(function(d, i) {delay = i * 7; return delay;}) 
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
        .attr('r', function(d) { return d.r; })
        .style('opacity', 1)
        .each("end", function(d, i) {
            var viz = svg.select("#bubbleChart");
            viz.append("text")
                .attr("class", "bubbleTweetText")
                .attr("id", "text" + i)
                .attr("x", d.x)
                .attr("y", d.y + 5)
                .attr("text-anchor", "middle")
                .text(d.screen_name.substring(0, d.r / 3))
                .style({
                    "fill":"white", 
                    "font-family":"Helvetica Neue, Helvetica, Arial, san-serif",
                    "font-size": "12px"
                });
        }); // force to 1, so they don't get stuck below 1 at enter()

    viz.enter().append('circle')
        .attr("class", "bubbleTweet")
        .attr("id", function(d, i) {return "bubble" + i})
        .attr("r", function(d){ return d.r; })
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
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
        .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
        .transition()
        .duration(duration * 1.02)
        .style('opacity', 1)
        .each("end", function(d, i) {
            var viz = svg.select("#bubbleChart");
            viz.append("text")
                .attr("class", "bubbleTweetText")
                .attr("id", "text" + i)
                .attr("x", d.x)
                .attr("y", d.y + 5)
                .attr("text-anchor", "middle")
                .text(d.screen_name.substring(0, d.r / 3))
                .style({
                    "fill":"white", 
                    "font-family":"Helvetica Neue, Helvetica, Arial, san-serif",
                    "font-size": "12px"
                });
        });

    viz.exit()
        .transition()
        .duration(duration / 2)
        .style('opacity', 0)
        .remove();
}

var generateBubbles = function(nodes, numOf) {
	//Cuts off the top "n" values off the sorted array
	var nodesToDisplay = nodes.slice(-1 * numOf);
	var formattedNodes = bubble.nodes({children:nodesToDisplay}).filter(function(d) { return !d.children; });

    //First get the BUBBLE CHART <G>
	var viz = d3.select("#bubbleChart");
    //Then from the viz, get all bubble tweets
    var bubbles = viz.selectAll(".bubbleTweet");

    var updateSelection = bubbles.data(formattedNodes);
    var enterSelection = updateSelection.enter();

    console.log("Adding " + formattedNodes.length + " objects");
    console.log(enterSelection);
    var bubbleTweet = enterSelection.append("g").attr("class", "bubbleTweet");
	//create the bubbles
    bubbleTweet
        .append("circle")
        .attr("id", function(d, i) {return "bubble" + i})
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
    bubbleTweet
        .append("text")
        .attr("id", function(d, i) {return "text" + i})
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
