/* globals makeAuthRequest,Materialize */
"use strict";

var experienceID = location.search.slice(1);
var noteSaveNotificationTimeout;

// fill in drug/method selectors, etc.
function setUpAddConsumptions(){
  // init new consumption date picker
  var $input = $('.datepicker').pickadate();
  var picker = $input.pickadate('picker');
  picker.set('select', new Date());

  var date = new Date();
  $('#addTime').val(('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2));
  $('#addtimeLabel').addClass('active');

  makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, data, code){
    if(data.length < 1){
      $('#addDrug').append('<option value="" disabled selected>None</option>');
      return;
    }

    data.forEach(function(drug){
      $('#addDrug').append('<option value="' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
    });
  });

  makeAuthRequest('/method/all', 'GET', null, 'json', function(err, data, code){
    if(data.length < 1){
      $('#addMethod').append('<option value="" disabled selected>None</option>');
      return;
    }

    data.forEach(function(method){
      $('#addMethod').append('<option value="' + method.id + '">' + method.name + '</option>');
    });
  });
}

// create Add Experience submit listener
$('#addConsumption').submit(function( event ) {
  event.preventDefault();
  var datetime = Math.floor(Date.parse($('#addDate').val()) / 1000);

  // add the time box
  var hours = Math.floor($('#addTime').val() / 100);
  var minutes = $('#addTime').val() % 100;
  var timeSeconds = (hours * 3600) + (minutes * 60);
  var timeStamp = (datetime + timeSeconds);

  var payload = {date: timeStamp, count: $('#addCount').val(), experience_id: experienceID, drug_id: $('#addDrug').val(), method_id: $('#addMethod').val(), location: $('#addLocation').val()};

  makeAuthRequest('/consumption', 'POST', JSON.stringify(payload), 'json', function(err, data, code){
    if(err){
      Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
      return;
    }

    console.log('drawing in the consumption')
    Materialize.toast('Consumption created', 6000, 'success-toast');
  });
});

$(document).ready(function(){
  makeAuthRequest('/experience/' + experienceID, 'GET', null, 'json', function(err, data, code){
    if(code === 404){
      // no Experiences
      $('#loading').hide();
      $('#noExperience').show();
      return;
    }

    // load title and date
    $('#title').text(data.title);

    var date = new Date(data.date * 1000);
    $('#date').text(date.toISOString().slice(0, 16).replace(/T/, ' '));

    // load Consumptions
    if(data.consumptions.length < 1){
      $('#noConsumptions').show();
    } else {
      $('#noConsumptions').hide();

      data.consumptions.forEach(function(consumption){
        console.log(consumption)
        $('#consumptionsCollection').append('<li class="collection-item">' + consumption.count + ' ' + consumption.drug.unit + ' ' + consumption.drug.name + ', ' + consumption.method.name + '<a href="#" class="secondary-content"><i class="material-icons">send</i></a></div></li>');
      });
    }

    setUpAddConsumptions();

    // load notes
    $('#notesArea').text(data.notes);
    $('#notesArea').trigger('autoresize');

    // lift the curtain
    $('#loading').hide();
    $('#main').show();
    $('ul.tabs').tabs('select_tab', 'consumptions');
  });
});

// listen to save text area
$("#notesArea").on('change keyup paste', function() {
  clearTimeout(noteSaveNotificationTimeout);
  noteSaveNotificationTimeout = setTimeout(function() {
    Materialize.toast('Notes saved.', 1000);
    makeAuthRequest('/experience', 'PUT', JSON.stringify({id: experienceID, notes: $("#notesArea").val()}), 'json', function(err, data, code){
      console.log(err, data);
    });
  }, 1000);
});
