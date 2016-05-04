/* globals makeAuthRequest,makeAuthBlobRequest,Materialize,micromarkdown,getCookie,cleanMarkdown,collateConsumptions */
/* jshint -W003, -W089 */
"use strict";

var experienceID = location.search.slice(1);
var noteSaveNotificationTimeout;
var metaSaveNotificationTimeout;
var masterExp;

var consumptions, drugs = [];
var recentsPopulated = false;

// we futz with the meta values after the listener is added; padd it out so the first update doesn't fire the message
var initialMetaMsgFired = 0;

// populate friends and locations
function setUpFriendsLoc() {
  $('#locations').empty();
  makeAuthRequest('/consumption/locations', 'GET', null, 'json', function(err, data, code) {
    data.forEach(function(location) {
      $('#locations').append('<option value="' + location.location + '"></option>');
    });
  });

  $('#friends').empty();
  makeAuthRequest('/consumption/friends', 'GET', null, 'json', function(err, data, code) {
    data.forEach(function(friend) {
      $('#friends').append('<option value="' + friend.name + '"></option>');
    });
  });
}

// fill in title/rating, etc.
function setUpMeta() {
  makeAuthRequest('/experience/' + experienceID, 'GET', null, 'json', function(err, data, code) {
    var $input = $('#metaDate').pickadate({
      format: 'yyyy-mm-dd'
    });
    var metaExp = data;
    var picker = $input.pickadate('picker');
    picker.set('select', new Date(data.date * 1000).toISOString().slice(0, 10));

    // load title
    $('#metaTitle').val(data.title);
    $('#addTitleLabel').addClass('active');

    // panic msg
    $('#metaPanic').text(data.panicmsg);
    $('#metaPanicLabel').addClass('active');

    // rating
    if (data.rating_id) {
      $('#metaRating').val(data.rating_id);
    }

    // draw T-Time
    // flush first
    $('#metaTTime').empty();
    $('#metaTTime').append('<option value="0">No T-Time</option>');
    data.consumptions.forEach(function(consumption) {
      $('#metaTTime').append('<option value="' + consumption.id + '">' + new Date(consumption.date * 1000).toISOString().slice(10, 16).replace(/T/, ' ') + ' -- ' + consumption.count + ' ' + consumption.drug.unit + ' ' + consumption.drug.name + '</option>');
    });

    if (data.ttime) {
      $('#metaTTime').val(data.ttime);
    }

    makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, data, code) {
      data.sort(function(a, b) {
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        return (a < b) ? -1 : (a > b) ? 1 : 0;
      });

      var interactions;

      if (metaExp.interactions) {
        interactions = JSON.parse(metaExp.interactions);
      } else {
        interactions = [];
      }

      if (interactions.length > 0) {
        $('#interactionWarning').show();
      }

      data.forEach(function(drug) {
        var checkedString = interactions.indexOf(drug.id) > -1 ? 'checked="true"' : '';
        $('#drugCollection').append('<input id="interactionDrug' + drug.id + '" ' + checkedString + ' name="interactionDrug" type="checkbox"><label for="interactionDrug' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</label><br />');
        $('#metaGroupDrug').append('<option value="' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
      });

      $('#interactionList').html(interactions.map(function(interaction) {
        return drugs[interaction].name;
      }).join(', '));

      // grouping
      $("#metaGroupDrug").val(0);
      if (masterExp.groupDrug !== null) {
        $('#metaGroupCount').val(masterExp.groupCount);
        $('#metaGroupDrug').val(masterExp.groupDrug);
      }
    });
  });
}

// kill the whole thing
function deleteExperience() {
  makeAuthRequest('/experience', 'DELETE', JSON.stringify({
    id: experienceID
  }), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast(err, 6000, 'warning-toast');
      return;
    }

    window.location = '/experiences.html';
  });
}

