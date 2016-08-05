/*
 *  CLIENT
 */

(function(){
    function Base(){}
    
    Base.prototype.construct = function(Core){
        var self = this;
        
        this.Core = Core;
        this.GUI_Elements = [];
        
        this.baseWidth = 0;
        this.baseHeight = 0;
        this.tileWidth = 0;
        this.tileHeight = 0;
        
        this.draggingMap = false;
        
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.prevDragOffsetX = 0;
        this.prevDragOffsetY = 0;
        
        this.cur_highlighted_tile = -1;
        
        this.inMem_offsetX = 0;
        this.inMem_offsetY = 0;
        
        //in-mem canvases/context
        this.inMem_tiles = Core.Canvas.createInMemCanvas();
        this.inMem_buildings = Core.Canvas.createInMemCanvas();
        this.inMem_info = Core.Canvas.createInMemCanvas();
        this.inMem_invalidRanges = Core.Canvas.createInMemCanvas();
        
        //this variable will be set if the user is dragging a building
        this.placingBuilding = false;
        
        //contains blocked off tile ranges.
        this.invalid_ranges = [];
        
        //ui stuff --- change to an interface soon bb
        this.ui_panelHeight = 80; // in pixels
        this.ui_currTab = false;
        this.ui_tabPath = []; // e.g.: buildings -> building category -> building info
        
        this.GUI_Elements.push( new Core.Gui.Button( Core, this.Core.Canvas.canvas.width-125, 45, 'WORLD MAP', {}, function(){ 
            self.Core.Canvas.setScreen(self.Core.GlobalMap);
        } ) );
    }
    
    Base.prototype.draw = function(){
        var ctx = this.Core.Canvas.ctx;
        var mouse = this.Core.Canvas.mouse;
        
        var dragOffsetX = this.dragOffsetX;
        var dragOffsetY = this.dragOffsetY;
        
        //account for drag offsets
        if(dragOffsetX !== 0 || dragOffsetY !== 0){
            ctx.translate(dragOffsetX, dragOffsetY);
        }
        
        //draw different canvas layers
        ctx.drawImage(this.inMem_tiles.canvas, this.midOffsetX, this.midOffsetY);
        ctx.drawImage(this.inMem_buildings.canvas, this.midOffsetX, this.midOffsetY);
        ctx.drawImage(this.inMem_info.canvas, this.midOffsetX, this.midOffsetY);
        
        if(this.placingBuilding){
            ctx.drawImage(this.inMem_invalidRanges.canvas, this.midOffsetX, this.midOffsetY);
        }
        
        this.handleClicks();
        
        //do not check for hovers if hovering over a Gui element
        if(!this.Core.Gui.hoveringOverGuiElement()){
            this.handleHover();
            
            //handle dragging
            if(mouse.down && mouse.button === 0){
                this.dragMap();
                
                if(!this.draggingMap){
                    this.draggingMap = true;
                }
            }else if(this.draggingMap){
                //did they finish a drag?
                this.finishedMapDrag();
            }
        }else if(this.cur_highlighted_tile >= 0){
            this.cur_highlighted_tile = -1;
            this.renderInfoCtx();
        }
        
        //reverse drag offsets
        if(dragOffsetX !== 0 || dragOffsetY !== 0){
            ctx.translate(-dragOffsetX, -dragOffsetY);
        }
    }
    
    Base.prototype.renderTiles = function(){
        var ctx = this.inMem_tiles.ctx;
        
        this.inMem_tiles.clear();
        
        for(var y = 0; y < this.baseHeight; y++){
            for(var x = 0; x < this.baseWidth; x++){
                var tile = this.tiles[(y*this.baseWidth)+x];
                
                ctx.drawImage(this.Core.Resources.base.tiles[tile.type].img_obj, tile.gameX, tile.gameY);
            }
        }
    }
    
    Base.prototype.renderBuildings = function(){
        var ctx = this.inMem_buildings.ctx;
        
        this.inMem_buildings.clear();
        
        //all buildings in the city
        var buildings = this.Core.Player.getCityData().city_buildings;
            buildings = this.sortBuildingsByPos(buildings);
        
        for(var i = 0; i < buildings.length; i++){
            var building = buildings[i];
            var rscObj = this.Core.Resources.base.buildings[building.type];
            
            var heightOffset = this.getBuildingHeightOffset(building.type);
            var pos = this.gamePosToScreenPos(building.x, building.y);

            ctx.drawImage(rscObj.img_obj, pos.x, pos.y - heightOffset);
        }
    }
    
    Base.prototype.handleClicks = function(){
        var clicks = this.Core.Canvas.clicks;
        
        for(var i = 0; i < clicks.length; i++){
            var click = clicks[i];
            
            var tile = this.screenPosToGamePos(click.x, click.y);
                tile = this.tiles[(tile.y*this.baseWidth)+tile.x];

            //left click
            if(click.button === 0){
                if(typeof tile !== 'undefined'){
                    //make sure it isn't a child tile of a larger multi-tile
                    if(tile.tile_parent){
                        tile = this.tiles[tile.tile_parent];
                    }

                    if(this.placingBuilding){
                        this.placeBuilding(tile.x, tile.y, this.placingBuilding);
                    }else{
                        var onTile = tile.onTile;

                        //if there is a building on this tile
                        if(onTile){
                            //type of building on tile
                            var building = this.Core.Resources.base.buildings[onTile.data.type];

                            if(building.interface){
                                this.Core.InterfaceManager.loadInterface(building.interface);
                            }else{
                                var title = building.name.toUpperCase();
                                var description = building.description;

                                this.Core.Gui.popup(false, fn_htmlEnc(title), fn_htmlEnc(description), {
                                    x : click.cx,
                                    y : click.cy
                                });
                            }
                        }
                    }
                }
            }else if(click.button === 2){
                //place the building
                if(this.placingBuilding){
                    this.placingBuilding = false;
                    this.renderInfoCtx();
                }else{
                    //make sure it isn't a child tile of a larger multi-tile
                    if(tile.tile_parent){
                        tile = this.tiles[tile.tile_parent];
                    }
                    
                    //did they right-click a building? if so, it's the sell action.
                    //otherwise just reset the drag offsets
                    if(typeof tile !== 'undefined' && tile.onTile){
                        this.sellBuildingOnTile(tile);
                    }else{
                        this.resetDrag();
                    }
                }
            }
        }
    }
    
    Base.prototype.handleHover = function(){
        var mouse = this.Core.Canvas.mouse;
        
        if(this.posInBase(mouse.x, mouse.y)){
            var tile = this.screenPosToGamePos(mouse.x, mouse.y);
        
            if(tile){
                var pos = (tile.y*this.baseWidth)+tile.x;

                tile = this.tiles[pos];

                //handle tile highlighting
                if(tile && this.cur_highlighted_tile !== pos){
                    this.cur_highlighted_tile = pos;
                    this.renderInfoCtx();
                }
            }else if(this.cur_highlighted_tile){
                //not hovering over any tile
                this.cur_highlighted_tile = -1;
                this.renderInfoCtx();
            }
        }
    }
    
    Base.prototype.renderInfoCtx = function(){
        var ctx = this.inMem_info.ctx;
        var Resources = this.Core.Resources;
        
        this.inMem_info.clear();
        
        //render highlighted tile & tile info
        if(this.cur_highlighted_tile >= 0){
            var h_tile = this.tiles[this.cur_highlighted_tile];
            
            //is this part of a parent multi-tiled tile?
            if(h_tile.tile_parent){
                h_tile = this.tiles[h_tile.tile_parent];
            }
            
            /*
             *  handle any building placement
             */
            
            if(this.placingBuilding){
                var building = this.Core.Resources.base.buildings[this.placingBuilding];
                var heightOffset = this.getBuildingHeightOffset(this.placingBuilding);
                
                ctx.drawImage(building.img_obj, h_tile.gameX, h_tile.gameY - heightOffset);
            }
            
            /*
             * highlight appropriate tiles
             */
            
            var onTile = h_tile.onTile;
            var resource = (onTile) ? Resources.base.buildings[onTile.data.type] : Resources.base.tiles[h_tile.type];
            var h_img = (onTile) ? resource.img_highlight_obj : resource.img_highlight_obj;
            
            //otherwise, if it does not have one supplied, use default
            if(!h_img){
                h_img = Resources.images['base_tile_highlighted'][1];
            }
            
            //if the tile has a height > 1, the highlight tile will need to be fixed
            //relative to the new offsets. otherwise, leave the same
            if(onTile){
                var offset = this.getHeightOffset(resource.height);
                
                ctx.drawImage(h_img, h_tile.gameX, h_tile.gameY - offset);
            }else{
                ctx.drawImage(h_img, h_tile.gameX, h_tile.gameY);
            }
        }
    }
    
    Base.prototype.renderInvalidRangesCtx = function(){
        var ctx = this.inMem_invalidRanges.ctx;
        
        //clear for drawing
        this.inMem_invalidRanges.clear();
        
        //draw invalid ranges
        var img_obj = this.Core.Resources.images.base_tile_highlight_invalid[1];
        var invalidTiles = this.getAllInvalidRangeTiles();

        //draw invalid highlight img obj on each invalid tile
        for(var i = 0; i < invalidTiles.length; i ++){
            var tile = this.tiles[invalidTiles[i]];

            ctx.drawImage(img_obj, tile.gameX, tile.gameY);
        }
    }
    
    Base.prototype.cache = function(){
        var tiles = [];
        
        var baseWidth = this.baseWidth;
        var baseHeight = this.baseHeight;
        
        var tileWidth = this.tileWidth;
        var tileHeight = this.tileHeight;
        var tileOffset = this.tileOffset;
        
        //no tiles exceed this index
        var maxIndex = (baseHeight*baseWidth)+baseWidth;
        
        //populate tile array first
        for(var y = 0; y < this.baseHeight; y++){
            for(var x = 0; x < this.baseWidth; x++){
                tiles.push({});
            }
        }
        
        var i = 0;
        for(var y = 0; y < this.baseHeight; y++){
            for(var x = 0; x < this.baseWidth; x++){
                var currIndex = (y*this.baseWidth)+x;
                
                var tile = tiles[currIndex];
                var pos = this.gamePosToScreenPos(x, y);
                
                tile.x = x;
                tile.y = y;
                tile.gameX = pos.x;
                tile.gameY = pos.y;
                tile.screenX = pos.x + this.midOffsetX;
                tile.screenY = pos.y + this.midOffsetY;
                tile.centerX = pos.x + (tileWidth/2);
                tile.centerY = pos.y + (tileHeight - (tileOffset * .5) );
                tile.type = 'grass';
                tile.onTile = this.onTile(x,y);
                tile.tile_children = [];
                
                //determine width&height of the tile relative to globalmap
                if(tile.onTile){
                    var size = this.getBuildingSize(tile.onTile.data.type);
                    var width = size.width - 1;
                    var height = size.height - 1;
                    
                    if(width || height){
                        var dx = x + width;
                        var dy = y + height;
                        
                        var children = this.getTilesInRange(x, y, dx, dy);
                        
                        //loop through each tile found in range, set their parent tile
                        for(var z = 0; z < children.length; z++){
                            var tileIndex = children[z];
                            
                            if(tileIndex !== currIndex && tileIndex <= maxIndex){
                                tiles[tileIndex].tile_parent = currIndex;
                                tile.tile_children.push(tileIndex);
                            }
                        }
                    }
                }
                
                i++;
            }
        }
        this.tiles = tiles;
    }
    
    Base.prototype.buildTileInfo = function(x,y){
        var currIndex = (y*this.baseWidth)+x;
        var tile = this.tiles[currIndex];
        
        //reset parent id for each child
        for(var i = 0; i < tile.tile_children.length; i++){
            this.tiles[tile.tile_children[i]].tile_parent = false;
        }
        
        tile.onTile = this.onTile(x,y);
        tile.tile_children = [];
        
        if(tile.onTile){
            var x = tile.x;
            var y = tile.y;
            
            var maxIndex = (this.baseHeight*this.baseWidth)+this.baseWidth;
            
            var size = this.getBuildingSize(tile.onTile.data.type);
            var width = size.width - 1;
            var height = size.height - 1;

            if(width || height){
                var dx = x + width;
                var dy = y + height;

                var children = this.getTilesInRange(x, y, dx, dy);

                //loop through each tile found in range, set their parent tile
                for(var z = 0; z < children.length; z++){
                    var tileIndex = children[z];

                    if(tileIndex !== currIndex && tileIndex <= maxIndex){
                        this.tiles[tileIndex].tile_parent = currIndex;
                        tile.tile_children.push(tileIndex);
                    }
                }
            }
        }
    }
    
    Base.prototype.onTile = function(x, y){
        //buildings in city
        var buildings = this.Core.Player.getCityData().city_buildings;
        
        //check for buildings
        for(var building in buildings){
            var data = buildings[building];
            var resource = this.Core.Resources.base.buildings[data.type];
            
            if(data.x === x && data.y === y){
                return {
                    resource : resource,
                    data : data
                };
            }
        }
        
        return false;
    }
    
    Base.prototype.dragMap = function(){
        var mouse = this.Core.Canvas.mouse;
        
        this.dragOffsetX = (0 - (mouse.drag.x - mouse.x)) + this.prevDragOffsetX;
        this.dragOffsetY = (0 - (mouse.drag.y - mouse.y)) + this.prevDragOffsetY;
    }
    
    Base.prototype.finishedMapDrag = function(){
        this.prevDragOffsetX = this.dragOffsetX;
        this.prevDragOffsetY = this.dragOffsetY;
        
        this.draggingMap = false;
    }
    
    Base.prototype.resetDrag = function(){
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.prevDragOffsetX = 0;
        this.prevDragOffsetY = 0;
    }
    
    Base.prototype.getMidOffsets = function(){
        this.midOffsetX = 0;
        this.midOffsetY = 0;
    }
    
    /* Go from game coordinates to screen coordinates */
    Base.prototype.gamePosToScreenPos = function(x, y){
        return {
            x : ((x - y) * this.tileWidthHalf) + this.inMem_offsetX,
            y : ((x + y) * this.tileHeightHalf)
        };
    }
    
    /* Go from screen coordinates to game coordinates */
    Base.prototype.screenPosToGamePos = function(x, y){
        if(!this.Core.Canvas.mouseOutsideCanvas()){
            var tileWidthHalf = this.tileWidthHalf;
            var tileHeightHalf = this.tileHeightHalf;
            
            x -= (this.tileOffset + this.tileOffsetLie) + this.inMem_offsetX + this.midOffsetX + tileWidthHalf + this.dragOffsetX;
            y -= (this.tileOffset + this.tileOffsetLie) + this.midOffsetY + this.dragOffsetY;

            return {
                x : Math.floor(((x / tileWidthHalf) + (y / tileHeightHalf)) * .5),
                y : Math.floor((y / tileHeightHalf - (x / tileWidthHalf)) *.5)
            };
        }
    }
    
    /*
     *  makes sure something stays within boundaries of the canvas
     */
    Base.prototype.getRelativeBoundaries = function(x, y, width, height, gamePos){
        //using game pos instead of screen pos, gotta account for the drawing offsets of the canvases
        //e.g.: tile.gameX instead of tile.screenX
        if(gamePos){
            x += this.midOffsetX;
            y += this.midOffsetY;
        }
        
        //max left
        if(x < 5){
            x = 5;
        }

        //max right
        if(x > this.Core.Canvas.canvas.width-(width+10)){
            x = this.Core.Canvas.canvas.width - width - 10;
        }

        //max down
        if(y > this.Core.Canvas.canvas.height-(height-5)){
            y = y - this.tileHeight - height - 5;
        }
        
        //revert back
        if(gamePos){
            x -= this.midOffsetX;
            y -= this.midOffsetY;
        }
        
        return {
            x : x,
            y : y
        };
    }
    
    Base.prototype.posInBase = function(x, y){
        var width = this.inMem_tiles.canvas.width;
        var height = this.inMem_tiles.canvas.height;
        
        var centerX = this.midOffsetX+(width/2) + this.dragOffsetX,
            centerY = this.midOffsetY+(height/2) + this.dragOffsetY;
        
        var dx = Math.abs(x - centerX),
            dy = Math.abs(y - centerY);
        
        return (dx / (width * 0.5) + dy / (height * 0.5) <= 1);
    }
    
    Base.prototype.getHeightOffset = function(height){
        height -= 1;
        
        if(height > 0){
            return (height) * (this.tileHeightHalf);
        }else{
            return 0;
        }
    }
    
    Base.prototype.placeBuilding = function(x, y, building){
        var Player = this.Core.Player;
        var rscObj = this.Core.Resources.base.buildings[building];
        
        //function will return the range of the building if it is a valid spot
        var range = this.isValidBuildingSpot(x, y, building);
        
        if(range){
            //push building to city building array
            Player.cities[Player.current_city].city_buildings.push({
                city_id : Player.current_city,
                type : building,
                x : x,
                y : y
            });
            
            //rebuild tile info
            this.buildTileInfo(x,y);
            
            //send event to server
            this.Core.Events.emit('BASE:BUILDING_CREATE', {
                type : building,
                x : x,
                y : y
            });
            
            //update money
            this.Core.Player.subCost(Player.current_city, rscObj.cost);
            this.Core.Player.setResourceRates(Player.current_city);
            
            //update resource info immediately after purchase
            this.Core.Player.updateResources(Player.current_city);
            
            //no longer placing building
            this.placingBuilding = false;
            
            this.setInvalidRanges();
            this.renderInfoCtx();
            this.renderBuildings();
        }
    }
    
    Base.prototype.sellBuildingOnTile = function(tile){
        var Player = this.Core.Player;
        var city_id = Player.getCityData().city_id;
        
        var type = tile.onTile.data.type;
        var building = this.Core.Resources.base.buildings[type];
        
        if(building.sellable){
            var html = '<ul>';
                
                for(var item in building.offer){
                    html += '<li>'+fn_numberFormat(building.offer[item]) + ' '+ item+'</li>';
                }
                
                html += '</ul>';
            
            
            var self = this;
            this.Core.Gui.popup(0, 'Confirm', 'Are you sure you wish to sell this building? You will receive: '+ html, {
                buttons : [
                    ['Sell Building', function(){
                        //tell the server
                        self.Core.Events.emit('BASE:SELL_BUILDING', {
                            city_id : city_id,
                            type : type,
                            x : tile.x,
                            y : tile.y
                        });
                        
                        if(self.removeBuildingOnTile(tile.x, tile.y, type)){
                            //rebuild tile info
                            self.buildTileInfo(tile.x, tile.y);
                            
                            //update money
                            Player.subCost(Player.current_city, building.offer, true);
                            Player.setResourceRates(city_id);

                            //update resource info immediately after purchase
                            Player.updateResources(city_id);

                            self.setInvalidRanges();
                            self.renderInfoCtx();
                            self.renderBuildings();
                        }
                    }],
                    ['Cancel']
                ]
            });
        }else{
            this.Core.Gui.popup(0, 'Error', 'You cannot sell this building.');
        }
    }
    
    /*
    *  type is optional; however, if supplied, it will make sure
    *  the building is of the given type
    */
    Base.prototype.getBuildingOnTile = function(x, y, type){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var buildings = city.city_buildings;
        
        for(var i = 0; i < buildings.length; i++){
            var building = buildings[i];

            if(building.x === x && building.y === y && ( !type || (type && building.type === type) )){
                return building;
            }
        }

        return false;
    }
    
    
    /*
    *  type is optional; however, if supplied, it will make sure
    *  the building is of the given type
    */
    Base.prototype.removeBuildingOnTile = function(x, y, type){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var buildings = city.city_buildings;
        
        for(var i = 0; i < buildings.length; i++){
            var building = buildings[i];

            if(building.x === x && building.y === y && ( !type || (type && building.type === type) )){
                //remove from array
                city.city_buildings.splice(i, 1);
                return true;
            }
        }

        return false;
    }
    
    //grab the list of buildings by a certain type, e.g.:
    //government
    Base.prototype.getBuildingsByType = function(type){
        var matches = [];
        var buildings = this.Core.Resources.base.buildings;
        
        for(var building in buildings){
            if(buildings[building].type === type){
                matches.push(building);
            }
        }
        
        return matches;
    }
    
    /*
     *  return the number of buildings the city has of given building type
     *  e.g.: # of capitals would probably turn 1
     */
    Base.prototype.getNumOfSameBuildingsInCity = function(type){
        var matches = 0;
        var buildings = this.Core.Player.getCityData().city_buildings;
        
        for(var i = 0; i < buildings.length; i++){
            if(buildings[i].type === type){
                matches++;
            }
        }
        
        return matches;
    }
    
    /*
     *  checks if the spot for a particular building is valid
     */
    Base.prototype.isValidBuildingSpot = function(x, y, building){
        //building resource object
        var rscObj = this.Core.Resources.base.buildings[building];
        
        var dx = x + rscObj.width - 1;
        var dy = y + rscObj.height - 1; 
        
        var range = this.getTilesInRange(x, y, dx, dy);
        
        if(!this.doesRangeOverlap(range, this.invalid_ranges)){
            return range;
        }else{
            return false;
        }
    }
    
    
    /*
     *  get appropriate offset for buildings to be placed correctly
     *  on the base canvas
     */
    Base.prototype.getBuildingHeightOffset = function(building){
        var obj = this.Core.Resources.base.buildings[building];
        
        if(obj.offsetY > 0){
            return obj.offsetY - 15;
        }else{
            return 0;
        }
    }
    
    /*
     *  sorts teh buildings back-to-front for rendering
     */
    Base.prototype.sortBuildingsByPos = function(buildings){
        buildings.sort(function(a, b){
            if (a.y === b.y) return a.x - b.x;
            return a.y - b.y;
        });
        
        return buildings;
    }
    
    /*
     *  get and return all tiles in range sx,sy -> dx, dy
     */
    Base.prototype.getTilesInRange = function(sx, sy, dx, dy){
        var tiles = [];
        
        var diffX = dx-sx;
        var diffY = dy-sy;
        
        for(var y = 0; y <= diffY; y++){
            for(var x = 0; x <= diffX; x++){
                var tileIndex = ((sy-y)*this.baseWidth)+(x+sx);

                tiles.push(tileIndex);
            }
        }
        
        return tiles;
    }
    
    Base.prototype.getAllInvalidRangeTiles = function(){
        var tiles = [];
        
        var ranges = this.invalid_ranges;
        
        for(var i = 0; i < ranges.length; i++){
            var range = ranges[i];
            for(var z = 0; z < range.length; z++){
                tiles.unshift(range[z]);
            }
        }
        
        return tiles;
    }
    
    Base.prototype.doesRangeOverlap = function(range, ranges){
        for(var i = 0; i < ranges.length; i++){
            var tiles = ranges[i];
            
            for(var z = 0; z < tiles.length; z++){
                if(range.indexOf(tiles[z]) !== -1){
                    return true;
                }
            }
        }
        
        return false;
    }
    
    Base.prototype.getBuildingSize = function(type){
        var resource = this.Core.Resources.base.buildings[type];
        
        return {
            width : resource.width,
            height : resource.height
        };
    }
    
    /*
     *  get the ranges of tiles that would be invalid for the player
     *  to place objects, e.g.: a building.
     */
    Base.prototype.setInvalidRanges = function(){
        //all buildings in the city
        var buildings = this.Core.Player.getCityData().city_buildings;
        
        var ranges = [];
        
        for(var i = 0; i < buildings.length; i++){
            var building = buildings[i];
            var rscObj = this.Core.Resources.base.buildings[building.type];
            
            var dx = building.x + rscObj.width - 1;
            var dy = building.y + rscObj.height - 1; 
            
            //all tiles that the building covers
            var tiles = this.getTilesInRange(building.x, building.y, dx, dy);
            
            ranges.push(tiles);
        }
        
        this.invalid_ranges = ranges;
        
        //update invalid ranges ctx
        this.renderInvalidRangesCtx();
    }
    
    Base.prototype.setFormat = function(data){
        this.baseWidth = data.baseWidth;
        this.baseHeight = data.baseHeight;
        
        this.tileWidth = data.tileWidth;
        this.tileHeight = data.tileHeight;
        
        this.tileOffset = data.tileOffset;
        this.tileOffsetLie = data.tileOffsetLie;
        
        this.tileWidthHalf = data.tileWidth/2;
        this.tileHeightHalf = (data.tileHeight-data.tileOffset)/2;
    }
    
    Base.prototype.init = function(){
        this.setInMemCanvasSizes();
    }
    
    Base.prototype.loadCity = function(callback){
        this.cache();
        this.renderTiles();
        this.renderBuildings();
        this.setInvalidRanges();
        
        if(callback){
            callback(true);
        }
        //$('body').append('<img src="'+this.inMem_tiles.canvas.toDataURL()+'">');
    }
    
    /*
     *  set the correct canvas size for inMem canvases such as tiles/buildings
     */
    Base.prototype.setInMemCanvasSizes = function(){
        //set the appropriate widths and heights for the inMemory canvases
        //account for centering
        var canvasWidth = this.baseWidth * this.tileWidth;
        var canvasHeight = this.baseHeight * this.tileHeight;
        
        //resize inMem canvases to new size
        this.inMem_tiles.resize(canvasWidth, canvasHeight);
        this.inMem_buildings.resize(canvasWidth, canvasHeight);
        this.inMem_info.resize(canvasWidth, canvasHeight);
        this.inMem_invalidRanges.resize(canvasWidth, canvasHeight);
        
        //get the appropritate tile x offset for drawing onto the inmem canvas.
        //the equation will differ depending on if there is an even or odd base
        //width or height. e..g: 20x20 tiles or 21x21 tiles
        if(this.baseWidth % 2 === 0){
            this.inMem_offsetX = Math.floor((this.baseWidth - 1)/2)*this.tileWidth + this.tileWidthHalf;
        }else{
            this.inMem_offsetX = Math.floor(this.baseWidth/2)*this.tileWidth;
        }
        
        //this will give us the offsets to center the inMem canvases relative to parent
        this.midOffsetX = (this.Core.Canvas.canvas.width - canvasWidth)/2;
        this.midOffsetY = (this.Core.Canvas.canvas.height - canvasHeight)/2;
    }
    
    /*
     *  UI
     */
    Base.prototype.positionPanel = function(){
        var el = $('#panel');
        
        //set height
        var height = this.ui_panelHeight;
            el.height(height);
        
        var canvas = this.Core.Canvas.canvas;
        var pos = $('#game').offset();
        
        var posX = (pos.top + canvas.height) - height;
        var posY = pos.left;
        
        el.css({
            top : posX,
            left : posY,
            width : canvas.width
        });
    }
    
   
    Base.prototype.openPanel = function(){
        $('#panel div[name="globalmap"]').hide(0);
        $('#panel div[name="base"]').show(0);
        $('#panel').show(0);
    }
    
    Base.prototype.closePanel = function(){
        $('#panel').hide(0);
    }
    
    Base.prototype.panelButtonClicked = function(e){
        e.preventDefault();
        
        var tabName = $(e.currentTarget).attr('name').split('-')[1];
        this.showTabContent(tabName);
    }
    
    Base.prototype.buyBuilding = function(e){
        e.preventDefault();
        
        //get current city data
        var city = this.Core.Player.getCityData();
        
        var buildingName = $(e.currentTarget).attr('name').split('-')[1];
        var obj = this.Core.Resources.base.buildings[buildingName];
        
        //does the city have enough $$$ or other resources?
        if(this.Core.Player.canAfford(city.resources, obj.cost)){
            if(this.Core.Player.hasBlueprints(obj.research_required)){
                //the number of this building that already exist in city
                var existingBuildings = this.getNumOfSameBuildingsInCity(buildingName);

                //has the city reached max # of building type?
                if(existingBuildings < obj.max){
                    this.placingBuilding = buildingName;

                    this.closeTab();
                }else{
                    this.Core.Gui.popup(0, 'Error Report', 'The city currently has the max amount of buildings of this type.');
                }
            }else{
                this.Core.Gui.popup(0, 'Error Report', 'The city does not have the required blueprints to construct this building.');
            }
        }else{
            this.Core.Gui.popup(0, 'Error Report', 'The city does not have the required resources to purchase this building.');
        }
    }
    
    Base.prototype.openBuildingCategory = function(e){
        e.preventDefault();
        
        var catName = $(e.currentTarget).attr('name').split('-')[1];
        
        //get buildings in this category
        var buildings = this.getBuildingsByType(catName);
        
        if(buildings.length > 0){
            var html = '<span style="font-size:18px;margin-bottom:10px;display:block;">'+ catName.toUpperCase() +'</span>';
            
            for(var i = 0; i < buildings.length; i++){
                var building = buildings[i];
                var obj = this.Core.Resources.base.buildings[building];
                
                
                html += '<div style="display:inline-block;"><img name="building_info-'+ building +'" src="'+ obj.img_thumbnail_src +'" /><br/>'+ obj.name +'</div>';
                
                //max two buildings per line
                if((i+1) % 2 === 0){
                    html += '<br/>';
                }
            }
            
            html += '<div name="back_button" class="button" style="width:100%;margin-top:10px;">BACK</div>';
            
            this.showTabContent('building_category', html);
        }else{
            this.showTabContent('building_category', '<b>error</b>');
        }
    }
    
    Base.prototype.openBuildingInfo = function(e){
        e.preventDefault();
        
        var buildingName = $(e.currentTarget).attr('name').split('-')[1];
        var obj = this.Core.Resources.base.buildings[buildingName];
        
        var html = '<span style="font-size:18px;margin-bottom:10px;display:block;">'+ obj.name.toUpperCase() +'</span>';
            html += '<img src="'+ obj.img_src +'" style="width:130px;height:100px;float:left;margin-right:6px;" />';
            html += '<div class="left" style="max-width:300px;text-align:left;">'+obj.description+'</div>';
            html += '<div class="clear"></div>';
            html += '<table style="color:white;margin:0 auto;margin-top:6px;" cellpadding="7">';
            html += '<tr><td><b>Building Category</b></td><td>'+ obj.type.toUpperCase() +'</td></tr>';
            html += '<tr><td><b>Cost</b></td><td>';
            
            //costs
            for(var resource in obj.cost){
                var amount = obj.cost[resource];
                
                if(resource === 'money'){
                    html += '$ '+ fn_numberFormat(amount) +'<br/>';
                }else{
                    html += fn_numberFormat(amount) +' '+ resource.toUpperCase() +'<br/>';
                }
            }
            
            html += '</td></tr>';
            
            //if building has an income
            if(obj.base_income){
                html += '<tr><td><b>Income</b></td><td>';
            
                //income
                for(var resource in obj.base_income){
                    var amount = obj.base_income[resource];

                    if(resource === 'money'){
                        html += '$ '+ fn_numberFormat(amount) +'<br/>';
                    }else{
                        html += fn_numberFormat(amount) +' '+ resource.toUpperCase() +'<br/>';
                    }
                }

                html += '</td></tr>';
            }
            
            //if building has an upkeep cost
            if(obj.cost_upkeep){
                html += '<tr><td><b>Upkeep Cost</b></td><td>';
            
                //upkeep costs
                for(var resource in obj.cost_upkeep){
                    var amount = obj.cost_upkeep[resource];

                    if(resource === 'money'){
                        html += '$ '+ fn_numberFormat(amount) +'<br/>';
                    }else{
                        html += fn_numberFormat(amount) +' '+ resource.toUpperCase() +'<br/>';
                    }
                }
                
                html += '</td></tr>';
            }
            
            //if building has an income
            var research_required = obj.research_required;
            if(research_required.length > 0){
                html += '<tr><td><b>Blueprints</b></td><td>';
            
                //income
                for(var i = 0; i < research_required.length; i++){
                    var obj = this.Core.Game.gameCfg.research_projects[research_required[i]];
                    html += obj.name+'<br/>';
                }

                html += '</td></tr>';
            }
            
            html += '</table>';
            html += '<div name="back_button" class="button" style="width:50%;">BACK</div>';
            html += '<div name="buy_building-'+ buildingName +'" class="button" style="width:50%;">BUY</div>';
            html += '<div class="clear"></div>';
        
        this.showTabContent('building_info', html);
    }
    
    Base.prototype.gotoPrevTab = function(){
        var path = this.ui_tabPath;
        
        if(path.length > 0){
            this.showTabContent(path[path.length - 2]);
            this.ui_tabPath.pop();
        }
    }
        
    Base.prototype.showTabContent = function(tabName,html){
        $('#base_tabcontent div[name|="tabcontent"]').hide();
        
        if(tabName !== this.ui_currTab){
            var el = $('#base_tabcontent div[name="tabcontent-'+ tabName +'"]');
            
            //if html was provided, set the innerhtml to the given param
            if(html){
                el.html(html);
            }
            
            //center the element to middle of canvas screen
            this.centerElement(el);
            
            //display element
            el.show();
            
            //build dynamic path
            if(this.ui_tabPath.indexOf(tabName) === -1){
                this.ui_tabPath.push(tabName);
            }
            
            this.ui_currTab = tabName;
        }else{
            this.ui_currTab = false;
            this.ui_tabPath = [];
        }
    }
    
    Base.prototype.closeTab = function(){
        $('#base_tabcontent div[name|="tabcontent"]').hide();
        this.ui_currTab = false;
        this.ui_tabPath = [];
    }
    
    Base.prototype.centerElement = function(el){
        //center the tabcontent element/div
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
    
    Base.prototype.onSwitchedTo = function(){
        var canvas = this.Core.Canvas.canvas;
        
        $(document).on('click', '#panel div[name="base"] img[name|="tab"]', this.panelButtonClicked.bind(this));
        $(document).on('click', '#base_tabcontent div[name="back_button"]', this.gotoPrevTab.bind(this));
        $(document).on('click', '#base_tabcontent img[name|="building_category"]', this.openBuildingCategory.bind(this));
        $(document).on('click', '#base_tabcontent img[name|="building_info"]', this.openBuildingInfo.bind(this));
        $(document).on('click', '#base_tabcontent div[name|="buy_building"]', this.buyBuilding.bind(this));
        
        this.openPanel();
        this.positionPanel();
        
        $(canvas).css({
            'background-image' : 'none',
            'background-color' : 'white',
            'background-size' : canvas.width +'px '+ canvas.height +'px'
        });
    }
    
    Base.prototype.onSwitchedFrom = function(){
        //hide any open tab
        if(this.ui_currTab){
            $('#base_tabcontent div[name="tabcontent-'+ this.ui_currTab +'"]').hide();
            
            this.ui_currTab = false;
            this.ui_tabPath = [];
        }
        
        this.closePanel();
        
        $(document).off('click', '#panel div[name="base"] img[name|="tab"]');
        $(document).off('click', '#base_tabcontent div[name="back_button"]');
        $(document).off('click', '#base_tabcontent img[name|="building_category"]');
        $(document).off('click', '#base_tabcontent img[name|="building_info"]');
        $(document).off('click', '#base_tabcontent div[name|="buy_building"]');
    }
    
    Client.Base = Base;
})();