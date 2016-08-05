/*
 *  CLIENT
 */

(function(){
    function Canvas(){}
    
    Canvas.prototype.construct = function(Core, canvas){
        var self = this;
        
        this.Core = Core;
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.screen = false;
        
        //store all the inMem canvases and contextes created by
        //createInMemCanvas()
        this.inMemCanvases = {};
        
        //bounding box variables
        this.offsetX = 0;
        this.offsetY = 0;
        
        //mouse properties
        this.mouse = {
            x : 0,
            y : 0,
            cx : 0,
            cy : 0,
            drag : {
                x : 0,
                y : 0,
                endX : 0,
                endY : 0
            },
            button : 0,
            down : false
        };
        
        this.clicks = [];
        
        //init/start stuff
        this.resize(1400, 800);
    }
    
    Canvas.prototype.main = function(){
        var Core = this.Core;
        var mouse = this.mouse;
        
        //clear for drawing
        this.clear();
        
        //we draw all GUI elements to the memory context. then
        //redraw the GUI elements from the memory context
        //reason for doing this is so we can process the GUI elements
        //and see if a GUI element has been clicked.
        Core.Gui.draw(this.screen);
        this.screen.draw();
        this.ctx.drawImage(Core.Gui.memCanvas, 0, 0);
        
        /*this.ctx.font = '10px "Times New Roman", serif';
        this.ctx.fillStyle = 'red';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(mouse.x+','+mouse.y, 11, 10);
        this.ctx.fillText(mouse.cx+', '+ mouse.cy, 11, 18);*/
        
        //clear clicks
        this.clicks = [];
       
        //call next frame to be drawn
        requestAnimationFrame(this.main.bind(this));
    }

    Canvas.prototype.posInArea = function(x, y, area){
        var finalX = area.width + area.x;
        var finalY = area.height + area.y;
        
        return ((x >= area.x && x <= finalX) && (y >= area.y && y <= finalY)) ? true : false;
    }
   
    Canvas.prototype.setBoundingBox = function(){
        var offsets = fn_getElementOffsets(this.canvas);
        
        this.offsetX = offsets.x;
        this.offsetY = offsets.y;
        
        this.Core.Gui.fixNotificationPos();
    }
    
    Canvas.prototype.mouseOutsideCanvas = function(){
        return (
            this.mouse.x < 0 || this.mouse.x > this.canvas.width ||
            this.mouse.y < 0 || this.mouse.y > this.canvas.height
        ) ? true : false;
    }
    
    /*
     *  called whenever the mouse moves anywhere on the canvas 
     */
    Canvas.prototype.setMousePos = function(e){
        this.mouse.x = e.pageX - this.offsetX;
        this.mouse.y = e.pageY - this.offsetY;
        this.mouse.cx = e.clientX;
        this.mouse.cy = e.clientY;
    }
    
    Canvas.prototype.mouseDown = function(e){
        this.mouse.down = true;

        //set drag pos
        this.mouse.drag.x = this.mouse.x;
        this.mouse.drag.y = this.mouse.y;
        this.mouse.button = e.button;
    }
    
    Canvas.prototype.mouseUp = function(){
        var self = this;
        var mouse = this.mouse;
        
        mouse.down = false;
        
        mouse.drag.endX = mouse.x;
        mouse.drag.endY = mouse.y; 
        
        //do not act as a click if it was a drag
        if(mouse.drag.x === mouse.drag.endX && mouse.drag.y === mouse.drag.endY){
            this.clicks.push({
                x : mouse.x,
                y : mouse.y,
                cx : mouse.cx,
                cy : mouse.cy,
                button : mouse.button
            });
        }
    }
    
    Canvas.prototype.setScreen = function(screen){
        if(screen !== this.screen){
            this.Core.InterfaceManager.handleScreenSwitch();
            
            //tell the screen it is being switched from
            if(this.screen.onSwitchedFrom){
                this.screen.onSwitchedFrom();
            }

            //switch to new screen
            this.screen = screen;

            //tell the screen it has been switched to
            if(this.screen.onSwitchedTo){
                this.screen.onSwitchedTo();
            }
            
            //reset cursor
            $('html,body').css('cursor', 'default');
        }else{
            console.warn('Screen already set.');
        }
    }
    
    Canvas.prototype.clear = function(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /*
     *  returns an instance of an object that has own functions/properties
     */
    Canvas.prototype.createInMemCanvas = function(width, height){
        var parent = this;
        return new (function inMemCanvas(){
            var self = this;
            
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');

            this.canvas.width    = (typeof width !== 'undefined') ? width : parent.canvas.width;
            this.canvas.height   = (typeof width !== 'undefined') ? height : parent.canvas.height;
            
            this.clear = function(){
                self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
            };
            this.resize = function(width, height){
                self.canvas.width = width;
                self.canvas.height = height;
            };
        });
    }
    
    Canvas.prototype.resize = function(width, height){
        this.canvas.width = width;
        this.canvas.height = height;
        
        //resize any in-mem canvases
        this.Core.Gui.memCanvas.width = width;
        this.Core.Gui.memCanvas.height = height;
        
        var inMemCanvases = this.inMemCanvases;
        
        for(var canvas in inMemCanvases){
            canvas = inMemCanvases[canvas];
            
            canvas.width = width;
            canvas.height = height;
        }
        
        this.setBoundingBox();
        
        console.log('Resized canvas to '+ width +'x'+ height +'.');
    }
    
    Canvas.prototype.windowResized = function(){
        this.setBoundingBox();
    }
    
    Client.Canvas = Canvas;
})();