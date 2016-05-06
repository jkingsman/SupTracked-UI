/* globals makeAuthRequest,Materialize */
/* jshint -W069 */
"use strict";

var consumption = {};
var experiences;
var unit;

// initialize date picker & time
var $input = $('.datepicker').pickadate();
var picker = $input.pickadate('picker');
picker.set('select', new Date());

// set up default title
var actions = ['Shenanigans', 'Chillaxment', 'Fun', 'Amusement', 'Things', 'Hoopla', 'BS', 'Funtime', 'Smorgasbord '];
var action = actions[Math.floor(Math.random() * actions.length)];
var hour = new Date().getHours();
var timing;
if (hour >= 0 && hour <= 4) {
  timing = 'Early Morning';
} else if (hour >= 5 && hour <= 9) {
  timing = 'Mid Morning';
} else if (hour >= 10 && hour <= 14) {
  timing = 'Mid Day';
} else if (hour >= 15 && hour <= 19) {
  timing = 'Evening';
} else if (hour >= 19 && hour <= 23) {
  timing = 'Night';
}

var title = timing + ' ' + action + ' (Autotitle)';
$('#title').val(title);

// set listeners for the title box
$('#title').focus(function() {
  if ($('#title').val() === title) {
    $('#title').val('');
  }
});

$('#title').focusout(function() {
  if ($('#title').val() === '') {
    $('#title').val(title);
  }
});

// retrieve a week of back data
var drugData = {};
makeAuthRequest('/experience/search', 'POST', JSON.stringify({
  startdate: Math.round(+new Date() / 1000) - 604800,
  enddate: Math.round(+new Date() / 1000)
}), 'json', function(err, data, code) {
  experiences = data;
  experiences.forEach(function(experience) {
    experience.consumptions.forEach(function(consumption) {
      // new drug
      if (!drugData.hasOwnProperty(consumption.drug.name)) {
        drugData[consumption.drug.name] = consumption.drug;
      }
    });
  });

  for (var key in drugData) {
    if (drugData.hasOwnProperty(key)) {
      $('#drugList').append('<a href="#" class="collection-item" onclick="setDrug(' + drugData[key]['id'] + ', \'' + btoa(key) + '\', \'' + btoa(drugData[key]['unit']) + '\');">' + key + '</a>');
    }
  }
});

function setTitle(){
  consumption.title = $('#title').val();
  consumption.date = Math.floor((new Date().getTime() - (new Date().getTimezoneOffset()) * 60000) / 1000);
  $('ul.tabs').tabs('select_tab', 'drug');
}

function setDrug(id, name, unit) {
  consumption.drug = id;
  consumption.drugName = atob(name);
  consumption.drugUnit = atob(unit);
  var methods = [];

  experiences.forEach(function(experience) {
    experience.consumptions.forEach(function(consumption) {
      if (consumption.drug.id === id) {
        methods[consumption.method.id] = consumption.method.name;
      }
    });
  });

  $('#methodList').empty();
  for (var key in methods) {
    if (methods.hasOwnProperty(key)) {
      $('#methodList').append('<a href="#" class="collection-item" onclick="setMethod(' + key + ', \'' + btoa(methods[key]) + '\');">' + methods[key] + '</a>');
    }
  }

  $('ul.tabs').tabs('select_tab', 'method');
}

function setMethod(id, name) {
  consumption.method = id;
  consumption.methodName = atob(name);
  $('#unit').html('(' + consumption.drugUnit + ')');
  $('ul.tabs').tabs('select_tab', 'count');
}

function setCount(count) {
  consumption.count = count;
  var friends = [];

  experiences.forEach(function(experience) {
    experience.consumptions.forEach(function(consumption) {
      consumption.friends.forEach(function(friendEntry) {
        if (friends.indexOf(friendEntry.name) === -1) {
          friends.push(friendEntry.name);
        }
      });
    });
  });

  friends.forEach(function(friend) {
    $('#friendList').append('<input id="' + friend + '" name="friendEntry" type="checkbox"><label for="' + friend + '">' + friend + '</label><br />');
  });

  $('ul.tabs').tabs('select_tab', 'friends');
}

function setFriends() {
  consumption.friends = $('input[type="checkbox"][name="friendEntry"]:checked').map(function() {
    return this.id;
  }).get();

  var locations = [];

  experiences.forEach(function(experience) {
    experience.consumptions.forEach(function(consumption) {
        if (locations.indexOf(consumption.location) === -1) {
          locations.push(consumption.location);
        }
    });
  });

  locations.forEach(function(location) {
    $('#locationList').append('<a href="#" class="collection-item" onclick="setLocation(\'' + btoa(location)   + '\');">' + location + '</a>');
  });

  $('ul.tabs').tabs('select_tab', 'location');
}

function setLocation(location){
  consumption.location = atob(location);

  $('#fTitle').html(consumption.title);
  $('#fDate').html(new Date(consumption.date * 1000).toISOString().slice(0, 16).replace(/T/, ' '));
  $('#fCon').html(consumption.count + ' ' + consumption.drugUnit + ' ' + consumption.drugName + ' ' + consumption.methodName);
  $('#fLoc').html(consumption.location);

  var friendList;
  if(consumption.friends.length === 0){
    friendList = '[none]';
  } else {
    friendList = consumption.friends.join(', ');
  }

  $('#fFriends').html(friendList);
  $('ul.tabs').tabs('select_tab', 'finalize');
}

function create(){
  makeAuthRequest('/experience', 'POST', JSON.stringify({
    title: consumption.title,
    date: consumption.date
  }), 'json', function(err, data, code) {
    if (err) {
      Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
      return;
    }

    Materialize.toast('Experience created', 6000, 'success-toast');

    var payload = {
      date: consumption.date,
      count: consumption.count,
      experience_id: data.id,
      drug_id: consumption.drug,
      method_id: consumption.method,
      location: consumption.location
    };

    makeAuthRequest('/consumption', 'POST', JSON.stringify(payload), 'json', function(err, conData, code) {
      if (err) {
        Materialize.toast(err.charAt(0).toUpperCase() + err.slice(1), 6000, 'warning-toast');
        return;
      }

      Materialize.toast('Consumption created', 6000, 'success-toast');

      if(consumption.friends.length === 0){
        window.location.href = '/quick.html';
        return;
      }

      consumption.friends.forEach(function(friend, index) {
        makeAuthRequest('/consumption/friend', 'POST', JSON.stringify({
          consumption_id: conData.id,
          name: friend
        }), 'json', function(err, data, code) {
          if (index === (consumption.friends.length - 1)) {
            Materialize.toast('Friends added', 6000, 'success-toast');
            window.location.href = '/quick.html';
          }
        });
      });
    });


  });
}
