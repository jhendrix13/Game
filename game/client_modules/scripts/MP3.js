/*
 *  CLIENT
 */

(function(){
    function MP3(Core, file){
        this.Core = Core;
        this.mp3_file = file;
        this.mp3_id = window.btoa(file).substr(0,10);
        this.mp3_el = false;
    }
    
    MP3.prototype.load = function(){
    }
    
    MP3.prototype.play = function(){
        this.mp3_el.play();
    }
    
    MP3.prototype.stop = function(){
        this.mp3_el.stop();
    }
    
    MP3.prototype.onFinished = function(){
        this.mp3_el.remove();
    }
    
    Client.scripts.push(['MP3', MP3]);
})();
