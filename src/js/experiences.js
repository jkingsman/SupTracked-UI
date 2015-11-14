/* globals makeAuthRequest,Materialize */
/* jshint -W089 */

"use strict";

var currentBatch = 0;
var batchSize = 10;
var atEnd = false;

makeAuthRequest('/experience/search', 'POST', JSON.stringify({
  limit: 1
}), 'json', function(err, data, code) {
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

      // get it into date order
      data.sort(function(a, b) {
        return parseFloat(b.date) - parseFloat(a.date);
      });

      data.forEach(function(experience) {
        if (experience.title.length < 1) {
          experience.title = '[none]';
        }

        // compile thr consumptions, grouped by drug
        var groupedConsumptionList = {};

        experience.consumptions.forEach(function(consumption) {
          if (groupedConsumptionList.hasOwnProperty(consumption.drug.name)) {
            groupedConsumptionList[consumption.drug.name].count += consumption.count;
          } else {
            groupedConsumptionList[consumption.drug.name] = {};
            groupedConsumptionList[consumption.drug.name].count = consumption.count;
            groupedConsumptionList[consumption.drug.name].unit = consumption.drug.unit;
          }
        });

        // group the consumptions into strings by drug
        var stringifiedConsumptions = [];

        if (Object.keys(groupedConsumptionList).length > 0) {
          for (var drug in groupedConsumptionList) {
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

var autoLoader = function() {
  if ($(window).scrollTop() + $(window).height() > $(document).height() - 50) {
    loadMore();
  }
};

function prepareFilter() {
  var today = new Date();
  var dateString = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2) + ' ' + ('0' + today.getHours()).slice(-2) + ('0' + today.getMinutes()).slice(-2);
  $('#filterEndDate').val(dateString);
  $('#filterStartDate').val('1975-01-01 0000');
}

$('#filterForm').submit(function(event) {
  event.preventDefault();
  var filterCriteria = {};

  if ($('#filterTitle').val().length > 0) {
    filterCriteria.title = $('#filterTitle').val();
  }

  if ($('#filterNotes').val().length > 0) {
    filterCriteria.notes = $('#filterNotes').val();
  }

  // assemble start date
  var startDate = $('#filterStartDate').val().split(' ')[0];
  var startTime = $('#filterStartDate').val().split(' ')[1];
  var startDateStamp = Math.floor(new Date(startDate).getTime() / 1000);

  // add hours and minutes
  startDateStamp += Math.floor(startTime / 100) * 3600;
  startDateStamp += (startTime - (Math.floor(startTime / 100) * 100)) * 60;

  // assemble end date
  var endDate = $('#filterEndDate').val().split(' ')[0];
  var endTime = $('#filterEndDate').val().split(' ')[1];
  var endDateStamp = Math.floor(new Date(endDate).getTime() / 1000);

  // add hours and minutes
  endDateStamp += Math.floor(endTime / 100) * 3600;
  endDateStamp += (endTime - (Math.floor(endTime / 100) * 100)) * 60;

  filterCriteria.startdate = startDateStamp;
  filterCriteria.enddate = endDateStamp;

  makeAuthRequest('/experience/search', 'POST', JSON.stringify(filterCriteria), 'json',
    function(err, data, code) {
      $(".collection-item").remove(); // clear existing entries
      $(window).off("scroll", autoLoader); // stop listening for scroll; we're loading them all at once now
      data.sort(function(a, b) {
        return parseFloat(b.date) - parseFloat(a.date);
      });

      data.forEach(function(experience) {
        if (experience.title.length < 1) {
          experience.title = '[none]';
        }

        // compile thr consumptions, grouped by drug
        var groupedConsumptionList = {};

        experience.consumptions.forEach(function(consumption) {
          if (groupedConsumptionList.hasOwnProperty(consumption.drug.name)) {
            groupedConsumptionList[consumption.drug.name].count += consumption.count;
          } else {
            groupedConsumptionList[consumption.drug.name] = {};
            groupedConsumptionList[consumption.drug.name].count = consumption.count;
            groupedConsumptionList[consumption.drug.name].unit = consumption.drug.unit;
          }
        });

        // group the consumptions into strings by drug
        var stringifiedConsumptions = [];

        if (Object.keys(groupedConsumptionList).length > 0) {
          for (var drug in groupedConsumptionList) {
            stringifiedConsumptions.push(groupedConsumptionList[drug].count + ' ' + groupedConsumptionList[drug].unit + ' ' + drug);
          }
        } else {
          stringifiedConsumptions.push('no consumptions');
        }

        $('#experiences-collection').append('<li class="collection-item">' + new Date(experience.date * 1000).toISOString().slice(0, 10) + '<h5><a href="/experience.html?' + experience.id + '">' + experience.title + '</a></h5><div class="pad-left-40">' + stringifiedConsumptions.join('<br />') + '</div></li>');
      });
    });
});

loadMore();
prepareFilter();
$(window).scroll(autoLoader);
