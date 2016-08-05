/*
 * 
 * WARNING
 * WARNING
 * WARNING
 * WARNING
 * WARNING
 */

(function(){
    function Rectangle(Core, x, y, zIndex){
        this.Core = Core;
        
        this.x = x;
        this.y = y;
        this.width = 0;
        this.height = 0;
        this.zIndex = zIndex;
        this.hidden = false;
        this.enabled = true;
        this.colorPrimary = '#292929';
        this.colorSecondary = '#949494';
        this.colorHover = '';
        this.colorMouseDown = '';
        this.textColor = '#FFF';
        this.textAlign = 'center';
        this.text = text;
        this.textX = 0; //for caching
        this.textY = 0; //for caching
        this.font = '14px Arial';
        this.splitColors = false;
        this.border = 'yellow';
        this.borderSize = 1;
        this.callback = callback;
        
        //states
        this.hovering = false;
        this.clicked = false;
        
        this.setText(text);
        this.updated();
    }
    
    /*
     *  check if element should be redrawn
     */
    Rectangle.prototype.check = function(){
        if(!this.hidden){
            var Canvas = this.Core.Canvas;

            var mx = Canvas.mouse.x;
            var my = Canvas.mouse.y;

            //store previous hovering state
            var prevHovering = this.hovering;
            
            //get current states
            var hovering = this.coordsIn(mx, my);
            var clicked = this.wasClicked();
            
            //set to current states
            this.hovering = hovering;
            this.clicked = clicked;

            //callback when clicked
            if(clicked && typeof this.callback !== 'undefined'){
                this.callback();
            }

            //has the button been updated? e.g.: user went from
            //hovering mouse to no longer hovering
            if((prevHovering && !hovering) || (!prevHovering && hovering)){
                this.updated();
            }
        }
    }
    
    /*
     *  draws the button to the given canvas context
     */
    Rectangle.prototype.draw = function(){
        if(!this.hidden){
            var self = this;
            var ctx = this.Core.Gui.memCtx;
            
            var hover = this.hovering;
            var clicked = this.clicked;

            if(this.splitColors){

            }else{
                ctx.beginPath();

                ctx.rect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = (hover) ? this.colorSecondary : this.colorPrimary;
                ctx.fill();

                if(this.border){
                    ctx.beginPath();

                    ctx.translate(.50, .50);
                    ctx.strokeStyle = this.border;
                    ctx.lineWidth = this.borderSize;
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                    ctx.lineWidth = 1;
                    ctx.translate(-.50, -.50);
                }

                if(this.text.length > 0){
                    ctx.fillStyle = this.textColor;
                    ctx.textAlign = 'center';
                    ctx.font = self.font;
                    ctx.fillText(self.text, self.textX, self.textY);
                }
            }
        }
    }
    
    Rectangle.prototype.setText = function(text){
        //create a temp canvas so we can us the context
        //to measure the length of given text
        $('body').append('<canvas width="1" height="1" id="gui_button"></canvas>');
        var ctx = document.getElementById('gui_button').getContext('2d');
        
        //we need to be using the right font to get the correct
        //width. diff font, diff size
        ctx.font = this.font;
        
        var textWidth = ctx.measureText(text).width;
        
        this.width = textWidth+25;
        this.height = 38;
        this.textX = (this.x + ( this.width*.5 ));
        this.textY = this.y + ( this.height/2 ) + 4;
        
        //remove the temporary canvas
        $('#gui_button').remove();
        
        this.updated();
    }
    
    Rectangle.prototype.wasClicked = function(){
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
     *  are the given coords within the button? 
     */
    Rectangle.prototype.coordsIn = function(x, y){
        return (
            ( x >= this.x && x < this.x+this.width ) &&
            ( y >= this.y && y < this.y+this.height )
        );
    }
    
    Rectangle.prototype.updated = function(){
        this.Core.Gui.guiStateUpdated();
    }
    
    Client.Rectangle = Rectangle;
})();