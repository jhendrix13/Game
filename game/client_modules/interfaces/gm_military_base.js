/*
 *  CLIENT
 */

(function(){
    function gm_military_base(Core, data){
        this.Core = Core;
        this.id = 'gm_military_base';
        
        this.data = data;
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    gm_military_base.prototype.load = function(){
        var Game = this.Core.Game;
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var resource = this.Core.Resources.globalmap.buildings['military_base'];
        
        var data = this.data;
        var stationed_commanders = data.onTile.data.commanders;
        var stationed_amount = stationed_commanders.length;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:550px;">';
            html += '<div class="title">'+ resource.name.toUpperCase() +'</div>';
            html += '<div style="margin:10px;">'; 
        
        if(data.onTile.data.userid === Player.id){
            var level = data.onTile.data.level;
            
            //building description
            html += '<div class="description"><div style="margin:10px;">'+ resource.description +'</div></div>';
            
            //commanders
            html += '<div name="content-commanders">';
            
            
            var available_slots = Game.gameCfg.military_base_starting_slots + (Game.gameCfg.military_base_extra_slots_per_level * level) - stationed_amount;
            
            for(var i = 0; i < stationed_commanders.length; i++){
                var obj = stationed_commanders[i];
                var rank = Game.gameCfg.commander_ranks[obj.rank];
                var divclass = (rank.rare) ? 'rare' : 'normal';

                html += '<div name="commander-'+ obj.id +'" class="rank_'+ divclass +'" style="width:45%;float:left;margin-right:6px;margin-bottom:5px;">';
                html += '<div style="float:left;margin-right:6px;"><img src="game/resources/images/other/rank_'+ obj.rank +'.gif"></div>';
                html += '<div style="float:left;">';
                html += '<div style="font-size:18px;">'+ obj.name +'</div>';
                html += '<div style="font-size:15px;">'+ rank.rank +'</div>';
                html += '</div><div class="clear"></div></div>';
            } 
            
            for(var i = 0; i < available_slots; i++){
                html += '<div name="add_commander" style="width:45%;float:left;margin-bottom:5px;margin-right:6px;border:1px dashed grey;text-align:center;cursor:pointer;">';
                html += '<div style="margin:10px;width:100%;text-transform:uppercase;">add commander</div>';
                html += '<div class="clear"></div></div>';
            }
            
            html += '<div class="clear"></div>';
            html += '<button name="ok">Ok</button>';
            html += '</div>';
            
            html += '<div name="content-my_commanders"></div>';
            html += '<div name="content-commander"></div>';
        }else{
            html += resource.description;
            
            html += '<div class="clear"></div>';
            
            html += '<button name="war">War</button><button name="ok">Ok</button>';
        }
        
        html += '</div></div>';
        
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="add_commander"]', this.addCommander.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="content-my_commanders"] div[name|="commander"]', this.chooseCommander.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="content-commanders"] div[name|="commander"]', this.recallCommander.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="war"]', this.war.bind(this));
    }
    
    gm_military_base.prototype.addCommander = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var html = '';
        
        var x = this.data.x;
        var y = this.data.y;
        
        if(Player.getNumAvailableCommanders(city.city_id) > 0){
            var commanders = city.commanders;
            
            for(var commanderID in commanders){
                var commander = commanders[commanderID];
                
                if(!this.Core.Player.commanderHasMission(commander)){
                    if(commander.station_x !== x || commander.station_y !== y){
                        var rank = this.Core.Game.gameCfg.commander_ranks[commander.rank];
                        var divclass = (rank.rare) ? 'rare' : 'normal';
                        
                        var extra = (commander.station_x === city.city_x && commander.station_y === city.city_y) ? '' : '<span style="color:red;font-weight:bold;">*</span>';

                        html += '<div name="commander-'+ commanderID +'" class="rank_'+ divclass +'" style="width:45%;float:left;margin-right:6px;">';
                        html += '<div style="float:left;margin-right:6px;"><img src="game/resources/images/other/rank_'+ commander.rank +'.gif"></div>';
                        html += '<div style="float:left;">';
                        html += '<div style="font-size:18px;">'+ commander.name +' '+ extra +'</div>';
                        html += '<div style="font-size:15px;">'+ rank.rank +'</div>';
                        html += '</div><div class="clear"></div></div>';
                    }
                }
            }
            
            html += '<div class="clear"></div>';
            html += '<div style="margin-top:7px;margin-bottom:4px;background-color:black;padding:4px;">';
            html += '<span style="color:red;font-weight:bold;">*</span> indicates the commander is stationed away from home';
            html += '</div>';
        }else{
            html += '<div style="margin-bottom:5px;">The city does not have any available commanders to relocate to this military base.</div>';
        }
        
        
        html += '<div class="clear"></div>';
        html += '<button name="back-commanders">Back</button>';
        
        //build html
        $('div[name="interface-'+ this.id +'"] div[name="content-my_commanders"]').html(html);
        
        this.showTab(null, 'my_commanders');
    }
    
    gm_military_base.prototype.chooseCommander = function(e){
        var self = this;
        
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var commanderID = parseInt($(e.target).closest('div[name|="commander"]').attr('name').split('-')[1]);
        var commander = city.commanders[commanderID];
        
        var x = this.data.x;
        var y = this.data.y;
        
        var msg;
        var leaving = false;

        if(commander.station_x === city.city_x && commander.station_y === city.city_y){
            msg = 'Are you sure you wish to order this commander from the city to military base?';
            leaving = true;
        }else{
            msg = 'This commander is currently stationed somewhere else on the map. The commander is not stationed in a city. Are you sure you wish to move the commander from where ';
            msg += 'he is currently stationed to this military base?';
        }

        this.Core.Gui.popup(0, 'Confirm', msg, {
            buttons : [
                ['Send Commander', function(){
                    self.Core.Events.emit('GLOBALMAP:COMMANDER_MOVE', {
                        city_id : city.city_id,
                        commanderID : commanderID,
                        destination_x : x,
                        destination_y : y
                    });

                    self.Core.GlobalMap.addMission({
                        user_id : Player.id,
                        city_id : city.city_id,
                        x : commander.station_x,
                        y : commander.station_y,
                        destination_x : x,
                        destination_y : y,
                        departure : Date.now(),
                        action : 'commander_move',
                        data : {
                            commanderID : commanderID
                        }
                    });

                    //update commander mission data
                    commander.mission_x = x;
                    commander.mission_y = y;
                    
                    if(leaving){
                        self.removeCommanderFromBase();
                    }

                    self.showTab(null, 'commanders');
                }],
                ['No']
            ]
        });
    }
    
    gm_military_base.prototype.recallCommander = function(e){
        var self = this;
        
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var commanderID = parseInt($(e.target).closest('div[name|="commander"]').attr('name').split('-')[1]);
        var commander = city.commanders[commanderID];
        
        var x = city.city_x;
        var y = city.city_y;
        
        this.Core.Gui.popup(0, 'Recall Commander to city', 'Are you sure you wish to recall this commander to your city?', {
            buttons : [
                ['Recall Commander', function(){
                    self.Core.Events.emit('GLOBALMAP:COMMANDER_MOVE', {
                        city_id : city.city_id,
                        commanderID : commanderID,
                        destination_x : x,
                        destination_y : y
                    });

                    self.Core.GlobalMap.addMission({
                        user_id : Player.id,
                        city_id : city.city_id,
                        x : commander.station_x,
                        y : commander.station_y,
                        destination_x : x,
                        destination_y : y,
                        departure : Date.now(),
                        action : 'commander_move',
                        data : {
                            commanderID : commanderID
                        }
                    });

                    //update commander mission data
                    commander.mission_x = x;
                    commander.mission_y = y;
                    
                    self.removeCommanderFromBase(commanderID);

                    self.showTab(null, 'commanders');
                }],
                ['No']
            ]
        });
    }
    
    gm_military_base.prototype.removeCommanderFromBase = function(commanderID){
        var html =  '<div name="add_commander" style="width:45%;float:left;margin-bottom:5px;margin-right:6px;border:1px dashed grey;text-align:center;cursor:pointer;">' +
                    '<div style="margin:10px;width:100%;text-transform:uppercase;">add commander</div>' +
                    '<div class="clear"></div></div>';
        
        var el = $('div[name="interface-'+ this.id +'"] div[name="content-commanders"] div[name="commander-'+ commanderID +'"]');
        
        el.after(html);
        el.remove();
        
        var stationed_commanders = this.data.onTile.data.commanders;
        
        for(var i = 0; i < stationed_commanders.length; i++){
            var commander = stationed_commanders[i];
            
            if(commander.id === commanderID){
                this.data.onTile.data.commanders.splice(i, 1);
            }
        }
    }
    
    gm_military_base.prototype.war = function(){
        this.Core.InterfaceManager.unloadInterface(this.id);
        this.Core.InterfaceManager.loadInterface('war_gmActions', this.data);
    }
    
    gm_military_base.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    gm_military_base.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    gm_military_base.prototype.unload = function(){
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="add_commander"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="content-my_commanders"] div[name|="commander"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="war"]');
        
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['gm_military_base'] = gm_military_base;
})();