function populateRecents() {
  if (consumptions.length > 0) {

    $('.method-input').each(function(entry) {
      $(this).prepend('<option id="emptyMethodDelimiter" value="0" disabled>──────────────</option>');
    });

    var addedMethodIds = [];

    // reverse so we can prepend neatly
    var reverseOrder = consumptions.slice();
    reverseOrder.reverse();

    reverseOrder.forEach(function(consumption) {
      if (addedMethodIds.indexOf(consumption.method.id) < 0) {
        $('.method-input').each(function(entry) {

          $(this).prepend('<option value="' + consumption.method.id + '">' + consumption.method.name + '</option>');
        });
        addedMethodIds.push(consumption.method.id);
      }
    });

    $('.method-input').each(function(entry) {
      $(this).val($('#' + $(this)[0].id + ' option:first').val());
    });

    $('.drug-input').each(function(entry) {
      $(this).prepend('<option id="emptyDrugDelimiter" value="0" disabled>──────────────</option>');
    });

    var addedDrugIds = [];

    reverseOrder.forEach(function(consumption) {
      if (addedDrugIds.indexOf(consumption.drug.id) < 0) {
        $('.drug-input').each(function(entry) {
          $(this).prepend('<option value="' + consumption.drug.id + '">' + consumption.drug.name + ' (' + consumption.drug.unit + ')</option>');
        });
        addedDrugIds.push(consumption.drug.id);
      }
    });

    $('.drug-input').each(function(entry) {
      $(this).val($('#' + $(this)[0].id + ' option:first').val());
    });
  }
}

// draw consumptions into the collection
function drawConsumptions() {
  makeAuthRequest('/consumption/experience/' + experienceID, 'GET', null, 'json', function(err, data, code) {
    // load Consumptions
    if (code === 404) {
      $('#consumptionsCollection').empty();
      $('#consumptionsCollection').append('<li id="noConsumptions" class="collection-item"><div>No consumptions</div></li>');
    } else {
      $('#consumptionsCollection').empty();

      data.sort(function(a, b) {
        return a.date - b.date;
      });

      consumptions = data;

      if (!recentsPopulated) {
        // now that things are loaded, populate the recents
        populateRecents();
        recentsPopulated = true;
      }

      var currentCount = 0;
      var rollingTotals = {};
      data.forEach(function(consumption, index, internalData) {
        // build friends list
        var friendList = [];
        friendList = consumption.friends.map(function(friend) {
          return friend.name;
        });

        var friendString = 'No friends';

        if (friendList.length > 0) {
          friendString = friendList.join(', ');
        }

        var currentCountClass = '';
        if (masterExp.groupDrug === consumption.drug.id) {
          currentCountClass = 'grouped-' + Math.floor(currentCount / masterExp.groupCount);
          currentCount += consumption.count;
        }

        // get minutes since last
        var delta = '';
        if (index > 0) {
          delta = ' (' + Math.floor((consumption.date - internalData[index - 1].date) / 60) + ' min after last)';
        }

        // get rolling increases
        if (consumption.drug.id in rollingTotals) {
          rollingTotals[consumption.drug.id] += Number(consumption.count);
        } else {
          rollingTotals[consumption.drug.id] = Number(consumption.count);
        }

        $('#consumptionsCollection').prepend('<li class="collection-item ' + currentCountClass + '" id="con-' + consumption.id + '">' +
          '<span id="conDate">' + new Date(consumption.date * 1000).toISOString().slice(5, 16).replace(/T/, ' ').replace('-', '/') + '<span class="delta" style="display: none;">' + delta + '</span></span>' +
          '<span class="consumption-location hide-on-small-and-down pad-left-40">' + consumption.location + '</span>' +
          '<span class="consumption-friends hide-on-med-and-down pad-left-40">' + friendString + '</span>' +
          '<a href="#" title="Bulk Edit" onClick="bulkEdit()" class="secondary-content consumption-icon bulk-edit-button" style="display: none;"><i class="material-icons">library_books</i></a>' +
          '<a href="#" title="Edit" onClick="editConsumption(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">list</i></a>' +
          '<a href="#" title="Set to Now" onClick="setNow(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">alarm_on</i></a>' +
          '<a href="#" title="Duplicate" onClick="duplicateConsumption(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">call_split</i></a>' +
          '<a href="#" title="Delete" onClick="deleteConsumption(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">delete</i></a>' +
          '<a href="#" title="Clone Friend and Location Data" onClick="cloneData(' + consumption.id + ')" class="secondary-content consumption-icon"><i class="material-icons">input</i></a>' +
          '<br><span class="consumption-data">' + consumption.count + ' ' + consumption.drug.unit + ' ' + '<a target="_BLANK" href="/analytics.html?' + consumption.drug.id + '">' +
          consumption.drug.name + '</a>, ' + consumption.method.name + '</span>' +
          '<span class="rollingTotal" style="display: none;"> (total to ' + (Math.round(rollingTotals[consumption.drug.id] * 100) / 100) + ' ' + consumption.drug.unit + ')</span>' +
          '</li>');
      });
    }
  });
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

    // if we just deleted the T-Time consumption, reset that
    makeAuthRequest('/experience/' + experienceID, 'GET', null, 'json', function(err, data, code) {
      if (id === data.ttime) {
        makeAuthRequest('/experience', 'PUT', JSON.stringify({
          id: experienceID,
          ttime: 0
        }), 'json', function(err, data, code) {
          if (code !== 200) {
            Materialize.toast('Metadata save error: ' + err, 6000, 'warning-toast');
            return;
          }

          Materialize.toast('Associated T-Time reset', 1000, 'success-toast');
          setUpMeta();
        });
      }
    });
    drawConsumptions();
  });
}

