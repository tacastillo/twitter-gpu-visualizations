if(!Detector.webgl){
    Detector.addGetWebGLMessage();
} else {
    var container = document.getElementById('container');
    var globe = new DAT.Globe(container);
    var currentLang = 'en';
    var currentRes = 1;

  var datasetRandomized = [];
  var currentDate = 0;

  /* - INITDATA - 
   * This method is used to manually load all of the JSON data on the client side and parse it into
   * a randomized series of arrays to simulate the data points being spread across different "dates".
   * Dynamically generates the DOM elements for browsing through each date.
   */
  var initData = function() {
    xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/globeMapped.json', true);
    xhr.onreadystatechange = function(e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                //Generate a random % of dates to split by(eg, if it's 7, then split globeMapped.json's data into 7 portions)
                var numOfDates = Math.floor((Math.random() * 10) + 1);
                for (i = 0; i < numOfDates; i++) {
                  var newArray = [];
                  datasetRandomized.push(newArray);
                }

                var data = JSON.parse(xhr.responseText);
                window.data = data;

                //Iterates through the top-level of the json array, starts with date-data heirarchy
                for (i=0;i<data.length;i++) {
                  var dataset = data[i][1];
                  //Iterate through dataset through sets of 3, since each point depends on a 3-set index
                  for (j = 0; j < dataset.length; j+=3) {
                    var randomIndex = Math.floor(Math.random() * numOfDates);
                    datasetRandomized[randomIndex].push(dataset[j]); //Latitude
                    datasetRandomized[randomIndex].push(dataset[j + 1]); //Longitude
                    datasetRandomized[randomIndex].push(dataset[j + 2]); //Magnitude
                  }
                }

                window.onload = function() {
                  var navTable = document.getElementById("navigationTable");
                  var tableRow = document.createElement("tr");
                  var dateRowHead = document.createElement("td");
                  var dateRowHeadCell = document.createElement("span");

                  dateRowHeadCell.onclick = function(){
                    loadDateData(0);
                  };
                  dateRowHeadCell.innerHTML = "Dates";

                  dateRowHead.appendChild(dateRowHeadCell);
                  tableRow.appendChild(dateRowHead);

                  var dateRowContents = document.createElement("td");
                  for (i = 0; i < numOfDates; i++) {
                    var dateBullet = createDateSpan(i);
                    dateRowContents.appendChild(dateBullet);
                  }
                  tableRow.appendChild(dateRowContents);
                  navTable.appendChild(tableRow);

                  //Load initial date as the first day
                  loadDateData(0);
                  //Animate the globe ONCE. 
                  globe.animate();
                };
            }
        }
    };
    xhr.send(null);
  }

  var loadDateData = function(date) {
    console.log(date);
    document.getElementById("date" + currentDate).style.color = '#555';
    currentDate = date;
    document.getElementById("date" + currentDate).style.color = '#fff';
    document.getElementById('load').innerHTML = 'Loading...';
    
    var data = datasetRandomized[date];
    window.data = data;
    globe.clearData();
    globe.addData(data);
    globe.createPoints();

    document.getElementById('load').innerHTML = ' ';

  };

  var createDateSpan = function(dateValue) {
    var spanTag = document.createElement("span");
    spanTag.id = "date" + dateValue;
    spanTag.className = "bull";
    spanTag.innerHTML = "&#x25cf;"
    spanTag.onclick = function(){
      loadDateData(dateValue);
    }
    return spanTag;
  }
    
  initData();
}