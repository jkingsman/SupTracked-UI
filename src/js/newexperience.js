/* globals makeAuthRequest,Materialize */
"use strict";

// initialize date picker & time
var $input = $('.datepicker').pickadate();
var picker = $input.pickadate('picker');
picker.set('select', new Date());

var date = new Date();
$('#time').val(('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2));


$(document).on("click", ":submit", function(event){
  event.preventDefault();

  // load up the date and time
  var datetime = Math.floor(Date.parse($('#date').val()) / 1000);

  // add the time box
  var hours = Math.floor($('#time').val() / 100);
  var minutes = $('#time').val() % 100;
  var timeSeconds = (hours * 3600) + (minutes * 60);
  var timeStamp = (datetime + timeSeconds);

  makeAuthRequest('/experience', 'POST', JSON.stringify({title: $('#title').val(), date: timeStamp}), 'json', function(err, data, code){
    if(err){
      Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
    } else{
      Materialize.toast('Experience created', 6000, 'success-toast');
    }
  });
});
