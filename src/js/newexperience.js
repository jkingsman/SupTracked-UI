/* globals makeAuthRequest,Materialize */
"use strict";

// initialize date picker & time
var $input = $('.datepicker').pickadate();
var picker = $input.pickadate('picker');
picker.set('select', new Date());

var date = new Date();


$(document).on("click", ":submit", function(event) {
  event.preventDefault();
  document.activeElement.blur();

  // load up the date and time
  var datetime = Math.floor(Date.parse($('#date').val() + ' 00:00:00 GMT') / 1000);

  makeAuthRequest('/experience', 'POST', JSON.stringify({
    title: $('#title').val(),
    date: datetime
  }), 'json', function(err, data, code) {
    if (err) {
      Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
      return;
    }

    window.location = "experience.html?" + data.id;
    Materialize.toast('Experience created', 6000, 'success-toast');
  });
});
