/* prepare yourself for this monstrosity. but you'll have to 1v1 me irl if you want me to rewrite this atm */

(function(){
    function Resources(){}
    
    Resources.prototype.construct = function(Core){
        this.Core = Core;
        
        //in tiles & backgrounds, where there's images or anything else to load
        //the format of the object is: [url, loadedResourceObj]
        this.images = {
            bg_grass : ['game/resources/images/backgrounds/bg_grass.png', null],
            gm_tile_highlighted : ['game/resources/images/tiles/globalmap/tile_highlight.png', null],
            base_tile_highlighted : ['game/resources/images/tiles/base/tile_highlight.png', null],
            bg_transparent_black_pixel : ['game/resources/images/other/bg_transparent_black_pixel.png', null],
            alli_flag_default : ['game/resources/images/flags/flag_default.png', null],
            gm_star : ['game/resources/images/other/gm_star.png', null],
            gm_tiles_render : ['game/resources/images/backgrounds/gm_tiles_render_blur_compressed.png', null],
            base_tile_highlight_invalid : ['game/resources/images/tiles/base/tile_highlight_invalid.png', null],
            rank_major : ['game/resources/images/other/rank_major.gif', null],
            rank_brig_general : ['game/resources/images/other/rank_brig_general.gif', null],
            rank_colonel : ['game/resources/images/other/rank_colonel.gif', null],
            rank_general : ['game/resources/images/other/rank_general.gif', null],
            rank_goa : ['game/resources/images/other/rank_goa.gif', null],
            rank_lt_colonel : ['game/resources/images/other/rank_lt_colonel.gif', null],
            rank_mag_general : ['game/resources/images/other/rank_mag_general.gif', null],
            rank_lt_general : ['game/resources/images/other/rank_major.gif', null]
        };
        this.mp3 = {};
        
        this.totalClientResources = 0;
        this.loadedClientResources = 0;
        
        this.totalServerResources = 0;
        this.loadedServerResources = 0;
    }
    
    Resources.prototype.setup = function(resources){
        this.globalmap = {};
        this.globalmap.tiles = resources.globalmap.tiles;
        this.globalmap.buildings = resources.globalmap.buildings;
        
        this.base = {};
        this.base.tiles = resources.base.tiles;
        this.base.buildings = resources.base.buildings;
    }
    
    Resources.prototype.loadClientResources = function(){
        //set this to 0 on each load.
        this.loadedClientResources = 0;
        
        this.totalClientResources = this.getTotalClientResources();
        
        //load each image resource
        for(var image in this.images){
            var imgData = this.images[image];
            
            imgData[1] = new Image();
            imgData[1].onload = this.clientResourceLoaded.bind(this);
            imgData[1].src = imgData[0];
        }
    }
    
    Resources.prototype.loadServerResources = function(callback){
        //set this to 0 on each load.
        this.loadedServerResources = 0;
        
        this.serverResourcesLoadedCallback = callback;
        this.totalServerResources = this.getTotalServerResources();
        
        for(var tile in this.globalmap.tiles){
            var tileData = this.globalmap.tiles[tile];
            
            tileData.img_obj = new Image();
            tileData.img_obj.onload = this.serverResourceLoaded.bind(this);
            tileData.img_obj.src = tileData.img_src;
            
            //does this have a highlighted version of the tile?
            if(typeof tileData.img_highlight_src !== 'undefined'){
                tileData.img_highlight_obj = new Image();
                tileData.img_highlight_obj.onload = this.serverResourceLoaded.bind(this);
                tileData.img_highlight_obj.src = tileData.img_highlight_src;
            }
        }
        
        //load each building
        for(var building in this.globalmap.buildings){
            var bldData = this.globalmap.buildings[building];
            
            bldData.img_obj = new Image();
            bldData.img_obj.onload = this.serverResourceLoaded.bind(this);
            bldData.img_obj.src = bldData.img_src;
            
            //does this have a highlighted version of the tile?
            if(typeof bldData.img_highlight_src !== 'undefined'){
                bldData.img_highlight_obj = new Image();
                bldData.img_highlight_obj.onload = this.serverResourceLoaded.bind(this);
                bldData.img_highlight_obj.src = bldData.img_highlight_src;
            }
            
            //does this have a thumbnail icon?
            if(typeof bldData.img_thumbnail_src !== 'undefined'){
                bldData.img_thumbnail_obj = new Image();
                bldData.img_thumbnail_obj.onload = this.serverResourceLoaded.bind(this);
                bldData.img_thumbnail_obj.src = bldData.img_thumbnail_src;
            }
        }
        
        for(var tile in this.base.tiles){
            var tileData = this.base.tiles[tile];
            
            tileData.img_obj = new Image();
            tileData.img_obj.onload = this.serverResourceLoaded.bind(this);
            tileData.img_obj.src = tileData.img_src;
            
            //does this have a highlighted version of the tile?
            if(typeof tileData.img_highlight_src !== 'undefined'){
                tileData.img_highlight_obj = new Image();
                tileData.img_highlight_obj.onload = this.serverResourceLoaded.bind(this);
                tileData.img_highlight_obj.src = tileData.img_highlight_src;
            }
        }
        
        //load each building
        for(var building in this.base.buildings){
            var bldData = this.base.buildings[building];
            
            bldData.img_obj = new Image();
            bldData.img_obj.onload = this.serverResourceLoaded.bind(this);
            bldData.img_obj.src = bldData.img_src;
            
            if(typeof this.base.buildings[building].img_highlight_src !== 'undefined'){
                bldData.img_highlight_obj = new Image();
                bldData.img_highlight_obj.onload = this.serverResourceLoaded.bind(this);
                bldData.img_highlight_obj.src = bldData.img_highlight_src;
            }
            
            if(typeof this.base.buildings[building].img_thumbnail_src !== 'undefined'){
                bldData.img_thumbnail_obj = new Image();
                bldData.img_thumbnail_obj.onload = this.serverResourceLoaded.bind(this);
                bldData.img_thumbnail_obj.src = bldData.img_thumbnail_src;
            }
        }
    }
    
    Resources.prototype.clientResourceLoaded = function(){
        this.loadedClientResources++;
        
        if(this.loadedClientResources >= this.totalClientResources){
            this.Core.setReady('clientResourcesLoaded');
        }
    }
    
    Resources.prototype.serverResourceLoaded = function(){
        this.loadedServerResources++;
        
        if(this.loadedServerResources >= this.totalServerResources){
            this.serverResourcesLoadedCallback();
        }
    }
    
    Resources.prototype.getTotalClientResources = function(){
        var totalResources = 0;
        
        for(var images in this.images){
            totalResources++;
        }
        
        return totalResources;
    }
    
    Resources.prototype.getTotalServerResources = function(){
        var totalResources = 0;
        
        //get totalResources
        for(var tile in this.globalmap.tiles){
            totalResources++;
            
            //does this have a highlighted version of the tile?
            if(typeof this.globalmap.tiles[tile].img_highlight_src !== 'undefined'){
                totalResources++;
            }
        }
        
        for(var building in this.globalmap.buildings){
            totalResources++;
            
            //does this have a highlighted version of the tile?
            if(typeof this.globalmap.buildings[building].img_highlight_src !== 'undefined'){
                totalResources++;
            }
            
            //does this have a thumbnail icon?
            if(typeof this.globalmap.buildings[building].img_thumbnail_src !== 'undefined'){
                totalResources++;
            }
        }
        
        //get totalResources
        for(var tile in this.base.tiles){
            totalResources++;
            
            //does this have a highlighted version of the tile?
            if(typeof this.base.tiles[tile].img_highlight_src !== 'undefined'){
                totalResources++;
            }
        }
        
        for(var building in this.base.buildings){
            totalResources++;
            
            //does this have a highlighted version of the tile?
            if(typeof this.base.buildings[building].img_highlight_src !== 'undefined'){
                totalResources++;
            }
            
            if(typeof this.base.buildings[building].img_thumbnail_src !== 'undefined'){
                totalResources++;
            }
        }
        
        return totalResources;
    }
    
    Client.Resources = Resources;
})();