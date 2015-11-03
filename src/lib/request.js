/* globals Materialize */

function makeAuthRequest(endpoint, data, progressMessage, callback){
  "use strict";

  // get the cookie
  //  err if not exists
  // fire the request
  // show the message
  // return err or data
  Materialize.toast('Making connection', 2000);
  setTimeout(function(){ Materialize.toast(progressMessage, 2000); }, 1000);
}
