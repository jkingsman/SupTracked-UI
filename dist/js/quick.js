"use strict";function updateExperienceObject(e){makeAuthRequest("/experience/search","POST",JSON.stringify({limit:1}),"json",function(t,n,o){return 404===o?void(window.location="/experiences.html"):(experience=n[0],void e())})}function drawConsumptions(){$("#consumptionsCollection").empty(),0===experience.consumptions.length?$("#consumptionsCollection").append('<li class="collection-item"><div>No consumptions</div></li>'):(experience.consumptions.sort(function(e,t){return e.date>t.date?-1:e.date<t.date?1:0}),experience.consumptions.forEach(function(e){$("#consumptionsCollection").append('<li class="collection-item">'+new Date(1e3*e.date).toISOString().slice(5,16).replace(/T/," ").replace("-","/")+'<a href="#" title="Set to Now" onClick="setNow('+e.id+')" class="secondary-content consumption-icon"><i class="material-icons">alarm_on</i></a><a href="#" title="Duplicate" onClick="duplicateConsumption('+e.id+')" class="secondary-content consumption-icon"><i class="material-icons">call_split</i></a><a href="#" title="Delete" onClick="deleteConsumption('+e.id+')" class="secondary-content consumption-icon"><i class="material-icons">delete</i></a><br><span class="consumption-data">'+e.count+" "+e.drug.unit+" "+e.drug.name+", "+e.method.name+"</span></li>")}))}function deleteConsumption(e){makeAuthRequest("/consumption","DELETE",JSON.stringify({id:e}),"json",function(e,t,n){return 200!==n?void Materialize.toast(e,6e3,"warning-toast"):(Materialize.toast("Consumption deleted",1e3,"success-toast"),void updateExperienceObject(function(){drawConsumptions()}))})}function setNow(e){experience.consumptions.forEach(function(t){if(t.id===e){var n={id:e,date:Math.floor(((new Date).getTime()-6e4*(new Date).getTimezoneOffset())/1e3)};makeAuthRequest("/consumption","PUT",JSON.stringify(n),"json",function(e,t,n){return 200!==n?void Materialize.toast(e.charAt(0).toUpperCase()+e.slice(1),6e3,"warning-toast"):(updateExperienceObject(function(){drawConsumptions()}),void Materialize.toast("Consumption set to now",1e3,"success-toast"))})}})}function duplicateConsumption(e){experience.consumptions.forEach(function(t){if(t.id===e){var n={date:Math.floor(((new Date).getTime()-6e4*(new Date).getTimezoneOffset())/1e3),count:t.count,experience_id:experience.id,drug_id:t.drug.id,method_id:t.method.id,location:t.location};makeAuthRequest("/consumption","POST",JSON.stringify(n),"json",function(e,t,n){return e?void Materialize.toast(e.charAt(0).toUpperCase()+e.slice(1),6e3,"warning-toast"):(updateExperienceObject(function(){drawConsumptions()}),void Materialize.toast("Consumption duplicated",1e3,"success-toast"))})}})}function sendGeoData(){navigator.geolocation.watchPosition(function(e){makeAuthRequest("/sms","POST",JSON.stringify({message:"As of now, they are near the following location: https://www.google.com/maps/search/"+e.coords.latitude+","+e.coords.longitude+". Updated data may be sent as it becomes available."}),"json",function(e,t,n){return 200!==n?void Materialize.toast(e.charAt(0).toUpperCase()+e.slice(1),6e3,"warning-toast"):void Materialize.toast("Location data sent",5e3,"success-toast")})})}function confirmPanic(){$("#panicButton").removeClass("orange").addClass("red"),$("#panicButton").text("Confirm panic message?"),$("#panicButton").attr("onclick","sendPanic();")}function sendPanic(){makeAuthRequest("/sms","POST",JSON.stringify({message:atob(getCookie("auth")).split(":")[0]+" is having a bad drug experience, and would like your help."}),"json",function(e,t,n){return 200!==n?void Materialize.toast(e.charAt(0).toUpperCase()+e.slice(1),6e3,"warning-toast"):void Materialize.toast("Initial message sent",5e3,"success-toast")}),setTimeout(function(){sendGeoData(),updateExperienceObject(function(){var e=[];experience.consumptions.forEach(function(t){e.push(new Date(1e3*t.date).toISOString().slice(5,16).replace(/T/," ").replace("-","/")+" -- "+t.count+" "+t.drug.unit+" "+t.drug.name+", "+t.method.name),e.length===experience.consumptions.length&&makeAuthRequest("/sms","POST",JSON.stringify({message:"They have taken the following substances: \n"+e.join(". \n")}),"json",function(e,t,n){return 200!==n?void Materialize.toast(e.charAt(0).toUpperCase()+e.slice(1),6e3,"warning-toast"):void Materialize.toast("Consumption data sent",5e3,"success-toast")})}),experience.panicmsg&&experience.panicmsg.length>1&&makeAuthRequest("/sms","POST",JSON.stringify({message:"They have provided the following information that may be helpful: "+experience.panicmsg}),"json",function(e,t,n){return 200!==n?void Materialize.toast(e.charAt(0).toUpperCase()+e.slice(1),6e3,"warning-toast"):void Materialize.toast("Panic message sent",5e3,"success-toast")})})},1e3)}var experience;$("#addConsumption").submit(function(e){e.preventDefault();var t={date:Math.floor(((new Date).getTime()-6e4*(new Date).getTimezoneOffset())/1e3),count:$("#count").val(),experience_id:experience.id,drug_id:$("#addDrug").val(),method_id:$("#addMethod").val(),location:$("#addLocation").val()};makeAuthRequest("/consumption","POST",JSON.stringify(t),"json",function(e,t,n){return e?void Materialize.toast(e.charAt(0).toUpperCase()+e.slice(1),6e3,"warning-toast"):(updateExperienceObject(function(){drawConsumptions()}),$("ul.tabs").tabs("select_tab","consumptions"),void Materialize.toast("Consumption created",1e3,"success-toast"))})}),$("#addQuicknote").submit(function(e){e.preventDefault(),updateExperienceObject(function(){var e;experience.notes||(experience.notes=""),experience.ttime?experience.consumptions.forEach(function(t){if(t.id===experience.ttime){var n=Math.floor(new Date(1e3*t.date).getTime()/1e3),o=Math.floor((new Date).getTime()/1e3)-60*(new Date).getTimezoneOffset(),i="+";n>o&&(i="-");var a=Math.abs(o-n),s=Math.floor(a/60/60);a-=60*s*60;var c=Math.floor(a/60);e=experience.notes+"\nT"+i+("0"+s).slice(-2)+":"+("0"+c).slice(-2)+" -- "+$("#note").val()}}):e=experience.notes+"\n"+("0"+(new Date).getHours()).slice(-2)+("0"+(new Date).getMinutes()).slice(-2)+" -- "+$("#note").val(),makeAuthRequest("/experience","PUT",JSON.stringify({id:experience.id,notes:e}),"json",function(e,t,n){return 200!==n?void Materialize.toast("Quicknote error: "+e,6e3,"warning-toast"):void Materialize.toast("Quicknote Added",1e3,"success-toast")}),updateExperienceObject(function(){}),$("#note").val(""),$("#title").focus()})}),$("#media").change(function(){event.preventDefault();var e=new FormData;e.append("title","Mobile Media "+Math.floor(16777215*Math.random()).toString(8)),e.append("date",Math.floor((new Date).getTime()/1e3)-60*(new Date).getTimezoneOffset()),e.append("association_type","experience"),e.append("association",experience.id),e.append("image",$("#media").prop("files")[0]);var t=getCookie("auth"),n=getCookie("server"),o=new XMLHttpRequest;o.onload=function(e){4===o.readyState&&(201===o.status?(Materialize.toast("Media added",6e3,"success-toast"),$("#media").val(""),$("#mediaPath").val("")):(Materialize.toast(o.statusText,4e3,"warning-toast"),$("#media").val(""),$("#mediaPath").val("")))},o.onerror=function(e){Materialize.toast(o.statusText,4e3,"warning-toast")},o.open("POST",n+"/media"),o.setRequestHeader("Authorization","Basic "+t),o.send(e)}),$(document).ready(function(){$("ul.tabs").tabs()}),updateExperienceObject(function(){makeAuthRequest("/drug/all","GET",null,"json",function(e,t,n){return t.sort(function(e,t){return e=e.name.toLowerCase(),t=t.name.toLowerCase(),t>e?-1:e>t?1:0}),t.length<1?void $("#addDrug").append('<option value="" disabled selected>None</option>'):void t.forEach(function(e){$("#addDrug").append('<option value="'+e.id+'">'+e.name+" ("+e.unit+")</option>")})}),makeAuthRequest("/method/all","GET",null,"json",function(e,t,n){return t.sort(function(e,t){return e=e.name.toLowerCase(),t=t.name.toLowerCase(),t>e?-1:e>t?1:0}),t.length<1?void $("#addMethod").append('<option value="" disabled selected>None</option>'):void t.forEach(function(e){$("#addMethod").append('<option value="'+e.id+'">'+e.name+"</option>")})}),makeAuthRequest("/consumption/locations","GET",null,"json",function(e,t,n){t.forEach(function(e){$("#addLocationAutofill").append('<option value="'+e.location+'"></option>')})}),$("#title").html(experience.title),$(".fullLink").attr("href","/experience.html?"+experience.id),drawConsumptions()});