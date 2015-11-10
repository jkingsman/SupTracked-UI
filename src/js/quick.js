/* globals makeAuthRequest,Materialize,getCookie,makeAuthBlobRequest,server */
/* jshint -W089 */

"use strict";

var experience;

// load experiences
makeAuthRequest('/experience/search', 'POST', JSON.stringify({
  limit: 1
}), 'json', function(err, data, code) {
  if (code === 404) {
    // no experiences
    window.location = '/experiences.html';
    return;
  }

  experience = data[0];

  makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, drugs, code) {
    drugs.sort(function(a, b){
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();

      return (a < b) ? -1 : (a > b) ? 1 : 0;
    });

    if (drugs.length < 1) {
      $('#addDrug').append('<option value="" disabled selected>None</option>');
      return;
    }

    drugs.forEach(function(drug) {
      $('#addDrug').append('<option value="' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
    });
  });

  makeAuthRequest('/method/all', 'GET', null, 'json', function(err, methods, code) {
    methods.sort(function(a, b){
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();

      return (a < b) ? -1 : (a > b) ? 1 : 0;
    });

    if (methods.length < 1) {
      $('#addMethod').append('<option value="" disabled selected>None</option>');
      return;
    }

    methods.forEach(function(method) {
      $('#addMethod').append('<option value="' + method.id + '">' + method.name + '</option>');
    });
  });

  $('#title').html(experience.title);
});

// add quicknote submit listener
$('#addQuicknote').submit(function(event) {
  event.preventDefault();
  console.log('adding quicknote');
  $('#note').val('');
});

// add consumption submit listener
$('#addConsumption').submit(function(event) {
  event.preventDefault();
  console.log('adding consumption');
});

// upload media
$('#media').change(function() {
  console.log('uploading media');
  $('#media').val('');
});

// init tabs
$(document).ready(function() {
  $('ul.tabs').tabs();
});
