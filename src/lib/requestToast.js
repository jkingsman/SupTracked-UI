/* globals Materialize */
"use strict";

// first, show the main placeholder toast and hide
Materialize.toast('<div class="progress" style="z-index: 9000; position: absolute; bottom: -10px; left: 5%; width: 90%;"><div class="indeterminate"></div></div>' +
  '<div id="reqToastTextContainer" style="margin-right: auto; margin-left: auto;"><span id="apiContainer"><span id="pendingAPIReqCount">0</span>&nbsp;pending API request<span id="pendingAPIReqCountMultiple"></span></span>' +
  '<span id="conjunction">&nbspand&nbsp</span>' +
  '<span id="blobContainer"><span id="pendingBlobReqCount">0</span>&nbsp;pending blob request<span id="pendingBlobReqCountMultiple"></span></span></div?', 100000000, 'pendingReqToast');
$('.pendingReqToast').hide();

function prettifyReqToast() {
  // handle API multiples
  if (parseInt($('#pendingAPIReqCount').html()) > 1) {
    $('#pendingAPIReqCountMultiple').html('s');
  } else {
    $('#pendingAPIReqCountMultiple').html('');
  }

  //handle blob multiples
  if (parseInt($('#pendingBlobReqCount').html()) > 1) {
    $('#pendingBlobReqCountMultiple').html('s');
  } else {
    $('#pendingBlobReqCountMultiple').html('');
  }

  // handle conjunction and visibiliyu
  if (parseInt($('#pendingAPIReqCount').html()) > 0 || parseInt($('#pendingBlobReqCount').html()) > 0) {
    if (parseInt($('#pendingAPIReqCount').html()) > 0) {
      $('#apiContainer').show();
    } else {
      $('#apiContainer').hide();
    }

    if (parseInt($('#pendingBlobReqCount').html()) > 0) {
      $('#blobContainer').show();
    } else {
      $('#blobContainer').hide();
    }

    if (parseInt($('#pendingAPIReqCount').html()) > 0 && parseInt($('#pendingBlobReqCount').html()) > 0) {
      $('#conjunction').show();
    } else {
      $('#conjunction').hide();
    }

    $('.pendingReqToast').show();
  } else {
    // no reqs
    $('.pendingReqToast').hide();
  }

}

// type is 'blob' or 'API'
function newReqToast(type) {
  if (type === 'api') {
    $('#pendingAPIReqCount').html(parseInt($('#pendingAPIReqCount').html()) + 1);
  } else {
    // type is blob
    $('#pendingBlobReqCount').html(parseInt($('#pendingBlobReqCount').html()) + 1);
  }

  prettifyReqToast();
}

// type is 'blob' or 'API'
function delReqToast(type) {
  if (type === 'api') {
    $('#pendingAPIReqCount').html(parseInt($('#pendingAPIReqCount').html()) - 1);
  } else {
    // type is blob
    $('#pendingBlobReqCount').html(parseInt($('#pendingBlobReqCount').html()) - 1);
  }

  prettifyReqToast();
}