function setNow(id) {
  makeAuthRequest('/consumption/experience/' + experienceID, 'GET', null, 'json', function(err, data, code) {
    data.forEach(function(consumption) {
      if (consumption.id === id) {
        var payload = {
          id: id,
          date: Math.floor((new Date().getTime() - (new Date().getTimezoneOffset()) * 60000) / 1000)
        };

        makeAuthRequest('/consumption', 'PUT', JSON.stringify(payload), 'json', function(err, data, code) {
          if (code !== 200) {
            Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
            return;
          }

          // draw consumptions, which will include our jumped one
          drawConsumptions();
          Materialize.toast('Consumption set to now', 1000, 'success-toast');
        });
      }
    });
  });
}

function cloneData(id) {
  makeAuthRequest('/consumption/experience/' + experienceID, 'GET', null, 'json', function(err, consumptions, code) {
    // sort by date desc
    consumptions.sort(function(a, b) {
      return (a.date > b.date) ? -1 : (a.date < b.date) ? 1 : 0;
    });

    // set current con to earliest con
    makeAuthRequest('/consumption', 'PUT', JSON.stringify({
      id: id,
      location: consumptions[consumptions.length - 1].location
    }), 'json', function(err, data, code) {
      if (code !== 200) {
        Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
        return;
      }
      Materialize.toast('Location data cloned', 1000, 'success-toast');

      if (consumptions[consumptions.length - 1].friends.length > 0) {
        // original consumption has friends to clone
        consumptions[consumptions.length - 1].friends.forEach(function(friend, index) {
          makeAuthRequest('/consumption/friend', 'POST', JSON.stringify({
            consumption_id: id,
            name: friend.name
          }), 'json', function(err, data, code) {
            if (code !== 201) {
              Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
              return;
            }
            if (index === (consumptions[consumptions.length - 1].friends.length - 1)) {
              // just processed last element; fire message and refresh
              Materialize.toast('Friend data cloned', 1000, 'success-toast');
              drawConsumptions();
            }
          });
        });
      } else {
        Materialize.toast('No friends to clone', 1000);
      }
    });
  });
}

