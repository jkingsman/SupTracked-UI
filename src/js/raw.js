/* globals makeAuthRequest,Materialize */
/* jshint -W089 */

"use strict";

var fullData;
var results;

makeAuthRequest('/experience/search', 'POST', JSON.stringify({
  'limit': 10
}), 'json', function(err, data, code) {
  if (code === 404) {
    Materialize.toast("No experiences", 6000, 'danger-toast');
    return;
  }

  // get it into date order
  data.sort(function(a, b) {
    return parseFloat(b.date) - parseFloat(a.date);
  });

  fullData = data;

  $('#status').html('Loaded! Accessible in <span style="font-family: monospace;">fullData</span>');
  $('#status').css('color', 'green');
});

// entry is a JSON entry
// keyarray is an array of descending json key names
function getKeyVal(entry, keyArray) {
  var keyError = false;
  keyArray.forEach(function(keyString) {
    if (!keyError) {
      if (entry.hasOwnProperty(keyString)) {
        entry = entry[keyString];
      } else {
        console.log("Invalid key name " + keyString + " in array " + keyArray.join('.') + ' while searching data');
        keyError = true;
        return;
      }
    } else {
      return;
    }
  });

  if (!keyError) {
    return entry;
  }
}

function compute_EQ(val1, val2) {
  return val1 === val2;
}

function compute_GT(val1, val2) {
  return val1 > val2;
}

function compute_LT(val1, val2) {
  return val1 < val2;
}

function compute_GE(val1, val2) {
  return val1 >= val2;
}

function compute_LE(val1, val2) {
  return val1 <= val2;
}

function compute_INC(val1, val2) {
  return String(val1).indexOf(String(val2)) > -1;
}

// data - raw array
// field - fieldname (date, or drug.name, drug.id)
// value - comparison value
// compType - EQ, GT, LT, GE, LE, INC
function queryConsumption(data, field, value, compType) {
  // can be queried in place
  var statics = ['count', 'date', 'experience_id', 'location', 'owner'];
  // can be queried as children
  var subfields = ['method', 'drug'];
  var matchingIDs = [];

  data.forEach(function(dataField, index) {
    // dynamic comparator call
    dataField.consumptions.forEach(function(consumption) {

      if (statics.indexOf(field) > -1) {
        // easy lookup
        if (window['compute_' + compType](consumption[field], value)) {
          if (matchingIDs.indexOf(index) < 0) {
            // no duplicates
            matchingIDs.push(index);
          }
        }
      } else {
        //special lookup
        var seekComponents = field.split('.');
        if (subfields.indexOf(seekComponents[0]) > -1) {
          // drug or method
          if (window['compute_' + compType](consumption[seekComponents[0]][seekComponents[1]], value)) {
            if (matchingIDs.indexOf(index) < 0) {
              // no duplicates
              matchingIDs.push(index);
            }
          }
        } else if (seekComponents[0] === 'friends') {
          consumption.friends.forEach(function(friend) {
            if (window['compute_' + compType](friend[seekComponents[1]], value)) {
              if (matchingIDs.indexOf(index) < 0) {
                // no duplicates
                matchingIDs.push(index);
              }
            }
          });
        } else {
          console.log("no such field.");
        }
      }
    });
  });

  return fullData.filter(function(data, index) {
    // filter to only those contained in the matching array
    return matchingIDs.indexOf(index) > -1;
  });
}

// data - raw array
// field - fieldname (ttime, etc.)
// value - comparison value
// compType - EQ, GT, LT, GE, LE, INC
function queryExperience(data, field, value, compType) {
  var matchingIDs = [];
  data.forEach(function(dataField, index) {
    if (window['compute_' + compType](dataField[value], value)) {
      if (matchingIDs.indexOf(index) < 0) {
        // no duplicates
        matchingIDs.push(index);
      }
    }
  });

  return fullData.filter(function(data, index) {
    // filter to only those contained in the matching array
    return matchingIDs.indexOf(index) > -1;
  });
}

// two data arrays
function intersect(data1, data2){
  var loadedIDs = [];
  var allExperiences = [];
  data1.forEach(function (experience){
    if(loadedIDs.indexOf(experience.id) < 0){
      // don't have it; load it
      allExperiences.push(experience);
    }
  });

  data2.forEach(function (experience){
    if(loadedIDs.indexOf(experience.id) < 0){
      // don't have it; load it
      allExperiences.push(experience);
    }
  });

  return allExperiences;
}

// direction: -1 ASC, 1 DESC
function sortByField(data, field, direction) {
  return data.sort(function(a, b) {
    var sortA = a;
    var sortB = b;

    field.split('.').forEach(function(fieldName) {
      // get vals of field we sort on
      sortA = sortA[fieldName];
      sortB = sortB[fieldName];
    });

    if (sortA < sortB) {
      return direction;
    }
    if (sortB < sortA) {
      return -1;
    }

    return 0;
  });
}
