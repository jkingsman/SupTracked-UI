/* globals makeAuthRequest,Materialize,micromarkdown */

"use strict";

var drugs, saveNotificationTimeout;

function alphabetizeSort(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();

  return (a < b) ? -1 : (a > b) ? 1 : 0;
}

function populateDropdown(selected) {
  // default the selector to zero if there's no specific drug to select
  selected = selected || 0;

  // empty and load boilerplate
  $('#drugList').empty();
  $('#deleteDrug').hide();
  $('#drugList').append('<option value="0">New Drug</option>');

  makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, data, code) {
    // alphabetize the list
    data.sort(function(a, b) {
      return alphabetizeSort(a.name, b.name);
    });

    // store it for use
    drugs = data;

    // populate the dropdown
    data.forEach(function(drug) {
      // if this is the one we want selected, mark it
      var selectedString = '';
      if (selected === drug.id) {
        selectedString = 'selected ';
      }

      $('#drugList').append('<option ' + selectedString + 'value="' + drug.id + '">' + drug.name + '</option>');
    });

    // all done; trigger change event
    $('#drugList').trigger("change");
  });
}

$(document).ready(function() {
  populateDropdown();
});

$("#drugList").on('change', function() {
  if (parseInt($('#drugList').val()) === 0) {
    // creating a new drug; clear everything
    $('#name').val('');
    $('#unit').val('');
    $('#classification').val('');
    $('#family').val('');
    $('#rarity').val(1);
    $('#notes').val('');

    // reveal the save button, hide delete
    $('#saveNew').show();
    $('#deleteDrug').hide();
    return;
  }

  // hide the save, show delete
  $('#saveNew').hide();
  $('#deleteDrug').show();

  // it's not a new one; go ID hunting
  drugs.forEach(function(drug) {
    if (drug.id === parseInt($('#drugList').val())) {
      // found our drug. Load it.
      $('#name').val(drug.name);
      $('#unit').val(drug.unit);
      $('#classification').val(drug.classification);
      $('#family').val(drug.family);
      $('#rarity').val(drug.rarity);
      $('#notes').val(drug.notes);

      // trigger formatting and autoresizing
      $('#nameLabel, #unitLabel, #classificationLabel, #familyLabel, #notesLabel').addClass('active');
      $('#notes').trigger('autoresize');

      var breaksToBR = micromarkdown.parse($('#notes').val()).replace(/(?:\r\n|\r|\n)/g, ' <br /> ');

      // scrub out unnecessary breaks
      breaksToBR = breaksToBR.replace(/(<br>\s*)+<br>/gm, '<br>');

      //scrub out breaks before and after all h1-4
      breaksToBR = breaksToBR.replace(/<\/h1>[\s<br />\s]+/g, '</h1>').replace(/[\s<br />\s]+<h1>/g, '<h1>');
      breaksToBR = breaksToBR.replace(/<\/h2>[\s<br />\s]+/g, '</h2>').replace(/[\s<br />\s]+<h2>/g, '<h2>');
      breaksToBR = breaksToBR.replace(/<\/h3>[\s<br />\s]+/g, '</h3>').replace(/[\s<br />\s]+<h3>/g, '<h3>');
      breaksToBR = breaksToBR.replace(/<\/h4>[\s<br />\s]+/g, '</h4>').replace(/[\s<br />\s]+<h4>/g, '<h4>');

      $('#notesMarkdown').html(breaksToBR);
      $('#notes').hide();
      $('#notesMarkdown').show();
    }
  });
});

// listen for changes
$("#name, #unit, #classification, #family, #rarity, #notes").on('change keyup paste', function() {
  if (parseInt($('#drugList').val()) !== 0) {
    // only fire if we're not creating a new one
    clearTimeout(saveNotificationTimeout);
    saveNotificationTimeout = setTimeout(function() {
      var updateObj = {
        id: parseInt($('#drugList').val()),
        name: $('#name').val(),
        unit: $('#unit').val(),
        notes: $('#notes').val(),
        classification: $('#classification').val(),
        family: $('#family').val(),
        rarity: $('#rarity').val()
      };

      makeAuthRequest('/drug', 'PUT', JSON.stringify(updateObj), 'json', function(err, data, code) {
        if (code !== 200) {
          Materialize.toast('Drug save error: ' + err, 6000, 'warning-toast');
          return;
        }

        // redraw the dropdown and reselect the Drug
        populateDropdown(parseInt($('#drugList').val()));

        Materialize.toast('Drug saved', 1000);
      });
    }, 1000);
  }
});

// saving function
function saveNew() {
  var newDrug = {
    name: $('#name').val(),
    unit: $('#unit').val(),
    notes: $('#notes').val(),
    classification: $('#classification').val(),
    family: $('#family').val(),
    rarity: $('#rarity').val()
  };

  makeAuthRequest('/drug', 'POST', JSON.stringify(newDrug), 'json', function(err, data, code) {
    if (code !== 201) {
      Materialize.toast('Drug save error: ' + err, 6000, 'warning-toast');
      return;
    }

    // redraw the dropdown and reselect the Drug
    populateDropdown(data.id);

    Materialize.toast('Drug created', 1000);
  });
}

function deleteDrug() {
  makeAuthRequest('/drug', 'DELETE', JSON.stringify({
    id: parseInt($('#drugList').val())
  }), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast('Drug delete error: ' + err, 6000, 'warning-toast');
      return;
    }

    // redraw the dropdown and reselect the Drug
    populateDropdown(0);

    Materialize.toast('Drug deleted', 1000);
  });
}

// add click listener to reveal text box
$("#notesMarkdown").on("click", function() {
  $("#notesMarkdown").hide();
  $("#notes").show();
  $("#notesLabel").show();
});