function duplicateConsumption(id) {
  makeAuthRequest('/consumption/experience/' + experienceID, 'GET', null, 'json', function(err, data, code) {
    data.forEach(function(consumption) {
      if (consumption.id === id) {
        var payload = {
          date: Math.floor((new Date().getTime() - (new Date().getTimezoneOffset()) * 60000) / 1000),
          count: consumption.count,
          experience_id: experienceID,
          drug_id: consumption.drug.id,
          method_id: consumption.method.id,
          location: consumption.location
        };

        makeAuthRequest('/consumption', 'POST', JSON.stringify(payload), 'json', function(err, data, code) {
          if (err) {
            Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
            return;
          }

          // clone friends if we have them
          if (consumption.friends.length === 0) {
            Materialize.toast('Consumption duplicated', 6000, 'success-toast');
            drawConsumptions();
            return;
          }

          consumption.friends.forEach(function(friend, index) {
            makeAuthRequest('/consumption/friend', 'POST', JSON.stringify({
              consumption_id: data.id,
              name: friend.name
            }), 'json', function(err, data, code) {
              if (index === (consumption.friends.length - 1)) {
                // draw consumptions, which will include our new one
                drawConsumptions();
                Materialize.toast('Consumption duplicated', 6000, 'success-toast');
              }
            });
          });
        });
      }
    });
  });
}

function editConsumption(id) {
  makeAuthRequest('/consumption/experience/' + experienceID, 'GET', null, 'json', function(err, data, code) {
    data.forEach(function(consumption) {
      if (consumption.id === id) {
        // load the ID
        $('#editID').val(consumption.id);

        // set count
        $('#editCount').val(consumption.count);

        // set date and time
        var $input = $('#editDate').pickadate({
          format: 'yyyy-mm-dd'
        });
        var picker = $input.pickadate('picker');

        var date = new Date(consumption.date * 1000);
        picker.set('select', date.toISOString().slice(0, 10), {
          format: 'yyyy-mm-dd'
        });

        $('#editTime').val(date.toISOString().slice(11, 16).replace(/:/, ''));
        $('#edittimeLabel').addClass('active');

        // set location
        $('#editLocation').val(consumption.location);
        $('#editLocationLabel').addClass('active');

        // set drug and method
        $('#editDrug').val(consumption.drug.id);
        $('#editMethod').val(consumption.method.id);

        // set up Friends
        $('#editFriendBox').empty();
        if (consumption.friends.length === 0) {
          $('#editFriendBox').text('No friends!');
        } else {
          consumption.friends.forEach(function(friend) {
            $('#editFriendBox').append('<div class="chip" id="friend' + friend.id + '" onClick="removeFriend(' + friend.id + ')">' + friend.name + '</div>');
          });
        }

        $('#editConsumptionModal').openModal();
        $('#editDate_root').attr('tabindex', '-1');
        $('#editCount').focus();
      }
    });
  });
}

function addBeFriend() {
  var id = $('#beAddFriend').val().replace(/ /g, '-') + '-add';
  $('#beAddFriendBox').append('<div class="chip" id="' + id + '" onClick="$(\'#' + $('#beAddFriend').val().replace(/ /g, '-') + '-add\').remove();">' + $('#beAddFriend').val() + '</div>');
  $('#beAddFriend').val('');
}

function delBeFriend() {
  var id = $('#beDelFriend').val().replace(/ /g, '-') + '-del';
  $('#beDelFriendBox').append('<div class="chip" id="' + id + '" onClick="$(\'#' + $('#beDelFriend').val().replace(/ /g, '-') + '-del\').remove();">' + $('#beDelFriend').val() + '</div>');
  $('#beDelFriend').val('');
}

$('#addFriendForm').submit(function(event) {
  event.preventDefault();

  var friendName = $('#addFriend').val();
  makeAuthRequest('/consumption/friend', 'POST', JSON.stringify({
    consumption_id: $('#editID').val(),
    name: friendName
  }), 'json', function(err, data, code) {
    if (code !== 201) {
      Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
      return;
    }

    // make the friend visible
    // clear the no friend text if we have it
    $('#editFriendBox').html($('#editFriendBox').html().replace('No friends!', ''));

    $('#editFriendBox').append('<div class="chip" id="friend' + data[0].id + '" onClick="removeFriend(' + data[0].id + ')">' + data[0].name + '</div>');
    $('#addFriend').val('');
    drawConsumptions();
  });
});

