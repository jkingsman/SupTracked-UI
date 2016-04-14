/* globals makeAuthRequest,Materialize */

// these are predefined in the master analytics.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, drug, allExperiences;

analyticsCount += 1;

function experience_list() {
  "use strict";

  $('#experienceContainer').empty();

  allExperiences.forEach(function(experience) {
    if (experience.title.length < 1) {
      experience.title = '[none]';
    }

    var totalCount = 0;
    experience.consumptions.forEach(function(consumption) {
      if (consumption.drug.id === drug.id) {
        totalCount += consumption.count;
      }
    });

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

    $('#experienceContainer').append('<li class="collection-item">' + new Date(experience.date * 1000).toISOString().slice(0, 10) + '<span class="right hide-on-med-and-down" style="max-width: 50%;">' + groupedFriendsString + ' at <strong>' + groupedLocationsString + '</strong></span><h5><a href="/experience.html?' + experience.id + '">' + experience.title + '</a></h5><div class="pad-left-40">' + totalCount + ' ' + drug.unit + ' ' + drug.name + '</div></li>');
  });
  analyticsFinished += 1;
}
