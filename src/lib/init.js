(function($) {
  $(function() {
    $('.button-collapse').sideNav({
      closeOnClick: true
    });
  }); // end of document ready
})(jQuery); // end of jQuery name space

$(document).on('click', 'a', function(event) {
  if ($(event.target).attr('class') == undefined || $(event.target).attr('class').indexOf('page-action') === -1) {
    console.log('preving')
    event.preventDefault();
    window.location = $(this).attr("href");
  }
});