function removeFriend(id) {
  makeAuthRequest('/consumption/friend', 'DELETE', JSON.stringify({
    id: id
  }), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
      return;
    }

    $('#friend' + id).remove();
    drawConsumptions();
  });
}

// fill in drug/method selectors, dates, etc. for creation and editing etc.
function setUpConsumptions() {
  // init new consumption date picker
  var $input = $('#addDate').pickadate({
    format: 'yyyy-mm-dd'
  });
  var picker = $input.pickadate('picker');
  picker.set('select', new Date());

  var date = new Date();
  $('#addTime').val(('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2));
  $('#addtimeLabel').addClass('active');

  setUpFriendsLoc();

  makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, data, code) {
    data.sort(function(a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();

      return (a < b) ? -1 : (a > b) ? 1 : 0;
    });

    if (data.length < 1) {
      $('.drug-input').each(function(entry) {
        $(this).append('<option value="" disabled selected>None</option>');
      });
      return;
    }

    data.forEach(function(drug) {
      $('.drug-input').each(function(entry) {
        $(this).append('<option value="' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
      });
    });
  });

  makeAuthRequest('/method/all', 'GET', null, 'json', function(err, data, code) {
    data.sort(function(a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();

      return (a < b) ? -1 : (a > b) ? 1 : 0;
    });

    if (data.length < 1) {
      $('.method-input').each(function(entry) {
        $(this).append('<option value="" disabled selected>None</option>');
      });
      return;
    }

    data.forEach(function(method) {
      $('.method-input').each(function(entry) {
        $(this).append('<option value="' + method.id + '">' + method.name + '</option>');
      });
    });
  });
}

function drawMedia() {
  makeAuthRequest('/media/search', 'POST', JSON.stringify({
    association_type: 'experience',
    association: experienceID
  }), 'json', function(err, data, code) {
    if (data === null) {
      // skip on empty
      return;
    }

    data.forEach(function(media, index) {
      if (index % 4 === 0) {
        // we're beginning a new row
        $('#media').append('<div id="row' + Math.floor(index / 4) + '" class="row"></div>');
      }

      var mediaUrl = getCookie('server') + '/media/file/' + media.id;
      $('#row' + Math.floor(index / 4)).append('<div class="col s12 m3"><div class="card"><div class="card-image">' +
        '<a id="imagelink' + media.id + '"><img id="image' + media.id + '"/><span class="card-title" style="background-color: rgba(0, 0, 0, 0.5);">' + media.title + '</span><a/></div>' +
        '<div class="card-content"><p>' + new Date(media.date * 1000).toISOString().slice(5, 16).replace(/T/, ' ').replace('-', '/') + '</p></div>' +
        '</div></div>');

      makeAuthBlobRequest('/media/file/' + media.id, function(data) {
        var url = window.URL || window.webkitURL;
        $('#image' + media.id).attr('src', url.createObjectURL(data));
        $('#imagelink' + media.id).attr('href', url.createObjectURL(data));
      });
    });
  });
}

function openNewModal() {
  // populate location with most common loc
  // build the location list

  if (consumptions) {
    var locations = consumptions.map(function(consumption) {
      return consumption.location;
    });

    // get the counts
    var counts = {};
    var max = 0;
    var commonLocation;
    locations.forEach(function(singleLocation) {
      counts[singleLocation] = (counts[singleLocation] || 0) + 1;
      if (counts[singleLocation] > max) {
        commonLocation = singleLocation;
      }
    });

    $('#addLocation').val(commonLocation);
    $('#locationLabel').addClass('active');
  }

  $('#addConsumptionModal').openModal();
  $('#addDate_root').attr('tabindex', '-1');
  $('#addCount').focus();
}

function bulkEdit() {
  if ($('.bulk-edit-selected').length === 0) {
    Materialize.toast("No consumptions selected", 1000, 'warning-toast');
    return;
  } else {
    var bcIDs = [];
    var bcCons = [];

    $('.bulk-edit-selected').each(function(entry) {
      bcIDs.push(Number($(this)[0].id.slice(4)));
    });

    consumptions.forEach(function(consumption) {
      if (bcIDs.indexOf(consumption.id) > -1) {
        bcCons.push(consumption);
      }
    });

    // populate editing list
    $('#beConList').empty();
    $('#beEntrieCount').html(bcIDs.length);

    bcCons.forEach(function(consumption) {
      var optFriends = 'None';
      if (consumption.friends.length > 0) {
        optFriends = consumption.friends.map(function(friend) {
          return friend.name;
        }).join(', ');
      }

      var entryString = '<td>' + new Date(consumption.date * 1000).toISOString().slice(5, 16).replace(/T/, ' ').replace('-', '/') + '</td>' +
        '<td>' + consumption.count + '</td>' +
        '<td>' + consumption.drug.unit + ' ' + consumption.drug.name + '</td>' +
        '<td>' + consumption.method.name + '</td>' +
        '<td>' + optFriends + '</td>';

      $('#beConList').append('<tr>' + entryString + '</tr>');
    });

    $('#beConsumptionModal').openModal();
  }
}

// create Add Experience submit listener
$('#addConsumption').submit(function(event) {
  event.preventDefault();

  var datetime = Math.floor(Date.parse($('#addDate').val()) / 1000);

  // add the time box
  var hours = Math.floor($('#addTime').val() / 100);
  var minutes = $('#addTime').val() % 100;
  var timeSeconds = (hours * 3600) + (minutes * 60);
  var timeStamp = (datetime + timeSeconds);

  var payload = {
    date: timeStamp,
    count: $('#addCount').val(),
    experience_id: experienceID,
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
    drawConsumptions();
    setUpMeta();
    Materialize.toast('Consumption created', 6000, 'success-toast');
    $('#addConsumptionModal').closeModal();
  });
});

