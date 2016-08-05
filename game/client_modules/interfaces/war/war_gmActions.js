/*
 *  CLIENT
 */

(function(){
    function war_gmActions(Core, data){
        this.Core = Core;
        var Player = Core.Player;
        
        this.id = 'war_gmActions';
        
        this.data = data;
        this.allowed = true;
        
        if(data.onTile){
            var building = data.onTile.data;
            var resource = this.Core.Resources.globalmap.buildings[building.type];
            
            if(resource.type === 'city'){
                this.type = 'city';
            }else{
                this.type = 'building';
            }
            
            this.warID = Player.amAtWar(this.data.onTile.data.userid); //warID
        
            //if war exists, extract some info
            if(this.warID){
                this.war = Player.wars[Player.getWarIndex(this.warID)];
                this.amAttacker = (this.war.attacker === Player.id);
            }

            //ids of the commanders the player chooses
            this.commanderIDs = [];
        }else{
            this.type = 'resource';
            this.allowed = false;
        }
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    war_gmActions.prototype.load = function(){
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:700px;">';
            html += '<div class="title">War Actions</b></div>';
            html += '<div style="margin:10px;">';
            
            
            html += '<div style="float:left;width:25%;margin-bottom:20px;">';
            
            if(this.allowed){
                html += '<button name="action-main" class="field_padding" style="display:block;width:100%;">Main</button>';
                html += '<button name="nav-back" class="field_padding" style="display:block;width:100%;">Back</button>';
                html += '<button name="nav-exit" class="field_padding" style="display:block;width:100%;">Exit</button>';
            }else{
                html += '<button name="nav-exit" class="field_padding" style="display:block;width:100%;">Exit</button>';
            }
            
            html += '</div>';
            
            html += '<div style="float:right;width:70%;">';
            
            //start main
            html += '<div name="content-main">';
            
            if(this.allowed){
                html += 'The city of <span style="color:white;font-weight:bold;">'+ this.data.onTile.data.name +'</span>. ';
                html += ((this.warID) ? 'You are at war with this nation.' : 'You are currently not at war with this nation.')

                html += '<div class="clear" style="margin-bottom:20px;"></div>';

                //selected commanders
                html += '<div style="font-size:19px;margin-bottom:4px;">Commanders</div>';
                html += '<div name="selectedCommanders">';
                html += this.getCommanderHTML();
                html += '</div>';

                html += '<div class="clear"></div>';

                //battle type
                html += '<div name="action_type" style="margin-top:30px;margin-bottom:15px;">';
                html += '<table>';
                html += '<tr>';
                html += '<td style="font-size:19px;">Battle Type</td>';
                html += '<td><select name="action_type" class="field_padding">';
                
                html += '<option value="attack">Attack</option>';
                html += '<option value="conquest">Conquest</option>';
                
                if(this.type === 'city'){
                    html += '<option value="siege">Siege</option>';
                }
                
                html += '</select></td>';
                html += '</tr>';
                html += '</table>';

                html += '<div name="type-attack">';
                if(this.type === 'city'){
                    html += 'Attacking results in the most destruction of the target city. Your surviving commanders and soldiers return immediately after attacking.';
                }else{
                    html += 'Attacking a building bububububu';
                }
                html += '</div>';
                
                html += '<div name="type-conquest">';
                if(this.type === 'city'){
                    html += 'Conquesting city ...';
                }else{
                    html += 'Conquesting resource ...';
                }
                html += '</div>';

                if(this.type === 'city'){
                    html += '<div name="type-siege" class="hidden">';
                    html += 'Sieging a city ...';
                    html += '</div>';
                }

                html += '<button name="initiate" style="width:200px;margin-top:35px;border:1px solid red;" class="field_padding">'+ ((this.warID) ? 'Intitiate Mission' : 'Declare War') +'</button>';

                if(this.warID){
                    html += '<span name="peaceButton">';
                    html += this.getPeaceButtonHTML();
                    html += '</span>';
                }

                html += '</div>';

                html += '<button class="field_padding" style="display:none;width:100%;">Confirm</button>';
            }else{
                html += 'You cannot launch an attack on this type of tile.';
            }
            
            //end main
            html += '</div>';
            
            //attack
            html += '<div name="content-types" style="display:none;">';
            html += 'The types of battle are ...';
            html += '</div>';
            
            //commanders
            html += '<div name="content-commanders" style="display:none;">';
            html += '</div>';
            
            html += '</div>';
            
            html += '</div></div>';
            
            
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="action"]', this.handleAction.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]', this.buttonPressed.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="add_commander"]', this.addCommander.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="content-commanders"] div[name|="commander"]', this.chooseCommander.bind(this));
        $(document).on('change', 'div[name="interface-'+ this.id +'"] select[name="action_type"]', this.switchBattleTypeInfo.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="initiate"]', this.initiate.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="peace"]', this.handlePeace.bind(this));
    }
    
    war_gmActions.prototype.getCommanderHTML = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var commanders = this.commanderIDs;
        var cityCommanders = city.commanders;
        
        var html = '';
        
        for(var i = 0; i < commanders.length; i++){
            var commanderID = commanders[i];
            var commander = cityCommanders[commanderID];
            
            var rank = this.Core.Game.gameCfg.commander_ranks[commander.rank];
            var divclass = (rank.rare) ? 'rare' : 'normal';

            html += '<div name="commander-'+ commanderID +'" class="rank_'+ divclass +'" style="width:45%;height:18;float:left;margin-right:6px;">';
            html += '<div style="float:left;margin-right:6px;"><img src="game/resources/images/other/rank_'+ commander.rank +'.gif" width="65" height="35"></div>';
            html += '<div style="float:left;">';
            html += '<div style="font-size:18px;">'+ commander.name +'</div>';
            html += '<div style="font-size:15px;">'+ rank.rank +'</div>';
            html += '</div><div class="clear"></div></div>';
        }
        
        for(var i = 0; i < this.Core.Game.gameCfg.war_commanders_max_per_mission - commanders.length; i++){
            html += '<div name="add_commander" style="width:45%;float:left;margin-bottom:5px;margin-right:6px;border:1px dashed grey;text-align:center;cursor:pointer;">';
            html += '<div style="margin:10px;text-transform:uppercase;">add commander</div>';
            html += '<div class="clear"></div></div>';
        }
        
        return html;
    }
    
    war_gmActions.prototype.getNumCommanders = function(){
        return this.commanderIDs.length;
    }
    
    war_gmActions.prototype.addCommander = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var html = '';
        
        var x = this.data.x;
        var y = this.data.y;
        
        if(Player.getNumAvailableCommanders(city.city_id) > 0){
            var commanders = city.commanders;
            
            for(var commanderID in commanders){
                commanderID = parseInt(commanderID);
                
                var commander = commanders[commanderID];
                
                if(!this.Core.Player.commanderHasMission(commander)){
                    if((commander.station_x !== x || commander.station_y !== y) && this.commanderIDs.indexOf(commanderID) === -1){
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
            html += '<div style="margin-bottom:5px;">The city does not have any available commanders to assign to this mission.</div>';
        }
        
        html += '<div class="clear"></div>';
        
        //build html
        $('div[name="interface-'+ this.id +'"] div[name="content-commanders"]').html(html);
        
        this.showTab(null, 'commanders');
    }
    
    war_gmActions.prototype.chooseCommander = function(e){
        var self = this;
        
        var commanderID = parseInt($(e.target).closest('div[name|="commander"]').attr('name').split('-')[1]);

        this.Core.Gui.popup(0, 'Confirm', 'Are you sure you wish to assign this commander to this mission?', {
            buttons : [
                ['Send Commander', function(){
                    self.commanderIDs.push(commanderID);

                    //update commander html
                    $('div[name="interface-'+ self.id +'"] div[name="content-main"] div[name="selectedCommanders"]').html(self.getCommanderHTML());
                    
                    self.showTab(null, 'main');
                }],
                ['No']
            ]
        });
    }
    
    war_gmActions.prototype.initiate = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var type = this.getBattleType();
        var commanders = this.commanderIDs;
        
        if(commanders.length > 0){
            var self = this;
            
            var x = this.data.x;
            var y = this.data.y;
            var targetCity = (this.type === 'city') ? self.data.onTile.data.id : self.data.onTile.data.city_id;
            
            var msg = (!this.warID) ? 'Are you sure you wish to declare war against this nation?' : 'Are you sure to wish to initiate this attack?';
            
            this.Core.Gui.popup(0, 'Confirm', msg, {
                buttons : [
                    ['Continue', function(){
                        //send event to server
                        self.Core.Events.emit('WAR:INITIATE_MISSION', {
                            city_id     : self.Core.Player.current_city,
                            mode        : type,
                            x           : x,
                            y           : y,
                            commanders  : commanders,
                            targetID    : self.data.onTile.data.userid,
                            targetTile  : self.data.onTile.data.id,
                            targetCity  : targetCity
                        });
                        
                        for(var i = 0; i < self.commanderIDs.length; i++){
                            var commanderID = self.commanderIDs[i];
                            var commander = city.commanders[commanderID];
                            
                            self.Core.GlobalMap.addMission({
                                user_id : Player.id,
                                city_id : city.city_id,
                                x : commander.station_x,
                                y : commander.station_y,
                                destination_x : x,
                                destination_y : y,
                                departure : Date.now(),
                                action : 'commander_attack',
                                data : {
                                    commanderID : commanderID,
                                    mode        : type
                                }
                            });

                            //update commander mission data
                            commander.mission_x = x;
                            commander.mission_y = y;
                            commander.mission_type = 'commander_attack';
                        }

                        //unload
                        self.Core.InterfaceManager.unloadInterface(self.id);
                    }],
                    ['No']
                ]
            });
        }else{
            this.Core.Gui.popup(0, 'Error', 'You have not assigned any commanders to this mission.');
        }
    }
    
    war_gmActions.prototype.getPeaceButtonHTML = function(){
        if((this.amAttacker && this.war.defenderOfferedPeace) || (!this.amAttacker && this.war.attackerOfferedPeace)){
            return '<button name="peace" style="width:200px;margin-top:35px;border:1px solid green;" class="field_padding">Accept Peace</button>';
        }else if((this.amAttacker && !this.war.attackerOfferedPeace) || (!this.amAttacker && !this.war.defenderOfferedPeace)){
            return '<button name="peace" style="width:200px;margin-top:35px;border:1px solid green;" class="field_padding">Offer Peace</button>';
        }else{
            return '<button name="peace" style="width:200px;margin-top:35px;border:1px solid red;" class="field_padding">Revoke Peace</button>';
        }
    }
    
    war_gmActions.prototype.handlePeace = function(){
        var self = this;
        var Gui = this.Core.Gui;
        
        if((this.amAttacker && this.war.defenderOfferedPeace) || (!this.amAttacker && this.war.attackerOfferedPeace)){
            Gui.popup(0, 'Accept Peace Offer', 'Are you sure you wish to accept the enemies peace offer?', {
                buttons : [
                    ['Accept Peace', emit],
                    ['No']
                ]
            });
        }else if((this.amAttacker && !this.war.attackerOfferedPeace) || (!this.amAttacker && !this.war.defenderOfferedPeace)){
            Gui.popup(0, 'Offer Peace', 'Are you sure you wish to give your enemy an offer of peace?', {
                buttons : [
                    ['Offer Peace', function(){
                        if(self.amAttacker){
                            self.war.attackerOfferedPeace = 1;
                        }else{
                            self.war.defenderOfferedPeace = 1;
                        }
                        
                        emit();
                    }],
                    ['No']
                ]
            });
        }else{
            Gui.popup(0, 'Revoke Peace', 'Are you sure you wish to revoke your peace offer?', {
                buttons : [
                    ['Revoke Peace', function(){
                        if(self.amAttacker){
                            self.war.attackerOfferedPeace = 0;
                        }else{
                            self.war.defenderOfferedPeace = 0;
                        }
                        
                        emit();
                    }],
                    ['No']
                ]
            });
        }
        
        function emit(){
            self.Core.Events.emit('WAR:UPDATE_PEACE', self.warID);
            $('div[name="interface-'+ self.id +'"] div[name="content-main"] span[name="peaceButton"]').html(self.getPeaceButtonHTML());
        }
    }
    
    war_gmActions.prototype.getBattleType = function(){
        return $('div[name="interface-'+ this.id +'"] select[name="action_type"]').val();
    }
    
    war_gmActions.prototype.switchBattleTypeInfo = function(e){
        var type = $(e.target).val();
        
        $('div[name="interface-'+ this.id +'"] div[name="content-main"] div[name|="type"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-main"] div[name="type-'+ type +'"]').show();
    }
    
    war_gmActions.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        //unload
        this.Core.InterfaceManager.unloadInterface(this.id);
        
        switch(name){
            case 'back':
                this.Core.InterfaceManager.loadInterface('gm_mapobject', this.data);
                break;
        }
    }
    
    war_gmActions.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    war_gmActions.prototype.handleAction = function(e){
        var action = $(e.target).attr('name').split('-')[1];
        this.showTab(null, action);
    }
    
    war_gmActions.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    war_gmActions.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="action"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="add_commander"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="content-commanders"] div[name|="commander"]');
        $(document).off('change', 'div[name="interface-'+ this.id +'"] select[name="action_type"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="initiate"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="peace"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['war_gmActions'] = war_gmActions;
})();