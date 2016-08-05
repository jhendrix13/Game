(function(){
    function InterfaceManager(){}
    
    InterfaceManager.prototype.construct = function(Core){
        this.Core = Core;
        
        this.loaded_interfaces = {};
        this.last_loaded = '';
    }
    
    InterfaceManager.prototype.loadInterface = function(id, param1, param2, param3){
        var interface = Client.interfaces[id];
        
        if(interface){
            //if interface is already loaded?
            if(this.loaded_interfaces[id]){
                this.unloadInterface(id);
            }
            
            this.loaded_interfaces[id] = new interface(this.Core, param1, param2, param3);
            this.loaded_interfaces[id].load();
            
            this.last_loaded = id;
            
            //center
            this.centerInterface(id);
            return true;
        }else{
            console.warn('Interface "'+ id +'" does not exist.');
        }
        
        return false;
    }
    
    InterfaceManager.prototype.unloadInterface = function(id){
        id = (!id) ? this.last_loaded : id;
        
        //since closing it won't fire the mouseOut event
        this.Core.Gui.mouseWithinExternElement(false);
        
        this.loaded_interfaces[id].unload();
        this.loaded_interfaces[id] = null;
        
        delete this.loaded_interfaces[id];
    }
    
    InterfaceManager.prototype.isInterfaceLoaded = function(id){
        return this.loaded_interfaces[id];
    }
    
    InterfaceManager.prototype.handleScreenSwitch = function(){
        var loaded = this.loaded_interfaces;
        
        for(var interface in loaded){
            var obj = loaded[interface];
            
            if(obj.unload_on_screen_switch){
                this.unloadInterface(interface);
            }
        }
    }
    
    InterfaceManager.prototype.centerActiveInterfaces = function(){
        var loaded = this.loaded_interfaces;
        
        for(var interface in loaded){
            this.centerInterface(interface);
        }
    }
    
    InterfaceManager.prototype.centerInterface = function(id){
        var el = $('div[name="interface-'+ id +'"]');
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
    
    Client.InterfaceManager = InterfaceManager;
})();