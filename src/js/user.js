/* globals makeAuthRequest,Materialize */

"use strict";

var saveNotificationTimeout;

$(document).ready(function() {
  // user data
  makeAuthRequest('/user', 'GET', null, 'json', function(err, data, code) {
    $('#username').val(data.username);
    $('#emergcontact').val(data.emergcontact);
    $('#phone').val(data.phone);

    $('#usernameLabel, #emergcontactLabel, #phoneLabel').addClass('active');
  });

  // audit data
  var auditCount = parseInt(location.search.slice(1));
  if(isNaN(auditCount)){
    auditCount = 250;
  }
  makeAuthRequest('/user/audit', 'POST', JSON.stringify({limit: auditCount}), 'json', function(err, data, code) {
    data.forEach(function(auditEntry){
      $('#auditLog').append('<li class="collection-item">' +
      new Date((auditEntry.date * 1000) - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16).replace('T', ' ') +
      '<span class="margin-left-40">' + auditEntry.ip + '</span>' +
      '<span class="margin-left-40"><strong>' + auditEntry.action + '</strong></span>' +
      '<span style="border-bottom: 1px dashed #ADADAD;" class="margin-left-40 tooltipped" data-position="top" data-delay="50" data-tooltip="' + auditEntry.useragent + '">User Agent</span>' +
      '</li>');
    });

    // init tooltips
    $('.tooltipped').tooltip({delay: 50});
  });
});

$("#emergcontact, #phone").on('change keyup paste', function() {
    clearTimeout(saveNotificationTimeout);
    saveNotificationTimeout = setTimeout(function() {
      var updateObj = {
        emergcontact: $('#emergcontact').val(),
        phone: $('#phone').val()
      };

      makeAuthRequest('/user', 'PUT', JSON.stringify(updateObj), 'json', function(err, data, code) {
        if (code !== 200) {
          Materialize.toast('User save error: ' + err, 6000, 'warning-toast');
          return;
        }

        Materialize.toast('User saved', 1000);
      });
    }, 1000);
});

$('#updatePass').submit(function(event) {
  event.preventDefault();
  if($('#password').val() !== $('#passwordConfirm').val()){
    Materialize.toast('Passwords must match', 6000, 'warning-toast');
    return;
  }
  makeAuthRequest('/user/password', 'PUT', JSON.stringify({password: $('#passwordConfirm').val()}), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast('Password error: ' + err, 6000, 'warning-toast');
      return;
    }

    Materialize.toast('Password updated', 1000);
    $('#password, #passwordConfirm').val('');
  });
});
