/* globals makeAuthRequest,Materialize */
"use strict";

makeAuthRequest('/experience/search', 'POST', null, 'json', function(err, data, code){
  if(code === 404){
    // no Experiences
    $('#loading').hide();
    $('#emptyExperiences').show();
  }
});
