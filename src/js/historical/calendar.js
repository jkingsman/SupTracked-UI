/* globals makeAuthRequest,Materialize */

// these are predefined in the master historical.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, allExperiences, dateToFormat, parseUrlParam, allDrugs;

analyticsCount += 1;

function calendar() {
  "use strict";
  var currentDay = new Date(parseUrlParam('start'));
  var endDay = new Date(parseUrlParam('end'));

  currentDay.setDate(currentDay.getDate() + 1); // initial date jump
  endDay.setDate(endDay.getDate() + 1); // initial date jump

  // set it back to the most recent sunday
  if (currentDay.getDay() !== 0) {
    currentDay.setDate(currentDay.getDate() - currentDay.getDay());
  }

  var column = 1;
  var rowNumber = 0;
  while (currentDay <= endDay) {
    if (column === 7) {
      column = 0;
      rowNumber += 1;
    }

    if (column === 1) {
      $('#calendar').append('<div class="row" id="calendarRow' + rowNumber + '"</div>');
    }

    $('#calendarRow' + rowNumber).append('<div class="col s12 m2 col' + column + '" style="min-height: 100px; border: 1px solid rgb(0, 0, 0);"><strong>' + dateToFormat(currentDay) + '</strong><hr>' +
    '<ul style="margin-left: 15px; list-style-type: disc !important;" id="' + dateToFormat(currentDay) + '"></ul></div>');

    column += 1;
    currentDay.setDate(currentDay.getDate() + 1);
  }

  // figure out drugs per day
  var drugsPerDay = {};
  allConsumptions.forEach(function(consumption) {
    var conDate = dateToFormat(new Date(consumption.date * 1000));
    var drugID = conDate + '--' + consumption.drug.id;

    if (drugsPerDay.hasOwnProperty(drugID)) {
      drugsPerDay[drugID] = drugsPerDay[drugID] + consumption.count;
    } else {
      drugsPerDay[drugID] = Number(consumption.count);
    }
  });

  for (var k in drugsPerDay) {
    if (drugsPerDay.hasOwnProperty(k)) {
      var dateID = k.split('--');
      var drugCount = drugsPerDay[k];
      var drugData = allDrugs[dateID[1]];

      $('#' + dateID[0]).append('<li>' + drugCount + ' ' + drugData.unit + ' ' + drugData.name + "</li>");
    }
  }

  analyticsFinished += 1;
}
