/* globals makeAuthRequest,Materialize,micromarkdown,cleanMarkdown */

"use strict";

var drug, allDrugs, allConsumptions = [];
var analyticsCount = 0;
var analyticsFinished = 0;

// just get jshint off our back. these are defined in their respective files
var vitals, experienceList;

function startAnalytics() {
  vitals();
}

// don't show select if we're already navigating
if (location.hash.length > 1) {
  $('#selection').hide();
  $('#loading').show();
}

// populate the drug dropdown
makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, data, code) {
  allDrugs = data;

  data.sort(function(a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    return (a < b) ? -1 : (a > b) ? 1 : 0;
  });

  if (data.length < 1) {
    $('#drug').append('<option value="" disabled selected>None</option>');
    return;
  }

  data.forEach(function(drug) {
    $('#drug').append('<option value="' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
  });

  $('#loadingOpt').remove();

  // we have a hash
  if (location.hash.length > 1) {
    $('#drug').val(location.hash.substr(1));
    $('#drugSelect').submit();
  }
});

// catch form submission
$('#drugSelect').submit(function(event) {
  event.preventDefault();

  $('#selection').hide();
  $('#loading').show();

  allDrugs.forEach(function(singleDrug) {
    if (singleDrug.id === parseInt($('#drug').val())) {
      location.hash = singleDrug.id;
      drug = singleDrug;
      return;
    }
  });

  document.title = drug.name.substr(0, 1).toUpperCase() + drug.name.substr(1) + ' | SupTracked';
  $('.drugName').text(drug.name);

  $('#unit').html(drug.unit);
  $('#classification').html(drug.classification);
  $('#family').html(drug.family);

  switch (parseInt(drug.rarity)) {
    case 0:
      $('#rarity').html('<span class="blue white-text" style="padding: 3px; border-radius: 24px;">Very Common</span>');
      break;
    case 1:
      $('#rarity').html('<span class="green white-text" style="padding: 3px; border-radius: 24px;">Common</span>');
      break;
    case 2:
      $('#rarity').html('<span class="purple white-text" style="padding: 3px; border-radius: 24px;">Uncommon</span>');
      break;
    case 3:
      $('#rarity').html('<span class="red white-text" style="padding: 3px; border-radius: 24px;">Rare</span>');
      break;
    default:
      $('#rarity').html('<span class="grey white-text" style="padding: 3px; border-radius: 24px;">???</span>');
  }

  $('#notes').html(cleanMarkdown(micromarkdown.parse(drug.notes)));

  // compile all consumptions
  makeAuthRequest('/consumption/search', 'POST', JSON.stringify({
    drug_id: drug.id
  }), 'json', function(err, data, code) {
    if (data) {
      data.forEach(function(experience) {
        experience.consumptions.forEach(function(consumption) {
          if (consumption.drug.id === drug.id) {
            consumption.title = experience.title;
            consumption.exp_id = experience.id;
            allConsumptions.push(consumption);
          }
        });
      });

      // sort in ascending date
      allConsumptions.sort(function(a, b) {
        return (a.date < b.date) ? -1 : (a.date > b.date) ? 1 : 0;
      });

      // off we go!
      startAnalytics();
    } else{
      analyticsFinished = analyticsCount;
    }
  });
});

// set up the completion listener
var updateInterval = setInterval(function updateCompletion() {
  // update the percentages
  $('#analyticsComplete').text(Math.round(analyticsFinished / analyticsCount * 100));
  $('#analyticsProgress').css('width', Math.round(analyticsFinished / analyticsCount * 100) + '%');

  if (analyticsFinished === analyticsCount) {
    // we're done here;  display it after an aesthetic delay for the progress bar to hit 100%
    clearInterval(updateInterval);
    setTimeout(function() {
      $('#loading').hide();
      $('#analytics').show();
    }, 500);
  }
}, 100);
