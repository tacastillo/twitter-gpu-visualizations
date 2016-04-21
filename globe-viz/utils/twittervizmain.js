
// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 30, left: 50},
    width = (window.innerWidth/6)*5 - margin.left - margin.right,
    height = (window.innerHeight/6)*5 - margin.top - margin.bottom;

// Parse the date / time
var parseDate = d3.time.format("%Y-%m-%d").parse;
var formatTime = d3.time.format("%B %e, %Y");

// Set the ranges
var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

// DEFAULT AXIS - OVERRIDE IN DATA INITIALIZATION
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

// Define the line
var valueline = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close); });

// Define the div for the tooltip
var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

// Adds the svg canvas
var svg = d3.select("body")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

var countTweetsByDate = function(data) {
    var countedDates = {};
    for (i = 0; i < data.length; i++) {
        var obj = data[i];
        if(countedDates[obj.date_simple] == null) {
            countedDates[obj.date_simple] = 1;
        }
        else {
            countedDates[obj.date_simple]++;
        }
    }
    
    var dateWrappers = [];
    for (var key in countedDates) {
        if (countedDates.hasOwnProperty(key)) {
            dateWrappers.push({
                "date": parseDate(key),
                "close": countedDates[key]
            })   
        }
    }

    return dateWrappers;
}

var updateData = function(data) {
    console.log("Updating data");
    var formatData = countTweetsByDate(data);
    // Scale the range of the data
    x.domain(d3.extent(formatData, function(d) { return d.date; }));
    y.domain([0, d3.max(formatData, function(d) { return d.close; })]);

    console.log("Updated domains");
    var t = svg.transition().duration(750);
    t.select(".x.axis").call(xAxis);
    console.log("Updating axis");
    t.select(".line").attr("d", valueline(formatData));
    console.log("Updating lines");

    svg.selectAll("circle").remove();

    svg.selectAll("dot")
        .data(formatData)
        .enter().append("circle")                               
        .attr("r", 7)       
        .attr("cx", function(d) { return x(d.date); })       
        .attr("cy", function(d) { return y(d.close); })     
        .on("mouseover", function(d) {      
            div.transition()        
                .duration(200)      
                .style("opacity", .9);      
            div .html(formatTime(d.date) + "<br/>"  + d.close + " tweets")  
                .style("left", (d3.event.pageX) + "px")     
                .style("top", (d3.event.pageY - 28) + "px");    
            })                  
        .on("mouseout", function(d) {       
            div.transition()        
                .duration(500)      
                .style("opacity", 0);   
        });
}
var initDataForViz = function(data) {
    var formatData = countTweetsByDate(data);

    // Scale the range of the data
    x.domain(d3.extent(formatData, function(d) { return d.date; }));
    y.domain([0, d3.max(formatData, function(d) { return d.close; })]);

    // Add the valueline path.
    svg.append("path")
        .attr("class", "line")
        .attr("d", valueline(formatData));

    // Add the scatterplot
    svg.selectAll("dot")    
        .data(formatData)         
    .enter().append("circle")                               
        .attr("r", 7)       
        .attr("cx", function(d) { return x(d.date); })       
        .attr("cy", function(d) { return y(d.close); })     
        .on("mouseover", function(d) {      
            div.transition()        
                .duration(200)      
                .style("opacity", .9);      
            div .html(formatTime(d.date) + "<br/>"  + d.close + " tweets")  
                .style("left", (d3.event.pageX) + "px")     
                .style("top", (d3.event.pageY - 28) + "px");    
            })                  
        .on("mouseout", function(d) {       
            div.transition()        
                .duration(500)      
                .style("opacity", 0);   
        });

    xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(formatData.length);

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
}