/* globals makeAuthRequest,Materialize */

// these are predefined in the master historical.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, allExperiences, dateToFormat, parseUrlParam;

analyticsCount += 1;

function calendar() {
  "use strict";
  var currentDay = new Date(parseUrlParam('start'));
  var endDay = new Date(parseUrlParam('end'));

  currentDay.setDate(currentDay.getDate() + 1); // initial date jump
  endDay.setDate(endDay.getDate() + 1); // initial date jump

  // set it back and forward to the most recent sunday
  if(currentDay.getDay() !== 0){
    currentDay.setDate(currentDay.getDate() - currentDay.getDay());
  }

  if(endDay.getDay() !== 0){
    endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));
  }

  while(currentDay <= endDay){
    console.log(dateToFormat(currentDay));

    currentDay.setDate(currentDay.getDate() + 1);
  }

  analyticsFinished += 1;
}
