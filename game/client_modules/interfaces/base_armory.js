/*
 *  CLIENT
 */

(function(){
    function base_armory(Core){
        this.Core = Core;
        this.id = 'base_armory';
        
        //temp vars
        this.commanderID = false;
        this.assignMax = 0;
        this.assignOriginal = 0;
        this.isHome = false;
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    base_armory.prototype.load = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var resource = this.Core.Resources.base.buildings['armory'];
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:550px;">';
            html += '<div class="title">'+ resource.name.toUpperCase() +'</div>';
            html += '<div style="margin:10px;">'; 
            html += '<div class="description"><div style="margin:10px;">'+ resource.description +'</div></div>';
            
            html += '<div name="tab_selection" class="tabs">';
            html += '<div name="tab-commanders" class="tab">Commanders</div><div name="tab-weapons" class="tab">Weapons</div><div name="tab-vehicles" class="tab">Vehicles</div>';
            html += '</div>';
            
            
            //commanders
            html += '<div name="content-commanders">';
            
            if(Player.getNumCommanders(city.city_id) > 0){
                var commanders = city.commanders;
                for(var commanderID in commanders){
                    var data = commanders[commanderID];
                    var rank = this.Core.Game.gameCfg.commander_ranks[data.rank];
                    var divclass = (rank.rare) ? 'rare' : 'normal';

                    html += '<div name="commander-'+ commanderID +'" class="rank_'+ divclass +'" style="width:45%;float:left;margin-right:6px;">';
                    html += '<div style="float:left;margin-right:6px;"><img src="game/resources/images/other/rank_'+ data.rank +'.gif"></div>';
                    html += '<div style="float:left;">';
                    html += '<div style="font-size:18px;">'+ data.name +'</div>';
                    html += '<div style="font-size:15px;">'+ rank.rank +'</div>';
                    html += '</div><div class="clear"></div></div>';
                }
            }else{
                html += 'Your city has not recruited any commanders.';
            }
            
            html += '<div class="clear"></div>';
            html += '<button name="ok">Ok</button>';
            html += '</div>';
            
            //content weapons & vehicles
            html += '<div name="content-weapons" class="hidden">';
            var weapons = this.Core.Game.gameCfg.military_weapons;
            
            for(var weapon in weapons){
                var obj = weapons[weapon];
                
                html += '<div style="float:left;margin:8px;">';
                html += '<img name="item-weapons/'+ weapon +'" src="'+ obj.thumbnail_src +'" style="width:64;height:64;cursor:pointer;">';
                html += '<div style="margin:5px;">';
                html += '<table cellpadding="0" style="color:white;">';
                html += '<tr style="font-size:18px;color:yellow;"><td colspan="2">'+ obj.name +'</td></tr>';
                html += '<tr><td>Attack</td><td>&nbsp;'+ fn_numberFormat(obj.attack) +'</td></tr>';
                html += '<tr><td>Defense</td><td>&nbsp;'+ fn_numberFormat(obj.defense) +'</td></tr>';
                html += '<tr><td>PPM</td><td>&nbsp;'+ fn_numberFormat(obj.ppm) +'</td></tr>';
                html += '</table>';
                html += '</div>';
                html += '</div>';
            }
            html += '<div class="clear"><button name="ok">Ok</button></div>';
            html += '</div>';
            
            html += '<div name="content-vehicles" class="hidden">';
            var vehicles = this.Core.Game.gameCfg.military_vehicles;
            
            for(var vehicle in vehicles){
                var obj = vehicles[vehicle];
                    html += '<div style="float:left;margin:8px;">';
                    html += '<img name="item-vehicles/'+ vehicle +'" src="'+ obj.thumbnail_src +'" style="width:64;height:64;cursor:pointer;">';
                    html += '<div style="margin:5px;">';
                    html += '<table cellpadding="0" style="color:white;">';
                    html += '<tr style="font-size:18px;color:yellow;"><td colspan="2">'+ obj.name +'</td></tr>';
                    html += '<tr><td>Attack</td><td>&nbsp;'+ fn_numberFormat(obj.attack) +'</td></tr>';
                    html += '<tr><td>Defense</td><td>&nbsp;'+ fn_numberFormat(obj.defense) +'</td></tr>';
                    html += '<tr><td>PPM</td><td>&nbsp;'+ fn_numberFormat(obj.ppm) +'</td></tr>';
                    html += '</table>';
                    html += '</div>';
                    html += '</div>';
            }
            html += '<div class="clear"><button name="ok">Ok</button></div>';
            html += '</div>';
            
            html += '<div name="content-commander"></div>';
            html += '<div name="content-slotinfo"></div>';
            html += '</div>';
            
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="commander"]', this.showCommander.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('focus', 'div[name="interface-'+ this.id +'"] input[name="assigned"]', this.assignFieldFocus.bind(this));
        $(document).on('blur', 'div[name="interface-'+ this.id +'"] input[name="assigned"]', this.assignFieldBlur.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="assign"]', this.assignSoldiers.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="slot"]', this.slotClicked.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="set_item_amount"]', this.updateAmount.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="add_item"]', this.addItem.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="discharge"]', this.discharge.bind(this));
    }
    
    base_armory.prototype.showCommander = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var id = $(e.target).closest('div[name|="commander"]').attr('name').split('-')[1];
        var commander = city.commanders[id];
        var rank = this.Core.Game.gameCfg.commander_ranks[commander.rank];
        
        var freeSoldiers = Player.numFreeSoldiers(city.city_id);
        var isHome = ((commander.station_x === city.city_x && commander.station_y === city.city_y) && !Player.commanderHasMission(commander)) ? true : false;
        
        this.assignMax = freeSoldiers + commander.soldiers;
        this.assignOriginal = commander.soldiers;
        this.commanderID = id;
        this.isHome = isHome;
        
        var stationed_txt = (isHome) ? fn_htmlEnc(city.city_name) : '<span style="color:yellow;font-weight:bold;">AWAY</span><br/>@'+ commander.station_x +','+ commander.station_y;
        
        var html = '<div style="float:left;width:27%">';
            html += '<div style="text-align:center;">'+ commander.name +'<br/>'+ rank.rank +'<br/><img src="game/resources/images/other/rank_'+ commander.rank +'.gif"></div>';
            
            html += '<table style="color:white;" cellpadding="5">';
            html += '<tr><td>Capacity</td><td>'+ fn_numberFormat(commander.capacity) +'</td></tr>';
            html += '<tr><td>Stationed</td><td>'+ stationed_txt +'</td></tr>';
            html += '</table>';
            
            html += '</div>';
            
            html += '<div style="float:right;width:70%;">';
            
            html += '<table style="margin-bottom:10px;">';
            html += '<tr><td>Available soldiers</td><td><b>'+ fn_numberFormat(freeSoldiers) +'</b></td></tr>';
            
            if(isHome){
                html += '<tr><td>Assigned soldiers</td><td><input name="assigned" type="text" value="'+ commander.soldiers +'" style="width:60px;"> <button name="assign" style="display:none;height:23px;">Update</button></td></tr>';
            }else{
                html += '<tr><td>Assigned soldiers</td><td><b>'+ fn_numberFormat(commander.soldiers) +'</b></td></tr>';
            }
            
            html += '</table>';
            
            var max_slots = this.Core.Game.gameCfg.commander_max_slots;
            var used_slots = 0;
            
            for(var item in commander.equipment){
                var category = this.Core.Game.getMilitaryItemCategory(item);
                
                var obj;
                if(category === 'weapons'){
                    obj = this.Core.Game.gameCfg.military_weapons[item];
                }else{
                    obj = this.Core.Game.gameCfg.military_vehicles[item];
                }
                
                html += '<div name="slot-'+ item +'" style="margin-right:6px;margin-bottom:8px;float:left;border:1px dashed grey;cursor:pointer;height:84px;width:80px;">';
                html += '<div style="width:100%;text-align:center;"><img src="'+ obj.thumbnail_src +'" width="64" height="64"></div>';
                html += '<div style="width:100%;line-height:20px;background-color:black;color:white;font-size:13px;text-align:center;max-height:20px;overflow:hidden;">'+ obj.name +'</div>';
                html += '</div>';
                
                used_slots++;
            }

            for(var i = used_slots; i < max_slots; i++){
                if(isHome){
                    html += '<div name="slot-empty" style="margin-right:6px;margin-bottom:8px;float:left;border:1px dashed grey;cursor:pointer;height:84px;width:80px;">';
                    html += '<div style="margin:10px;text-align:center;">';
                    html += 'ADD ITEM';
                    html += '</div>';
                    html += '</div>';
                }else{
                    html += '<div style="margin-right:6px;margin-bottom:8px;float:left;border:1px dashed grey;height:84px;width:80px;">';
                    html += '<div style="margin:10px;text-align:center;">';
                    html += 'EMPTY';
                    html += '</div>';
                    html += '</div>';
                }
            }
            
            html += '<button name="discharge" style="width:100%;height:30px;margin:0 auto;margin-bottom:7px;">Discharge '+ commander.name +'</button>';
            html += '</div>';
            html += '<div class="clear"></div>';
            html += '<button name="ok">Cancel</button><button name="back-commanders">Back</button>';
        
        //set html
        $('div[name="interface-'+ this.id +'"] div[name="content-commander"]').html(html);
        
        this.showTab(null, 'commander');
    }
    
    base_armory.prototype.slotClicked = function(e, item_name){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var commander = city.commanders[this.commanderID];
        
        var item = (item_name) ? item_name : $(e.target).closest('div[name|="slot"]').attr('name').split('-')[1];
        
        var html = '';
        if(item === 'empty'){
            var i = 0;
            var weapons = this.Core.Game.gameCfg.military_weapons;
            var vehicles = this.Core.Game.gameCfg.military_vehicles;
            
            for(var weapon in weapons){
                if(!commander.equipment[weapon]){
                    var obj = weapons[weapon];
                    
                    html += '<div name="add_item-'+ weapon +'" style="margin-right:6px;margin-bottom:8px;float:left;border:1px dashed grey;cursor:pointer;height:84px;width:80px;">';
                    html += '<div style="width:100%;text-align:center;"><img src="'+ obj.thumbnail_src +'" width="64" height="64"></div>';
                    html += '<div style="width:100%;line-height:20px;background-color:black;color:white;font-size:13px;text-align:center;max-height:20px;overflow:hidden;">'+ obj.name +'</div>';
                    html += '</div>';
                }
                
                i++;
            }
            
            for(var vehicle in vehicles){
                if(!commander.equipment[vehicle]){
                    var obj = vehicles[vehicle];
                    
                    html += '<div name="add_item-'+ vehicle +'" style="margin-right:6px;margin-bottom:8px;float:left;border:1px dashed grey;cursor:pointer;height:84px;width:80px;">';
                    html += '<div style="width:100%;text-align:center;"><img src="'+ obj.thumbnail_src +'" width="64" height="64"></div>';
                    html += '<div style="width:100%;line-height:20px;background-color:black;color:white;font-size:13px;text-align:center;max-height:20px;overflow:hidden;">'+ obj.name +'</div>';
                    html += '</div>';
                }
                
                i++;
            }
        }else{
            html = this.getItemInfoHTML(item);
        }
        
        html += '<div class="clear"></div>';
        html += '<button name="ok">Cancel</button><button name="back-commander">Back</button>';
        
        
        //set html
        $('div[name="interface-'+ this.id +'"] div[name="content-slotinfo"]').html(html);
        
        this.showTab(null, 'slotinfo');
    }
    
    base_armory.prototype.addItem = function(e){
        var item = $(e.target).closest('div[name|="add_item"]').attr('name').split('-')[1];
        this.slotClicked(null, item);
    }
    
    base_armory.prototype.updateAmount = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var item = $(e.target).attr('name').split('-')[1];
        
        var commander = city.commanders[this.commanderID];
        
        var amount = parseInt($('div[name="interface-'+ this.id +'"] input[name="set_item_amount"]').val());
        
        var inventory_amount = Player.numInInventory(city.city_id, item);
        var inventory_commander = Player.commanderNumInInventory(commander, item);
        var amount_difference = inventory_commander - amount;
        
        if(amount >= 0){
            if(amount_difference >= 0 || (amount_difference < 0 && amount <= (inventory_amount + inventory_commander))){
                this.Core.Events.emit('GAME:ASSIGN_EQUIPMENT', {
                    city_id : city.city_id,
                    item_name : item,
                    amount : parseInt(amount),
                    commanderID : this.commanderID
                });
                
                //item doesn't exist in inventory, so we need to construct the object
                if(inventory_commander === 0){
                    commander.equipment[item] = 0;
                    
                     //get item object
                    var category = this.Core.Game.getMilitaryItemCategory(item);

                    var obj;
                    if(category === 'weapons'){
                        obj = this.Core.Game.gameCfg.military_weapons[item];
                    }else{
                        obj = this.Core.Game.gameCfg.military_vehicles[item];
                    }
                    
                    //update commander html
                    var html = '<div style="width:100%;text-align:center;"><img src="'+ obj.thumbnail_src +'" width="64" height="64"></div>';
                        html += '<div style="width:100%;line-height:20px;background-color:black;color:white;font-size:13px;text-align:center;max-height:20px;overflow:hidden;">'+ obj.name +'</div>';
                    
                    var slot_div = $('div[name="interface-'+ this.id +'"] div[name="content-commander"] div[name="slot-empty"]').first();
                    
                    slot_div.html(html);
                    slot_div.attr('name', 'slot-'+ item);
                }
                
                //delete from inventory if set to 0
                if(amount === 0){
                    commander.equipment[item] = null;
                    delete commander.equipment[item];
                    
                    //update html
                    var html = '<div style="margin:10px;text-align:center;">';
                        html += 'ADD ITEM';
                        html += '</div>';
                    
                    var slot_div = $('div[name="interface-'+ this.id +'"] div[name="content-commander"] div[name="slot-'+ item +'"]');
                    
                    slot_div.html(html);
                    slot_div.attr('name', 'slot-empty');
                }else{
                    //update commander inventory
                    commander.equipment[item] = amount;
                }
                
                //update city inventory
                Player.setInventoryAmount(city.city_id, item, inventory_amount + amount_difference);
                
                this.showTab(null, 'commander');
            }else{
                this.Core.Gui.popup(0, 'Error', 'You do not have enough of this item in your city\'s inventory.', {});
            }
        }else{
            this.Core.Gui.popup(0, 'Error', 'You cannot assign a negative number of items in inventory.', {});
        }
    }
    
    base_armory.prototype.getItemInfoHTML = function(item_name){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var commander = city.commanders[this.commanderID];
        
        var amount = this.Core.Player.commanderNumInInventory(commander, item_name);
        var category = this.Core.Game.getMilitaryItemCategory(item_name);
        
        var item;
        if(category === 'weapons'){
            item = this.Core.Game.gameCfg.military_weapons[item_name];
        }else{
            item = this.Core.Game.gameCfg.military_vehicles[item_name];
        }

        var html = '<div style="float:left;width:28%;border-right:1px dashed grey;">';
            html += '<img src="'+ item.thumbnail_large_src +'" style="width:128px;height:128px;">';
            html += '<table cellpadding="6" style="color:white;">';
            html += '<tr style="font-size:18px;color:yellow;"><td colspan="2">'+ item.name +'</td></tr>';
            html += '<tr><td>Attack</td><td>&nbsp;'+ fn_numberFormat(item.attack) +'</td></tr>';
            html += '<tr><td>Defense</td><td>&nbsp;'+ fn_numberFormat(item.defense) +'</td></tr>';

            //show capacity stat if it's a vehicle
            if(category === 'vehicles'){
                html += '<tr><td>Capacity</td><td>&nbsp;'+ fn_numberFormat(item.capacity) +'</td></tr>';
            }

            html += '<tr><td>PPM</td><td>&nbsp;'+ fn_numberFormat(item.ppm) +'</td></tr>';
            html += '</table>';
            html += '</div>';
            html += '<div style="float:right;width:69%">';
            html += '<div class="description" style="width:100%;border:1px dashed grey;border-color:grey;"><div style="margin:6px;text-align:justify;">'+ item.description +'</div></div>';
            html += '<table style="margin-bottom:10px;">';
            html += '<tr><td colspan="2"><span style="font-weight:bold;color:white;font-size:17px;">City of '+ fn_htmlEnc(city.city_name) +'</span></td></tr>';
            html += '<tr><td>Available</td><td>'+ fn_numberFormat(Player.numInInventory(city.city_id, item_name)) +'</td></tr>';
            html += '</table>';
            html += '<table>';
            html += '<tr><td colspan="2"><span style="font-weight:bold;color:white;font-size:17px;">Commander '+ fn_htmlEnc(commander.name) +'</span></td></tr>';
            
            if(this.isHome){
                html += '<tr><td>Inventory Amount</td><td><input name="set_item_amount" type="text" value="'+ amount +'" style="width:60px;"> <button name="set_item_amount-'+ item_name +'" style="height:23px;">Update</button></td></tr>';
            }else{
                html += '<tr><td>Inventory Amount</td><td>'+ fn_numberFormat(amount) +'</td></tr>';
            }
            
            html += '</table>';
            html += '</div>';
            html += '<div class="clear"></div>';
            
        return html;
    }
    
    /* insure integrity of final value */
    base_armory.prototype.assignFieldBlur = function(e){
        var Player = this.Core.Player;
        
        var input = $(e.target);
        var val = parseInt(input.val());
        
        var original_val = this.assignOriginal;
        var max_val = this.assignMax;
        var commander = Player.cities[Player.current_city].commanders[this.commanderID];
        
        //restore original value
        if(val.length === 0){
            input.val(original_val);
        }else if(isNaN(val)){
            input.val(original_val);
        }else if(val < 0){
            input.val(0);
        }else if(val > commander.capacity){
            input.val(commander.capacity);
        }else if(val > max_val){
            input.val(max_val);
        }else{
            input.val(val);
        }
        
        if(val === original_val){
           $('div[name="interface-'+ this.id +'"] div[name="content-commander"] button[name|="assign"]').hide(); 
        }
    }
    
    base_armory.prototype.assignFieldFocus = function(e){
        $('div[name="interface-'+ this.id +'"] div[name="content-commander"] button[name|="assign"]').show();
    }
    
    base_armory.prototype.assignSoldiers = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var queue = city.production_queues['recruitment'][0];
        var value = parseInt($('div[name="interface-'+ this.id +'"] input[name="assigned"]').val());
        
        if(!queue || (!queue.deduction || (queue.deduction && value < 1))){
            this.Core.Events.emit('GAME:ASSIGN_SOLDIERS', {
                city_id : city.city_id,
                commanderID : this.commanderID,
                value : value
            });

            //update
            city.commanders[this.commanderID].soldiers = value;
        }else{
            this.Core.Gui.popup(0, 'Error', 'You cannot assign more troops to a commander while your city is actively discharging troops.', {});
        }
        
        $('div[name="interface-'+ this.id +'"] div[name="content-commander"] button[name|="assign"]').hide();
    }
    
    base_armory.prototype.discharge = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var self = this;
        var id = this.commanderID;
        
        this.Core.Gui.popup(0, 'Confirm', 'Are you sure you wish to discharge this commander from your city? Discharging a commander will return any assigned equipment to the city inventory.', {
            buttons : [
                ['Discharge', function(){
                    self.Core.Events.emit('GAME:COMMANDER_DISCHARGE', {
                        city_id : city.city_id,
                        commanderID : id
                    });
                    
                    Player.dischargeCommander(city.city_id, id);
                    
                    //remove from html
                    $('div[name="interface-'+ self.id +'"] div[name="commander-'+ id +'"]').remove();
                    
                    //back to commanders list
                    self.showTab(null, 'commanders');
                }],
                ['Cancel']
            ]
        });
    }
    
    base_armory.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    base_armory.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    base_armory.prototype.unload = function(){
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="commander"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('focus', 'div[name="interface-'+ this.id +'"] input[name="assigned"]');
        $(document).off('blur', 'div[name="interface-'+ this.id +'"] input[name="assigned"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="assign"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="slot"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="set_item_amount"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="add_item"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="discharge"]');
        
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['base_armory'] = base_armory;
})();