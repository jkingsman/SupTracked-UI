function experience_list(){"use strict";allExperiences.forEach(function(n){n.title.length<1&&(n.title="[none]");var i=0;n.consumptions.forEach(function(n){n.drug.id===drug.id&&(i+=n.count)});var e=[],t="Solo Experience";n.consumptions.forEach(function(n){n.friends.forEach(function(n){-1===e.indexOf(n.name)&&e.push(n.name)})}),e.length>0&&(t=e.join(", "));var a=[],o="[no location]";n.consumptions.forEach(function(n){-1===a.indexOf(n.location)&&a.push(n.location)}),a.length>0&&(o=a.join(", ")),$("#experienceContainer").append('<li class="collection-item">'+new Date(1e3*n.date).toISOString().slice(0,10)+'<span class="right hide-on-med-and-down" style="max-width: 50%;">'+t+" at <strong>"+o+'</strong></span><h5><a href="/experience.html?'+n.id+'">'+n.title+'</a></h5><div class="pad-left-40">'+i+" "+drug.unit+" "+drug.name+"</div></li>")}),analyticsFinished+=1}var analyticsCount,analyticsFinished,allDrugs,allConsumptions,drug,allExperiences;analyticsCount+=1;
function top_listings(){"use strict";var n={};allConsumptions.forEach(function(o){n.hasOwnProperty(o.location)?n[o.location]=n[o.location]+1:n[o.location]=1});var o=Object.keys(n);o.sort(function(o,t){return n[o]>n[t]?-1:n[o]<n[t]?1:0}),o=o.slice(0,10);var t="<ol>"+o.map(function(o){return"<li>"+o+" ("+n[o]+" consumptions/"+Math.round(n[o]/allConsumptions.length*100,-1)+"%)</li>"}).join("")+"</ol>";$("#topLocations").append(t),analyticsFinished+=1;var i={};allConsumptions.forEach(function(n){n.friends.forEach(function(n){i.hasOwnProperty(n.name)?i[n.name]=i[n.name]+1:i[n.name]=1})});var a=Object.keys(i);a.sort(function(n,o){return i[n]>i[o]?-1:i[n]<i[o]?1:0}),a=a.slice(0,10);var s="<ol>"+a.map(function(n){return"<li>"+n+" ("+i[n]+" consumptions)</li>"}).join("")+"</ol>";$("#topFriends").append(s),analyticsFinished+=1}var analyticsCount,analyticsFinished,allDrugs,allConsumptions,drug;analyticsCount+=2;
function vitals(){"use strict";allDrugs.sort(function(t,e){return t.use_count<e.use_count?1:t.use_count>e.use_count?-1:0});var t=allDrugs.map(function(t){return t.name}),e=t.indexOf(drug.name),a="";e>0&&(a='preceded by <a href="/analytics.html?'+allDrugs[e-1].id+'">'+t[e-1]+"</a>");var n="";e!==t.length-1&&(n='followed by <a href="/analytics.html?'+allDrugs[e+1].id+'">'+t[e+1]+"</a>");var s;s=a&&n?"("+a+" and "+n+")":a?"("+a+")":n?"("+n+")":"",$("#ranking").html("#"+(e+1)+" by usage with "+allDrugs[e].use_count+" uses <i>"+s+"</i>"),$("#useFirst").html(new Date(1e3*allConsumptions[0].date).toISOString().slice(0,16).replace(/T/," ").replace(":","")+' -- <a href="/experience.html?'+allConsumptions[0].exp_id+'">'+allConsumptions[0].title+"</a>"),$("#useLast").html(new Date(1e3*allConsumptions[allConsumptions.length-1].date).toISOString().slice(0,16).replace(/T/," ").replace(":","")+' -- <a href="/experience.html?'+allConsumptions[allConsumptions.length-1].exp_id+'">'+allConsumptions[allConsumptions.length-1].title+"</a>");var l=allConsumptions.map(function(t){return Math.floor(new Date(1e3*t.date)/864e5)});l=l.filter(function(t,e){return l.indexOf(t)===e});var i=[],r={};l.forEach(function(t,e){return 0===e?(r.startDate=t,void(r.days=1)):e===l.length-1?void i.push({startDate:r.startDate,days:r.days}):void(t-l[e-1]===1?r.days+=1:(i.push({startDate:r.startDate,days:r.days}),r.startDate=t,r.days=1))}),i.sort(function(t,e){return t.days<e.days?1:t.days>e.days?-1:0}),$("#streak").html(i[0].days+" days <i>(starting on "+new Date(86400*i[0].startDate*1e3).toISOString().slice(0,10)+")</i>");var o,u,p=!1,c=0;allConsumptions.forEach(function(t,e){var a;return e===allConsumptions.length-1?(a=Math.floor((new Date).getTime()/1e3)-t.date,void(a>c&&(o=e,u=0,p=!0,c=a))):(a=allConsumptions[e+1].date-t.date,void(a>c&&(o=e,u=e+1,c=a)))});var d,m=new Date(1e3*allConsumptions[o].date).toISOString().slice(0,16).replace(/T/," ").replace(":","")+' (<a href="/experience.html?'+allConsumptions[o].exp_id+'">'+allConsumptions[o].title+"</a>)";d=p?(new Date).toISOString().slice(0,16).replace(/T/," ").replace(":","")+" (present)":new Date(1e3*allConsumptions[u].date).toISOString().slice(0,16).replace(/T/," ").replace(":","")+' (<a href="/experience.html?'+allConsumptions[u].exp_id+'">'+allConsumptions[u].title+"</a>)";var h=Math.floor(c/86400);$("#tBreak").html(m+" to "+d+" ("+h+" days)"),analyticsFinished+=1}var analyticsCount,analyticsFinished,allDrugs,allConsumptions,drug;analyticsCount+=1;