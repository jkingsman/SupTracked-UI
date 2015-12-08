/* globals makeAuthRequest,Materialize */
/* jshint -W089 */

"use strict";

var currentBatch = 0;
var batchSize = 10;
var atEnd = false;

makeAuthRequest('/experience/search', 'POST', JSON.stringify({
  limit: 1
}), 'json', function(err, data, code) {
  if (code === 404) {
    // no Experiences
    $('#loading').hide();
    $('#emptyExperiences').show();
  }
});

function loadMore() {
  if (!atEnd) {
    makeAuthRequest('/experience/search', 'POST', JSON.stringify({
      limit: batchSize,
      offset: currentBatch * batchSize
    }), 'json', function(err, data, code) {
      // we've got an incomplete page and at the end
      if (code !== 404) {
        // we're not at the end yet; bump it up
        currentBatch += 1;
      } else {
        atEnd = true;
      }

      // get it into date order
      data.sort(function(a, b) {
        return parseFloat(b.date) - parseFloat(a.date);
      });

      data.forEach(function(experience) {
        if (experience.title.length < 1) {
          experience.title = '[none]';
        }

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
        var stringifiedConsumptions = [];

        if (Object.keys(groupedConsumptionList).length > 0) {
          for (var drug in groupedConsumptionList) {
            stringifiedConsumptions.push(groupedConsumptionList[drug].count + ' ' + groupedConsumptionList[drug].unit + ' ' + drug);
          }
        } else {
          stringifiedConsumptions.push('no consumptions');
        }

        // compile friends list
        var groupedFriendsList = [];
        var groupedFriendsString = 'Solo Experience';

        experience.consumptions.forEach(function(consumption) {
          consumption.friends.forEach(function(friend) {
            if (groupedFriendsList.indexOf(friend.name) === -1) {
              groupedFriendsList.push(friend.name);
            }
          });
        });

        if (groupedFriendsList.length > 0) {
          groupedFriendsString = groupedFriendsList.join(', ');
        }

        // compile locations
        var groupedLocationsList = [];
        var groupedLocationsString = '[no location]';

        experience.consumptions.forEach(function(consumption) {
          if (groupedLocationsList.indexOf(consumption.location) === -1) {
            groupedLocationsList.push(consumption.location);
          }
        });

        if (groupedLocationsList.length > 0) {
          groupedLocationsString = groupedLocationsList.join(', ');
        }

        $('#experiences-collection').append('<li class="collection-item">' + new Date(experience.date * 1000).toISOString().slice(0, 10) + '<span class="right hide-on-med-and-down" style="max-width: 50%;">' + groupedFriendsString + ' at <strong>' + groupedLocationsString + '</strong></span><h5><a href="/experience.html?' + experience.id + '">' + experience.title + '</a></h5><div class="pad-left-40">' + stringifiedConsumptions.join('<br />') + '</div></li>');
      });

      $('#loading').hide();
      $('#experiences').show();
    });
  }
}

var autoLoader = function() {
  if ($(window).scrollTop() + $(window).height() > $(document).height() - 50) {
    loadMore();
  }
};

function prepareFilter() {
  var today = new Date();
  var dateString = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2) + ' ' + ('0' + today.getHours()).slice(-2) + ('0' + today.getMinutes()).slice(-2);
  $('#filterEndDate').val(dateString);
  $('#filterStartDate').val('1975-01-01 0000');

  makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, data, code) {
    data.forEach(function(drug) {
      $('#drugs').append('<option>' + drug.name + '</option>');
    });
  });

  makeAuthRequest('/method/all', 'GET', null, 'json', function(err, data, code) {
    data.forEach(function(method) {
      $('#methods').append('<option>' + method.name + '</option>');
    });
  });

  makeAuthRequest('/consumption/friends', 'GET', null, 'json', function(err, data, code) {
    data.forEach(function(friend) {
      $('#friends').append('<option>' + friend.name + '</option>');
    });
  });
}