// bulk consumption edit listener
$('#beConsumption').submit(function(event) {
  event.preventDefault();
  var ids = [];

  $('.bulk-edit-selected').each(function(entry) {
    ids.push(Number($(this)[0].id.slice(4)));
  });

  // start by doing all the non-friend stuff
  var payload = {};
  var dateOffset = 0;

  if ($('#beChangeCount').is(':checked')) {
    payload.count = Number($('#beCount').val());
  }

  if ($('#beChangeDate').is(':checked')) {
    dateOffset = Number($('#beDate').val());
  }

  if ($('#beChangeLocation').is(':checked')) {
    payload.location = $('#beLocation').val();
  }

  if ($('#beChangeDrug').is(':checked')) {
    payload.drug_id = Number($('#beDrug').val());
  }

  if ($('#beChangeMethod').is(':checked')) {
    payload.method_id = Number($('#beMethod').val());
  }

  var requests = [];
  consumptions.forEach(function(consumption) {
    if (ids.indexOf(consumption.id) > -1) {
      var customPayload = JSON.parse(JSON.stringify(payload));
      customPayload.id = consumption.id;
      customPayload.date = consumption.date + dateOffset * 60;

      requests.push({
        path: '/consumption',
        method: 'PUT',
        payload: JSON.stringify(customPayload),
        format: 'json'
      });

      $('#beAddFriendBox').children().each(function(newFriend) {
        var name = $(this).html();
        requests.push({
          path: '/consumption/friend',
          method: 'POST',
          payload: JSON.stringify({
            consumption_id: consumption.id,
            name: name
          }),
          format: 'json'
        });
      });

      var goodNameIDs = [];
      $('#beDelFriendBox').children().each(function(delFriend) {
        var name = $(this).html();
        consumption.friends.forEach(function(friend) {
          if (friend.name === name) {
            goodNameIDs.push(friend.id);
          }
        });

        goodNameIDs.forEach(function(id) {
          requests.push({
            path: '/consumption/friend',
            method: 'DELETE',
            payload: JSON.stringify({
              id: id
            }),
            format: 'json'
          });
        });
      });
    }
  });

  requests.forEach(function(request, index) {
    makeAuthRequest(request.path, request.method, request.payload, request.formay, function(err, data, code) {
      if (code !== 200 && code !== 201) {
        Materialize.toast(err + code, 6000, 'warning-toast');
      }

      if (index === requests.length - 1) {
        drawConsumptions();
        setUpMeta();
        Materialize.toast('Consumptions bulk edited', 6000, 'success-toast');
        $('#beConsumptionModal').closeModal();
      }
    });
  });
});

