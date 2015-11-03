/* globals Materialize */

// log the user into the given server with the provided credentials
function authLogin(username, password, server){
  "use strict";

  // get the cookie
  //  return err or success
  Materialize.toast('Making connection', 2000);
  setTimeout(function(){ Materialize.toast('Logging in', 2000); }, 1000);
}

// register the user with given server with the provided credentials
function authRegister(username, password, server){
  "use strict";

  // get the cookie
  //  return err or success
  Materialize.toast('Making connection', 2000);
  setTimeout(function(){ Materialize.toast('Registering', 2000); }, 1000);
}

// make function to authenticate for the first time
function makeAuthRequest(endpoint, data, progressMessage, callback){
  "use strict";

  // get the cookie
  //  break if not exists; redirect to login
  // fire the request
  // show the message
  // return err or data
  Materialize.toast('Making connection', 2000);
  setTimeout(function(){ Materialize.toast(progressMessage, 2000); }, 1000);
}
