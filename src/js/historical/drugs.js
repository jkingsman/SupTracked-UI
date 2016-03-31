/* globals makeAuthRequest,Materialize */

// these are predefined in the master historical.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, allExperiences;

analyticsCount += 1;

function drugs() {
  "use strict";
  var groupedConsumptionList = [];
  var friendCounts = [];
  allConsumptions.forEach(function(consumption) {
    // get drug counts
    if (groupedConsumptionList.hasOwnProperty(consumption.drug.name)) {
      groupedConsumptionList[consumption.drug.name].count += consumption.count;
      groupedConsumptionList[consumption.drug.name].number += 1;
    } else {
      groupedConsumptionList[consumption.drug.name] = {};
      groupedConsumptionList[consumption.drug.name].count = consumption.count;
      groupedConsumptionList[consumption.drug.name].number = 1;
      groupedConsumptionList[consumption.drug.name].unit = consumption.drug.unit;
    }
  });

  // format and show cons
  var consumptionArray = [];
  for (var ck in groupedConsumptionList) {
    if (groupedConsumptionList.hasOwnProperty(ck)) {
      consumptionArray.push({
        count: groupedConsumptionList[ck].count,
        unit: groupedConsumptionList[ck].unit,
        number: groupedConsumptionList[ck].number,
        name: ck
      });
    }
  }

  var consumptionStrings = consumptionArray.sort(function(a, b) {
    return b.number - a.number;
  }).map(function(con) {
    return con.count + ' ' + con.unit + ' (' + con.number + ' consumptions) of ' + con.name;
  });

  var consumptionString = '<ul class="pad-left-40"><li>' + consumptionStrings.join('</li><li>') + '</li></ul>';
  $('#totalCons').html(consumptionString);

  analyticsFinished += 1;
}
