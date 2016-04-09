/* globals makeAuthRequest,Materialize */

// these are predefined in the master analytics.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, drug;

analyticsCount += 3;

function hourly() {
  "use strict";
  var hours = [];
  for (var i = 0; i <= 23; i += 1) {
    hours[i] = 0;
  }

  var dateOffset = new Date().getTimezoneOffset() * 60000;
  allConsumptions.forEach(function(consumption) {
    var conDate = new Date((consumption.date * 1000) + dateOffset);
    var hoursVal = conDate.getHours();
    hours[hoursVal] += 1;
  });

  $('#hourly').highcharts({
    chart: {
      type: 'column'
    },
    title: {
      text: 'Consumptions by hour'
    },
    xAxis: {
      categories: [
        '0000 - 0100',
        '0100 - 0200',
        '0200 - 0300',
        '0300 - 0400',
        '0400 - 0500',
        '0500 - 0600',
        '0600 - 0700',
        '0700 - 0800',
        '0800 - 0900',
        '0900 - 1000',
        '1000 - 1100',
        '1100 - 1200',
        '1200 - 1300',
        '1300 - 1400',
        '1400 - 1500',
        '1500 - 1600',
        '1600 - 1700',
        '1700 - 1800',
        '1800 - 1900',
        '1900 - 2000',
        '2000 - 2100',
        '2100 - 2200',
        '2200 - 2300',
        '2300 - 0000'
      ],
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Consumptions'
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}: </span>',
      pointFormat: '<b>{point.y} consumptions</b>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: [{
      name: drug.name,
      data: hours
    }]
  });

  setTimeout(function() {
    $('#hourly').highcharts().reflow();
  }, 2000);

  analyticsFinished += 1;
}

function daily() {
  "use strict";
  var days = [];
  for (var i = 0; i <= 6; i += 1) {
    days[i] = 0;
  }

  var dateOffset = new Date().getTimezoneOffset() * 60000;
  allConsumptions.forEach(function(consumption) {
    var conDate = new Date((consumption.date * 1000) + dateOffset);
    var dayNumber = conDate.getDay();
    days[dayNumber] += 1;
  });

  $('#daily').highcharts({
    chart: {
      type: 'column'
    },
    title: {
      text: 'Consumptions by Day'
    },
    xAxis: {
      categories: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Consumptions'
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}: </span>',
      pointFormat: '<b>{point.y} consumptions</b>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: [{
      name: drug.name,
      data: days
    }]
  });

  setTimeout(function() {
    $('#daily').highcharts().reflow();
  }, 2000);

  analyticsFinished += 1;
}

function computeRegressionPts(data){
  "use strict";
  // from http://www.mathportal.org/calculators/statistics-calculator/correlation-and-regression-calculator.php

  var sumX = 0;
  var sumY = 0;
  var sumXY = 0;
  var sumXX = 0;
  var n = data.length;

  data.forEach(function(y, x){
    sumX += x;
    sumY += y;
    sumXY += y*x;
    sumXX += x*x;
  });

  var a = ((sumY * sumXX) - (sumX * sumXY)) / ((n * sumXX) - (sumX * sumX));
  var b = ((n * sumXY) - (sumX * sumY)) / ((n * sumXX) - (sumX * sumX));

  return [[0, a], [n - 1, ((n - 1) * b) + a]];
}

function weekly() {
  "use strict";
  var weeks = [];
  var weekRanges = [];

  var weekStart = new Date();
  if (weekStart.getDay() !== 0) {
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  }

  for (var i = 0; i <= 25; i += 1) {
    weeks[i] = 0;
    weekRanges.push('Week of ' + (weekStart.getMonth() + 1) + '/' + weekStart.getDate());
    weekStart.setDate(weekStart.getDate() - 7);
  }

  var today = new Date();
  if (today.getDay() !== 0) {
    today.setDate(today.getDate() - today.getDay());
  }
  var dateOffset = today.getTimezoneOffset() * 60000;
  allConsumptions.forEach(function(consumption) {
    var conDate = new Date((consumption.date * 1000) + dateOffset);
    var diff = (today - conDate) / (1000 * 60 * 60 * 24);
    var weekDiff = Math.floor(diff / 7) + 1;
    if (weekDiff <= 25) {
      weeks[weekDiff] += consumption.count;
    }
  });

  weeks.reverse();
  weekRanges.reverse();

  var regPts = computeRegressionPts(weeks);

  $('#weekly').highcharts({
    chart: {
      type: 'column'
    },
    title: {
      text: drug.unit + ' per Week'
    },
    xAxis: {
      categories: weekRanges,
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: drug.unit + ' of ' + drug.name
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}: </span>',
      pointFormat: '<b>{point.y} ' + drug.unit + '</b>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: [{
      name: drug.name,
      data: weeks
    }, {
      type: 'line',
      name: 'Trend',
      data: regPts,
      marker: {
        enabled: false
      },
      states: {
        hover: {
          lineWidth: 0
        }
      },
      enableMouseTracking: false
    }]
  });

  setTimeout(function() {
    $('#weekly').highcharts().reflow();
  }, 2000);

  analyticsFinished += 1;
}

function hours_days() {
  "use strict";
  hourly();
  daily();
  weekly();
}
