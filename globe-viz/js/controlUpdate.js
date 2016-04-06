var socket = io();
var slider = document.getElementById('slider');
var updateButton = document.getElementById('update');
var sliderValues = {start: new Date(2016, 1, 19).getTime(), finish: new Date(2016,2,7) };
var labels = [document.getElementById('min-label'), document.getElementById('max-label')];

noUiSlider.create(slider, {
	start: [ sliderValues["start"], sliderValues["finish"] ],
	connect: true,
	step: 24 * 60 * 60 * 1000,
    range: {
        min: timestamp(sliderValues["start"]),
        max: timestamp(sliderValues["finish"])
    },
});

slider.noUiSlider.on('update', function( values, handle ) {
	sliderValues["start"] = new Date(+values[0]).toISOString();
	sliderValues["finish"] = new Date(+values[1]).toISOString();
	labels[handle].innerHTML = new Date(+values[handle]);
});

updateButton.addEventListener("click", function() {
	console.log(sliderValues);
	var args = {newStart: sliderValues["start"], newFinish: sliderValues["finish"]};
	socket.emit('changeDate', args);
});

function timestamp(str){
    return new Date(str).getTime();   
}
