/* globals makeAuthRequest,Materialize */
"use strict";

$(document).on("click", ":submit", function(event){
    event.preventDefault();
    var action = $(this).val();

    if(action === 'login'){
      makeAuthRequest(1, 2, "Verifying user", 4);
    } else {
      // handle registration
      makeAuthRequest(1, 2, "Attempting registration", 4);
    }
});
