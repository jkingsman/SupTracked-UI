(function($) {
  "use strict";
  $(function() {
    $('.button-collapse').sideNav({
      closeOnClick: true
    });
  }); // end of document ready
})(jQuery); // end of jQuery name space

$(document).on('click', 'a', function(event) {
  "use strict";
  if (($(event.target).attr('class') === undefined || $(event.target).attr('class').indexOf('page-action') === -1) && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    event.preventDefault();
    window.location = $(this).attr("href");
  }
});

function cleanMarkdown(text) {
  "use strict";
  // breaks to BR
  text = text.replace(/(?:\r\n|\r|\n)/g, ' <br /> ');

  // scrub out unnecessary breaks
  text = text.replace(/(<br>\s*)+<br>/gm, '<br>');

  //scrub out breaks before and after all h1-6
  text = text.replace(/<\/h1>[\s<br />\s]+/g, '</h1>').replace(/[\s<br />\s]+<h1>/g, '<h1>');
  text = text.replace(/<\/h2>[\s<br />\s]+/g, '</h2>').replace(/[\s<br />\s]+<h2>/g, '<h2>');
  text = text.replace(/<\/h3>[\s<br />\s]+/g, '</h3>').replace(/[\s<br />\s]+<h3>/g, '<h3>');
  text = text.replace(/<\/h4>[\s<br />\s]+/g, '</h4>').replace(/[\s<br />\s]+<h4>/g, '<h4>');
  text = text.replace(/<\/h5>[\s<br />\s]+/g, '</h5>').replace(/[\s<br />\s]+<h5>/g, '<h5>');
  text = text.replace(/<\/h6>[\s<br />\s]+/g, '</h6>').replace(/[\s<br />\s]+<h6>/g, '<h6>');

  return text;
}

function collateConsumptions(consumptions){
  "use strict";

  var groupedConsumptionList = {};

  consumptions.forEach(function(consumption) {
    if (groupedConsumptionList.hasOwnProperty(consumption.drug.name)) {
      groupedConsumptionList[consumption.drug.name].count += consumption.count;
    } else {
      groupedConsumptionList[consumption.drug.name] = {};
      groupedConsumptionList[consumption.drug.name].count = consumption.count;
      groupedConsumptionList[consumption.drug.name].unit = consumption.drug.unit;
    }
  });

  return groupedConsumptionList;
}

function getTTime(consumptionDate){
  "use strict";
  var conDate = Math.floor(new Date(consumptionDate * 1000).getTime() / 1000);
  var now = Math.floor(new Date().getTime() / 1000) - (new Date().getTimezoneOffset() * 60);

  var sign = '+';
  if (conDate > now) {
    sign = '-';
  }

  var diff = Math.abs(now - conDate);
  var hours = Math.floor(diff / 60 / 60);
  diff -= hours * 60 * 60;
  var minutes = Math.floor(diff / 60);

  var timeString = 'T' + sign + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2);
  return timeString;
}

// toggle menu display with alt
$(document).on('click', function(event) {
  "use strict";
  if (event.altKey) {
      // show sidenav on alt+click
      $('.button-collapse').sideNav('show');
    }
});
