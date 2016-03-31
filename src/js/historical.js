/* globals makeAuthRequest,Materialize,micromarkdown,cleanMarkdown */

"use strict";

var drug, allDrugs, allConsumptions = [], allExperiences;
var analyticsCount = 0;
var analyticsFinished = 0;

// just get jshint off our back. these are defined in their respective files
var friends, drugs, basics, experience_list, hourly_daily_breakdown;

function startHistorical() {
  friends();
  drugs();
  basics();
  experience_list();
  hourly_daily_breakdown();
}

function dateToFormat(dateObj) {
  return dateObj.getFullYear() + '-' + ('0' + (dateObj.getMonth() + 1)).slice(-2) + '-' + ('0' + dateObj.getDate()).slice(-2);
}

function parseUrlParam(param) {
  return location.search.split(param + '=')[1].split('&')[0];
}

if (location.search.length === 0) {
  // need a default date
  var today = new Date();
  var weekAgo = new Date(new Date().setDate(new Date().getDate() - 7));
  window.location = '/historical.html?start=' + dateToFormat(weekAgo) + '&end=' + dateToFormat(today);
} else {
  var start = new Date(parseUrlParam('start')).getTime() / 1000;
  var end = new Date(parseUrlParam('end')).getTime() / 1000;

  $('.start').html(parseUrlParam('start'));
  $('.end').html(parseUrlParam('end'));

  makeAuthRequest('/experience/search', 'POST', JSON.stringify({
    startdate: start,
    enddate: end
  }), 'json', function(err, data, code) {
    if (err) {
      $('#noCon').show();
      $('#cons').hide();
      $('#loading').hide();
      return;
    }

    allExperiences = data;

    data.forEach(function(experience) {
      experience.consumptions.forEach(function(consumption) {
        consumption.expTitle = experience.title;
        allConsumptions.push(consumption);
      });
    });

    startHistorical();
  });
}

// set up the completion listener
var updateInterval = setInterval(function updateCompletion() {
  // update the percentages
  $('#historicalComplete').text(Math.round(analyticsFinished / analyticsCount * 100));
  $('#historicalProgress').css('width', Math.round(analyticsFinished / analyticsCount * 100) + '%');

  if (analyticsFinished === analyticsCount) {
    // we're done here;  display it after an aesthetic delay for the progress bar to hit 100%
    clearInterval(updateInterval);
    setTimeout(function() {
      $('#loading').hide();
      $('#cons').show();
    }, 500);
  }
}, 100);
