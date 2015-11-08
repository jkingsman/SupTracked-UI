/* globals makeAuthRequest,Materialize */
/* jshint -W089 */

"use strict";

var currentBatch = 0;
var batchSize = 30;
var atEnd = false;

makeAuthRequest('/experience/search', 'POST', null, 'json', function(err, data, code) {
  if (code === 404) {
    // no Experiences
    $('#loading').hide();
    $('#emptyExperiences').show();
  }
});

function loadMore() {
  if (!atEnd) {
    makeAuthRequest('/experience/search', 'POST', JSON.stringify({
      limit: batchSize,
      offset: currentBatch * batchSize
    }), 'json', function(err, data, code) {
      // we've got an incomplete page and at the end
      if (code !== 404) {
        // we're not at the end yet; bump it up
        currentBatch += 1;
      } else {
        atEnd = true;
      }

      data.forEach(function(experience) {
        if (experience.title.length < 1) {
          experience.title = '[none]';
        }

        // compile thr consumptions, grouped by drug
        var groupedConsumptionList = {};

        experience.consumptions.forEach(function(consumption){
          if(groupedConsumptionList.hasOwnProperty(consumption.drug.name)){
            groupedConsumptionList[consumption.drug.name].count += consumption.count;
          } else {
            groupedConsumptionList[consumption.drug.name] = {};
            groupedConsumptionList[consumption.drug.name].count = consumption.count;
            groupedConsumptionList[consumption.drug.name].unit = consumption.drug.unit;
          }
        });

        // group the consumptions into strings by drug
        var stringifiedConsumptions = [];

        if(Object.keys(groupedConsumptionList).length > 0){
          for(var drug in groupedConsumptionList){
            stringifiedConsumptions.push(groupedConsumptionList[drug].count + ' ' + groupedConsumptionList[drug].unit + ' ' + drug);
          }
        } else {
          stringifiedConsumptions.push('no consumptions');
        }

        $('#experiences-collection').append('<li class="collection-item">' + new Date(experience.date * 1000).toISOString().slice(0, 10) + '<h5><a href="/experience.html?' + experience.id + '">' + experience.title + '</a></h5><div class="pad-left-40">' + stringifiedConsumptions.join('<br />') + '</div></li>');
      });

      $('#loading').hide();
      $('#experiences').show();
    });
  }
}

loadMore();

$(window).scroll(function() {
  if ($(window).scrollTop() + $(window).height() > $(document).height() - 50) {
    loadMore();
  }
});
