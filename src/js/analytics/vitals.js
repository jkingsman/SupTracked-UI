/* globals makeAuthRequest,Materialize,drug */

// these are predefined in the master analytics.js file
var analyticsCount, analyticsFinished;

analyticsCount += 1;

function vitals(id){
  "use strict";


  setTimeout(function(){analyticsFinished += 1;}, 500);
}
