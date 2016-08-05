/*
 *  CLIENT
 */

(function(){
    function GlobalMap(){}
    
    GlobalMap.prototype.construct = function(Core){
        var self = this;
        
        this.Core = Core;
        
        this.GUI_Elements = [];
        
        this.screenBackground = Core.Resources.images.bg_grass[0];
        
        //loaded map position
        this.mapX = 0;
        this.mapY = 0;
        
        //create chunk variables
        this.chunk = {};
        this.chunkOffsetX = 0;
        this.chunkOffsetY = 0;
        this.chunkWidth = 0;
        this.chunkHeight = 0;
        this.tileWidth = 0; 
        this.tileHeight = 0;
        this.tileWidthHalf = 0;
        this.tileHeightHalf = 0;
        this.tileOffset = 0;
        this.tileOwners = {};
        
        //tick count for missions
        this.ticks_missions = 0;
        
        //bool for if client is loading a chunk
        this.loadingChunk = false;
        
        //the offsets that will center a single tile in the center of the screen
        this.midOffsetX = 0;
        this.midOffsetY = 0;
        
        //is the map being dragged?
        this.draggingMap = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        //in-mem canvases/context
        this.inMem_tiles        = Core.Canvas.createInMemCanvas();
        this.inMem_missions     = Core.Canvas.createInMemCanvas();
        this.inMem_info         = Core.Canvas.createInMemCanvas();
        
        //highlighted tile. do not set == 0
        this.cur_highlighted_tile = -1;
        
        //ui stuff
        this.ui_panelHeight = 80; //pixels
        
        this.GUI_Elements.push( new Core.Gui.Button( Core, this.Core.Canvas.canvas.width-125, 65, 'CITY', {}, function(){ 
            self.Core.Canvas.setScreen(self.Core.Base);
        } ) );
        this.GUI_Elements.push( new Core.Gui.Button( Core, this.Core.Canvas.canvas.width-125, 115, 'ALLIANCE', {}, function(){ 
            self.Core.InterfaceManager.loadInterface('alliance');
        } ) );
        this.GUI_Elements.push( new Core.Gui.Button( Core, this.Core.Canvas.canvas.width-125, 165, 'WARS', {}, function(){ 
            self.Core.InterfaceManager.loadInterface('war_myWars');
        } ) );
        this.GUI_Elements.push( new Core.Gui.Button( Core, this.Core.Canvas.canvas.width-125, 215, 'MESSAGES', {}, function(){ 
            self.Core.InterfaceManager.loadInterface('my_messages');
        } ) );
        this.GUI_Elements.push( new Core.Gui.Button( Core, this.Core.Canvas.canvas.width-125, 265, 'LOGOUT', {}, function(){ 
            self.Core.Player.logout();
        } ) );
    }
    
    GlobalMap.prototype.draw = function(){
        var ctx = this.Core.Canvas.ctx;
            ctx.font = '10px "Times New Roman", serif';
        var mouse = this.Core.Canvas.mouse;
        
        var dragOffsetX = this.dragOffsetX;
        var dragOffsetY = this.dragOffsetY;
        
        //account for drag offsets
        if(dragOffsetX !== 0 || dragOffsetY !== 0){
            ctx.translate(dragOffsetX, dragOffsetY);
        }
        
        //update missions
        this.ticks_missions++;
        if(this.ticks_missions > 5){
            this.updateAndRenderMissions();
            this.ticks_missions = 0;
        }
        
        //draw the different canvas layers
        ctx.drawImage(this.inMem_tiles.canvas, this.midOffsetX, this.midOffsetY);
        ctx.drawImage(this.inMem_info.canvas, this.midOffsetX, this.midOffsetY);
        ctx.drawImage(this.inMem_missions.canvas, this.midOffsetX, this.midOffsetY);
        
        //process event handling for clicks
        this.handleClicks();
        
        //do not check for hovers if hovering over a Gui element
        if(!this.Core.Gui.hoveringOverGuiElement()){
            this.handleHover();
            
            //handle globalmap dragging
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
    
    /*
     *  renders chunk to its respective in-mem canvas
     */
    GlobalMap.prototype.renderChunk = function(){
        var chunkWidth = this.chunkWidth;
        var chunkHeight = this.chunkHeight;
        
        this.inMem_tiles.clear();
        
        //draw map tiles
        for(var y = 0; y < chunkHeight; y++){
            for(var x = 0; x < chunkWidth; x++){
                var currIndex = (y*chunkWidth)+x;
                var tile = this.chunk.tiles[currIndex];
                
                //dont render the tile if it has a parent
                if(!tile.tile_parent){
                    this.renderTile(tile);
                    
                    if(tile.onTile){
                        this.renderBuilding(tile);
                    }
                }
            }
        }
    }
    
    GlobalMap.prototype.renderTile = function(tile){
        //don't render tile if there if onTile is defined
        if(!tile.onTile){
            //tile values/properties
            var img = this.Core.Resources.globalmap.tiles[tile.type].img_obj;
            var gameX = tile.gameX;
            var gameY = tile.gameY;

            //draw the tile onto the map
            this.inMem_tiles.ctx.drawImage(img, gameX, gameY);
        }
    }
    
    /*
     *  renders any building on the given tile 
     */
    GlobalMap.prototype.renderBuilding = function(tile){
        //tile values/properties
        var gameX = tile.gameX;
        var gameY = tile.gameY;
        var onTile = tile.onTile;
        
        //get building size
        var size = this.getBuildingSize(onTile.data.type);
        var offsetY = this.getBuildingOffset(size.height);
        
        var img = this.Core.Resources.globalmap.buildings[onTile.data.type].img_obj;
        
        this.inMem_tiles.ctx.drawImage(img, gameX, gameY - offsetY);
    }
    
    GlobalMap.prototype.updateAndRenderMissions = function(){
        var ctx = this.inMem_missions.ctx;
        
        this.inMem_missions.clear();
        
        for(var tile_identifier in this.chunk.missions){
            var tile_missions = this.chunk.missions[tile_identifier];
            
            for(var mission_id in tile_missions){
                var data = this.chunk.missions[tile_identifier][mission_id];
            
                //some missions will be stored just for logic reasons
                //and their values will be false to let us know we do
                //not render them. if(data), then render
                if(data){
                    //time until arrival (exact).
                    var ETA = data.arrival_time - this.Core.now();
                    var progress = 1 - (ETA/data.startETA);

                    //still enroute
                    if(ETA > 0){
                        var tile = this.chunk.tiles[(data.gameY*this.chunkWidth)+data.gameX];

                        //centering for multi-tiles
                        var offsetY = 0;
                        if(tile.onTile){
                            var size = this.getBuildingSize(tile.onTile.data.type);
                            offsetY = this.getBuildingOffset(size.height);
                        }

                        var curScreenX = Math.floor(data.screenX + (data.distanceX * progress) + 61);
                        var curScreenY = Math.floor(data.screenY + (data.distanceY * progress) + 91 - offsetY);

                        ctx.beginPath();
                        ctx.fillRect(curScreenX, curScreenY, 10, 10);
                    }else{
                        //arrived.
                        this.missionComplete(tile_identifier, mission_id);
                    }
                }
            }
        }
    }
    
    /*
     *  does all the processing of click events
     */
    GlobalMap.prototype.handleClicks = function(){
        var self = this;
        var clicks = this.Core.Canvas.clicks;
        
        for(var i = 0; i < clicks.length; i++){
            var click = clicks[i];
            
            var tile = this.screenPosToGamePos(click.x, click.y);
                tile = this.chunk.tiles[(tile.y*this.chunkWidth)+tile.x];

            //make sure it isn't a child tile of a larger multi-tile
            if(tile.tile_parent){
                tile = this.chunk.tiles[tile.tile_parent];
            }
            
            if(typeof tile !== 'undefined'){
                //check and see if there is a building on this tile.
                //if there is a building on this tile, load appropriate interface.
                var resource = this.Core.Resources.globalmap.tiles[tile.type];

                if(tile.onTile || !resource.ignored || (resource.ignored && resource.placeables)){
                    if(click.button === 0){
                        if(tile.onTile){
                            var building_resource = this.Core.Resources.globalmap.buildings[tile.onTile.data.type];

                            if(building_resource.interface){
                                this.Core.InterfaceManager.loadInterface(building_resource.interface, tile);
                                break;
                            }
                        }

                        this.Core.InterfaceManager.loadInterface('gm_mapobject', tile);
                    }else if(click.button === 2){
                        //if the user owns it
                        if(tile.onTile && tile.onTile.data.userid === this.Core.Player.id){
                            var building_resource = this.Core.Resources.globalmap.buildings[tile.onTile.data.type];
                            
                            if(building_resource.sell && building_resource.type !== 'city'){
                               this.Core.Gui.popup(0, 'Actions', 'Are you sure you wish to sell this building?', {
                                    buttons : [
                                        ['Sell', function(){
                                            self.sellBuilding(tile);
                                        }],
                                        ['Cancel']
                                    ]
                                }); 
                            }else{
                                this.Core.Gui.popup(0, 'Error', 'You cannot sell this type of building.');
                            }
                        }
                    }
                }

                break;
            }
        }
    }
    
    GlobalMap.prototype.sellBuilding = function(tile){
        if(tile.onTile){
            var onTile = tile.onTile;
            
            //gotta own it m8!
            if(onTile.data.userid === this.Core.Player.id){
                this.Core.Events.emit('GLOBALMAP:SELL_BUILDING', {
                    city_id : onTile.data.city_id,
                    x : onTile.data.x,
                    y : onTile.data.y
                });
            }
        }
    }
    
    GlobalMap.prototype.buildingSold = function(data){
        var Player = this.Core.Player;
        
        //remove building from our data
        Player.removeGMBuilding(data.city_id, data.x, data.y);
        
        var buildings = this.chunk.buildings;
        
        for(var i = 0; i < buildings.length; i++){
            var building = buildings[i];
            
            if(building.x === data.x && building.y === data.y){
                //building resource
                var resource = this.Core.Resources.globalmap.buildings[building.type];
                
                if(resource.sell){
                    //add resources
                    Player.subCost(data.city_id, resource.sell, true);
                    Player.setResourceRates(data.city_id);
                    Player.updateResources(data.city_id);
                }
                
                //remove from chunk now
                buildings.splice(i, 1);
               
                //update globalmap/re-render
                this.cache(this.chunk);
                
                return true;
            }
        }
    }
    
    /*
     *  draw any hover elements AFTER the tiles are fully rendered.
     */
    GlobalMap.prototype.handleHover = function(){
        var mouse = this.Core.Canvas.mouse;
        
        var tile = this.screenPosToGamePos(mouse.x, mouse.y);
        
        if(this.posInMap(mouse.x, mouse.y)){
            if(tile){
                var pos = (tile.y*this.chunkWidth)+tile.x;

                tile = this.chunk.tiles[pos];

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
    
    /*
     *  redraws the gm_tools ctx when necessary
     */
    GlobalMap.prototype.renderInfoCtx = function(){
        var ctx = this.inMem_info.ctx;
        var Resources = this.Core.Resources;
        
        this.inMem_info.clear();
        
        //render highlighted tile & tile info
        if(this.cur_highlighted_tile >= 0){
            var h_tile = this.chunk.tiles[this.cur_highlighted_tile];
            
            //is this part of a parent multi-tiled tile?
            if(h_tile.tile_parent){
                h_tile = this.chunk.tiles[h_tile.tile_parent];
            }
            
            var onTile = h_tile.onTile;
            var resource = (onTile) ? Resources.globalmap.buildings[onTile.data.type] : Resources.globalmap.tiles[h_tile.type];
            var h_img = (onTile) ? resource.img_highlight_obj : resource.img_highlight_obj;
            
            //otherwise, if it does not have one supplied, use default
            if(!h_img){
                h_img = Resources.images['gm_tile_highlighted'][1];
            }
            
            //draw the highlighted image on all child tiles, too
            var children = h_tile.tile_children;
            var xAvg = 0;
            var yMax = 0;
            var total = 0;
            
            if(children){
                for(var i = 0; i < children.length; i++){
                    var child = this.chunk.tiles[children[i]];

                    total++;
                    xAvg += child.gameX;

                    if(child.gameY > yMax){
                        yMax = child.gameY;
                    }
                }
            }
            
            xAvg += h_tile.gameX;
            total++;
            
            //get corrext x/y
            xAvg = Math.round(xAvg / total);
            
            if(h_tile.gameY > yMax){
                yMax = h_tile.gameY;
            }
            
            //if the tile has a height > 1, the highlight tile will need to be fixed
            //relative to the new offsets. otherwise, leave the same
            if(onTile){
                var offset = this.getBuildingOffset(resource.height);
                
                ctx.drawImage(h_img, h_tile.gameX, h_tile.gameY - offset);
            }else{
                ctx.drawImage(h_img, h_tile.gameX, h_tile.gameY);
            }
            
            //draw the tile info
            if(onTile || !resource.ignored){
                var bg_img = this.Core.Resources.images.bg_transparent_black_pixel[1];
                
                var width = 200;
                var height = 70;
                var x = xAvg + (this.tileWidthHalf - width/2);
                var y = yMax + this.tileHeight + 5;
                
                //make sure popups stays within boundaries of the canvas screen
                var fixedPos = this.getRelativeBoundaries(x, y, width, height, true);
                
                //correct coordinates
                x = fixedPos.x;
                y = fixedPos.y;
                
                ctx.drawImage(bg_img, x, y, width, height);
                
                /*
                 * hover info box
                 */
                
                var title, userid, owner, desc, flag, wonder;
                
                //are we dealing with a city, building, or tile?
                if(onTile){
                    var resc = this.Core.Resources.globalmap.buildings[onTile.data.type];
                    var resc_type = resc.type;
                    
                    wonder = resc.wonder;
                    
                    if(resc_type === 'city'){
                        title = onTile.data.name;
                        owner = onTile.data.username;
                        userid = onTile.data.userid;
                        
                        //draw ownerships stars if hovering over city!
                        if(userid){
                            var ownedTiles = this.tileOwners[userid];

                            if(ownedTiles){
                                for(var i = 0; i < ownedTiles.length; i++){
                                    var tileIndex = ownedTiles[i];
                                    var tile = this.chunk.tiles[tileIndex];

                                    //don't draw the star for the tile we are on, even
                                    //if they own it
                                    if(tile.chunk_tile_id !== h_tile.chunk_tile_id){
                                        this.drawTileStar(tileIndex);
                                    }
                                }   
                            }
                        }
                    }else{
                        title = this.Core.Resources.globalmap.buildings[onTile.data.type].name;
                        owner = onTile.data.username;
                        userid = onTile.data.userid;
                    }
                }else{
                    var resc = this.Core.Resources.globalmap.tiles[h_tile.type];
                    
                    wonder = resc.wonder;
                    
                    title = resc.name;
                    owner = h_tile.username;
                    userid = h_tile.userid;
                }
                
                //if no owner was found
                if(!owner){
                    owner = 'Tile not owned.';
                }

                //city title black background
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                ctx.fillRect(x - .5, y, width + 1, 18);

                //city title txt
                ctx.font = '17px Times New Roman';
                ctx.fillStyle = (wonder) ? '#FFA500' : 'yellow';

                var txtWidth = ctx.measureText(title).width;

                ctx.fillText(title, x + (width/2) - (txtWidth/2), y + 15);

                //username txt
                ctx.font = '13px Times New Roman';
                ctx.fillStyle = 'white';
                ctx.fillText(owner, x + 70, y + 34);

                //alliance flag pic
                ctx.beginPath();
                ctx.rect(x + 4.5, y + 20.5, 61, 41);
                ctx.strokeStyle = 'black';
                ctx.stroke();
                ctx.drawImage(this.Core.Resources.images.alli_flag_default[1], x + 5, y + 21, 60, 40);
                
                //border
                ctx.beginPath();
                ctx.strokeStyle = 'black';
                ctx.strokeRect(x - .5, y - .5, width + 1, height + 1);
            }
        }
    }
    
    GlobalMap.prototype.drawTileStar = function(currIndex){
        var ctx = this.inMem_info.ctx;
        var img = this.Core.Resources.images['gm_star'][1];
        var tile = this.chunk.tiles[currIndex];
        
        ctx.drawImage(img, tile.gameX, tile.gameY);
    }
    
    /*
     *  chunk data that was sent from the server
     */
    GlobalMap.prototype.chunkLoaded = function(chunk){
        this.chunk = chunk;
        this.cache(chunk);
    }
    
    /*
     *  goes ahead and calculates the positions of all the tiles that
     *  are to be drawn, and other good stuff whenever a chunk is loaded
     */
    
    GlobalMap.prototype.cache = function(chunk){
        var tileWidth = this.tileWidth;
        var tileWidthHalf = this.tileWidthHalf;
        
        var tileHeight = this.tileHeight;
        var tileOffset = this.tileOffset;
        var tileOffsetLie = this.tileOffsetLie;
        
        var chunkWidth = this.chunkWidth;
        var chunkHeight = this.chunkHeight;
        
        //reset tile owners
        this.tileOwners = {};
        
        //the globalmap x,y position
        this.mapX = chunk.pos.x;
        this.mapY = chunk.pos.y;
        
        //calculate position of tiles and buildings
        var i = 0;
        for(var y = 0; y < chunkHeight; y++){
            for(var x = 0; x < chunkWidth; x++){
                var currIndex = (y*chunkWidth)+x;
                var tile = chunk.tiles[currIndex];
                
                var pos = this.gamePosToScreenPos(x, y);
                
                tile.gameX = pos.x;
                tile.gameY = pos.y;
                tile.screenX = pos.x + this.midOffsetX;
                tile.screenY = pos.y + this.midOffsetY;
                tile.centerX = pos.x + (tileWidth/2);
                tile.centerY = pos.y + (tileHeight - ((tileOffset+tileOffsetLie) * .5) );
                tile.onTile = this.onTile(tile.x, tile.y);
                tile.tile_children = [];
                tile.chunk_tile_id = i;
                
                //cache who owns what for easy reference
                if(tile.onTile && tile.onTile.data.userid){
                    if(!this.tileOwners[tile.onTile.data.userid]){
                        this.tileOwners[tile.onTile.data.userid] = [];
                    }
                    this.tileOwners[tile.onTile.data.userid].push(currIndex);
                }else if(tile.userid){
                    if(!this.tileOwners[tile.userid]){
                        this.tileOwners[tile.userid] = [];
                    }
                    this.tileOwners[tile.userid].push(currIndex);
                }
                
                //determine width&height of the tile relative to globalmap
                if(tile.onTile){
                    var size = this.getBuildingSize(tile.onTile.data.type);
                    var width = size.width - 1;
                    var height = size.height - 1;
                    
                    if(width || height){
                        var dx = x + width;
                        var dy = y + height;
                        
                        var tiles = this.getTilesInRange(x, y, dx, dy);
                        
                        //loop through each tile found in range, set their parent tile
                        for(var z = 0; z < tiles.length; z++){
                            var tileIndex = tiles[z];
                            
                            if(tileIndex !== currIndex && chunk.tiles[tileIndex]){
                                chunk.tiles[tileIndex].tile_parent = currIndex;
                                tile.tile_children.push(tileIndex);
                            }
                        }
                    }
                }
                
                i++;
            }
        }
        
        //cache mission stuff
        for(var tile_identifier in chunk.missions){
            var tile_missions = chunk.missions[tile_identifier];

            for(var mission_id in tile_missions){
                this.buildMissionData(chunk.missions[tile_identifier][mission_id]);
            }
        }
        
        //use the cached chunk for drawing
        this.chunk = chunk;
        
        //render/update new chunk
        this.renderChunk();
        this.updateAndRenderMissions();
        
        //no longer loading chunk, set to false
        if(this.loadingChunk){
            this.resetDrag();
            this.loadingChunk = false;
        }
        
        //set position container field values
        $('div[name="globalmap_position"] input[name="gm_x"]').val(this.mapX);
        $('div[name="globalmap_position"] input[name="gm_y"]').val(this.mapY);
        
        console.log('GlobalMap chunk cached.');
    }
    
    GlobalMap.prototype.buildTileInfo = function(x,y){
        var currIndex = (y*this.chunkWidth)+x;
        var tile = this.chunk.tiles[currIndex];
        
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
    
    /*
     *  checks if any buildings or cities are on a specified tile.
     */
    GlobalMap.prototype.onTile = function(x, y){
        var r = false;
        
        //check for buildings
        for(var building in this.chunk.buildings){
            var data = this.chunk.buildings[building];
            var resource = this.Core.Resources.globalmap.buildings[data.type];
            
            if(data.x === x && data.y === y){
                r = {
                    resource : resource,
                    data : data
                };
            }
        }
            
        //check for cities
        for(var city in this.chunk.cities){
            var data = this.chunk.cities[city];
            
            if(data.x === x && data.y === y){
                r = {
                    data : data
                };
            }
        }
        
        return r;
    }
    
    GlobalMap.prototype.addMission = function(data){
        var distance = this.Core.Game.getDistance(data.x, data.y, data.destination_x, data.destination_y);
        var travelTime = distance * this.Core.Game.gameCfg.mission_tile_traverse_time * 1000;
        
        //make sure origin is local
        var originLocal = this.serverPosToGamePos(data.x, data.y);
        var originTile = this.getTileByPos(originLocal.x, originLocal.y);
        
        //make sure destination is local
        var destinationLocal = this.serverPosToGamePos(data.destination_x, data.destination_y);
        var destinationTile = this.getTileByPos(destinationLocal.x, destinationLocal.y);
        
        //get unique id
        var tile_identifier = data.destination_x+','+data.destination_y;
        var mission_id = this.getUniqueMissionID(tile_identifier);
        
        //initiate tile missions object
        if(typeof this.chunk.missions[tile_identifier] === 'undefined'){
            this.chunk.missions[tile_identifier] = {};
        }
        
        if(originTile && destinationTile){
            data.arrival_time = this.Core.now() + travelTime;
        
            this.buildMissionData(data);
            this.chunk.missions[tile_identifier][mission_id] = data;
        }else{
            //setting to flag false tells client not to render it, because it is out of the loaded chunk
            //but prevents any future events from adding another mission to this tile
            this.chunk.missions[tile_identifier][mission_id] = false;
        }
    }
    
    GlobalMap.prototype.buildMissionData = function(data){
        var gamePos = this.serverPosToGamePos(data.x, data.y);
        var screenPos = this.gamePosToScreenPos(gamePos.x, gamePos.y);

        var targetGamePos = this.serverPosToGamePos(data.destination_x, data.destination_y);
        var targetScreenPos = this.gamePosToScreenPos(targetGamePos.x, targetGamePos.y);

        data.startETA = data.arrival_time - this.Core.now();
        data.gameX = gamePos.x;
        data.gameY = gamePos.y;
        data.screenX = screenPos.x;
        data.screenY = screenPos.y;
        data.distanceX = targetScreenPos.x - screenPos.x;
        data.distanceY = targetScreenPos.y - screenPos.y;
    }
    
    /*
     *  a new mission is a mission that was created by any players that are nearby
     *  so we don't have to refresh the chunk to see the new mission
     *  make sense? no? ok.
     */
    GlobalMap.prototype.newMissionNearby = function(mission){
        //add the mission
        this.addMission(mission);
    }
    
    GlobalMap.prototype.getUniqueMissionID = function(tile_identifier){
        var tile_missions = this.chunk.missions[tile_identifier];

        var largest = 0;

        for(var id in tile_missions){
            id = parseInt(id);

            if(id > largest){
                largest = id;
            }
        }

        return largest + 1;
    }
    
    GlobalMap.prototype.tileHasMissionByType = function(x, y, type){
        var missions = this.chunk.missions[x+','+y];
        
        if(missions){
            for(var mission_id in missions){
                var mission = missions[mission_id];
                
                if(mission.action === type){
                    return true;
                }
            }
        }
    }
    
    GlobalMap.prototype.getTileMissionCount = function(x, y){
        var missions = this.chunk.missions[x+','+y];
        
        var count = 0;
        
        for(var mission in missions){
            count++;
        }
        
        return count;
    }
    
    
    
    GlobalMap.prototype.missionComplete = function(tile_identifier, mission_id){
        //create mission object with no references to original.
        var mission = JSON.parse(JSON.stringify(this.chunk.missions[tile_identifier][mission_id]));
        var data = mission.data;
        
        //destroy mission before we run any GlobalMap.cache function
        //or else there is a potential to create an infinite loop that
        //freezes the game.
        this.chunk.missions[tile_identifier][mission_id] = null;
        delete this.chunk.missions[tile_identifier][mission_id];
        
        switch(mission.action){
            case 'create_building':
                this.chunk.buildings.push({
                    city_id : mission.city_id,
                    level : 0,
                    type : data.type,
                    userid : data.userid,
                    username : data.username,
                    x : mission.destination_x,
                    y : mission.destination_y
                });
                this.cache(this.chunk, true);
                break;
            case 'commander_move':
                break;
            case 'trade_mission':
                break;
        }
    }
    
    /*
     *  get and return all tiles in range sx,sy -> dx, dy
     */
    GlobalMap.prototype.getTilesInRange = function(sx, sy, dx, dy){
        var tiles = [];
        
        var diffX = dx-sx;
        var diffY = dy-sy;
        
        for(var y = 0; y <= diffY; y++){
            for(var x = 0; x <= diffX; x++){
                var tileIndex = ((sy-y)*this.chunkWidth)+(x+sx);

                tiles.push(tileIndex);
            }
        }
        
        return tiles;
    }
    
    GlobalMap.prototype.posInMap = function(x, y){
        var realHeight = (this.tileHeight - (this.tileOffset+this.tileOffsetLie));
        
        var width = this.inMem_tiles.canvas.width;
        var height = this.inMem_tiles.canvas.height - realHeight;
        
        var centerX = this.midOffsetX+(width/2) + this.dragOffsetX,
            centerY = this.midOffsetY+(height/2) + realHeight + this.dragOffsetY;
        
        var dx = Math.abs(x - centerX),
            dy = Math.abs(y - centerY);
        
        return (dx / (width * 0.5) + dy / (height * 0.5) <= 1);
    }
    
    GlobalMap.prototype.setInMemCanvasSizes = function(){
        //set the appropriate widths and heights for the inMemory canvases
        //account for centering
        var canvasWidth = this.chunkWidth * this.tileWidth;
        
        //realHeight is the size of the actual diamond, not full tile picture
        var realHeight = (this.tileHeight - (this.tileOffset+this.tileOffsetLie));
        var canvasHeight = (this.chunkHeight * realHeight) + realHeight;
        
        //resize inMem canvases to new size
        this.inMem_tiles.resize(canvasWidth, canvasHeight);
        this.inMem_info.resize(canvasWidth, canvasHeight);
        this.inMem_missions.resize(canvasWidth, canvasHeight);
        
        //get the appropritate tile x offset for drawing onto the inmem canvas.
        //the equation will differ depending on if there is an even or odd base
        //width or height. e..g: 20x20 tiles or 21x21 tiles
        if(this.chunkWidth % 2 === 0){
            this.inMem_offsetX = Math.floor((this.chunkWidth - 1)/2)*this.tileWidth + this.tileWidthHalf;
        }else{
            this.inMem_offsetX = Math.floor(this.chunkWidth/2)*this.tileWidth;
        }
        
        //this will give us the offsets to center the inMem canvases relative to parent
        this.midOffsetX = (this.Core.Canvas.canvas.width - canvasWidth)/2;
        this.midOffsetY = (this.Core.Canvas.canvas.height - canvasHeight)/2;
    }
    
    /* Go from game coordinates to screen coordinates */
    GlobalMap.prototype.gamePosToScreenPos = function(x, y){
        return {
            x : ((x - y) * this.tileWidthHalf) + this.inMem_offsetX,
            y : ((x + y) * this.tileHeightHalf)
        };
    }
    
    /* Go from screen coordinates to game coordinates */
    GlobalMap.prototype.screenPosToGamePos = function(x, y){
        if(!this.Core.Canvas.mouseOutsideCanvas()){
            var tileWidthHalf = this.tileWidthHalf;
            var tileHeightHalf = this.tileHeightHalf;

            //account for tileoffset
            x -= (this.tileOffset + this.tileOffsetLie) + this.midOffsetX + this.inMem_offsetX + this.dragOffsetX;
            y -= (this.tileOffset + this.tileOffsetLie) + this.midOffsetY + this.dragOffsetY;
            
            return {
                x : Math.floor(((x / tileWidthHalf) + (y / tileHeightHalf)) * .5),
                y : Math.floor((y / tileHeightHalf - (x / tileWidthHalf) ) *.5)
            };
        }
    }
    
    GlobalMap.prototype.serverPosToGamePos = function(x, y){
        //local game position of middle tile
        var localX = this.chunkOffsetX;
        var localY = this.chunkOffsetY;
        
        //server game position of middle tile
        var serverX = this.mapX;
        var serverY = this.mapY;
        
        var gameX = localX - (serverX - x);
        var gameY = localY - (serverY - y);
        
        return {
            x : gameX,
            y : gameY
        };
    }
    
    GlobalMap.prototype.serverPosIsLocal = function(x, y){
        var localPos = this.serverPosToGamePos(x, y);
        
        if(localPos.x < 0 || localPos.x > this.chunkWidth){
            return false;
        }
        
        if(localPos.y < 0 || localPos.y > this.chunkHeight){
            return false;
        }
        
        return true;
    }
    
    GlobalMap.prototype.getTileByPos = function(x, y){
        return this.chunk.tiles[(y*this.chunkWidth)+x]
    }
    
    /*
     *  gets the size of a building
     */
    GlobalMap.prototype.getBuildingSize = function(type){
        var resource = this.Core.Resources.globalmap.buildings[type];
        
        return {
            width : resource.width,
            height : resource.height
        };
    }
    
    /*
     *  if a building has a defined width and height, we want to calculate the
     *  correct screen position of that by getting the appropriate offset to
     *  account for its size (e.g.: 1x1, 3x3, 1x2)
     */
    GlobalMap.prototype.getBuildingOffset = function(height){
        height -= 1;
        
        if(height > 0){
            return (height) * (this.tileHeightHalf) + this.tileOffsetLie;
        }else{
            return 0;
        }
    }
    
    /*
     *  will move the map with the user's drag, and also
     *  load new tiles based off of the drag
     */
    GlobalMap.prototype.getDragMovement = function(){
        var mouse = this.Core.Canvas.mouse;
        
        //x,y position at the end of the drag
        var x = mouse.drag.endX;
        var y = mouse.drag.endY;
        
        //x,y position at start of drag
        var startX = mouse.drag.x;
        var startY = mouse.drag.y;
        
        //pixels moved
        var diffX = 0 - (startX - x);
        var diffY = 0 - (startY - y);
        
        //we want a minimal move distance
        if(Math.abs(diffX) >= 15 || Math.abs(diffY) >= 15){
            //get the tile position they started on and the new tile pos
            var tileStart = this.screenPosToGamePos(startX,startY);
            var newTilePos = this.screenPosToGamePos(startX + diffX, startY + diffY);

            //set tiles moved
            return {
                x : tileStart.x - newTilePos.x,
                y : tileStart.y - newTilePos.y
            };
        }
    }
    
    GlobalMap.prototype.dragMap = function(){
        var mouse = this.Core.Canvas.mouse;
        
        this.dragOffsetX = 0 - (mouse.drag.x - mouse.x);
        this.dragOffsetY = 0 - (mouse.drag.y - mouse.y);
    }
    
    GlobalMap.prototype.finishedMapDrag = function(){
        var drag = this.getDragMovement();

        if(drag){
            this.loadingChunk = true;
            this.move(drag.x, drag.y);
        }
        
        this.draggingMap = false;
    }
    
    GlobalMap.prototype.resetDrag = function(){
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
    }
    
    /*
     *  makes sure something stays within boundaries of the canvas
     */
    GlobalMap.prototype.getRelativeBoundaries = function(x, y, width, height, gamePos){
        //using game pos instead of screen pos, gotta account for the drawing offsets of the canvases
        //e.g.: tile.gameX instead of tile.screenX
        if(gamePos){
            x += this.midOffsetX;
            y += this.midOffsetY;
        }
        
        var minX = 5;
        var maxX = this.Core.Canvas.canvas.width-(width+10);
        var maxY = this.Core.Canvas.canvas.height-(height+3) - this.ui_panelHeight;
        
        //max left
        if(x < minX){
            x = minX;
        }

        //max right
        if(x > maxX){
            x = maxX;
        }

        //max down
        if(y > maxY){
            y = maxY;
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
    
    GlobalMap.prototype.setChunkFormat = function(settings){
        this.chunkOffsetX = settings.chunkOffsetX;
        this.chunkOffsetY = settings.chunkOffsetY;
        
        this.chunkWidth = settings.chunkWidth;
        this.chunkHeight = settings.chunkHeight;
        
        this.tileWidth = settings.tileWidth; 
        this.tileHeight = settings.tileHeight;
        
        this.tileWidthHalf = settings.tileWidth/2;
        this.tileHeightHalf = (settings.tileHeight-(settings.tileOffset+settings.tileOffsetLie)) * .5;
        
        this.tileOffset = settings.tileOffset;
        this.tileOffsetLie = settings.tileOffsetLie;
        
        this.setInMemCanvasSizes();
    }
    
    GlobalMap.prototype.chunkDimToPx = function(width, height){
        return {
            width   : width*(this.tileWidth),
            height  : height*(this.tileHeight)
        };
    }
    
    GlobalMap.prototype.resetState = function(){
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.loadingChunk = false;
        this.draggingMap = false;
        this.cur_highlighted_tile = false;
    }
    
    GlobalMap.prototype.move = function(xDistance, yDistance){
        this.Core.Events.emit('GLOBALMAP:MOVE', {
            xDistance : xDistance,
            yDistance : yDistance
        });
    }
    
    GlobalMap.prototype.requestChunk = function(x, y){
        this.Core.Events.emit('GLOBALMAP:REQUEST_CHUNK', {
            x : x,
            y : y
        });
    }
    
    /* UI STUFF */
    GlobalMap.prototype.positionPanel = function(){
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
    
    GlobalMap.prototype.openPanel = function(){
        $('#panel div[name="base"]').hide(0);
        $('#panel div[name="globalmap"]').show(0);
        $('#panel').show(0);
    }
    
    GlobalMap.prototype.closePanel = function(){
        $('#panel').hide(0);
    }
    
    GlobalMap.prototype.positionInput = function(e){
        e.preventDefault();
        
        //get input values for both x and y
        var x = parseInt($('div[name="globalmap_position"] input[name="gm_x"]').val());
        var y = parseInt($('div[name="globalmap_position"] input[name="gm_y"]').val());
        
        //needs to be a valid x and y
        if(!x || !y) return;
        
        //dont request same position
        if(x !== this.mapX || y !== this.mapY){
            this.requestChunk(x, y);
        }
    }
    
    GlobalMap.prototype.positionInputFocus = function(e){
        e.preventDefault();
        
        var name = $(e.target).attr('name');
        
        $('div[name="globalmap_position"] input[name="'+ name +'"]').val('');
    }
    
    GlobalMap.prototype.positionInputFocusLost = function(e){
        e.preventDefault();
        
        var name = $(e.target).attr('name');
        
        var elx = $('div[name="globalmap_position"] input[name="gm_x"]');
        var ely = $('div[name="globalmap_position"] input[name="gm_y"]');
        
        if(name === 'gm_x' && !parseInt( elx.val() )){
            elx.val(this.mapX);
        }else if(!parseInt( ely.val() )){
            ely.val(this.mapY);  
        }
    }

    GlobalMap.prototype.onSwitchedTo = function(){
        var self = this;
        var bg = this.screenBackground;
        var canvas = this.Core.Canvas.canvas;
        
        $(canvas).css({
            'background-image' : 'url('+bg+')',
            'background-size' : canvas.width +'px '+ canvas.height +'px'
        });
        
        //globalmap position container
        var el = $('div[name="globalmap_position"]');
        var pos = $('#game').offset();

        var offsetX = this.Core.Canvas.canvas.width - el.width() - 20;
        var offsetY = 20;

        el.css({
            top : pos.top + offsetY,
            left : pos.left + offsetX
        });
        el.show(0);
        
        $(document).on('focus', 'div[name="globalmap_position"] input', this.positionInputFocus.bind(this));
        $(document).on('blur', 'div[name="globalmap_position"] input', this.positionInputFocusLost.bind(this));
        $(document).on('keypress', 'div[name="globalmap_position"] input', function(e){
            if(e.keyCode === 13) {
                self.positionInput.bind(self)(e);
            }
        });
        
        //open panel
        this.openPanel();
        this.positionPanel();
    }
    
    GlobalMap.prototype.onSwitchedFrom = function(){
        $('div[name="globalmap_position"]').hide();
        
        //remove event handlers
        $(document).off('focus', 'div[name="globalmap_position"] input');
        $(document).off('blur', 'div[name="globalmap_position"] input');
        $(document).off('keypress', 'div[name="globalmap_position"] input');
        
        //close panel
        this.closePanel();
    }
    
    Client.GlobalMap = GlobalMap;
})();