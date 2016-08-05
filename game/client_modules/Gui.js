(function(){
    function Gui(){}
    
    Gui.prototype.construct = function(Core, GUIElements){
        var self = this;
        
        this.Core = Core;
        
        //in-memory canvas & context
        this.memCanvas = document.createElement('canvas');
        this.memCtx = this.memCanvas.getContext('2d');
        
        //store GUIEelemnts
        for(var element in GUIElements){
            self[element] = GUIElements[element];
        }
        
        this.guiPrevScreen = false;
        
        //if the gui is updated or any properties changed,
        //this varialbe  will be set to true so we can redraw
        //if no gui change, we do not redraw gui
        this.guiStateChanged = false;
        this.guiElementHovering = false;
        this.guiExternHovering = false;
        
        //popup stuff
        this.popupActive = false;
        this.popups = [];
        this.popupWidth = 425;
    }
    
    /*
     *  draws all the GUI elements of the given screen
     *  
     *  (IF NECESSARY) May not always draw.
     */
    Gui.prototype.draw = function(screen){
        var elements = screen.GUI_Elements;
        
        //reset values for next loop
        this.guiElementHovering = false;
        
        //max_zIndex will allow the Gui to determine what element
        //is on the highest layer; so say there are two gui elements
        //and they overlap, we will always store the zIndex of the "closer"
        //gui element, that way we know which element has priority for actions
        //such as clicking & hovering
        var max_zIndex = 0;
        
        //elements who have had their states changed/activated
        var activated_elements = [];
        
        //if we have moved to a different screen, we want to force
        //a clear and redraw to get rid of any left over GUI from the
        //previous screen
        if(screen !== this.guiPrevScreen){
            this.clear();
            this.guiStateChanged = true;
        }
        
        //if the given screen has GUIElements
        if(elements && elements.length > 0){
            //run tests
            for(var i = 0; i < elements.length; i++){
                var element = elements[i];
                var zIndex = element.zIndex;

                //run necessary checks to test if element was clicked
                //or mouse is hovering over
                element.check();

                //if either element clicked or being overed over
                if(element.hovering || element.clicked){
                    this.guiElementHovering = true;

                    activated_elements.push(i);

                    if(zIndex > max_zIndex){
                        max_zIndex = element.zIndex;
                    }
                }
            }

            //set appropriate states regarding zIndex levels
            for(var i = 0; i < activated_elements.length; i++){
                var element = elements[activated_elements[i]];

                //if this element has been clicked or is being hovered over
                //but IS NOT in the highest zIndex level that also has another element
                //being hovered over or clicked on, then ignore the action of the lower element
                if(element.zIndex !== max_zIndex){
                    element.clicked = false;
                    element.hovering = false;
                }else if(typeof elements[i].process !== 'undefined'){
                    element.process();
                }
            }

            //now that the checks have ran, if any of the checks
            //have set guiStateChanged to true, we can now draw the changes
            if(this.guiStateChanged){
                this.clear();

                //get the GUI elements of the current screen from Canvas
                var elements = screen.GUI_Elements;

                for(var i = 0; i < elements.length; i++){
                    elements[i].draw();
                }

                //gui canvas updated!
                this.guiStateChanged = false;
            }
        }
        
        this.guiPrevScreen = screen;
    }
    
    Gui.prototype.notify = function(popupData, type){
        var self = this;
        
        $('#notifications').append('<div name="notification" class="hidden"><img src="game/resources/images/notifications/notification_attack.png" /></div>');
        
        $('#notifications div[name="notification"]:last').fadeIn(1000);
        $('#notifications div[name="notification"]:last').on('mousedown', function(e){
            e.preventDefault();
            
            if(e.which === 1 && popupData){
                self.popup(1, popupData[1], popupData[2], popupData[3]);
            }
            
            $(this).fadeOut(1000);
            $(this).off('click');
        });
    }
    
    Gui.prototype.fixNotificationPos = function(){
        var offsets = {
            x : 10,
            y : 25
        };
        
        var pos = $('#game').offset();
        var height = $('#game').height() - this.Core.Canvas.offsetY;
        
        $('#notifications').css({
            top : pos.top + offsets.y,
            left : pos.left + offsets.x,
            "max-height" : height - offsets.y,
            "min-height" : height - offsets.y
        });
    }
    
    Gui.prototype.clearNotifications = function(){
        $('#notifications div[name="notification"]').off('mousedown');
        $('#notifications div[name="notification"]').remove();
    }
    
    Gui.prototype.popup = function(store, title, content, options){
        if(!this.popupActive || (this.popupActive && store)){
            var options = (typeof options === 'undefined') ? {} : options;
            
            if(typeof options.x === 'undefined' || typeof options.x === 'undefined'){
                options.x = 0;
                options.y = 0;
            }
            
            if(typeof options.buttons === 'undefined'){
                options.buttons = false;
            }
            
            //push with a client x and y so we know where on the page they clicked,
            //and not just relative to the canvas
            this.popups.push({
                title : title,
                content : content,
                buttons : options.buttons,
                x : options.x,
                y : options.y
            });
        }
        
        if(!this.popupActive)
            this.displayNextPopup();
    }
    
    /*
     *  Displays the oldest to newest popup.
     *  The type variable, if 0, means that the popup will
     *  not be queued because it is not important enough, if the
     *  type is 1, it will be queued if there is an existing popup.
     */
    Gui.prototype.displayNextPopup = function(){
        var popup = this.popups[0];
        
        if(typeof popup !== 'undefined'){
            this.popupActive = true;
            
            var title = popup.title;
            var content = popup.content;
            var buttons = popup.buttons;
            
           
            var x = popup.x,
                y = popup.y;
            
            //we will center the popup if no x or y pos is given
            if(x === 0 || y === 0){
                var Canvas = this.Core.Canvas;
                x = (Canvas.offsetX + (Canvas.canvas.width * .5)) - (this.popupWidth * .5);
                y = Canvas.offsetY + 150;
            }

            var buttonHTML = '';
            if(buttons){
                var i = 0;
                
                //generate each button element
                for(var button in buttons){
                    buttonHTML += '<button name="guiButton-'+ i +'">'+ buttons[button][0] +'</button>&nbsp;';
                    i++;
                }
            }else{
                buttonHTML += '<button name="guiButton-default">OK</button>';
            }

            //this will position our popup element where the user clicked
            var style = 'top:'+ y + 'px;left:'+ x +'px;width:'+ this.popupWidth +'px';

            //make sure an element doesn't already exist
            $('#popup').remove();

            //create popup on page
            $('body').append('<div id="popup" style="'+ style +'" class="popup"><div class="title">'+ title +'</div><div class="content">'+ content +'</div><div class="buttons">'+ buttonHTML +'</div><div class="clear"></div></div>');
            
            //make popup draggable
            $('#popup').draggable({
                handle : ".title"
            });
        }
    }
    
    Gui.prototype.handleAction = function(event){
        var action = event.target.getAttribute('name').split('-')[1];
        
        if(action !== 'default'){
            //execute the button's function IF IT HAS ONE
            var func = this.popups[0].buttons[parseInt(action)][1];
            if(func){
                func();
            }
        }
        
        //remove our popup
        this.popups.shift();
        $('#popup').remove();
        this.popupActive = false;
        
        //now is there still popups in the queue?
        if(this.popups.length > 0){
            this.displayNextPopup();
        }else{
            this.guiExternHovering = false;
        }
    }
    
    /* 
     * is the mouse hovering over an external gui element? when the mouse enters or
     * exits the element, this function will be triggered with a boolean
     */
    Gui.prototype.mouseWithinExternElement = function(bool){
        this.guiExternHovering = bool;
    }
    
    Gui.prototype.hoveringOverGuiElement = function(){
        return (this.guiElementHovering || this.guiExternHovering);
    }
    
    Gui.prototype.guiStateUpdated = function(){
        this.guiStateChanged = true;
    }
    
    Gui.prototype.clear = function(){
        this.memCtx.clearRect(0, 0, this.memCanvas.width, this.memCanvas.height);
    }
    
    Gui.prototype.windowResized = function(){
        // nothing
    }
    
    Client.Gui = Gui;
})();