// consumption edit listener
$('#editConsumption').submit(function(event) {
  event.preventDefault();

  var datetime = Math.floor(Date.parse($('#editDate').val()) / 1000);

  // add the time box
  var hours = Math.floor($('#editTime').val() / 100);
  var minutes = $('#editTime').val() % 100;
  var timeSeconds = (hours * 3600) + (minutes * 60);
  var timeStamp = (datetime + timeSeconds);

  var payload = {
    id: $('#editID').val(),
    date: timeStamp,
    count: $('#editCount').val(),
    experience_id: experienceID,
    drug_id: $('#editDrug').val(),
    method_id: $('#editMethod').val(),
    location: $('#editLocation').val()
  };

  makeAuthRequest('/consumption', 'PUT', JSON.stringify(payload), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
      return;
    }

    // draw consumptions, which will include our new one
    drawConsumptions();
    setUpMeta();
    Materialize.toast('Consumption edited', 6000, 'success-toast');
    $('#editConsumptionModal').closeModal();
  });
});

$(document).ready(function() {
  // catch recent before we keep keep going
  if (experienceID === 'recent') {
    var recentLimiter = JSON.stringify({
      limit: 1
    });

    makeAuthRequest('/experience/search', 'POST', recentLimiter, 'json', function(err, data, code) {
      if (code !== 200) {
        // no recents; back to Experiences
        window.location = '/experiences.html';
        return;
      }
      window.location = '/experience.html?' + data[0].id;
    });
    return;
  }

  makeAuthRequest('/experience/' + experienceID, 'GET', null, 'json', function(err, data, code) {
    if (code === 404 || code === 400) {
      // no Experiences
      $('#loading').hide();
      $('#noExperience').show();
      return;
    }

    masterExp = data;

    // load title and date
    $('#title').text(data.title);
    document.title = data.title + ' | SupTracked';

    var date = new Date(data.date * 1000);
    $('#date').text(date.toISOString().slice(0, 10));


    makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, data, code) {
      data.forEach(function(drug) {
        drugs[drug.id] = drug;
      });

      drawConsumptions();
      drawMedia();
      setUpConsumptions();
      setUpMeta();
    });

    // load notes
    $('#notesArea').text(data.notes);
    $('#notesArea').trigger('autoresize');

    $('#notesMarkdown').html(cleanMarkdown(micromarkdown.parse($('#notesArea').val())));

    // lift the curtain
    $('#loading').hide();
    $('#main').show();
    $('ul.tabs').tabs('select_tab', 'consumptions');
  });
});

// listen to save text area
$("#notesArea").on('change keyup paste', function() {
  clearTimeout(noteSaveNotificationTimeout);
  noteSaveNotificationTimeout = setTimeout(function() {
    makeAuthRequest('/experience', 'PUT', JSON.stringify({
      id: experienceID,
      notes: $("#notesArea").val()
    }), 'json', function(err, data, code) {
      if (code !== 200) {
        Materialize.toast('Notes save error: ' + err, 6000, 'warning-toast');
        return;
      }

      Materialize.toast('Notes saved', 1000, 'success-toast');
    });
  }, 1000);
});

