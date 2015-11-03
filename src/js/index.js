/* globals authLogin,authRegister,Materialize */
"use strict";

$(document).on("click", ":submit", function(event){
    event.preventDefault();
    var action = $(this).val();

    if(action === 'login'){
      authLogin('username', 'password', 'server');
    } else {
      // handle registration
      authRegister('username', 'password', 'server');
    }
});
