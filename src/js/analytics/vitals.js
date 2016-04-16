/* globals makeAuthRequest,Materialize */

// these are predefined in the master analytics.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, drug;

analyticsCount += 1;

function vitals() {
  "use strict";

  // get ranking
  allDrugs.sort(function(a, b) {
    return (a.use_count < b.use_count) ? 1 : (a.use_count > b.use_count) ? -1 : 0;
  });

  var rankings = allDrugs.map(function(singleDrug) {
    return singleDrug.name;
  });

  var ranking = rankings.indexOf(drug.name);

  var precedeString = '';
  if (ranking > 0) {
    precedeString = 'preceded by <a href="/analytics.html?' + allDrugs[ranking - 1].id + '">' + rankings[ranking - 1] + '</a>';
  }

  var followString = '';
  if (ranking !== (rankings.length - 1)) {
    followString = 'followed by <a href="/analytics.html?' + allDrugs[ranking + 1].id + '">' + rankings[ranking + 1] + '</a>';
  }

  var totalDosage = 0;
  allConsumptions.forEach(function(consumption) {
    if (consumption.drug.id === drug.id) {
      totalDosage += consumption.count;
    }
  });

  var surroundingString;
  if (precedeString && followString) {
    surroundingString = '(' + precedeString + ' and ' + followString + ')';
  } else if (precedeString) {
    surroundingString = '(' + precedeString + ')';
  } else if (followString) {
    surroundingString = '(' + followString + ')';
  } else {
    surroundingString = '';
  }

  $('#ranking').html('#' + (ranking + 1) + ' by usage with ' + allDrugs[ranking].use_count + ' uses/' + totalDosage + ' ' + drug.unit + ' <i>' + surroundingString + '</i>');

  // first and last usage
  $('#useFirst').html(new Date(allConsumptions[0].date * 1000).toISOString().slice(0, 16).replace(/T/, ' ').replace(':', '') + ' -- <a href="/experience.html?' + allConsumptions[0].exp_id + '">' + allConsumptions[0].title + '</a>');
  $('#useLast').html(new Date(allConsumptions[allConsumptions.length - 1].date * 1000).toISOString().slice(0, 16).replace(/T/, ' ').replace(':', '') + ' -- <a href="/experience.html?' + allConsumptions[allConsumptions.length - 1].exp_id + '">' + allConsumptions[allConsumptions.length - 1].title + '</a>');

  // largest consumption
  var consumptionDup = JSON.parse(JSON.stringify(allConsumptions));
  consumptionDup.sort(function(a, b) {
    return b.count - a.count;
  });

  var topCons = consumptionDup.slice(0, 3).map(function(consumption) {
    return '<li>' + new Date(consumption.date * 1000).toISOString().slice(0, 16).replace(/T/, ' ').replace(':', '') + ' -- ' + consumption.count + ' ' + drug.unit + ' -- <a href="/experience.html?' + consumption.exp_id + '">' + consumption.title + '</a></li>';
  });

  $('#largeDose').html('<ul class="pad-left-40">' + topCons.join('') + '</ul>');

  // longest streak calc

  // create an array of dates used (represented in days since the epoch) and drop the duplicatess
  var datesUsed = allConsumptions.map(function(consumption) {
    return Math.floor(new Date(consumption.date * 1000) / 8.64e7);
  });

  // drop the duplicates
  datesUsed = datesUsed.filter(function(item, pos) {
    return datesUsed.indexOf(item) === pos;
  });

  var streaks = [];
  var currentStreak = {};
  datesUsed.forEach(function(date, index) {
    // edge case - first entry
    if (index === 0) {
      // first entry
      currentStreak.startDate = date;
      currentStreak.days = 1;
      return;
    }

    // edge case - last entry
    if (index === datesUsed.length - 1) {
      streaks.push({
        startDate: currentStreak.startDate,
        days: currentStreak.days
      });
      return;
    }

    if (date - datesUsed[index - 1] === 1) {
      // date difference is one; they're consecutive
      currentStreak.days += 1;
    } else {
      // streak is broken
      streaks.push({
        startDate: currentStreak.startDate,
        days: currentStreak.days
      });
      currentStreak.startDate = date;
      currentStreak.days = 1;
    }
  });

  streaks.sort(function(a, b) {
    return (a.days < b.days) ? 1 : (a.days > b.days) ? -1 : 0;
  });

  $('#streak').html(streaks[0].days + ' days <i>(starting on ' + new Date(streaks[0].startDate * 86400 * 1000).toISOString().slice(0, 10) + ')</i>');

  // biggest break calc
  var earlyConIndex, lateConIndex, lateIsPresent = false,
    gap = 0;
  allConsumptions.forEach(function(consumption, index) {
    var testGap;
    if (index === (allConsumptions.length - 1)) {
      // hit the end; check for current
      testGap = Math.floor(new Date().getTime() / 1000) - consumption.date;
      if (testGap > gap) {
        earlyConIndex = index;
        lateConIndex = 0;
        lateIsPresent = true;
        gap = testGap;
      }
      return;
    } else {
      testGap = allConsumptions[index + 1].date - consumption.date;
      if (testGap > gap) {
        earlyConIndex = index;
        lateConIndex = index + 1;
        gap = testGap;
      }
    }
  });


  var earlyConString = new Date(allConsumptions[earlyConIndex].date * 1000).toISOString().slice(0, 16).replace(/T/, ' ').replace(':', '') + ' (<a href="/experience.html?' + allConsumptions[earlyConIndex].exp_id + '">' + allConsumptions[earlyConIndex].title + '</a>)';

  var lateConString;
  if (lateIsPresent) {
    lateConString = new Date().toISOString().slice(0, 16).replace(/T/, ' ').replace(':', '') + ' (present)';
  } else {
    lateConString = new Date(allConsumptions[lateConIndex].date * 1000).toISOString().slice(0, 16).replace(/T/, ' ').replace(':', '') + ' (<a href="/experience.html?' + allConsumptions[lateConIndex].exp_id + '">' + allConsumptions[lateConIndex].title + '</a>)';
  }

  var diffDays = Math.floor(gap / 86400);

  $('#tBreak').html(earlyConString + ' to ' + lateConString + ' (' + diffDays + ' days)');

  // most in an hour
  allConsumptions.sort(function(a, b) {
    return b.date - a.date;
  });

  var hours = [];
  allConsumptions.forEach(function(consumption, index) {
    var total = allConsumptions.filter(function(subCon) {
      if (subCon.date >= consumption.date && subCon.date <= (consumption.date + 3600)) {
        return true;
      }
      return false;
    }).reduce(function(accum, curr) {
      return accum + curr.count;
    }, 0);

    hours.push({
      start: consumption,
      count: total
    });
  });

  hours.sort(function(a, b){
    return b.count - a.count;
  });

  var topHours = hours.slice(0, 3).map(function(hourRecord) {
    return '<li>' + hourRecord.count + ' ' + drug.unit + ' between ' +
      new Date(hourRecord.start.date * 1000).toISOString().slice(11, 16) + ' and ' +
      new Date((hourRecord.start.date + 3600) * 1000).toISOString().slice(11, 16) +
      ' ' + new Date(hourRecord.start.date * 1000).toISOString().slice(0, 10) +
      ' during <a href="/experience.html?' + hourRecord.start.exp_id + '">' + hourRecord.start.title + '</a></li>';
  });

  $('#hourRecord').html('<ul class="pad-left-40">' + topHours.join('') + '</ul>');

  analyticsFinished += 1;
}
