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
  if (($(event.target).attr('class') === undefined || $(event.target).attr('class').indexOf('page-action') === -1) &&  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    event.preventDefault();
    window.location = $(this).attr("href");
  }
});
