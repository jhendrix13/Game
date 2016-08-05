/*
 *  UNFINISHED UNFINISHED UNFINISHED UNFINISHED
 *  UNFINISHED UNFINISHED UNFINISHED UNFINISHED
 *  UNFINISHED UNFINISHED UNFINISHED UNFINISHED
 *  UNFINISHED UNFINISHED UNFINISHED UNFINISHED
 */

(function(){
    function Image(Core, img){
        this.Core = Core;
        this.img = img;
        this.width = 0;
        this.height = 0;
        this.zIndex = 0;
        this.hidden = false;
    }
    
    Image.prototype.check = function(){
        if(!this.hidden){
            var Canvas = this.Core.Canvas;

            var mx = Canvas.mouse.x;
            var my = Canvas.mouse.y;
            
            //set to current states
            this.hovering = this.coordsIn(mx, my);
            this.clicked = this.wasClicked();
        }
    }
    
    Image.prototype.draw = function(){
        
    }
    
    Image.prototype.wasClicked = function(){
        var self = this;
        var clicks = this.Core.Canvas.clicks;
        
        for(var i = 0; i < clicks.length; i++){
            if(self.coordsIn(clicks[i].x, clicks[i].y)){
                //remove the click from the click list
                clicks = clicks.splice(i, 1);
                
                return true;
            }
        }
    }
    
    /*
     *  are the given coords within the loading bar?
     */
    Image.prototype.coordsIn = function(x, y){
        return (
            ( x >= this.x && x < this.x+this.width ) &&
            ( y >= this.y && y < this.y+this.height )
        );
    }
    
    Image.prototype.updated = function(){
        this.Core.Gui.guiStateUpdated();
    }
    
    Client.Image = Image;
})();