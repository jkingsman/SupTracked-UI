/* globals makeAuthRequest,Materialize,getCookie,makeAuthBlobRequest,server,micromarkdown,cleanMarkdown,getTTime  */
/* jshint -W089 */

"use strict";

var experience, drugTotals = [];

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
    experience.consumptions.sort(function(a, b) {
      return a.date - b.date;
    });

    // compile the consumptions, grouped by drug
    var groupedConsumptionList = {};

    experience.consumptions.forEach(function(consumption) {
      if (groupedConsumptionList.hasOwnProperty(consumption.drug.name)) {
        groupedConsumptionList[consumption.drug.name].count += consumption.count;
      } else {
        groupedConsumptionList[consumption.drug.name] = {};
        groupedConsumptionList[consumption.drug.name].count = consumption.count;
        groupedConsumptionList[consumption.drug.name].unit = consumption.drug.unit;
      }
    });

    // group the consumptions into strings by drug
    if (Object.keys(groupedConsumptionList).length > 0) {
      for (var drug in groupedConsumptionList) {
        drugTotals.push([groupedConsumptionList[drug].count, groupedConsumptionList[drug].unit, drug]);
      }
    }

    cb();
  });
}

function drawConsumptions() {
  var interactions;
  if (experience.interactions) {
    interactions = JSON.parse(experience.interactions);
  } else {
    interactions = [];
  }

  if (interactions.length > 0) {
    $('#interactionWarning').show();
  }

  $('#consumptionsCollection').empty();
  if (experience.consumptions.length === 0) {
    $('#consumptionsCollection').append('<li class="collection-item"><div>No consumptions</div></li>');
  } else {
    experience.consumptions.forEach(function(consumption) {
      $('#consumptionsCollection').prepend('<li class="collection-item">' + new Date(consumption.date * 1000).toISOString().slice(5, 16).replace(/T/, ' ').replace('-', '/') +
        '<a href="#" title="Set to Now" onClick="setNow(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">alarm_on</i></a>' +
        '<a href="#" title="Duplicate" onClick="duplicateConsumption(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">call_split</i></a>' +
        '<a href="#" title="Delete" onClick="deleteConsumption(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">delete</i></a>' +
        '<br><span class="consumption-data">' + consumption.count + ' ' + consumption.drug.unit + ' ' + consumption.drug.name + ', ' + consumption.method.name + '</span>' +
        '</li>');
    });

    $('#addLocation').val(experience.consumptions[experience.consumptions.length - 1].location);
  }
}

var youTookTimer;

function drawBP() {
  if (drugTotals.length === 0) {
    $('#notEnough').show();
    $('#loadingSpinner').removeClass('active');
  }

  // box 1
  var lastCon = experience.consumptions[0];
  if (lastCon.drug.unit.length < 5) {
    $('#youTook').html(lastCon.count + ' ' + lastCon.drug.unit);
    $('#youTookOf').html('of ' + lastCon.drug.name);
  } else {
    $('#youTook').html(lastCon.count);
    $('#youTookOf').html(lastCon.drug.unit + ' of ' + lastCon.drug.name);
  }

  youTookTimer = setInterval(function() {
    var secsDiff = ((new Date().getTime() / 1000) - experience.consumptions[0].date - (new Date().getTimezoneOffset() * 60));
    var hours = Math.floor(secsDiff / 3600);
    var minutes = Math.floor((secsDiff - (hours * 3600)) / 60);
    var seconds = Math.floor((secsDiff - (hours * 3600) - (minutes * 60)));

    $('#youTookTime').html(('00' + hours).substr(-2) + ':' + ('00' + minutes).substr(-2) + ':' + ('00' + seconds).substr(-2));
  }, 1000);

  // box 2
  if (experience.consumptions.length > 1) {
    var nextLastCon = experience.consumptions[1];
    if (nextLastCon.drug.unit.length < 5) {
      $('#youTookB4').html(nextLastCon.count + ' ' + nextLastCon.drug.unit);
      $('#youTookOfB4').html('of ' + nextLastCon.drug.name);
    } else {
      $('#youTookB4').html(nextLastCon.count);
      $('#youTookOfB4').html(nextLastCon.drug.unit + ' of ' + nextLastCon.drug.name);
    }

    var secsDiff = experience.consumptions[0].date - experience.consumptions[1].date;
    var hours = Math.floor(secsDiff / 3600);
    var minutes = Math.floor((secsDiff - (hours * 3600)) / 60);
    var seconds = Math.floor((secsDiff - (hours * 3600) - (minutes * 60)));

    $('#youTookTimeB4').html(('00' + hours).substr(-2) + ':' + ('00' + minutes).substr(-2) + ':' + ('00' + seconds).substr(-2));
  } else {
    $('#nextLastCon').html('<h4>..and that was it!</h4>');
  }

  // box 3
  var trimmedCons = drugTotals.sort(function(a, b) {
    return a[0] - b[0];
  }).slice(0, 2).map(function(drugTotals) {
    return '<div><h3>' + drugTotals[0] + ' ' + drugTotals[1] + '</h3>' + drugTotals[2] + '</div>';
  });

  $('#totals').empty().append('<hr>' + trimmedCons.join('<hr>') + '<hr>');
  if (drugTotals.length - trimmedCons.length > 0) {
    $('#totals').append('<div> and ' + (drugTotals.length - trimmedCons.length) + ' more<hr></div>');
  }

  $('#loadingSpinner').removeClass('active');
  $('.bigLoading').removeClass('hide');
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

        consumption.friends.forEach(function(friend) {
          makeAuthRequest('/consumption/friend', 'POST', JSON.stringify({
            consumption_id: data.id,
            name: friend.name
          }), 'json', function(err, data, code) {
            if (err) {
              Materialize.toast('Friends copy error: ' + err, 6000, 'warning-toast');
              return;
            }
          });
        });

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

    if ($('#cloneLastFriends').is(':checked')) {
      experience.consumptions[experience.consumptions.length - 1].friends.forEach(function(friend) {
        makeAuthRequest('/consumption/friend', 'POST', JSON.stringify({
          consumption_id: data.id,
          name: friend.name
        }), 'json', function(err, data, code) {
          if (err) {
            Materialize.toast('Friends copy error: ' + err, 6000, 'warning-toast');
            return;
          }
        });
      });
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
          var timePrefix = getTTime(consumption.date);

          newNotes = experience.notes + '\n' + timePrefix + ' -- ' + $('#note').val();
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

$('#consumptionsTabBtn, #addConsumptionTabBtn, #panicTabBtn, #bigTabBtn').click(function(e) {
  if (e.target.id === 'bigTabBtn') {
    $('.removable').addClass('hide');
  } else {
    $('.removable').removeClass('hide');
  }

  window.location.hash = e.target.hash;
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

  $('ul.tabs').tabs('select_tab', window.location.hash.substring(1));
  if (window.location.hash === 'bigTabBtn') {
    $('.removable').addClass('hide');
  }



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

  if (experience.notes === null) {
    // so micromarkdown doesn't choke
    experience.notes = '[none]';
  }

  $('#title').html(experience.title);
  $('#notes').html(cleanMarkdown(micromarkdown.parse(experience.notes)));
  $('.fullLink').attr('href', '/experience.html?' + experience.id);
  drawConsumptions();
  drawBP();
});
