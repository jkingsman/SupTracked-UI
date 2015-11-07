/* globals makeAuthRequest,Materialize */
"use strict";

var currentBatch = 0;
var batchSize = 30;
var atEnd = false;

makeAuthRequest('/experience/search', 'POST', null, 'json', function(err, data, code){
  if(code === 404){
    // no Experiences
    $('#loading').hide();
    $('#emptyExperiences').show();
  }
});

function loadMore(){
  if(!atEnd){
    makeAuthRequest('/experience/search', 'POST', JSON.stringify({limit: batchSize, offset: currentBatch * batchSize}), 'json', function(err, data, code){
      // either we've got an incomplete page and at the end, or we have a perfect boundary and have 404'd
      if(code !== 404 && data.length === batchSize){
        // we're not at the end yet; bump it up
        currentBatch += 1;
      } else{
        atEnd = true;
      }

      data.forEach(function(experience){
        if(experience.title.length < 1){
          experience.title = '[none]';
        }
        $('#experiences-collection').append('<li class="collection-item">' + new Date(experience.date * 1000).toISOString().slice(0, 10) + '<h5><a href="/experience.html?' + experience.id + '">' + experience.title + '</a></h5></li>');
      });

      $('#loading').hide();
      $('#experiences').show();
    });
  }
}

loadMore();

// $(window).scroll(function() {
//   if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
//     loadMore();
//   }
// });
