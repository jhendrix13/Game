/*
 *  CLIENT
 */

(function(){
    function alliance_donate(Core){
        this.Core = Core;
        this.id = 'alliance_donate';
        
        this.fee_agreed = false;
        this.at_register_screen = false;
        
        this.donation = {
            money : 0,
            soldiers : 0,
            firearms : {},
            vehicles : {}
        }
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    alliance_donate.prototype.load = function(){
        var access = false;
        var Player = this.Core.Player;
        var city = this.Core.Player.cities[Player.current_city];
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:700px;">';
            html += '<div class="title">Alliance Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //left side
            html += '<div style="width:70%;float:left;">';
            html += '<div style="margin:6px;">';
            
            //main content
            html += '<div name="main_content">';
            
            
            if(Player.alliance){
                access = true;
                
                var tax_rate = this.Core.Game.gameCfg.world_bank_alliance_tax_rate;
                
                //tax message
                html += '<p><span style="font-weight:bold;color:white;">Tax notice:</span> The World Bank sets tax rates on the donation of money from cities to alliances. The current set rate is '+ tax_rate +'%.</p>';
                
                //donation types
                html += 'I want to donate <select name="donation_type" class="field_padding">';
                html += '<option value="money">Money</option>';
                html += '<option value="soldiers">Soldiers</option>';
                html += '<option value="firearms">Firearms</option>';
                html += '<option value="vehicles">Vehicles</option>';
                html += '</select>';
                
                //separator
                html += '<div style="margin-top:15px;"></div>';
                
                //resources
                html += '<div name="type-money">';
                html += '<div class="p-header" style="margin-bottom:8px;">Donate Money</div>';
                html += '$ <input type="text" name="money" style="padding:6px;"> <button name="set_money" style="float:none;" class="field_padding">Set Amount</button>';
                html += '</div>';
                
                //soldiers
                var freeSoldiers = Player.numFreeSoldiers(city.city_id);
                
                html += '<div name="type-soldiers" class="hidden">';
                html += '<div class="p-header" style="margin-bottom:8px;">Donate Soldiers</div>';
                html += '<input type="text" name="soldiers" style="padding:6px;"> <button name="set_soldiers" style="float:none;" class="field_padding">Set Amount</button>';
                html += '<p>You have '+ fn_numberFormat(freeSoldiers) +' soldiers.</p>';
                html += '</div>';
                
                //firearms
                html += '<div name="type-firearms" class="hidden">';
                html += '<div class="p-header" style="margin-bottom:8px;">Donate Firearms</div>';
                
                html += '<input name="amount-firearm" type="text" placeholder="amount" style="margin-right:4px;padding:6px;">';
                html += '<select name="item-firearm" class="field_padding">';
                
                var default_firearm = false;
                
                for(var firearm in city.equipment.firearms){
                    if(!default_firearm){
                        default_firearm = firearm;
                    }
                    
                    var name = this.Core.Game.getItemDisplayNameByType(firearm, 'firearm');
                    html += '<option value="'+ firearm +'">'+ name +'</option>';
                }
                
                var firearm_amount = Player.numInInventory(city.city_id, default_firearm);
                
                html += '</select>';
                
                html += '<button name="additem-firearm" style="float:none;" class="field_padding">Add Firearm</button>';
                html += '<p>You have <span name="inventory_firearm">'+ fn_numberFormat(firearm_amount) +'</span> of this item.</p>';
                
                html += '<table name="firearm_donations" cellpadding="7" style="width:100%;"></table>';
                html += '</div>';
                
                //vehicles
                html += '<div name="type-vehicles" class="hidden">';
                html += '<div class="p-header" style="margin-bottom:8px;">Donate Vehicles</div>';
                
                html += '<input name="amount-vehicle" type="text" placeholder="amount" style="margin-right:4px;padding:6px;">';
                html += '<select name="item-vehicle" class="field_padding">';
                
                var default_vehicle = false;
                
                for(var vehicle in city.equipment.vehicles){
                    if(!default_vehicle){
                        default_vehicle = vehicle;
                    }
                    
                    var name = this.Core.Game.getItemDisplayNameByType(vehicle, 'vehicle');
                    html += '<option value="'+ vehicle +'">'+ name +'</option>';
                }
                
                var vehicle_amount = Player.numInInventory(city.city_id, default_vehicle);
                
                html += '</select>';
                html += '<button name="additem-vehicle" style="float:none;" class="field_padding">Add Vehicle</button>';
                html += '<p>You have <span name="inventory_vehicle">'+ fn_numberFormat(vehicle_amount) +'</span> of this item.</p>';
                
                html += '<table name="vehicle_donations" cellpadding="7" style="width:100%;"></table>';
                html += '</div>';
            }else{
                html += '<p>You cannot access this interface.</p>';
            }
            
            html += '</div>';
            
            //page content
            html += '<div name="page_content"></div>';
            html += '</div>';
            html += '</div>';
            
            //right side
            html += '<div style="width:30%;float:right;margin-bottom:25px;">';
            
            if(access){
                html += '<button name="nav-next" class="alliBigButton">Next</button>';
                html += '<button name="nav-complete" class="alliBigButton hidden">Complete</button>';
            }
            
            html += '<button name="nav-back" class="alliBigButton">Back</button>';
            html += '<button name="exit" class="alliBigButton">Exit</button>';
            html += '</div>';
            
            html += '</div></div>';
            
            
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]', this.buttonPressed.bind(this));
        $(document).on('change', 'div[name="interface-'+ this.id +'"] select[name="donation_type"]', this.onCategoryTypeChange.bind(this));
        $(document).on('change', 'div[name="interface-'+ this.id +'"] select[name|="item"]', this.onItemTypeChange.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="additem"]', this.addItem.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="set_money"]', this.setMoney.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="set_soldiers"]', this.setSoldiers.bind(this));
    }
    
    alliance_donate.prototype.next = function(){
        $('div[name="interface-'+ this.id +'"] div[name="main_content"]').hide(0);
        
        var donation = this.donation;
        
        var html = '<p>Please review your donation before completing the donation process.</p>';
            html += '<table style="width:100%;">';
            
            if(donation.money && donation.money > 0){
                html += '<tr><td>Money</td><td>$ '+ fn_numberFormat(donation.money) +'</td></tr>';
            }
            
            if(donation.soldiers && donation.soldiers > 0){
                html += '<tr><td>Soldiers</td><td>'+ fn_numberFormat(donation.soldiers) +'</td></tr>';
            }
            
            //firearms
            var firearm_html = '';
            for(var firearm in donation.firearms){
                var amount = donation.firearms[firearm];
                var name = this.Core.Game.getItemDisplayNameByType(firearm, 'firearm');
                
                firearm_html += '<li>'+ fn_numberFormat(amount) +' '+ name +'</li>';
            }
            
            if(firearm_html.length > 0){
                html += '<tr><td>Firearms</td><td><ul>'+ firearm_html +'</ul></td></tr>';
            }
            
            //vehicles
            var vehicle_html = '';
            for(var vehicle in donation.vehicles){
                var amount = donation.vehicles[vehicle];
                var name = this.Core.Game.getItemDisplayNameByType(vehicle, 'vehicle');
                
                vehicle_html += '<li>'+ fn_numberFormat(amount) +' '+ name +'</li>';
            }
            
            if(vehicle_html.length > 0){
                html += '<tr><td>Vehicles</td><td><ul>'+ vehicle_html +'</ul></td></tr>';
            }
            
            html += '</table>';
        
        $('div[name="interface-'+ this.id +'"] button[name="nav-next"]').hide(0);
        $('div[name="interface-'+ this.id +'"] button[name="nav-complete"]').show(0);
        
        var el = $('div[name="interface-'+ this.id +'"] div[name="page_content"]');
            el.html(html);
            el.show(0);
    }
    
    alliance_donate.prototype.addItem = function(e){
        var Player = this.Core.Player;
        var city = this.Core.Player.cities[Player.current_city];
        
        var type = $(e.target).attr('name').split('-')[1];
        var item = $('div[name="interface-'+ this.id +'"] select[name="item-'+ type +'"]').val();
        var name = this.Core.Game.getItemDisplayNameByType(item, type);
        
        var amount = parseInt($('div[name="interface-'+ this.id +'"] input[name="amount-'+ type +'"]').val());
        
        //ensure they have enough
        var inventory_amount = Player.numInInventory(city.city_id, item);
        
        if(inventory_amount >= amount){
            var currAmount = 0;
        
            if(type === 'firearm'){
                currAmount = this.donation.firearms[item];
                this.donation.firearms[item] = amount;
            }else{
                currAmount = this.donation.vehicles[item];
                this.donation.vehicles[item] = amount;
            }

            if(amount > 0 && (isNaN(currAmount) || currAmount === 0)){
                $('div[name="interface-'+ this.id +'"] table[name="'+ type +'_donations"]').append('<tr name="listing-'+ type +'_'+ item +'" style="cursor:pointer;"><td name="amount">'+ fn_numberFormat(amount) +'</td><td>'+ name +'</td></tr>');
            }else if(amount > 0){
                $('div[name="interface-'+ this.id +'"] table[name="'+ type +'_donations"] tr[name="listing-'+ type +'_'+ item +'"] td[name="amount"]').text(fn_numberFormat(amount));
            }else if(amount === 0){
                if(type === 'firearm'){
                    this.donation.firearms[item] = 0;
                }else{
                    this.donation.vehicles[item] = 0;
                }
                
                $('div[name="interface-'+ this.id +'"] table[name="'+ type +'_donations"] tr[name="listing-'+ type +'_'+ item +'"]').remove();
            }
            
            //button highlight
            $(e.target).effect('highlight', 2000);

            //alternating row colors
            fn_colorTable_AltBg('div[name="interface-'+ this.id +'"] table[name="'+ type +'_donations"]', '#404040', '#707070');
        }else{
            this.Core.Gui.popup(1, 'Error', 'You cannot donate this amount as you do not have enough in your city inventory.');
        }
    }
    
    alliance_donate.prototype.onItemTypeChange = function(e){
        var Player = this.Core.Player;
        var city = this.Core.Player.cities[Player.current_city];
        
        var el = $(e.target);
        var type = el.attr('name').split('-')[1];
        var item = el.val();
        
        var amount = Player.numInInventory(city.city_id, item);
        
        $('div[name="interface-'+ this.id +'"] span[name="inventory_'+ type +'"]').text(fn_numberFormat(amount));
    }
    
    alliance_donate.prototype.onCategoryTypeChange = function(e){
        var type = $(e.target).val();
        
        $('div[name="interface-'+ this.id +'"] div[name|="type"]').hide(0);
        $('div[name="interface-'+ this.id +'"] div[name="type-'+ type +'"]').show(0);
    }
    
    alliance_donate.prototype.setMoney = function(e){
        var amount = parseInt($('div[name="interface-'+ this.id +'"] input[name="money"]').val());
        
        if(amount > 0){
            var Player = this.Core.Player;
            var city = this.Core.Player.cities[Player.current_city];
            
            if(city.resources.money >= amount){
                this.donation.money = amount;
                
                //button highlight
                $(e.target).effect('highlight', 2000);
            }else{
                this.Core.Gui.popup(1, 'Error', 'You do not have enough money to donate this amount.');
            }
        }else{
            this.donation.money = 0;
        }
    }
    
    alliance_donate.prototype.setSoldiers = function(e){
        var amount = parseInt($('div[name="interface-'+ this.id +'"] input[name="soldiers"]').val());
        
        if(amount > 0){
            var Player = this.Core.Player;
            var city = this.Core.Player.cities[Player.current_city];
            
            var freeSoldiers = Player.numFreeSoldiers(city.city_id);
            
            if(freeSoldiers >= amount){
                this.donation.soldiers = amount;
                
                //button highlight
                $(e.target).effect('highlight', 2000);
            }else{
                this.Core.Gui.popup(1, 'Error', 'You do not have enough soldiers to donate this amount.');
            }
        }else{
            this.donation.soldiers = 0;
        }
    }
    
    alliance_donate.prototype.complete = function(){
        var Player = this.Core.Player;
        var city = this.Core.Player.cities[Player.current_city];
        
        this.Core.Events.emit('ALLIANCE:DONATE', {
            city_id         : city.city_id,
            donation        : this.donation
        });
        
        //remove the data from their city
        Player.subResource(city.city_id, 'money', this.donation.money);
        Player.subFirearms(city.city_id, this.donation.firearms);
        Player.subVehicles(city.city_id, this.donation.vehicles);
        city.population_military -= this.donation.soldiers;
        
        Player.updateResources(city.city_id);
        
        var html = '<p>Your donation has been received by your alliance. You will be able to donate to your alliance again in '+ this.Core.Game.gameCfg.alliance_donation_cooldown +' hours.</p>';
        
        $('div[name="interface-'+ this.id +'"] button[name="nav-complete"]').hide(0);
        $('div[name="interface-'+ this.id +'"] div[name="page_content"]').html(html);
    }
    
    alliance_donate.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        //unload
        if(['next','complete'].indexOf(name) === -1){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }
        
        switch(name){
            case 'back':
                this.Core.InterfaceManager.loadInterface('alliance');
                break;
            case 'next':
                this.next();
                break;
            case 'complete':
                this.complete();
                break;
        }
    }
    
    alliance_donate.prototype.unload = function(){
        //unload event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $(document).off('change', 'div[name="interface-'+ this.id +'"] select[name="donation_type"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="additem"]');
        $(document).off('change', 'div[name="interface-'+ this.id +'"] select[name|="item"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="set_money"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="set_soldiers"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance_donate'] = alliance_donate;
})();