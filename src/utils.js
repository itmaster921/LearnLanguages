import {DOMParser} from 'xmldom';

function xmlToJson(xml) {
  // Create the return object
  var obj = {};

  if (xml.nodeType == 1) { // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) { // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for(var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      
      if(!nodeName) continue;

      if (typeof(obj[nodeName]) == "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof(obj[nodeName].push) == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
};

function copy(o) {
  var output, v, key;
  output = Array.isArray(o) ? [] : {};
  for (key in o) {
      v = o[key];
      output[key] = (typeof v === "object") ? copy(v) : v;
  }
  return output;
}

function qsToJson(qs) {
  var res = {};
  var pars = qs.split('&');
  var kv, k, v;
  for (i in pars) {
    kv = pars[i].split('=');
    k = kv[0];
    v = kv[1];
    v = v.replace(/\+/g, '%20'); 
    res[k] = decodeURIComponent(v);
  }
  return res;
}

function timeStringFromSeconds(seconds){
  var date = new Date(null);
  date.setSeconds(seconds); // specify value for SECONDS here
  var timeString = date.toISOString().substr(11, 8);
  if(timeString.startsWith("00:"))
    timeString = timeString.substr(3);
  return timeString;
}

function strip(html){
  html = '<span>' + html + '</span>';
  var doc = (new DOMParser()).parseFromString(html, 'text/html');
  return doc.documentElement.textContent || "";
}

function getVideoIdFromYoutubeLink(link){
  var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  var match = link.match(regExp);
  if (match && match[2].length == 11) {
    return match[2];
  } else {
    return null
  }
}

export {
  copy,
  xmlToJson,
  qsToJson,
  timeStringFromSeconds,
  strip,
  getVideoIdFromYoutubeLink,
}