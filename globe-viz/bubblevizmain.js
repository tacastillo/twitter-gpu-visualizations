
var diameter = (window.innerHeight/8)*7,
    format = d3.format(",d"),
    color = d3.scale.category20();

var bubble = d3.layout.pack()
    .size([diameter, diameter])
    .value(function(d) {return d.numOfTweets;})
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

var sortTweetsByCount = function(data) {
    
    //console.log(data);
    var users = {};
    for (i = 0; i < data.length; i++) {
        var currTweet = data[i];
        if(users[currTweet.screen_name] == null) {
            users[currTweet.screen_name] = {
                userData: currTweet,
                tweets: [currTweet.text]
            }
        }
        else {
            users[currTweet.screen_name].tweets.push(currTweet.text);
        }
    }

    var compact = [];
    var keys = Object.keys(users);
    for (i = 0; i < keys.length; i++) {
        var username = keys[i];
        var currTweet = users[username];
        compact.push({
            screen_name: currTweet.userData.screen_name,
            numOfTweets: currTweet.tweets.length,
            tweetData: currTweet
        })
    }
    compact = compact.sort(function(a, b){
        return a.numOfTweets - b.numOfTweets;
    });

    return compact;
}

var initDataForViz = function(data) {

	//setup the chart
    var bubbles = svg.append("g")
        .attr("transform", "translate(0,0)")
        .attr("id", "bubbleChart");

    // var randNumInit = Math.floor((Math.random() * 100) + 10);
    updateData(data);

    // //setup our ui
    // d3.select("#randomizeCount")
    //     .on("click", function(d,i) {
    //         var numOf = Math.floor((Math.random() * 100) + 10);
    //         generateBubbles2(sorted, numOf);
    //     })  

}

var updateData = function(data) {
    var sorted = sortTweetsByCount(data);
    //var sorted = sortTweetsByFollowers(data);

    sorted = sorted.map(function(d){ d.value = +d.numOfTweets; return d; });
    generateBubbles2(sorted, 100);
}

var generateBubbles2 = function(nodeData, numOf) {
    //Cuts off the top "n" values off the sorted array
    var nodesToDisplay = nodeData.slice(-1 * numOf);
    var formattedNodes = bubble.nodes({children:nodesToDisplay}).filter(function(d) { return !d.children; });
    console.log("Fomratted");
    console.log(formattedNodes);
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
            console.log(d.tweetData);
            tooltip.html("username: " + d.screen_name + "<br/>" + 
                         "<img src=\"" + d.tweetData.userData.profile_image_url + "\" onError=\"this.src = '/static/img/defaultuser_small.png'\"></img>" + "<br/>" + 
                         "tweets: " + format(d.value) + "<br/>" + 
                         "tweet hashtags: " + d.tweetData.userData.hashtaglist); 
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

d3.select(self.frameElement).style("height", diameter + "px");
