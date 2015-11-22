/* globals authLogin,authRegister,Materialize */
"use strict";

// see if we're logging someone out
if(location.search.indexOf('logout') > -1){
  var cookies = document.cookie.split(";");

  for (var i = 0; i < cookies.length; i += 1) {
  	var cookie = cookies[i];
  	var eqPos = cookie.indexOf("=");
  	var cookieName = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
  	document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }

  Materialize.toast("You have been logged out!", 1000);
}

$('#server').val(location.protocol + '//' + location.host.split(':')[0] + ':3000');

$(document).on("click", ":submit", function(event){
  event.preventDefault();
  document.activeElement.blur();
  
  var action = $(this).val();

  if(action === 'login'){
    authLogin($('#username').val(), $('#password').val(), $('#server').val());
  } else {
    // handle registration
    authRegister($('#username').val(), $('#password').val(), $('#server').val());
  }
});
