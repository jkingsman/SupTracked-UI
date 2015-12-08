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
