/* globals makeAuthRequest,Materialize */

// these are predefined in the master historical.js file
var analyticsCount, analyticsFinished, allDrugs, allConsumptions, allExperiences, start, end, getCookie, makeAuthBlobRequest;

analyticsCount += 1;

function media() {
  "use strict";

  makeAuthRequest('/media/search', 'POST', JSON.stringify({
      startdate: start,
      enddate: end
    }), 'json',
    function(err, data, code) {
      if (err) {
        analyticsFinished += 1;
        return;
      }

      var rowsProcessed = 0;
      data.forEach(function(media, index) {
        if (index % 6 === 0) {
          // we're beginning a new row
          $('#media').append('<div id="row' + rowsProcessed + '" class="row"></div>');
          rowsProcessed += 1;
        }

        var mediaUrl = getCookie('server') + '/media/file/' + media.id;

        var association = '';
        var editString = '';
        if (media.association_type === 'experience') {
          association = '<br><a href="/experience.html?' + media.association + '">View Experience (' + media.exp_title + ')</a>';
        }

        var explicitBlurStyle = '';
        if (media.explicit) {
          explicitBlurStyle = 'style="-webkit-filter: blur(15px); filter: blur(15px);"';
        }

        var favoriteIcon = '';
        if (media.favorite) {
          favoriteIcon = '<i class="material-icons" style="color: gold;">thumb_up</i>';
        }

        var mediaTags = '<br>[no tags]';
        if (media.tags) {
          mediaTags = '<br>' + media.tags;
        }

        $('#row' + (rowsProcessed - 1)).append('<div class="col s12 m2"><div class="card"><div class="card-image">' +
          '<a id="imagelink' + media.id + '" target="_blank"><img id="image' + media.id + '" ' + explicitBlurStyle + '><span class="card-title" id="title-' + media.id + '" style="background-color: rgba(0, 0, 0, 0.5);">' + favoriteIcon + media.title + '</span><a/></div>' +
          '<div class="card-content"><p>' +
          new Date(media.date * 1000).toISOString().slice(5, 16).replace(/T/, ' ').replace('-', '/') + '<span id="tags-' + media.id + '">' + mediaTags + '</span>' + association + '</p></div>' +
          '</div></div>');

        makeAuthBlobRequest('/media/file/' + media.id, function(imgData) {
          var converter = new FileReader();
          converter.onload = function(e) {
            var result = e.target.result.replace('application/octet-stream', 'image/png');
            $('#image' + media.id).attr('src', result);
            $('#imagelink' + media.id).attr('href', result);
          };
          converter.readAsDataURL(imgData);
        });

        if (index === data.length - 1) {
          analyticsFinished += 1;
        }
      });
    });
}
