/* globals makeAuthRequest,Materialize,getCookie,makeAuthBlobRequest */
/* jshint -W089 */

"use strict";

var currentBatch = 0;
var batchSize = 24;
var atEnd = false;

makeAuthRequest('/media/search', 'POST', null, 'json', function(err, data, code) {
  if (code === 404) {
    // no media
    $('#loading').hide();
    $('#emptyMedia').show();
  }
});

function loadMore() {
  if (!atEnd) {
    atEnd = true;
    makeAuthRequest('/media/search', 'POST', JSON.stringify({
      limit: batchSize,
      offset: currentBatch * batchSize
    }), 'json', function(err, data, code) {
      // either we've got an incomplete page and at the end, or we have a perfect boundary and have 404'd
      if (code !== 404 && data.length === batchSize) {
        // we're not at the end yet; bump it up
        currentBatch += 1;
      } else {
        atEnd = true;
      }

      data.forEach(function(media, index) {
        if (index % 4 === 0) {
          // we're beginning a new row
          $('#media').append('<div id="row' + Math.floor(index / 4) + '" class="row"></div>');
        }

        var mediaUrl = getCookie('server') + '/media/file/' + media.id;

        var association = '';
        if(media.association_type === 'experience'){
          association = '<br><a href="/experience.html?' + media.association + '">View Experience</a>';
        }

        $('#row' + Math.floor(index / 4)).append('<div class="col s12 m3"><div class="card"><div class="card-image">' +
          '<a id="imagelink' + media.id + '"><img id="image' + media.id + '"/><span class="card-title">' + media.title + '</span><a/></div>' +
          '<div class="card-content"><p>' + new Date(media.date * 1000).toISOString().slice(5, 16).replace(/T/, ' ').replace('-', '/') + association + '</p></div>' +
          '</div></div>');

        makeAuthBlobRequest('/media/file/' + media.id, function(data) {
          var url = window.URL || window.webkitURL;
          $('#image' + media.id).attr('src', url.createObjectURL(data));
          $('#imagelink' + media.id).attr('href', url.createObjectURL(data));
        });
      });

      $('#loading').hide();
      $('#media').show();
    });
  }
}

loadMore();

$(window).scroll(function() {
  if ($(window).scrollTop() + $(window).height() > $(document).height() - 50) {
    loadMore();
  }
});

function newMedia(){
  $('#addMediaModal').openModal();
}
