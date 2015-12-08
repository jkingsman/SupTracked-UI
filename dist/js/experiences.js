"use strict";function loadMore(){atEnd||makeAuthRequest("/experience/search","POST",JSON.stringify({limit:batchSize,offset:currentBatch*batchSize}),"json",function(e,t,n){404!==n?currentBatch+=1:atEnd=!0,t.sort(function(e,t){return parseFloat(t.date)-parseFloat(e.date)}),t.forEach(function(e){e.title.length<1&&(e.title="[none]");var t={};e.consumptions.forEach(function(e){t.hasOwnProperty(e.drug.name)?t[e.drug.name].count+=e.count:(t[e.drug.name]={},t[e.drug.name].count=e.count,t[e.drug.name].unit=e.drug.unit)});var n=[];if(Object.keys(t).length>0)for(var o in t)n.push(t[o].count+" "+t[o].unit+" "+o);else n.push("no consumptions");var i=[],a="Solo Experience";e.consumptions.forEach(function(e){e.friends.forEach(function(e){-1===i.indexOf(e.name)&&i.push(e.name)})}),i.length>0&&(a=i.join(", "));var r=[],l="[no location]";e.consumptions.forEach(function(e){-1===r.indexOf(e.location)&&r.push(e.location)}),r.length>0&&(l=r.join(", ")),$("#experiences-collection").append('<li class="collection-item">'+new Date(1e3*e.date).toISOString().slice(0,10)+'<span class="right hide-on-med-and-down" style="max-width: 50%;">'+a+" at <strong>"+l+'</strong></span><h5><a href="/experience.html?'+e.id+'">'+e.title+'</a></h5><div class="pad-left-40">'+n.join("<br />")+"</div></li>")}),$("#loading").hide(),$("#experiences").show()})}function prepareFilter(){var e=new Date,t=e.getFullYear()+"-"+("0"+(e.getMonth()+1)).slice(-2)+"-"+("0"+e.getDate()).slice(-2)+" "+("0"+e.getHours()).slice(-2)+("0"+e.getMinutes()).slice(-2);$("#filterEndDate").val(t),$("#filterStartDate").val("1975-01-01 0000"),makeAuthRequest("/drug/all","GET",null,"json",function(e,t,n){t.forEach(function(e){$("#drugs").append("<option>"+e.name+"</option>")})}),makeAuthRequest("/method/all","GET",null,"json",function(e,t,n){t.forEach(function(e){$("#methods").append("<option>"+e.name+"</option>")})}),makeAuthRequest("/consumption/friends","GET",null,"json",function(e,t,n){t.forEach(function(e){$("#friends").append("<option>"+e.name+"</option>")})})}var currentBatch=0,batchSize=10,atEnd=!1;makeAuthRequest("/experience/search","POST",JSON.stringify({limit:1}),"json",function(e,t,n){404===n&&($("#loading").hide(),$("#emptyExperiences").show())});var autoLoader=function(){$(window).scrollTop()+$(window).height()>$(document).height()-50&&loadMore()};$("#filterForm").submit(function(e){e.preventDefault(),document.activeElement.blur();var t={};$("#filterTitle").val().length>0&&(t.title=$("#filterTitle").val()),$("#filterNotes").val().length>0&&(t.notes=$("#filterNotes").val()),$("#filterRating").val()>-1&&(t.rating_id=$("#filterRating").val());var n=$("#filterStartDate").val().split(" ")[0],o=$("#filterStartDate").val().split(" ")[1],i=Math.floor(new Date(n).getTime()/1e3);i+=3600*Math.floor(o/100),i+=60*(o-100*Math.floor(o/100));var a=$("#filterEndDate").val().split(" ")[0],r=$("#filterEndDate").val().split(" ")[1],l=Math.floor(new Date(a).getTime()/1e3);l+=3600*Math.floor(r/100),l+=60*(r-100*Math.floor(r/100)),t.startdate=i,t.enddate=l,makeAuthRequest("/experience/search","POST",JSON.stringify(t),"json",function(e,t,n){$(".collection-item").remove(),$(window).off("scroll",autoLoader),$(".collapsible-header").click(),$(window).scrollTop(0),t?(t.sort(function(e,t){return parseFloat(t.date)-parseFloat(e.date)}),t.forEach(function(e){var t=JSON.stringify(e.consumptions).toLowerCase();if(-1!==t.indexOf($("#filterLocation").val().toLowerCase())&&-1!==t.indexOf($("#filterFriends").val().toLowerCase())&&-1!==t.indexOf($("#filterDrug").val().toLowerCase())&&-1!==t.indexOf($("#filterMethod").val().toLowerCase())){e.title.length<1&&(e.title="[none]");var n={};e.consumptions.forEach(function(e){n.hasOwnProperty(e.drug.name)?n[e.drug.name].count+=e.count:(n[e.drug.name]={},n[e.drug.name].count=e.count,n[e.drug.name].unit=e.drug.unit)});var o=[];if(Object.keys(n).length>0)for(var i in n)o.push(n[i].count+" "+n[i].unit+" "+i);else o.push("no consumptions");var a=[],r="Solo Experience";e.consumptions.forEach(function(e){e.friends.forEach(function(e){-1===a.indexOf(e.name)&&a.push(e.name)})}),a.length>0&&(r=a.join(", "));var l=[],c="[no location]";e.consumptions.forEach(function(e){-1===l.indexOf(e.location)&&l.push(e.location)}),l.length>0&&(c=l.join(", ")),$("#experiences-collection").append('<li class="collection-item">'+new Date(1e3*e.date).toISOString().slice(0,10)+'<span class="right hide-on-med-and-down" style="max-width: 50%;">'+r+" at <strong>"+c+'</strong></span><h5><a href="/experience.html?'+e.id+'">'+e.title+'</a></h5><div class="pad-left-40">'+o.join("<br />")+"</div></li>")}})):$("#experiences-collection").append('<li class="collection-item"><h5>No results</h5></li>')})}),loadMore(),prepareFilter(),$(window).scroll(autoLoader);