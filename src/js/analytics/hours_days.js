/* globals makeAuthRequest,Materialize */

// these are predefined in the master analytics.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, drug;

analyticsCount += 2;

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

function hours_days() {
  "use strict";
  hourly();
  daily();
}
