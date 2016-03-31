/* globals makeAuthRequest,Materialize */
/* jshint -W089 */

// these are predefined in the master historical.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, allExperiences;

analyticsCount += 1;

function experience_list() {
  "use strict";

  allExperiences.forEach(function(experience) {
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

  analyticsFinished += 1;
}
