/* globals makeAuthRequest,Materialize */
/* jshint -W016 */

// these are predefined in the master historical.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, allExperiences;

analyticsCount += 1;

function drug_info() {
  "use strict";

  var classes = [], families = [], rarity = [];

  allConsumptions.forEach(function(consumption){
    classes.push(allDrugs[consumption.drug.id].classification);
    families.push(allDrugs[consumption.drug.id].family);
    rarity[allDrugs[consumption.drug.id].rarity] = (rarity[allDrugs[consumption.drug.id].rarity] + 1) || 1;
  });

  var classesCount = [], familiesCount = [];

  // classes
  classes.forEach(function(singleClass){
    classesCount[singleClass] = (classesCount[singleClass] + 1) || 1;
  });

  var classArray = [];
  for (var k in classesCount) {
    if (classesCount.hasOwnProperty(k)) {
      classArray.push({
        name: k,
        count: classesCount[k]
      });
    }
  }

  var classesStrings = classArray.sort(function(a, b) {
    return b.count - a.count;
  }).map(function(singleClass) {
    return '<strong>' + singleClass.name + '</strong>:' + singleClass.count + ' (' + Math.round((singleClass.count / allConsumptions.length) * 100) + '%)';
  });

  var classesString = '<ul>' + classesStrings.join('</li><li>') + '</li>';

  $('#classifications').html(classesString);

  // families
  families.forEach(function(family){
    familiesCount[family] = (familiesCount[family] + 1) || 1;
  });

  var familyArray = [];
  for (var j in familiesCount) {
    if (familiesCount.hasOwnProperty(j)) {
      familyArray.push({
        name: j,
        count: familiesCount[j]
      });
    }
  }

  var familyStrings = familyArray.sort(function(a, b) {
    return b.count - a.count;
  }).map(function(family) {
    return '<strong>' + family.name + '</strong>: ' + family.count + ' (' + Math.round((family.count / allConsumptions.length) * 100) + '%)';
  });

  var familyString = '<ul>' + familyStrings.join('</li><li>') + '</li>';

  $('#families').html(familyString);

  // rarity
  $('#rarities').append('<span class="blue white-text" style="padding: 3px; border-radius: 24px;">Very Common</span> -- ' + (rarity[0] | '-') + '<br><br>');
  $('#rarities').append('<span class="green white-text" style="padding: 3px; border-radius: 24px;">Common</span> -- ' + (rarity[1] | '-') + '<br><br>');
  $('#rarities').append('<span class="purple white-text" style="padding: 3px; border-radius: 24px;">Uncommon</span> -- ' + (rarity[2] | '-') + '<br><br>');
  $('#rarities').append('<span class="red white-text" style="padding: 3px; border-radius: 24px;">Rare</span> -- ' + (rarity[3] | '-') + '<br><br>');

  analyticsFinished += 1;
}
