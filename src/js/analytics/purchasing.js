/* globals makeAuthRequest,Materialize */
/* jshint -W003 */

// these are predefined in the master analytics.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, drug;

analyticsCount += 1;

function purchasing() {
  "use strict";

  $('.purchaseUnit').html(drug.unit);

  if (drug.notes.split('$$$purchasedata$$$')[1]) {
    drawPurchasings();
  }

  analyticsFinished += 1;
}

function drawPurchasings() {
  "use strict";
  $('#noteEntries').empty();
  var purchases = JSON.parse(drug.notes.split('$$$purchasedata$$$')[1]);
  purchases.forEach(function(purchase, index) {
    $('#noteEntries').append('<tr><td><a href="#" title="Delete" onClick="delPurchasing(' + index + ')" class="secondary-content consumption-icon"><i class="material-icons">delete</i></a>' +
      '</td><td>' + purchase.date + '</td><td>' + purchase.count + '</td><td>$' + (Math.round(purchase.cost * 100) / 100).toFixed(2) + '</td><td>' + purchase.notes + '</td></tr>');
  });

  $('#purchasedRecord').html(purchases.reduce(function(total, current) {
    return total + Number(current.count);
  }, 0) + ' ' + drug.unit);

  $('#purchasedCost').html(purchases.reduce(function(total, current) {
    return total + Number(current.cost);
  }, 0));

  $('#avgPrice').html((Math.round(purchases.reduce(function(total, current) {
    return total + Number(current.cost);
  }, 0) / purchases.reduce(function(total, current) {
    return total + Number(current.count);
  }, 0) * 1000) / 1000).toFixed(3));
}

function delPurchasing(id) {
  "use strict";

  var newNotes = drug.notes.split('$$$purchasedata$$')[0];
  var purchases = JSON.parse(drug.notes.split('$$$purchasedata$$$')[1]);
  var newPurchases = [];

  purchases.forEach(function(purchase, index) {
    if (index !== id) {
      newPurchases.push(purchase);
    }
  });

  newNotes += '$$$purchasedata$$$' + JSON.stringify(newPurchases);

  drug.notes = newNotes;
  commitPurchases();
}

function addPurchasing() {
  "use strict";
  var purchase = {
    date: $("#addPurchaseDate").val(),
    count: $("#addPurchaseCount").val(),
    cost: $("#addPurchaseCost").val(),
    notes: $("#addPurchaseNotes").val()
  };

  var newNotes = drug.notes.split('$$$purchasedata$$')[0];

  $('#addPurchaseDate, #addPurchaseCount, #addPurchaseCost, #addPurchaseNotes').val('');
  var purchases = [];
  if (!drug.notes.split('$$$purchasedata$$$')[1]) {
    // fresh purchasing notes
    purchases.push(purchase);
  } else {
    purchases = JSON.parse(drug.notes.split('$$$purchasedata$$$')[1]);
    purchases.push(purchase);
  }

  purchases.sort(function(a, b) {
    return a.date > b.date ? -1 : a.date < b.date ? 1 : 0;
  });

  newNotes += '$$$purchasedata$$$' + JSON.stringify(purchases);

  drug.notes = newNotes;
  commitPurchases();
}

function commitPurchases() {
  "use strict";
  makeAuthRequest('/drug', 'PUT', JSON.stringify({
    id: drug.id,
    notes: drug.notes
  }), 'json', function(err, data, code) {
    if (code !== 200) {
      Materialize.toast('Drug notes save error: ' + err, 6000, 'warning-toast');
      return;
    }

    drawPurchasings();
    Materialize.toast('Drug notes saved', 1000);
  });
}

$("#addPurchaseNotes").keyup(function(e) {
  "use strict";
  if (e.keyCode === 13) {
    addPurchasing();
  }
});
