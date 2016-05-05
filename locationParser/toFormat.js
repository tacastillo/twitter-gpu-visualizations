var oldJSON = require('./data/validLocations.json'),
	fs  = require('fs'),
	output = "./data/globeMapped.json"

var nestedArray = [];
var newJSON = [["data",nestedArray]];

// console.log(oldJSON);

for (var i = 0; i < oldJSON.length; i++) {
	var location = oldJSON[i];
	// console.log(location);
	nestedArray.push(location.lat);
	nestedArray.push(location.lng);
	nestedArray.push(1);
}

// console.log(newJSON);

fs.writeFile(output, JSON.stringify(newJSON), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + output);
    }
}); 
