/*
 *  CLIENT
 */

(function(){
    function gm_mapobject(Core, data){
        this.Core = Core;
        this.id = 'gm_mapobject';
        
        this.data = data;
        this.build_html = '';
        
        //interface options
        this.unload_on_screen_switch = true;
    }
    
    gm_mapobject.prototype.load = function(){
        var Player = this.Core.Player;
        var data = this.data;
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:450px;">';
            html += '<div name="content-tile">';
        
        //if their is a building on tile
        if(data.onTile){
            var building = data.onTile.data;
            var resource = this.Core.Resources.globalmap.buildings[building.type];

            if(resource.type === 'city'){
                var health = this.Core.Game.calculateHealth(building.health, building.lastHealthUpdate);
                
                html += '<div style="background-color:yellow;color:black;width:100%;text-align:center;">'+ fn_htmlEnc(building.name) +'</div>';
                
                html += '<div style="margin:10px;">';
                html += 'The city of <span style="color:white;font-weight:bold;">'+ fn_htmlEnc(building.name) +'</span>, controlled by <span style="color:white;font-weight:bold;">'+ fn_htmlEnc(building.username) +'</span>';
                html += ', leader of the nation <span style="color:white;font-weight:bold;">Stalingrad</span>.';
                html += '<div style="margin-top:20px;">'+ fn_numberFormat(health) +' health.</div>';
                html += '</div>';
                
                html += '<div style="margin-right:6px;">';

                //owned by player
                if(this.Core.Player.cities[building.id]){
                    html += '<button name="enter">Enter</button>';
                }else{
                    html += '<button name="trade">Trade</button>';
                    html += '<button name="war">War</button>';
                }
                
                html += '</div>';
            }else{
                html += '<div style="background-color:yellow;color:black;width:100%;text-align:center;">'+ resource.name +'</div>';
                html += '<div style="margin:10px;">'+ resource.description + '</div>';
                
                if(!this.Core.Player.cities[building.city_id]){
                    html += '<div style="margin-right:6px;"><button name="war">War</button></div>';
                }
            }
        }else{
            var resource = this.Core.Resources.globalmap.tiles[data.type];
            var placeables = resource.placeables;
            
            html += '<div style="background-color:yellow;color:black;width:100%;text-align:center;">'+ resource.name +'</div>';
            html += '<div style="margin:10px;">'+ resource.desc_click + '</div>';

            //doesn't have an owner?
            if((data.city_id === Player.current_city || data.city_id === 0) && placeables.length > 0){
                html += '<div style="margin-right:6px;"><button name="build">Build</button></div>';
            }
        }

        html += '<div style="margin-right:6px;"><button name="ok">Ok</button></div>';
        html += '</div>';
        
        //other content divs
        html += '<div name="content-build"></div>';
        html += '<div name="content-placeable"></div>';
        
        //end of interface div
        html += '</div>';
            
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="enter"]', function(){
            var city = data.onTile.data.id;
            
            this.Core.Player.switchCity(city);
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="build"]', this.build.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] img[name|="placeable"]', this.showPlaceable.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="place"]', this.placeBuilding.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="trade"]', this.trade.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="war"]', this.war.bind(this));
    }
    
    gm_mapobject.prototype.build = function(){
        //if we haven't already set build html
        if(!this.build_html){
            var resource = this.Core.Resources.globalmap.tiles[this.data.type];
            var placeables = resource.placeables;

            var html = '<div style="background-color:yellow;color:black;width:100%;text-align:center;">Build</div>';
                html += '<div style="margin:6px;">';
                
            for(var i = 0; i < placeables.length; i++){
                var name = placeables[i];
                var placeable = this.Core.Resources.globalmap.buildings[name];

                //add thumbnail
                html += '<div name="placeable_container" style="display:inline-block;border:1px solid yellow;margin:0px 4px 4px 0px;text-align:center;">';
                html += '<img name="placeable-'+ name +'" src="'+ placeable.img_thumbnail_src +'" style="cursor:pointer;margin:0 auto;" width="80" height="70">';
                html += '<div name="placeable_info" style="font-size:12px;margin:0 auto;background-color:yellow;color:black;">'+ placeable.name.toUpperCase() +'</div>';
                html += '</div>';
            }
            
            html += '</div>';
            
            //add buttons
            html += '<div style="margin-right:6px;"><button name="back-tile">Back</button></div>';

            //set build html
            this.build_html = html;
        }
        
        //build html
        $('div[name="interface-'+ this.id +'"] div[name="content-build"]').html(this.build_html);
        
        //now show build hmtl
        this.showContent('build');
    }
    
    gm_mapobject.prototype.showPlaceable = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var name = $(e.target).attr('name').split('-')[1];
        var placeable = this.Core.Resources.globalmap.buildings[name];
        
        var distance = this.Core.Game.getDistance(city.city_x, city.city_y, this.data.x, this.data.y);
        var fuelCost = this.Core.Game.getFuelCost(distance);
        
        var html = '<div style="background-color:yellow;color:black;width:100%;text-align:center;">'+ placeable.name +'</div>';
            html += '<div name="placeable_container" style="margin:6px;">';
            html += '<img src="'+ placeable.img_thumbnail_src +'" style="float:left;margin-right:10px;">';
            html += '<h2>'+placeable.name+'</h2>'+ placeable.description;
            html += '</div>';
            html += '<table style="color:yellow;" cellpadding="7">';
            html += '<tr><td><b>Cost</b></td><td>';
            
            //costs
            for(var resource in placeable.cost){
                var amount = placeable.cost[resource];
                
                if(resource === 'money'){
                    html += '$ '+ fn_numberFormat(amount) +'<br/>';
                }else{
                    html += fn_numberFormat(amount) +' '+ resource.toUpperCase() +'<br/>';
                }
            }
            
            html += '</td></tr>';
            
            //if building has an income
            if(placeable.base_income){
                html += '<tr><td><b>Income</b></td><td>';
            
                //income
                for(var resource in placeable.base_income){
                    var amount = placeable.base_income[resource];

                    if(resource === 'money'){
                        html += '$ '+ fn_numberFormat(amount) +'<br/>';
                    }else{
                        html += fn_numberFormat(amount) +' '+ resource.toUpperCase() +'<br/>';
                    }
                }

                html += '</td></tr>';
            }
            
            //if building has required research
            var research_required = placeable.research_required;
            if(research_required.length > 0){
                html += '<tr><td><b>Blueprints</b></td><td>';
            
                //income
                for(var i = 0; i < research_required.length; i++){
                    var obj = this.Core.Game.gameCfg.research_projects[research_required[i]];
                    html += obj.name+'<br/>';
                }

                html += '</td></tr>';
            }
            
            html += '<tr><td>Fuel Cost</td><td>'+ fn_numberFormat(fuelCost) +'</td></tr>';
            
            html += '</table>';
            html += '<div style="margin-right:6px;"><button name="place-'+ name +'">Build '+ placeable.name +'</button> <button name="back-build">Back</button></div>';
        
        //build html
        $('div[name="interface-'+ this.id +'"] div[name="content-placeable"]').html(html);
        
        //now show content
        this.showContent('placeable');
    }
    
    gm_mapobject.prototype.placeBuilding = function(e){
        var type = $(e.target).attr('name').split('-')[1];
        
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var building = this.Core.Resources.globalmap.buildings[type];
        
        var x = this.data.x;
        var y = this.data.y;
        
        var distance = this.Core.Game.getDistance(city.city_x, city.city_y, x, y);
        var fuelCost = this.Core.Game.getFuelCost(distance);
        
        //can they afford the costs?
        if(this.Core.GlobalMap.getTileMissionCount(x, y) === 0){
            if(Player.canAfford(city.resources, building.cost)){
                if(this.Core.Player.hasBlueprints(building.research_required)){
                    if(city.resources.fuel >= fuelCost){
                        var obj = {
                            city_id : city.city_id,
                            type : type,
                            x : x,
                            y : y
                        };

                        this.Core.GlobalMap.addMission({
                            city_id : city.city_id,
                            x : city.city_x,
                            y : city.city_y,
                            destination_x : x,
                            destination_y : y,
                            action : 'create_building',
                            data : {
                                type : type,
                                userid : Player.id,
                                username : Player.username 
                            }
                        });

                        //tell server, have server veify it
                        this.Core.Events.emit('GLOBALMAP:BUILDING_CREATE', obj);

                        //add city to city gm buildings object
                        Player.cities[Player.current_city].gm_buildings.push(obj);

                        //subtract costs
                        Player.subCost(city.city_id, building.cost);
                        Player.subResource(city.city_id, 'fuel', fuelCost);
                        Player.setResourceRates(city.city_id);

                        //update resource info immediately after purchase
                        Player.updateResources(city.city_id);

                        //close interface
                        this.Core.InterfaceManager.unloadInterface(this.id);
                    }else{
                        this.Core.Gui.popup(0, 'Error Report', 'The city does not have enough fuel to complete this action.');
                    }
                }else{
                    this.Core.Gui.popup(0, 'Error Report', 'The city does not have the required blueprints to build this.');
                }
            }else{
                this.Core.Gui.popup(0, 'Error', 'You do not have the resources to build this.');
            }
        }else{
            this.Core.Gui.popup(0, 'Error', 'You cannot construct a building on a tile that has an active mission.');
        }
    }
    
    gm_mapobject.prototype.trade = function(e){
        this.Core.InterfaceManager.unloadInterface(this.id);
        this.Core.InterfaceManager.loadInterface('trade', this.data);
    }
    
    gm_mapobject.prototype.war = function(e){
        this.Core.InterfaceManager.unloadInterface(this.id);
        this.Core.InterfaceManager.loadInterface('war_gmActions', this.data);
    }
    
    gm_mapobject.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showContent(destination);
    }
    
    gm_mapobject.prototype.showContent = function(name){
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ name +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    gm_mapobject.prototype.unload = function(){
        //unload event listeners
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="enter"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="build"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] img[name|="placeable"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="place"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="trade"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="war"]');
        
        //remove interface div
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['gm_mapobject'] = gm_mapobject;
})();