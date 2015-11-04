/* globals makeAuthRequest,Materialize */
"use strict";

// initialize date picker & time
var $input = $('.datepicker').pickadate();
var picker = $input.pickadate('picker');
picker.set('select', new Date());

var date = new Date();
$('time').val(date.getHours() + date.getMinutes());

// makeAuthRequest('/experience/search', 'GET', null, 'json', function(err, data, code){
//   if(code === 404){
//     // no Experiences
//     $('#loading').hide();
//     $('#emptyExperiences').show();
//   }
// });
