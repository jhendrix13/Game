(function(){
    function Button(Core, x, y, text, properties, callback){
        this.Core = Core;
        
        this.x = x;
        this.y = y;
        this.width = 0;
        this.height = 0;
        this.zIndex = 0;
        this.hidden = false;
        this.enabled = true;
        this.colorPrimary = '#292929';
        this.colorSecondary = '#949494';
        this.colorHoverPrimary = '#949494';
        this.colorHoverSecondary = '#292929';
        this.textColor = '#FFF';
        this.text = text;
        this.textX = 0; //for caching
        this.textY = 0; //for caching
        this.font = '14px Arial';
        this.splitColors = false;
        this.border = 'yellow';
        this.borderSize = 1;
        this.hoverCursor = 'pointer';
        this.callback = callback;
        
        //states
        this.hovering = false;
        this.clicked = false;
        
        this.setProperties(properties);
        this.setText(text);
        this.updated();
    }
    
    /*
     *  checks whether element was clicked/is being hovered over
     */
    Button.prototype.check = function(){
        if(!this.hidden){
            var Canvas = this.Core.Canvas;

            var mx = Canvas.mouse.x;
            var my = Canvas.mouse.y;

            //store previous hovering state
            var prevHovering = this.hovering;
            
            //has the button been updated? e.g.: user went from
            //hovering mouse to no longer hovering
            var hovering = this.coordsIn(mx, my);
            var clicked = this.wasClicked();
            
            //set to current states
            this.hovering = hovering;
            this.clicked = clicked;

            if((prevHovering && !hovering) || (!prevHovering && hovering)){
                //update cursor
                if(hovering){
                    $('html,body').css('cursor', this.hoverCursor);
                }else{
                    $('html,body').css('cursor', 'default');
                }
                
                //now update
                this.updated();
            }
        }
    }
    
    /*
     *  after Gui determines who has the highest zIndex, etc
     *  we this function is ran before draw()
     */
    Button.prototype.process = function(){
        var self = this;
        
        if(this.clicked && typeof this.callback !== 'undefined'){
            var clicks = this.Core.Canvas.clicks;

            //remove click from Canvas.clicks
            for(var i = 0; i < clicks.length; i++){
                if(self.coordsIn(clicks[i].x, clicks[i].y)){
                    clicks = clicks.splice(i, 1);
                }
            }
            
            this.callback();
            this.updated();
        }
    }
    
    /*
     *  draws the button to the given canvas context
     */
    Button.prototype.draw = function(){
        if(!this.hidden){
            var self = this;
            var ctx = this.Core.Gui.memCtx;
            
            var hover = this.hovering;
            var clicked = this.clicked;

            ctx.beginPath();
            
            if(this.splitColors){
                //COLOR 1
                ctx.rect(this.x, this.y, this.width, this.height/2);
                ctx.fillStyle = (hover) ? this.colorHoverPrimary : this.colorPrimary;
                ctx.fill();

                //COLOR 2
                ctx.beginPath();

                ctx.rect(this.x, this.y + (this.height/2), this.width, this.height/2);
                ctx.fillStyle = (hover) ? this.colorHoverSecondary : this.colorSecondary;
                ctx.fill();
            }else{
                ctx.rect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = (hover) ? this.colorHoverPrimary : this.colorPrimary;
                ctx.fill();
            }

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
    
    Button.prototype.setText = function(text){
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
    
    Button.prototype.setProperties = function(properties){
        for(var property in properties){
            var value = properties[property];
            
            if(typeof this[property] !== 'undefined' && property !== 'text'){
                this[property] = value;
            }else{
                console.error('BUTTON.JS: Property '+ property +' does not exist.');
            }
        }
        
        this.updated();
    }
    
    /*
     *  returns whether the element was clicked or not
     */
    Button.prototype.wasClicked = function(){
        var self = this;
        var clicks = this.Core.Canvas.clicks;
        
        for(var i = 0; i < clicks.length; i++){
            if(self.coordsIn(clicks[i].x, clicks[i].y) && clicks[i].button === 0){
                return true;
            }
        }
        
        return false;
    }
    
    /*
     *  are the given coords within the button? 
     */
    Button.prototype.coordsIn = function(x, y){
        return (
            ( x >= this.x && x < this.x+this.width ) &&
            ( y >= this.y && y < this.y+this.height )
        );
    }
    
    Button.prototype.updated = function(){
        this.Core.Gui.guiStateUpdated();
    }
    
    Client.Button = Button;
})();