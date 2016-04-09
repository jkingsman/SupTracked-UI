/* globals makeAuthRequest,Materialize,micromarkdown,cleanMarkdown */
/* jshint -W003 */ // ugh I'm done with rearranging

"use strict";

var drug, allDrugs, allConsumptions = [],
  allExperiences;
var analyticsCount = 0;
var analyticsFinished = 0;

// just get jshint off our back. these are defined in their respective files
var vitals, experience_list, top_listings, hours_days, purchasing;

var autoStart, countdown = 5,
  updateInterval;
var hasSelected = false;

function drugSelected() {
  if ($('#drug').val().indexOf('dup') > -1) {
    $('#drug').val($('#drug').val().split('-')[1]); // break out dups from menu
  }

  allDrugs.forEach(function(singleDrug) {
    if (singleDrug.id === parseInt($('#drug').val())) {
      if (location.search.length < 1) {
        // only set if we haven't set already, otherwise the page refreshes and we infiniloop
        location.search = singleDrug.id;
      }
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

  $('#notes').html(cleanMarkdown(micromarkdown.parse(drug.notes.split('$$$purchasedata$$$')[0])));

  // compile all consumptions
  makeAuthRequest('/consumption/search', 'POST', JSON.stringify({
    drug_id: drug.id
  }), 'json', function(err, data, code) {
    allExperiences = data;

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

      $('#drugEntry').attr('href', '/drugs.html?' + drug.id);

      // off we go!
      startAnalytics();
    } else {
      $('#selection').hide();
      $('#none').show();
      analyticsFinished = analyticsCount;
    }
  });
}

// set up the completion listener
updateInterval = setInterval(function updateCompletion() {
  var percentage = Math.round(analyticsFinished / analyticsCount) * 100;
  $('#analyticsComplete').text(percentage + '%');
  $('#analyticsProgress').css('width', percentage + '%');

  if (analyticsFinished === analyticsCount || window.location.hash.substring(1).indexOf('skip') > -1) {
    // we're done here; display it after an aesthetic delay for the progress bar to hit 100%
    setTimeout(function() {
      clearInterval(updateInterval);
      $('#loading').hide();
      $('#analytics').show();
    }, 500);
  }
}, 100);

function startAnalytics() {
  vitals();
  experience_list();
  top_listings();
  hours_days();
  purchasing();
}

// populate the drug dropdown
makeAuthRequest('/drug/all', 'GET', null, 'json', function(err, data, code) {
  if (data.length < 1) {
    $('#none').show();
    return;
  }

  allDrugs = data.sort(function(a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    return (a < b) ? -1 : (a > b) ? 1 : 0;
  });

  var drugsByUsage = allDrugs.slice();
  drugsByUsage = drugsByUsage.sort(function(a, b) {
    return b.use_count - a.use_count;
  }).slice(0, 5);

  $('#drug').append('<optgroup label="Common" id="common_dropdwngroup"></optgroup>');

  drugsByUsage.forEach(function(drug, index, orig) {
    $('#common_dropdwngroup').append('<option value="' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
    orig[index] = drug.id;
  });

  $('#drug').append('<optgroup label="All" id="all_dropdwngroup"></optgroup>');

  allDrugs.forEach(function(drug) {
    if (drugsByUsage.indexOf(drug.id) === -1) {
      $('#all_dropdwngroup').append('<option value="' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
    } else {
      $('#all_dropdwngroup').append('<option value="dup-' + drug.id + '">' + drug.name + ' (' + drug.unit + ')</option>');
    }
  });

  var allIds = allDrugs.map(function(drug) {
    return drug.id;
  });

  // we have a search
  if (location.search.length > 1 && allIds.indexOf(Number(location.search.substr(1))) > -1) {
    $('#drug').val(location.search.substr(1));
    drugSelected();
  } else {
    $('#drug').val(drugsByUsage[0]);
    drugSelected();
  }
});

$('#drug').change(function(){
  location.search = $('#drug').val();
});