$('#filterForm').submit(function(event) {
  event.preventDefault();
  document.activeElement.blur();

  var filterCriteria = {};

  if ($('#filterTitle').val().length > 0) {
    filterCriteria.title = $('#filterTitle').val();
  }

  if ($('#filterNotes').val().length > 0) {
    filterCriteria.notes = $('#filterNotes').val();
  }

  if ($('#filterRating').val() > -1) {
    filterCriteria.rating_id = $('#filterRating').val();
  }

  // assemble start date
  var startDate = $('#filterStartDate').val().split(' ')[0];
  var startTime = $('#filterStartDate').val().split(' ')[1];
  var startDateStamp = Math.floor(new Date(startDate).getTime() / 1000);

  // add hours and minutes
  startDateStamp += Math.floor(startTime / 100) * 3600;
  startDateStamp += (startTime - (Math.floor(startTime / 100) * 100)) * 60;

  // assemble end date
  var endDate = $('#filterEndDate').val().split(' ')[0];
  var endTime = $('#filterEndDate').val().split(' ')[1];
  var endDateStamp = Math.floor(new Date(endDate).getTime() / 1000);

  // add hours and minutes
  endDateStamp += Math.floor(endTime / 100) * 3600;
  endDateStamp += (endTime - (Math.floor(endTime / 100) * 100)) * 60;

  filterCriteria.startdate = startDateStamp;
  filterCriteria.enddate = endDateStamp;

  makeAuthRequest('/experience/search', 'POST', JSON.stringify(filterCriteria), 'json',
    function(err, data, code) {
      $(".collection-item").remove(); // clear existing entries
      $(window).off("scroll", autoLoader); // stop listening for scroll; we're loading them all at once now

      // collapse the filter and go to top
      $('.collapsible-header').click();
      $(window).scrollTop(0);

      if (data) {
        data.sort(function(a, b) {
          return parseFloat(b.date) - parseFloat(a.date);
        });

        data.forEach(function(experience) {
          // how we do a ghetto high speed search without parsing json
          var conString = JSON.stringify(experience.consumptions).toLowerCase();
          if (conString.indexOf($('#filterLocation').val().toLowerCase()) === -1 ||
            conString.indexOf($('#filterFriends').val().toLowerCase()) === -1 ||
            conString.indexOf($('#filterDrug').val().toLowerCase()) === -1 ||
            conString.indexOf($('#filterMethod').val().toLowerCase()) === -1) {
            // don't match our criteria
            return;
          }


          if (experience.title.length < 1) {
            experience.title = '[none]';
          }

          // compile thr consumptions, grouped by drug
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
          var stringifiedConsumptions = [];

          if (Object.keys(groupedConsumptionList).length > 0) {
            for (var drug in groupedConsumptionList) {
              stringifiedConsumptions.push(groupedConsumptionList[drug].count + ' ' + groupedConsumptionList[drug].unit + ' ' + drug);
            }
          } else {
            stringifiedConsumptions.push('no consumptions');
          }

          // compile friends list
          var groupedFriendsList = [];
          var groupedFriendsString = 'Solo Experience';

          experience.consumptions.forEach(function(consumption) {
            consumption.friends.forEach(function(friend) {
              if (groupedFriendsList.indexOf(friend.name) === -1) {
                groupedFriendsList.push(friend.name);
              }
            });
          });

          if (groupedFriendsList.length > 0) {
            groupedFriendsString = groupedFriendsList.join(', ');
          }

          // compile locations
          var groupedLocationsList = [];
          var groupedLocationsString = '[no location]';

          experience.consumptions.forEach(function(consumption) {
            if (groupedLocationsList.indexOf(consumption.location) === -1) {
              groupedLocationsList.push(consumption.location);
            }
          });

          if (groupedLocationsList.length > 0) {
            groupedLocationsString = groupedLocationsList.join(', ');
          }

          $('#experiences-collection').append('<li class="collection-item">' + new Date(experience.date * 1000).toISOString().slice(0, 10) + '<span class="right hide-on-med-and-down" style="max-width: 50%;">' + groupedFriendsString + ' at <strong>' + groupedLocationsString + '</strong></span><h5><a href="/experience.html?' + experience.id + '">' + experience.title + '</a></h5><div class="pad-left-40">' + stringifiedConsumptions.join('<br />') + '</div></li>');
        });
      } else {
        // no records
        $('#experiences-collection').append('<li class="collection-item"><h5>No results</h5></li>');
      }
    });
});

loadMore();
prepareFilter();
$(window).scroll(autoLoader);
