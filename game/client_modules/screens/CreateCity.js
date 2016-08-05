/*
 *  CLIENT
 */

(function(){
    function CreateCity(){}
    
    CreateCity.prototype.construct = function(Core){
        this.Core = Core;
        this.GUI_Elements = [];
        
        this.errorTimeout = false;
    }
    
    CreateCity.prototype.draw = function(){
        var ctx = this.Core.Canvas.ctx;
        var canvas = this.Core.Canvas.canvas;
        
        //draw animated background
        this.Core.scripts.AnimatedBg.draw(ctx, canvas);
    }
    
    CreateCity.prototype.validateForm = function(){
        var capital = $('#create_city input[name="capital"]').val().trim();
        var dsc = $('#create_city input[name="dsc"]').val().trim();
        
        if(capital.length < 3){
            this.setFormError('Capital name must be at least 3 characters.');
        }else if(capital.length > 18){
            this.setFormError('Capital name cannot be larger than 18 characters.');
        }else{
            this.showLoadingDiv(true);
            this.Core.client.emit('registerCity', {
                capital : capital,
                dsc     : dsc
            });
        }
    }
    
    CreateCity.prototype.showLoadingDiv = function(bool){
        if(bool){
            $('#create_city div[name="create_form"]').hide();
            $('#create_city div[name="loading"]').show();
        }else{
            $('#create_city div[name="loading"]').hide();
            $('#create_city div[name="create_form"]').show();
        }
        
        this.center();
    }
    
    CreateCity.prototype.setFormError = function(error){
        var el = $('#create_city div[name="error"]');
        
        el.text(error);
        el.stop(true);
        el.show(0);
        clearTimeout(this.errorTimeout);
        
        this.errorTimeout = setTimeout(function(){
            el.fadeOut(2000);
        },5000);
    }
    
    CreateCity.prototype.center = function(){
        var el = $('#create_city');
        var pos = $('#game').offset();

        var offsetX = this.Core.Canvas.canvas.width/2;
        var offsetY = this.Core.Canvas.canvas.height/2;

        offsetX -= el.width()/2;
        offsetY -= el.height()/2;

        el.css({
            top : pos.top + offsetY,
            left : pos.left + offsetX
        });
    }
    
    CreateCity.prototype.windowResized = function(){
        this.center();
    }
    
    CreateCity.prototype.onSwitchedTo = function(){
        this.center();
        
        $('#create_city').show();
        
        var self = this;
        $(document).on('click', '#create_city button[name="create"]', this.validateForm.bind(this));
        $(document).on('keypress', '#create_city input', function(e){
            if(e.keyCode === 13) {
                self.validateForm.bind(self)();
            }
        });
    }
    
    CreateCity.prototype.onSwitchedFrom = function(){
        console.log('hey')
        $('#create_city').hide();
        
        $(document).off('click', '#create_city button[name="create"]');
        $(document).off('keypress', '#create_city input');
    }
    
    /*
     *  any provided background will automatically center.
     *  @param  img     should be an already loaded image resource
     */
    CreateCity.prototype.setBackground = function(img){
        
    }
    
    Client.CreateCity = CreateCity;
})();