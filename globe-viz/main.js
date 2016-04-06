if(!Detector.webgl){
    Detector.addGetWebGLMessage();
} else {
    var container = document.getElementById('globeContainer');
    var globe = new DAT.Globe(container);
    var currentLang = 'en';
    var currentRes = 1;

  var dataset = [];
  var currentDate;
  var nextDate;
  var numOfDates;

  var startTimer = true;
  var interval;

  /* initGlobeForRender
   * - Simple hack method to initialize webGL's renderers on startup. This
   *   ensures that we have a globe mesh object to show and an initial data
   *   set to update later. Uses a lot of magic specific numbers.
   */
  var initGlobeForRender = function() {
    data = ["data", [38.2898512, -78.7136328, 1]];
    //window.data = data;
    dataset.push([]);
    var temp = data[1];
    for(i = 0; i < temp.length; i++) {
        dataset[0].push(temp[i]);
    }

    window.data = dataset[0];
    globe.clearData();
    globe.addData(data);
    globe.createPoints();

    globe.animate();
  }

  var processDataForGlobe = function(data) {
    var countedDates = {};

    for(i = 0; i < data.length; i++) {
      var tweetObj = data[i];
      if(countedDates[tweetObj.date_simple] == null) {
        countedDates[tweetObj.date_simple] = [tweetObj];
      }
      else {
        countedDates[tweetObj.date_simple].push(tweetObj);
      }
    }

    var formattedDates = [];
    for (var key in countedDates) {
      if (countedDates.hasOwnProperty(key)) {
        var coordinates = [];
        var tweets = countedDates[key];
        for(i = 0; i < tweets.length; i++) {
          var singleTweet = tweets[i];
          coordinates.push(singleTweet.latitude);
          coordinates.push(singleTweet.longitude);
          coordinates.push(1);
        }
        formattedDates.push({
          "date": key,
          "data": coordinates
        })
      }
    }

    return formattedDates;
  }

  var changeDataSet = function(data) {
    if(startTimer) {
      toggleAutomaticTimer();
    }

    var filteredData = processDataForGlobe(data);
    generateBullets(filteredData);
  }

  var generateBullets = function(data) {

    var dataRow = document.getElementById('dateRowContents');
    while(dataRow.hasChildNodes()) {
      dataRow.removeChild(dataRow.firstChild);
    }

    currentDate = 0;
    nextDate = 1;

    if(data.length > 0  ) {
      for (i = 0; i < data.length; i++) {
        var dateBullet = createDateSpan(data[i].date, i);
        dateRowContents.appendChild(dateBullet);
      }
      loadDateData(currentDate);
    }
  }
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
      dataset = processDataForGlobe(data);
      window.data = data;


      var navTable = document.getElementById("navigationTable");
      var tableRow = document.createElement("tr");
      tableRow.setAttribute('id', "datesRow");
      var dateRowHead = document.createElement("td");
      dateRowHead.setAttribute('id', "dateRowHead");
      var dateRowHeadCell = document.createElement("span");
      dateRowHeadCell.setAttribute('id', "dateRowHeadCell");

      dateRowHeadCell.onclick = function(){
        manualSetDate(0);
      };
      dateRowHeadCell.innerHTML = "Dates";

      dateRowHead.appendChild(dateRowHeadCell);
      tableRow.appendChild(dateRowHead);

      var dateRowContents = document.createElement("td");
      dateRowContents.setAttribute('id', "dateRowContents");

      numOfDates = dataset.length;
      for (i = 0; i < dataset.length; i++) {
        var dateBullet = createDateSpan(dataset[i].date, i);
        dateBullet.setAttribute('name', 'dateBullets');
        dateRowContents.appendChild(dateBullet);
      }
      tableRow.appendChild(dateRowContents);
      navTable.appendChild(tableRow);

      //!!!!!! DYNAMIC GENERATION OF DOM ELEMENTS !!!!!!!
      //NOTE: This original ENTIRE block(down to setInterval) depended on 
      //window.onload(). THIS MAY NOT WORK IN THE FUTURE, but for now 
      //it is OK

      //Load initial date as the first day
      currentDate = 0;
      nextDate = 1;
      loadDateData(currentDate);
      //Set the interval to run every 5 seconds
      if (startTimer) {
        interval = window.setInterval(autoAdvanceDate, 1000);
      }
  }

  var toggleAutomaticTimer = function() {
    if (startTimer) {
      window.clearInterval(interval);
      startTimer = false;
    }
    else {
      interval = window.setInterval(autoAdvanceDate, 1000);
      startTimer = true;
    }
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
    
    var data = dataset[date].data;
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
  var createDateSpan = function(dateValue, index) {
    var spanTag = document.createElement("span");
    spanTag.id = "date" + index;
    spanTag.className = "bull";
    spanTag.innerHTML = "&#x25cf;"
    spanTag.onclick = function(){
      manualSetDate(index);
    }
    spanTag.title = dateValue;
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
    if(nextDate >= dataset.length) {
        nextDate = 0;
    }
  }

  initGlobeForRender();
}