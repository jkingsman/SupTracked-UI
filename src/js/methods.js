/* globals makeAuthRequest,Materialize */

"use strict";

var methods, saveNotificationTimeout;

function alphabetizeSort(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();

  return (a < b) ? -1 : (a > b) ? 1 : 0;
}

function populateDropdown(selected) {
  // default the selector to zero if there's no specific method to select
  selected = selected || 0;

  // empty and load boilerplate
  $('#methodList').empty();
  $('#deleteMethod').hide();
  $('#methodList').append('<option value="0">New Method</option>');

  makeAuthRequest('/method/all', 'GET', null, 'json', function(err, data, code) {
    // alphabetize the list
    data.sort(function(a, b) {
      return alphabetizeSort(a.name, b.name);
    });

    // store it for use
    methods = data;

    // populate the dropdown
    data.forEach(function(method) {
      // if this is the one we want selected, mark it
      var selectedString = '';
      if (selected === method.id) {
        selectedString = 'selected ';
      }

      $('#methodList').append('<option ' + selectedString + 'value="' + method.id + '">' + method.name + '</option>');
    });

    // all done; trigger change event to pick new method on deletions, etc.
    $('#methodList').trigger("change");
  });
}

$(document).ready(function() {
  populateDropdown();
});

$("#methodList").on('change', function() {
  if (parseInt($('#methodList').val()) === 0) {
    // creating a new method; clear everything
    $('#name').val('');
    $('#icon').val('');

    // reveal the save button, hide delete
    $('#saveNew').show();
    $('#deleteMethod').hide();
    return;
  }

  // hide the save, show delete
  $('#saveNew').hide();
  $('#deleteMethod').show();

  // it's not a new one; go ID hunting
  methods.forEach(function(method) {
    if (method.id === parseInt($('#methodList').val())) {
      // found our method. Load it.
      $('#name').val(method.name);
      $('#icon').val(method.icon);

      // trigger formatting and autoresizing
      $('#nameLabel, #iconlabel').addClass('active');
    }
  });
});

// listen for changes
$("#name, #icon").on('change keyup paste', function() {
  if (parseInt($('#methodList').val()) !== 0) {
    // only fire if we're not creating a new one
    clearTimeout(saveNotificationTimeout);
    saveNotificationTimeout = setTimeout(function() {
      var updateObj = {
        id: parseInt($('#methodList').val()),
        name: $('#name').val(),
        icon: $('#icon').val()
      };

      makeAuthRequest('/method', 'PUT', JSON.stringify(updateObj), 'json', function(err, data, code) {
        if (code !== 200) {
          Materialize.toast('Method save error: ' + err, 6000, 'warning-toast');
          return;
        }

        // redraw the dropdown and reselect the method
        populateDropdown(parseInt($('#methodList').val()));

        Materialize.toast('Method saved', 1000);
      });
    }, 1000);
  }
});

// saving function
function saveNew() {
  var newMethod = {
    name: $('#name').val(),
    icon: $('#icon').val()
  };

  makeAuthRequest('/method', 'POST', JSON.stringify(newMethod), 'json', function(err, data, code) {
    if (code !== 201) {
      Materialize.toast('Method save error: ' + err, 6000, 'warning-toast');
      return;
    }

    // redraw the dropdown and reselect the method
    populateDropdown(data.id);

    Materialize.toast('Method created', 1000);
  });
}

function deleteMethod() {
  makeAuthRequest('/method', 'DELETE', JSON.stringify({
    id: parseInt($('#methodList').val())
  }), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast('Method delete error: ' + err, 6000, 'warning-toast');
      return;
    }

    // redraw the dropdown and reselect the method
    populateDropdown(0);

    Materialize.toast('Method deleted', 1000);
  });
}
