var slider = document.getElementById('slider');
var updateButton = document.getElementById('update');
var sliderValues = {start: new Date(2016, 1, 19).getTime(),
	finish: Date.now() };

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
});

updateButton.addEventListener("click", function() {
	console.log(sliderValues);
});

function timestamp(str){
    return new Date(str).getTime();   
}