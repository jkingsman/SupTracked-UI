/* globals makeAuthRequest,Materialize,getCookie,makeAuthBlobRequest,server */
/* jshint -W089 */

"use strict";

var experience;

function updateExperienceObject(cb) {
  makeAuthRequest('/experience/search', 'POST', JSON.stringify({
    limit: 1
  }), 'json', function(err, data, code) {
    if (code === 404) {
      // no experiences
      window.location = '/experiences.html';
      return;
    }

    experience = data[0];
    cb();
  });
}

function drawConsumptions() {
  $('#consumptionsCollection').empty();
  if (experience.consumptions.length === 0) {
    $('#consumptionsCollection').append('<li class="collection-item"><div>No consumptions</div></li>');
  } else {
    experience.consumptions.forEach(function(consumption) {
      $('#consumptionsCollection').append('<li class="collection-item">' + new Date(consumption.date * 1000).toISOString().slice(5, 16).replace(/T/, ' ').replace('-', '/') +
        '<a href="#" title="Duplicate" onClick="duplicateConsumption(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">open_in_new</i></a>' +
        '<a href="#" title="Delete" onClick="deleteConsumption(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">delete</i></a>' +
        '<br><span class="consumption-data">' + consumption.count + ' ' + consumption.drug.unit + ' ' + consumption.drug.name + ', ' + consumption.method.name + '</span>' +
        '</li>');
    });
  }
}

function deleteConsumption(id) {
  makeAuthRequest('/consumption', 'DELETE', JSON.stringify({
    id: id
  }), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast(err, 6000, 'warning-toast');
      return;
    }

    Materialize.toast('Consumption deleted', 1000, 'success-toast');
    updateExperienceObject(function() {
      drawConsumptions();
    });
  });
}

function duplicateConsumption(id) {
  experience.consumptions.forEach(function(consumption) {
    if (consumption.id === id) {
      var payload = {
        date: Math.floor((new Date().getTime() - (new Date().getTimezoneOffset()) * 60000) / 1000),
        count: consumption.count,
        experience_id: experience.id,
        drug_id: consumption.drug.id,
        method_id: consumption.method.id,
        location: consumption.location
      };

      makeAuthRequest('/consumption', 'POST', JSON.stringify(payload), 'json', function(err, data, code) {
        if (err) {
          Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
          return;
        }

        // draw consumptions, which will include our new one
        updateExperienceObject(function() {
          drawConsumptions();
        });
        Materialize.toast('Consumption duplicated', 1000, 'success-toast');
      });
    }
  });
}

// load drugs, methods into fields and draw the title
updateExperienceObject(function() {
  makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, drugs, code) {
    drugs.sort(function(a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();

      return (a < b) ? -1 : (a > b) ? 1 : 0;
    });

    if (drugs.length < 1) {
      $('#addDrug').append('<option value="" disabled selected>None</option>');
      return;
    }

    drugs.forEach(function(drug) {
      $('#addDrug').append('<option value="' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
    });
  });

  makeAuthRequest('/method/all', 'GET', null, 'json', function(err, methods, code) {
    methods.sort(function(a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();

      return (a < b) ? -1 : (a > b) ? 1 : 0;
    });

    if (methods.length < 1) {
      $('#addMethod').append('<option value="" disabled selected>None</option>');
      return;
    }

    methods.forEach(function(method) {
      $('#addMethod').append('<option value="' + method.id + '">' + method.name + '</option>');
    });
  });

  makeAuthRequest('/consumption/locations', 'GET', null, 'json', function(err, data, code) {
    data.forEach(function(location) {
      $('#addLocationAutofill').append('<option value="' + location.location + '"></option>');
    });
  });

  $('#title').html(experience.title);
  drawConsumptions();
});

// add consumption submit listener
$('#addConsumption').submit(function(event) {
  event.preventDefault();
  var payload = {
    date: Math.floor((new Date().getTime() - (new Date().getTimezoneOffset()) * 60000) / 1000),
    count: $('#count').val(),
    experience_id: experience.id,
    drug_id: $('#addDrug').val(),
    method_id: $('#addMethod').val(),
    location: $('#addLocation').val()
  };

  makeAuthRequest('/consumption', 'POST', JSON.stringify(payload), 'json', function(err, data, code) {
    if (err) {
      Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
      return;
    }

    // draw consumptions, which will include our new one
    updateExperienceObject(function() {
      drawConsumptions();
    });
    $('ul.tabs').tabs('select_tab', 'consumptions');
    Materialize.toast('Consumption created', 1000, 'success-toast');
  });
});

// add quicknote submit listener
$('#addQuicknote').submit(function(event) {
  event.preventDefault();

  updateExperienceObject(function() {
    var newNotes;
    if (experience.ttime) {
      experience.consumptions.forEach(function(consumption){
        if(consumption.id === experience.ttime){
          var conDate = Math.floor(new Date(consumption.date * 1000).getTime() / 1000);
          var now = Math.floor(new Date().getTime() / 1000) - (new Date().getTimezoneOffset() * 60);

          var sign = '+';
          if(conDate > now){
            sign = '-';
          }

          var diff = Math.abs(now - conDate);
          var hours = Math.floor(diff / 60 / 60);
          diff -= hours *  60 * 60;
          var minutes = Math.floor(diff / 60);

          newNotes = experience.notes + '\nT' + sign + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ' -- ' + $('#note').val();
        }
      });
    } else {
      newNotes = experience.notes + '\n' + ('0' + new Date().getHours()).slice(-2) + ('0' + new Date().getMinutes()).slice(-2) + ' -- ' + $('#note').val();
    }

    makeAuthRequest('/experience', 'PUT', JSON.stringify({
      id: experience.id,
      notes: newNotes
    }), 'json', function(err, data, code) {
      if (code !== 200) {
        Materialize.toast('Quicknote error: ' + err, 6000, 'warning-toast');
        return;
      }

      Materialize.toast('Quicknote Added', 1000, 'success-toast');
    });

    updateExperienceObject(function() {});
    $('#note').val('');
  });


});

// upload media
$('#media').change(function() {
  console.log('uploading media');
  $('#media').val('');
});

// init tabs
$(document).ready(function() {
  $('ul.tabs').tabs();
});
