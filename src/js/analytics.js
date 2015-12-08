/* globals makeAuthRequest,Materialize */

"use strict";

var drug = {
  name: '(none)',
  id: 0
};
var analyticsCount = 0;
var analyticsFinished = 0;

// just get jshint off our back. these are defined in their respective files
var vitals, experienceList;

function startAnalytics() {
  vitals();
}

// populate the drug dropdown
makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, data, code) {
  data.sort(function(a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    return (a < b) ? -1 : (a > b) ? 1 : 0;
  });

  if (data.length < 1) {
    $('#drug').append('<option value="" disabled selected>None</option>');
    return;
  }

  data.forEach(function(drug) {
    $('#drug').append('<option value="' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
  });

  $('#loadingOpt').remove();
});

// catch form submission
$('#drugSelect').submit(function(event) {
  event.preventDefault();
  drug.id = $('#drug').val();
  drug.name = $("#drug option:selected").html();

  $('.drugName').text(drug.name);
  $('#selection').hide();
  $('#loading').show();
  startAnalytics();
});

// set up the completion listener
var updateInterval = setInterval(function updateCompletion() {
  // update the percentages
  $('#analyticsComplete').text(Math.round(analyticsFinished / analyticsCount * 100));
  $('#analyticsProgress').css('width', Math.round(analyticsFinished / analyticsCount * 100) + '%');

  if (analyticsFinished === analyticsCount) {
    // we're done here;  display it after an aesthetic delay for the progress bar to hit 100%
    clearInterval(updateInterval);
    setTimeout(function() {
      $('#loading').hide();
      $('#analytics').show();
    }, 500);
  }
}, 100);
