/* globals Materialize */
/*jshint -W003 */
"use strict";

// see if they're already authenticated and aren't trying to log out
if(getCookie('server').length > 0 && getCookie('auth').length > 0 && location.search.indexOf('logout') === -1){
  makeAuthRequest('/user', 'GET', null, 'json', function(err, data){
    if(!err && (window.location.pathname === '/' || window.location.pathname === '/index.html')){
      // they have valid credentials stored, and they're hitting the login page - wave them in
      Materialize.toast("Logging in...", 6000);
      window.location = "/experiences.html";
    }
  });
} else{
  // if they're not at the login screen, take them there
  if(window.location.pathname !== '/' && window.location.pathname !== '/index.html'){
    window.location = "/";
  }
}

/**
* Loads a cookie by name
*
* @param {String} cname The desired cookie name
* @return {String} The data of the cookie, or an empty string if it doesn't exist
*/
function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i += 1) {
    var c = ca[i];
    while (c.charAt(0) === ' '){
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0){
      return c.substring(name.length,c.length);
    }
  }
  return "";
}

/**
* Parse out what an error was and show it to the user in a toast
*
* @param {xhr} xhr xhr request containing the error
*/
function displayJSONError(xhr){
  // handle standard error codes
  if(xhr.status === 0){
    // usually indicates a connection issues
    Materialize.toast('Server connection error', 6000, 'warning-toast');
    return;
  }

  if(xhr.status === 401){
    // usually indicates a connection issues
    Materialize.toast('Authentication error', 6000, 'warning-toast');
    return;
  }

  var err = xhr.responseText;
  try{
    var name = Object.keys(JSON.parse(err))[0];
    Materialize.toast(JSON.parse(err)[name].charAt(0).toUpperCase() + JSON.parse(err)[name].slice(1), 6000, 'warning-toast');
    console.log("Raw error:" + xhr.responseText + "; " + xhr.status);
  }
  catch (e){
    Materialize.toast('Unparseable error  (' + xhr.status + ')', 6000, 'warning-toast');
  }
}

/**
* Logs a user in and stores the cookie
*
* @param {String} username
* @param {String} password
* @param {String} server
*/
function authLogin(username, password, server){
  $.ajax({
    method: 'GET',
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization','Basic ' + btoa(username + ':'+ password));
    },
    dataType: "json",
    url: server + '/user',
  })
  .done(function(msg) {
    // set 24 hr expiration
    var now = new Date();
    var time = now.getTime();
    time += 86400 * 1000;
    now.setTime(time);

    document.cookie = "server=" + server + '; expires=' + now.toUTCString();
    document.cookie = "auth=" + btoa(username + ':'+ password) + '; expires=' + now.toUTCString();

    Materialize.toast("Logging in...", 6000);
    window.location = "/experiences.html";
  })
  .fail(displayJSONError);
}

/**
* Register the user with given server with the provided credentials
*
* @param {String} username
* @param {String} password
* @param {String} server
*/
function authRegister(username, password, server){
  $.ajax({
    method: 'POST',
    contentType: 'application/json; charset=UTF-8',
    processData: false,
    dataType: "text",
    url: server + '/register',
    data: JSON.stringify({username: username, password: password})
  })
  .done(function(msg) {
    Materialize.toast('Registration successful', 6000, 'success-toast');
  })
  .fail(displayJSONError);
}

/**
* Make an authenticated server request
*
* @param {String} endpoint the endpoint URL the data should go to
* @param {String} verb HTTP very the data should be sent with
* @param {String} data JSON data to be sent
* @param {String} responseType 'json' or 'text'; json will parse and give the JSON as the data to the callback. Text should only be used when no data is returned, and the callback data param will be null
* @param {callback} cb callback that handles the response
*/
function makeAuthRequest(endpoint, verb, data, responseType, cb){
  var auth = getCookie('auth');
  var server = getCookie('server');
  var requestID = Math.floor(Math.random() * 16777215).toString(16); // random six dig hex

  if(auth.length < 1 && server.length < 1){
    // doesn't exist; send them to login and clear cookies
    window.location = "/index.html?logout";
    return;
  }

  Materialize.toast('Request pending...', 10000, 'requestid-' + requestID);

  $.ajax({
    method: verb,
    contentType: 'application/json; charset=UTF-8',
    processData: false,
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization', 'Basic ' + auth);
    },
    dataType: responseType,
    url: server + endpoint,
    data: data
  })
  .done(function(msg, textStatus, xhr) {
    // hide the notification and fire the callback
    $('.requestid-' + requestID).hide();
    cb(null, msg, xhr.status);
  })
  .fail(function(xhr){
    $('.requestid-' + requestID).hide();
    // parse out the error message (either responseText or, failing that, statusText) and fire the callback
    var errorText;
    if(xhr.responseText !== undefined && (xhr.responseText.length > 0 || xhr.responseText !== '')){
      var name = Object.keys(JSON.parse(xhr.responseText))[0];
      errorText = JSON.parse(xhr.responseText)[name];
    } else {
      errorText = xhr.statusText;
    }

    cb(errorText, null, xhr.status);
  });
}


/**
* Callback to handle an authenticated request
* @callback requestCallback
* @param {string} err (will be null if no err occurred)
* @param {string} data data returned by the server (will be null if there is no response AND the 'text' type is provided for responseType)
* @param {Number} code http status code
*/

/**
* Make an authenticated server request for an image (returns a blob)
*
* @param {String} endpoint the endpoint URL the data should go to
* @param {String} verb HTTP very the data should be sent with
* @param {String} data JSON data to be sent
* @param {String} responseType 'json' or 'text'; json will parse and give the JSON as the data to the callback. Text should only be used when no data is returned, and the callback data param will be null
* @param {callback} cb callback that handles the response (only param is the data)
*/
function makeAuthBlobRequest(endpoint, cb){
  var auth = getCookie('auth');
  var server = getCookie('server');

  if(auth.length < 1 && server.length < 1){
    // doesn't exist; send them to login and clear cookies
    window.location = "/index.html?logout";
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
      if (this.readyState === 4 && this.status === 200){
          //this.response is what you're looking for
          cb(this.response);
      }
  };

  xhr.open("GET", server + endpoint);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.setRequestHeader('Authorization', 'Basic ' + auth);
  xhr.responseType = 'blob';
  xhr.send();
}
