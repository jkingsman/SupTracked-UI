/* globals makeAuthRequest,Materialize */

// these are predefined in the master historical.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, allExperiences;

analyticsCount += 1;

function basics() {
  "use strict";

  $('#totals').html(allConsumptions.length + ' consumptions in ' + allExperiences.length + ' experiences');

  var counts = allExperiences.map(function(exp) {
    return {
      id: exp.id,
      title: exp.title,
      count: exp.consumptions.length
    };
  }).sort(function(a, b) {
    return a.count < b.count;
  });

  $('#mostCon').html(counts[0].count + ' in <a href="/experience.html?' + counts[0].id + '">' + counts[0].title + '</a>');

  analyticsFinished += 1;
}