$("#beAddFriend").on('keydown', function(e) {
  if (e.which === 13) {
    event.preventDefault();
    addBeFriend();
  }
});

$("#beDelFriend").on('keydown', function(e) {
  if (e.which === 13) {
    event.preventDefault();
    delBeFriend();
  }
});

// listen on meta change
$("#metaTitle, #metaDate, #metaPanic, #metaRating, #metaTTime, #metaGroupDrug, #metaGroupCount, input[name='interactionDrug']").on('change keyup paste', function() {
  if (initialMetaMsgFired) {
    // only fire if this isn't generated by our loading/futzing
    clearTimeout(metaSaveNotificationTimeout);

    // determine if we're nulling or saving groupings
    var groupDrugSet = null,
      groupCountSet = null;
    if ($('#metaGroupDrug').val() !== "0") {
      groupDrugSet = $('#metaGroupDrug').val();
      if ($('#metaGroupCount').val().length < 1) {
        groupCountSet = 1;
      } else {
        groupCountSet = $('#metaGroupCount').val();
      }
    }

    metaSaveNotificationTimeout = setTimeout(function() {
      var updateObj = {
        id: experienceID,
        title: $('#metaTitle').val(),
        date: Math.floor(new Date($('#metaDate').val() + 'T00:00:00').getTime() / 1000),
        panicmsg: $('#metaPanic').val(),
        groupCount: groupCountSet,
        groupDrug: groupDrugSet,
        rating_id: $('#metaRating').val(),
        ttime: $('#metaTTime').val()
      };
      makeAuthRequest('/experience', 'PUT', JSON.stringify(updateObj), 'json', function(err, data, code) {
        if (code !== 200) {
          Materialize.toast('Metadata save error: ' + err, 6000, 'warning-toast');
          return;
        }

        // load the new title
        $('#title').text($('#metaTitle').val());
        Materialize.toast('Metadata saved.', 1000);
      });
    }, 1000);
  } else {
    initialMetaMsgFired = 1;
  }
});

$("input[name='interactionDrug']").on('change', function() {
  // listen on interaction change
  var interactions = [];
  $("input[name='interactionDrug']:checked").each(function(interactionDrug) {
    interactions.push(this.id.split('interactionDrug')[1]);
  });

  var interactionsString = '[' + interactions.join(', ') + ']';

  var updateObj = {
    id: experienceID,
    interactions: interactionsString
  };
  makeAuthRequest('/experience', 'PUT', JSON.stringify(updateObj), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast('Interactions save error: ' + err, 6000, 'warning-toast');
      return;
    }

    Materialize.toast('Interactions saved.', 1000);

    $('#interactionList').html(interactions.map(function(interaction) {
      return drugs[interaction].name;
    }).join(', '));
  });
});

// add click listener to reveal text box
$("#notesMarkdown").on("click", function() {
  $("#notesMarkdown").hide();
  $("#notesArea").show();
});

// listener for quick cons
$(window).keydown(function(e) {
  if (e.keyCode === 18) {
    $('#quickConList').empty();
    var groupedConsumptionList = collateConsumptions(consumptions);
    for (var drug in groupedConsumptionList) {
      $('#quickConList').append('<li>' + (Math.round(groupedConsumptionList[drug].count * 100) / 100) + ' ' + groupedConsumptionList[drug].unit + ' ' + drug + '</li>');
    }
    $('#quickConList').show();
    $('.delta').show();
    $('.rollingTotal').show();
  }
});

$(document).click(function(event) {
  if ($(event.target)[0].id.startsWith('con-')) {
    $(event.target).toggleClass('bulk-edit-selected');
    if ($('.bulk-edit-selected').length > 0) {
      $('.bulk-edit-button').show();
    } else {
      $('.bulk-edit-button').hide();
    }
  }
});
