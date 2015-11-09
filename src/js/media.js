/* globals makeAuthRequest,Materialize,getCookie,makeAuthBlobRequest,server */
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
        if (media.association_type === 'experience') {
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

function prepareAdd() {
  var today = new Date();
  var dateString = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2) + ' ' + ('0' + today.getHours()).slice(-2) + ('0' + today.getMinutes()).slice(-2);
  $('#customTime').val(dateString);
  makeAuthRequest('/experience/search', 'POST', null, 'json', function(err, data, code) {
    if (data.length < 1) {
      $('#experience').append('<option value="" disabled selected>None</option>');
      return;
    }

    data.sort(function(a, b) {
      return parseFloat(b.date) - parseFloat(a.date);
    });

    data.forEach(function(experience) {
      $('#experience').append('<option value="' + experience.id + '">' + new Date(experience.date * 1000).toISOString().slice(0, 10) + ' -- ' + experience.title + '</option>');
    });
  });
}

$('#addMedia').submit(function(event) {
  event.preventDefault();

  // assemble this horrible date
  var customDate = $('#customTime').val().split(' ')[0];
  var customTime = $('#customTime').val().split(' ')[1];
  var customDateStamp = Math.floor(new Date(customDate).getTime() / 1000);

  // add hours and minutes
  customDateStamp += Math.floor(customTime / 100) * 3600;
  customDateStamp += (customTime - (Math.floor(customTime / 100) * 100)) * 60;

  // build the form
  var formData = new FormData();
  formData.append("title", $('#title').val());
  formData.append("tags", $('#tags').val());

  if ($('input:radio[name=time]:checked').val() === 'custom') {
    formData.append("date", customDateStamp);
  }

  formData.append("association_type", 'experience');
  formData.append("association", $('#experience').val());

  if ($('#favorite').is(':checked')) {
    formData.append("favorite", 1);
  }

  if ($('#explicit').is(':checked')) {
    formData.append("explicit", 1);
  }

  formData.append("image", $('#mediaFile').prop('files')[0]);

  var auth = getCookie('auth');
  var server = getCookie('server');

  var xhr = new XMLHttpRequest();

  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 201) {
        $("#addMediaModal").closeModal();
        Materialize.toast('Media added', 6000, 'success-toast');
        setTimeout(function(){
          window.location = '/media.html';
        }, 1000);
      } else {
        $("#addMediaModal").closeModal();
        Materialize.toast(xhr.statusText, 4000, 'warning-toast');
      }
    }
  };

  xhr.onerror = function(e) {
    $("#addMediaModal").closeModal();
    Materialize.toast(xhr.statusText, 4000, 'warning-toast');
  };

  xhr.open("POST", server + '/media');
  xhr.setRequestHeader('Authorization', 'Basic ' + auth);
  xhr.send(formData);
});

// handle custom time show/hide
$('input:radio[name=time]').on('change', function() {
  if ($('input:radio[name=time]:checked').val() === 'custom') {
    $('#customTimeArea').show();
  } else {
    $('#customTimeArea').hide();
  }
});

$(window).scroll(function() {
  if ($(window).scrollTop() + $(window).height() > $(document).height() - 50) {
    loadMore();
  }
});

loadMore();
prepareAdd();
