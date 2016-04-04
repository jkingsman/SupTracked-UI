/* globals makeAuthRequest,Materialize */

// these are predefined in the master analytics.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, allExperiences;

analyticsCount += 1;

function friends() {
  "use strict";

  var friendCounts = [];
  allConsumptions.forEach(function(consumption) {
    if(consumption.friends.length === 0){
      if(friendCounts.hasOwnProperty('Solo')){
        friendCounts.Solo = friendCounts.Solo + 1;
      } else {
        friendCounts.Solo = 1;
      }
      return;
    }

    consumption.friends.forEach(function(friend) {
      if (friendCounts.hasOwnProperty(friend.name)) {
        friendCounts[friend.name] = friendCounts[friend.name] + 1;
      } else {
        friendCounts[friend.name] = 1;
      }
    });
  });

  // format and show friends
  var friendArray = [];
  for (var k in friendCounts) {
    if (friendCounts.hasOwnProperty(k)) {
      friendArray.push({
        name: k,
        count: friendCounts[k]
      });
    }
  }

  var friendStrings = friendArray.sort(function(a, b) {
    return b.count - a.count;
  }).map(function(friend) {
    return friend.count + ' (' + Math.round((friend.count / allConsumptions.length) * 100) + '%) with ' + friend.name;
  });

  var friendString = '<ul class="pad-left-40">' + friendStrings.join('</li><li>') + '</li>';
  $('#friends').html(friendString);

  analyticsFinished += 1;
}
