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
  if ($(event.target).attr('class') === undefined || $(event.target).attr('class').indexOf('page-action') === -1) {
    event.preventDefault();
    window.location = $(this).attr("href");
  }
});
