/* globals getCookie,Materialize */
var touchTimings = [];
var lastTouch = Date.now();

window.addEventListener("touchstart", function() {
  "use strict";
  touchTimings.push(Date.now());
  if (touchTimings.length > 5) {
    touchTimings.shift();
  }

  if (touchTimings.length === 5) {
    var beats = [];
    beats[0] = touchTimings[1] - touchTimings[0];
    beats[1] = touchTimings[2] - touchTimings[1];
    beats[2] = touchTimings[3] - touchTimings[2];
    beats[3] = touchTimings[4] - touchTimings[3];

    if(Math.abs(beats[0] - beats[3]) < 100 && Math.abs(beats[2] - beats[1]) < 100){
      Materialize.toast('Running on ' + getCookie('server'), 6000, 'success-toast');
      Materialize.toast('Logged in as ' + atob(getCookie('auth')).split(':')[0], 6000, 'success-toast');
      Materialize.toast('UI served from ' + window.location.origin, 6000, 'success-toast');
    }
  }
});
