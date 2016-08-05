var Client = {};
    Client.scripts = [];
    Client.interfaces = {};

var requestAnimationFrame =     window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
                                window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                                function(callback) {
                                  window.setTimeout(callback, 1000 / 60);
                                };
         
/*
 * GLOBAL CLIENT FUNCS
 */
var fn_capatilize = function(s){
    return (s.substr(0,1).toUpperCase()) + s.substr(1,s.length);
}

/*
     *  credit to HTML Unleashed by Simon Sarris, pg. 208
     *  accurate mouse pos retrieval
     */
var fn_getElementOffsets = function(el){
    var offsetX = 0;
    var offsetY = 0;

    var stylePaddingTop = parseInt(
        getComputedStyle(el, null).getPropertyValue('padding-top'));
    var stylePaddingLeft = parseInt(
        getComputedStyle(el, null).getPropertyValue('padding-left'));
    var styleBorderLeft = parseInt(
        getComputedStyle(el, null).getPropertyValue('border-left-width'));
    var styleBorderTop = parseInt(
        getComputedStyle(el, null).getPropertyValue('border-top-width'));

    var html = document.body.parentNode;
    var htmlTop = html.offsetTop;
    var htmlLeft = html.offsetLeft;

    var element = el;
    if(element.offsetParent !== undefined){
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }

    offsetX += stylePaddingLeft + styleBorderLeft + htmlLeft;
    offsetY += stylePaddingTop + styleBorderTop + htmlTop;
    
    return {
        x : offsetX,
        y : offsetY
    };
}

var fn_htmlEnc = function(s) {
    if(s && s.length > 0){
        return s.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/'/g, '&#39;')
                .replace(/"/g, '&#34;');
    }
}

var fn_validateInteger = function(val, min, max, failValue){
    val = parseInt(val);
    
    if(isNaN(val)){
        return parseInt(failValue);
    }

    if(val < min){
        return parseInt(min);
    }

    if(val > max){
        return parseInt(max);
    }
    
    return val;
}

//credit http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
var fn_rand = function(min,max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//credit http://stackoverflow.com/questions/10730362/javascript-get-cookie-by-name
 var fn_getCookie = function(name){
    var parts = document.cookie.split(name + "=");
    if(parts.length === 2) {
        return parts.pop().split(";").shift();
    }
    return false;
}

//credit http://stackoverflow.com/a/24103596/4931065
var fn_setCookie = function(name,value,days){
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

var fn_eraseCookie = function(name){
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;';
}

var fn_numberFormat = function(x){
    return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var fn_timeLeft = function(timeLeft){
    var timeString = '';
        
    var hours = false;
    var minutes = false;
    var seconds = 0;
        
    //HOURS
    if(timeLeft >= 3600000){
        hours = Math.floor(timeLeft / 3600000);
        timeLeft -= hours * 3600000;
        
        timeString += fn_numberFormat(hours) + ' hours';
    }
    
    //MINUTES
    if(timeLeft >= 60000){
        minutes = Math.floor(timeLeft / 60000);
        timeLeft -= minutes * 60000;
        
        if(hours !== false){
            timeString += ', ';
        }
        
        timeString += fn_numberFormat(minutes) + ' minutes';
    }
    
    //SECONDS
    seconds = Math.floor(timeLeft / 1000);
    
    if(hours !== false || minutes !== false){
        timeString += ', ';
    }
        
    timeString += fn_numberFormat(seconds) + ' seconds';
        
    return timeString;
}

var fn_colorTable_AltBg = function(selector, bg1, bg2){
    $(selector +' tr:even').css("background-color", bg1);
    $(selector +' tr:odd').css("background-color", bg2);
}

var fn_objectIsEmpty = function(obj){
    for(var key in obj){
        return false;
    }
    
    return true;
}

//credit http://phpjs.org/functions/nl2br/
function fn_nl2br(str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

$(document).ready(function(){
    var Core = new Client.Core();
});