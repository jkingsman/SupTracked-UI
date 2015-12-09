/* globals makeAuthRequest,Materialize */

// these are predefined in the master analytics.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, drug, allExperiences;

analyticsCount += 1;

function experience_list() {
  "use strict";

  allExperiences.forEach(function(experience) {
    var consumptions = experience.consumptions.map(function(consumption) {
      if (consumption.drug.id === drug.id) {
        return consumption.count + ' ' + consumption.drug.unit + ' ' + consumption.method.name;
      }
    });

    // purge empty entries (thanks, map()...)
    consumptions = consumptions.filter(function(n) {
      return n !== undefined;
    });

    $('#experienceContainer').append('<li class="collection-item">' + new Date(experience.date * 1000).toISOString().slice(0, 11).replace(/T/, ' ').replace(':', '') + ' -- <a href="/experience.html?' + experience.id + '">' + experience.title + '</a><br>' + consumptions.join('<br>') + '</li>');
  });

  analyticsFinished += 1;
}
