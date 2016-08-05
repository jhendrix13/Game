(function(){
    function LBar(Core, x, y, properties){
        this.Core = Core;
        
        this.x = x;
        this.y = y;
        this.width = 350;
        this.height = 60;
        this.zIndex = 0;
        this.percent = 0;
        this.text = 'Loading';
        this.textX = 0; //cached
        this.textY = 0; //cached
        this.font = '14px Arial';
        this.textColor = 'white';
        this.textAlign = 'center';
        this.colorPrimary = 'red';
        this.colorSecondary = 'green';
        this.borderColor = 'green';
        this.borderSize = 1;
        this.hidden = false;
        
        //states
        this.hovering = false;
        this.clicked = false;
        
        this.setProperties(properties);
        this.updated();
    }
    
    LBar.prototype.check = function(){
        if(!this.hidden){
            var Canvas = this.Core.Canvas;

            var mx = Canvas.mouse.x;
            var my = Canvas.mouse.y;
            
            //set to current states
            this.hovering = this.coordsIn(mx, my);
            this.clicked = this.wasClicked();
        }
    }
    
    /*
     *  draws the button to the given canvas context
     */
    LBar.prototype.draw = function(){
        if(!this.hidden){
            var ctx = this.Core.Gui.memCtx;
            
            /*
             *  INNER BAR 1
             */
            
            ctx.beginPath();
            ctx.fillStyle = this.colorPrimary;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            /*
             *  INNER BAR 2
             */
            var per = this.percent;

            if(per > 0){
                //the width of the actual loading bar that appears
                //inside the entire box
                var innerWidth = Math.floor(this.width*(per/100));

                ctx.beginPath();
                ctx.fillStyle = this.colorSecondary;
                ctx.fillRect(this.x, this.y, innerWidth, this.height);
            }
            
            /*
             *  BORDER
             */
            if(this.borderColor){
                ctx.beginPath();
                ctx.strokeStyle = this.borderColor;
                ctx.lineWidth = this.borderSize;
                ctx.translate(.50, .50);
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                ctx.translate(-.50, -.50);
                ctx.lineWidth = 1;
            }

            /*
             *  TEXT
             */
            if(this.text){
                ctx.textAlign = this.textAlign;
                ctx.font = this.font;
                ctx.fillStyle = this.textColor;
                ctx.fillText(this.text, this.textX, this.textY);
            }
        }
    }
    
    LBar.prototype.setText = function(text){
        if(!text){
            this.text = false;
        }else{
            this.text = text;
            this.textX = (this.x + ( this.width*.5 ));
            this.textY = this.y + ( this.height/2 ) + 4;
        }
        
        this.updated();
    }
    
    LBar.prototype.setPos = function(x, y){
        this.x = x;
        this.y = y;
        this.updated();
    }
    
    LBar.prototype.setPercent = function(per){
        this.percent = per;
        this.updated();
    }
    
    LBar.prototype.hide = function(bool){
        this.hidden = bool;
        this.updated();
    }
    
    LBar.prototype.setProperties = function(properties){
        for(var property in properties){
            var value = properties[property];
            
            if(typeof this[property] !== 'undefined'){
                this[property] = value;
            }else{
                console.error('LoadingBar.js: Property '+ property +' does not exist.');
            }
        }
        
        this.updated();
    }
    
    LBar.prototype.wasClicked = function(){
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
    LBar.prototype.coordsIn = function(x, y){
        return (
            ( x >= this.x && x < this.x+this.width ) &&
            ( y >= this.y && y < this.y+this.height )
        );
    }
    
    LBar.prototype.updated = function(){
        this.Core.Gui.guiStateUpdated();
    }
    
    Client.LBar = LBar;
})();