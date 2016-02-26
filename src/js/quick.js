/* globals makeAuthRequest,Materialize,getCookie,makeAuthBlobRequest,server,micromarkdown,cleanMarkdown  */
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
    experience.consumptions.sort(function(a, b) {
      return (a.date > b.date) ? -1 : (a.date < b.date) ? 1 : 0;
    });

    experience.consumptions.forEach(function(consumption) {
      $('#consumptionsCollection').append('<li class="collection-item">' + new Date(consumption.date * 1000).toISOString().slice(5, 16).replace(/T/, ' ').replace('-', '/') +
        '<a href="#" title="Set to Now" onClick="setNow(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">alarm_on</i></a>' +
        '<a href="#" title="Duplicate" onClick="duplicateConsumption(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">call_split</i></a>' +
        '<a href="#" title="Delete" onClick="deleteConsumption(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">delete</i></a>' +
        '<br><span class="consumption-data">' + consumption.count + ' ' + consumption.drug.unit + ' ' + consumption.drug.name + ', ' + consumption.method.name + '</span>' +
        '</li>');

      $('#addLocation').val(consumption.location);
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

function setNow(id) {
  experience.consumptions.forEach(function(consumption) {
    if (consumption.id === id) {
      var payload = {
        id: id,
        date: Math.floor((new Date().getTime() - (new Date().getTimezoneOffset()) * 60000) / 1000),
      };

      makeAuthRequest('/consumption', 'PUT', JSON.stringify(payload), 'json', function(err, data, code) {
        if (code !== 200) {
          Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
          return;
        }

        // draw consumptions, which will include our jumped one
        updateExperienceObject(function() {
          drawConsumptions();
        });
        Materialize.toast('Consumption set to now', 1000, 'success-toast');
      });
    }
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

function sendGeoData() {
  navigator.geolocation.watchPosition(function(position) {
    makeAuthRequest('/sms', 'POST', JSON.stringify({
      message: 'As of now, they are near the following location: https://www.google.com/maps/search/' +
        position.coords.latitude + ',' + position.coords.longitude +
        '. Updated data may be sent as it becomes available.'
    }), 'json', function(err, data, code) {
      if (code !== 200) {
        Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
        return;
      }

      Materialize.toast('Location data sent', 5000, 'success-toast');
    });
  });
}

function confirmPanic() {
  $('#panicButton').removeClass('orange').addClass('red');
  $('#panicButton').text('Confirm panic message?');
  $('#panicButton').attr('onclick', 'sendPanic();');
}

function sendPanic() {
  makeAuthRequest('/sms', 'POST', JSON.stringify({
    message: atob(getCookie('auth')).split(':')[0] + ' is having a bad drug experience, and would like your help.'
  }), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
      return;
    }

    Materialize.toast('Initial message sent', 5000, 'success-toast');
  });

  setTimeout(function() {
    sendGeoData();

    updateExperienceObject(function() {
      var consumptionArray = [];
      experience.consumptions.forEach(function(consumption) {
        consumptionArray.push(new Date(consumption.date * 1000).toISOString().slice(5, 16).replace(/T/, ' ').replace('-', '/') +
          ' -- ' + consumption.count + ' ' + consumption.drug.unit + ' ' + consumption.drug.name + ', ' + consumption.method.name);

        if (consumptionArray.length === experience.consumptions.length) {
          // loaded all experiences; on to the next step
          makeAuthRequest('/sms', 'POST', JSON.stringify({
            message: 'They have taken the following substances: \n' + consumptionArray.join('. \n')
          }), 'json', function(err, data, code) {
            if (code !== 200) {
              Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
              return;
            }

            Materialize.toast('Consumption data sent', 5000, 'success-toast');
          });
        }
      });

      if (experience.panicmsg && experience.panicmsg.length > 1) {
        makeAuthRequest('/sms', 'POST', JSON.stringify({
          message: 'They have provided the following information that may be helpful: ' + experience.panicmsg
        }), 'json', function(err, data, code) {
          if (code !== 200) {
            Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
            return;
          }

          Materialize.toast('Panic message sent', 5000, 'success-toast');
        });
      }
    });
  }, 1000);
}

// add consumption submit listener
$('#addConsumption').submit(function(event) {
  event.preventDefault();
  document.activeElement.blur();

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
  document.activeElement.blur();

  updateExperienceObject(function() {
    var newNotes;

    if (!experience.notes) {
      // if they're empty (null, usually), fill with empty string so we don't concat the string 'null' into the notes
      experience.notes = '';
    }

    if (experience.ttime) {
      experience.consumptions.forEach(function(consumption) {
        if (consumption.id === experience.ttime) {
          var conDate = Math.floor(new Date(consumption.date * 1000).getTime() / 1000);
          var now = Math.floor(new Date().getTime() / 1000) - (new Date().getTimezoneOffset() * 60);

          var sign = '+';
          if (conDate > now) {
            sign = '-';
          }

          var diff = Math.abs(now - conDate);
          var hours = Math.floor(diff / 60 / 60);
          diff -= hours * 60 * 60;
          var minutes = Math.floor(diff / 60);

          newNotes = experience.notes + '\nT' + sign + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ' -- ' + $('#note').val();
        }
      });
    } else {
      // current day epoch
      var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
      ];

      var date = new Date();
      var day = date.getDate();
      var monthIndex = date.getMonth();
      var year = date.getFullYear();

      var currentDateEpoch = Math.floor(Date.parse(day + ' ' + monthNames[monthIndex] + ', ' + year + ' 00:00:00 GMT') / 1000);

      var dateBlock;
      if (experience.date === currentDateEpoch) {
        // we're on the same day; procees as planned
        dateBlock = ('0' + new Date().getHours()).slice(-2) + ('0' + new Date().getMinutes()).slice(-2);
      } else {
        dateBlock = new Date().getMonth() + '-' + new Date().getDate() + ' ' + ('0' + new Date().getHours()).slice(-2) + ('0' + new Date().getMinutes()).slice(-2);
      }

      newNotes = experience.notes + '\n' + dateBlock + ' -- ' + $('#note').val();
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
  event.preventDefault();

  // build the form
  var formData = new FormData();
  formData.append("title", 'Mobile Media ' + Math.floor(Math.random() * 16777215).toString(8));
  formData.append("date", Math.floor(new Date().getTime() / 1000) - (new Date().getTimezoneOffset() * 60));
  formData.append("association_type", 'experience');
  formData.append("association", experience.id);

  formData.append("image", $('#media').prop('files')[0]);

  var auth = getCookie('auth');
  var server = getCookie('server');

  var xhr = new XMLHttpRequest();

  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 201) {
        Materialize.toast('Media added', 6000, 'success-toast');
        $('#media').val('');
        $('#mediaPath').val('');
      } else {
        Materialize.toast(xhr.statusText, 4000, 'warning-toast');
        $('#media').val('');
        $('#mediaPath').val('');
      }
    }
  };

  xhr.onerror = function(e) {
    Materialize.toast(xhr.statusText, 4000, 'warning-toast');
  };

  xhr.open("POST", server + '/media');
  xhr.setRequestHeader('Authorization', 'Basic ' + auth);
  xhr.send(formData);
});

// init tabs
$(document).ready(function() {
  $('ul.tabs').tabs();

  // autofocus notes on load; does nothing on iphone
  $('#note').focus();
});

if (location.search.slice(1) === 'hiddenNav') {
  $('nav').hide();
}

// load drugs, methods into fields and draw the title
updateExperienceObject(function() {
  makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, drugs, code) {
    drugs.sort(function(a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();

      return (a < b) ? -1 : (a > b) ? 1 : 0;
    });

    if (experience.consumptions.length > 0) {
      var addedDrugIds = [];
      experience.consumptions.forEach(function(consumption) {
        if (addedDrugIds.indexOf(consumption.drug.id) < 0) {
          $('#addDrug').append('<option value="' + consumption.drug.id + '">' + consumption.drug.name + ' (' + consumption.drug.unit + ')</option>');
          addedDrugIds.push(consumption.drug.id);
        }
      });
      $('#addDrug').append('<option disabled>──────────────</option>');
    }

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

    if (experience.consumptions.length > 0) {
      var addedMethodIds = [];
      experience.consumptions.forEach(function(consumption) {
        if (addedMethodIds.indexOf(consumption.method.id) < 0) {
          $('#addMethod').append('<option value="' + consumption.method.id + '">' + consumption.method.name + '</option>');
          addedMethodIds.push(consumption.method.id);
        }
      });
      $('#addMethod').append('<option disabled>──────────────</option>');
    }

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

  if(experience.notes === null){
    // so micromarkdown doesn't choke
    experience.notes = '[none]';
  }

  $('#title').html(experience.title);
  $('#notes').html(cleanMarkdown(micromarkdown.parse(experience.notes)));
  $('.fullLink').attr('href', '/experience.html?' + experience.id);
  drawConsumptions();
});
