if(!Detector.webgl){
    Detector.addGetWebGLMessage();
} else {
    var container = document.getElementById('container');
    var globe = new DAT.Globe(container);
    var currentLang = 'en';
    var currentRes = 1;

  var datasetRandomized = [];
  var currentDate;
  var nextDate;
  var fixedNumOfDates = 10;

  /* initData
   * - This method is used to manually load all of the JSON data on the client side and parse it into
   *   a randomized series of arrays to simulate the data points being spread across different "dates".
   *   Dynamically generates the DOM elements for browsing through each date.
   */
  var initData = function(data) {
      //Generate a random % of dates to split by(eg, if it's 7, then split globeMapped.json's data into 7 portions)
      //COMMENT THE BELOW LINE OUT(and the other one in) to change it to randomized.
      //var numOfDates = Math.floor((Math.random() * 10) + 1);
      //Fixed number of dates to split by
      var numOfDates = fixedNumOfDates;
      console.log("DATA", data);

      for (i = 0; i < numOfDates; i++) {
        var newArray = [];
        datasetRandomized.push(newArray);
      }

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
          manualSetDate(0);
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
        currentDate = 0;
        nextDate = 1;
        loadDateData(currentDate);
        //Set the interval to run every 5 seconds
        window.setInterval(autoAdvanceDate, 1000);
        //Animate the globe ONCE. 
        globe.animate();
      };
  }

  /**
   * manualSetDate
   * - Method for manually setting the date from an HTML element. The date
   *   argument will always be correct.
   */
  var manualSetDate = function(date) {
    loadDateData(date);
    nextDate = date + 1;
  }

  /**
   * loadDateData
   * - Generic method for unloading the current data from the globe & replacing
   *   it with a new one. Note that the date argument here implies an INDEX in 
   *   the global "datasetRandomized" array. 
   */
  var loadDateData = function(date) {
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

  /**
   * createDateSpan
   * - Dynamically generates the span element which represents the possible 
   *   dates for a user to select on the main page(the little bullets). The
   *   dateValue argument is generated from the index of the dataset in init().
   */
  var createDateSpan = function(dateValue) {
    var spanTag = document.createElement("span");
    spanTag.id = "date" + dateValue;
    spanTag.className = "bull";
    spanTag.innerHTML = "&#x25cf;"
    spanTag.onclick = function(){
      manualSetDate(dateValue);
    }
    return spanTag;
  }

  /**
   * autoAdvanceDate
   * - Function that runs on the specified interval in init(), does an
   *   automatic data load so the "timeline" can advance itself.
   */
  var autoAdvanceDate = function() {
    loadDateData(nextDate);
    currentDate = nextDate;
    nextDate++;
    if(nextDate >= datasetRandomized.length) {
        nextDate = 0;
    }
  }
}