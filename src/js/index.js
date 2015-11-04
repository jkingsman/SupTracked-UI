/* globals authLogin,authRegister,Materialize */
"use strict";

$(document).on("click", ":submit", function(event){
  event.preventDefault();
  var action = $(this).val();

  if(action === 'login'){
    authLogin($('#username').val(), $('#password').val(), $('#server').val());
  } else {
    // handle registration
    authRegister($('#username').val(), $('#password').val(), $('#server').val());
  }
});
