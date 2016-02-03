/* globals makeAuthRequest,Materialize */

// these are predefined in the master analytics.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, drug;

analyticsCount += 2;

function top_listings() {
  "use strict";

  // location calculations
  var locationCount = {};

  allConsumptions.forEach(function(consumption){
    if(locationCount.hasOwnProperty(consumption.location)){
      locationCount[consumption.location] = locationCount[consumption.location] + 1;
    } else {
      locationCount[consumption.location] = 1;
    }
  });

  var locationKeys = Object.keys(locationCount);

  locationKeys.sort(function(a, b) {
    return (locationCount[a] > locationCount[b]) ? -1 : (locationCount[a] < locationCount[b]) ? 1 : 0;
  });

  locationKeys = locationKeys.slice(0, 10);

  var locationHTML = '<ol>' + locationKeys.map(function(location){
    return '<li>' + location + ' (' + locationCount[location] + ' consumptions/' + Math.round((locationCount[location] / allConsumptions.length) * 100, -1) + '%)</li>';
  }).join('') + '</ol>';

  $('#topLocations').append(locationHTML);

  analyticsFinished += 1;

  // friend calculations
  var friendCount = {};

  allConsumptions.forEach(function(consumption){
    consumption.friends.forEach(function(friend){
      if(friendCount.hasOwnProperty(friend.name)){
        friendCount[friend.name] = friendCount[friend.name] + 1;
      } else {
        friendCount[friend.name] = 1;
      }
    });
  });

  var friendNames = Object.keys(friendCount);

  friendNames.sort(function(a, b) {
    return (friendCount[a] > friendCount[b]) ? -1 : (friendCount[a] < friendCount[b]) ? 1 : 0;
  });

  friendNames = friendNames.slice(0, 10);

  var friendHTML = '<ol>' + friendNames.map(function(friendName){
    return '<li>' + friendName + ' (' + friendCount[friendName] + ' consumptions)</li>';
  }).join('') + '</ol>';

  if(friendNames.length === 0){
    $('#topFriends').append("<i>None</i>");
  } else {
    $('#topFriends').append(friendHTML);
  }

  analyticsFinished += 1;
}
