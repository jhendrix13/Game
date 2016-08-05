/*
 *  CLIENT
 */

(function(){
    function trade(Core, target, existing_trade){
        /*
         *  @var    target  CAN BE FALSE/NULL! IF FALSE/NULL, WE WILL BE USING
         *                  THE EXISTING_TRADE DATA.
         */
        
        this.Core = Core;
        this.id = 'trade';
        
        this.max_offers = Core.Game.gameCfg.trade_max_offer_slots;
        this.max_requests = Core.Game.gameCfg.trade_max_request_slots;
        
        var Player = Core.Player;
        
        if(target){
            this.target = target;
            
            var sender_city         = Player.cities[Player.current_city];
            var target_city         = target.onTile.data;
            
            this.sender_username    = Player.username;
            this.sender_player_id   = Player.id;
            this.sender_city_name   = sender_city.city_name;
            this.sender_city_id     = sender_city.city_id;
            this.sender_city_x      = sender_city.city_x;
            this.sender_city_y      = sender_city.city_y;
            
            this.target_username    = target_city.username;
            this.target_player_id   = target_city.userid;
            this.target_city_id     = target_city.id;
            this.target_city_name   = target_city.name;
            this.target_city_x      = target_city.x;
            this.target_city_y      = target_city.y;
            
            this.offers             = {};
            this.requests           = {};
            
            this.existing_trade     = false;
            
        }else{
            this.trade_id           = existing_trade.id;
            
            this.sender_username    = existing_trade.sender_username;
            this.sender_player_id   = existing_trade.sender_userid;
            this.sender_city_name   = existing_trade.sender_city;
            this.sender_city_id     = existing_trade.sender_city_id;
            this.sender_city_x      = existing_trade.sender_x;
            this.sender_city_y      = existing_trade.sender_y;
            
            this.target_username        = existing_trade.receiver_username;
            this.target_player_id   = existing_trade.receiver_userid;
            this.target_city_name   = existing_trade.receiver_city;
            this.target_city_id     = existing_trade.receiver_city_id;
            this.target_city_x      = existing_trade.receiver_x;
            this.target_city_y      = existing_trade.receiver_y;
            
            this.max_offers         += existing_trade.slot_upgrade;
            this.max_requests       += existing_trade.slot_upgrade;
            
            //this is indeed an existing trade
            this.existing_trade     = true;
            
            //who's "court" is  this trade currently in?
            this.my_turn = (this.sender_player_id === Player.id) ? false : true;
            
            //switch sides
            this.offers             = (this.my_turn) ? existing_trade.request : existing_trade.offer;
            this.requests           = (this.my_turn) ? existing_trade.offer : existing_trade.request;
        }
        
        //store original,unedited values
        this.original_offers    = this.offers;
        this.original_requests  = this.requests;
        
        //find the other player's information, regardless if we are the sender or target, shouldn't matter
        this.real_target_city_id    = (this.target_player_id === Player.id) ? this.sender_city_id : this.target_city_id;
        this.real_target_city_name  = (this.target_player_id === Player.id) ? this.sender_city_name : this.target_city_name;
        this.real_target_player_id  = (this.target_player_id === Player.id) ? this.sender_player_id : this.target_player_id;
        
        this.changed_items = [];
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    trade.prototype.load = function(){
        var Game = this.Core.Game;
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:700px;">';
            html += '<div class="title">Trading with <b>'+ fn_htmlEnc(this.real_target_city_name) +'</b></div>';
            html += '<div style="margin:10px;">';
            
            html += '<div name="content-trade_screen">';
            html += '<table cellpadding="6" style="width:45%;float:left;">';
            html += '<tr><td>Target City</td><td style="color:white;">'+ fn_htmlEnc(this.target_city_name) +'</td><td style="color:yellow;">('+ this.target_city_x +','+ this.target_city_y +')</td></tr>';
            html += '<tr><td>Target Leader</td><td style="color:white;">'+ fn_htmlEnc(this.target_username) +'</td></tr>';
            html += '</table>';
            
            html += '<table cellpadding="6" style="width:45%;float:right;">';
            html += '<tr><td>Origin City</td><td style="color:white;">'+ fn_htmlEnc(this.sender_city_name) +'</td><td style="color:yellow;">('+ this.sender_city_x +','+ this.sender_city_y +')</td></tr>';
            html += '<tr><td>Origin Leader</td><td style="color:white;">'+ fn_htmlEnc(this.sender_username) +'</td></tr>';
            html += '</table>';
            
            html += '<div class="clear"></div>';
            
            html += '<div style="margin-bottom:12px;border-bottom:1px dashed grey;"></div>';
            
            var header_prepend_left = (this.existing_trade && this.my_turn) ? 'Their Request' : 'Your Offer';
            var header_prepend_right = (this.existing_trade && this.my_turn) ? 'Their Offer' : 'Your Request';
            
            html += '<div name="offers" style="float:left;width:47%">';
            html += '<div name="title" style="float;color:white;font-size:21px;text-align:center;margin-bottom:3px;">'+ header_prepend_left +' (<span name="remaining">'+ this.max_offers +'</span>)</div>';
            html += '<table name="listings" cellpadding="4" style="width:100%;overflow:scroll;max-height:10px;"></table>';
            html += '<select name="offers" style="width:100%;background-color:black;color:yellow;height:25px;margin-bottom:3px;margin-top:6px;">'+ this.getTradeableItems() +'</select>';
            html += '<div name="item"></div>';
            html += '</div>';
            
            html += '<div name="requests" style="float:right;width:47%">';
            html += '<div name="title" style="float;color:white;font-size:21px;text-align:center;margin-bottom:3px;">'+ header_prepend_right +' (<span name="remaining">'+ this.max_requests +'</span>)</div>';
            html += '<div name="items_retrieved" class="hidden">';
            html += '<table name="listings" cellpadding="4" style="width:100%;overflow:scroll;max-height:10px;"></table>';
            html += '<select name="requests" style="width:100%;background-color:black;color:yellow;height:25px;margin-bottom:3px;margin-top:6px;"></select>';
            html += '<div name="item"></div>';
            html += '</div>';
            
            html += '<div name="retrieving_items">Retrieving items ...</div>';
            html += '</div>';
            
            html += '<div class="clear" style="margin-bottom:10px;"></div>';
            
            html += '<div style="margin-bottom:12px;border-bottom:1px dashed grey;"></div>';
            
            
            html += '<div name="buttons" style="width:100%;margin:0 auto;text-align:center;">';
            
            if(!this.existing_trade){
                html += '<button name="submit_trade" style="width:200px;height:45px;float:none;">Submit Offer</button>';
            }else if(this.existing_trade && !this.my_turn){
                //im waiting a response
                html += '<button name="cancel_trade" style="width:200px;height:45px;float:none;">Cancel Trade</button>';
            }else{
                //my turn to respond
                html += '<button name="accept_trade" style="width:200px;height:45px;float:none;">Accept Trade</button>';
                html += '<button name="submit_counter_trade" style="width:200px;height:45px;float:none;">Submit Counter-Offer</button>';
                html += '<button name="cancel_trade" style="width:200px;height:45px;float:none;">Cancel Trade</button>';
            }
            
            html += '<button name="exit" style="width:200px;height:45px;float:none;">Exit</button>';
            html += '</div>';
            
            
            html += '</div>';
            
            
            html += '<div name="content-accept_screen" style="hidden"></div>';
            html += '</div></div>';
            
        $('body').append(html);
        
        //get tradeable items
        this.getTargetTradeableItems();
        
        if(!fn_objectIsEmpty(this.offers) || !fn_objectIsEmpty(this.requests)){
            this.updateListings();
        }
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"],div[name="interface-'+ this.id +'"] button[name="exit"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="submit_trade"]', this.submitTrade.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="submit_counter_trade"]', this.submitTrade.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="accept_trade"]', this.acceptTrade.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="cancel_trade"]', this.cancelTrade.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('change', 'div[name="interface-'+ this.id +'"] select', this.itemSelected.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="offers"] button[name="add_item"]', this.addItem.bind(this, 'offers'));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="requests"] button[name="add_item"]', this.addItem.bind(this, 'requests'));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="offers"] tr', this.deleteItem.bind(this, 'offers'));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="requests"] tr', this.deleteItem.bind(this, 'requests'));
    }
    
    trade.prototype.updateListings = function(){
        var offers_table = $('div[name="interface-'+ this.id +'"] div[name="offers"] table');
        offers_table.empty();
        
        for(var o_item_type in this.offers){
            //list of items by this type, e.g.: vehicle, blueprint, resource, ...
            var items = this.offers[o_item_type];
            
            //o_item === item name
            for(var o_item in items){
                var item_amount = items[o_item];
                var display_name = this.Core.Game.getItemDisplayNameByType(o_item, o_item_type); //display name of the item
                
                var html = '<tr name="'+ o_item_type +'-'+ o_item +'" style="color:white;cursor:pointer;"><td style="width:30%;">'+ fn_numberFormat(item_amount) +'</td><td style="width:70%;"><span style="color:'+ this.getItemTypeColor(o_item_type) +';">('+ o_item_type +')</span> '+ display_name +'</td></tr>';
                
                offers_table.append(html);
            }
        }
        
        var requests_table = $('div[name="interface-'+ this.id +'"] div[name="requests"] table');
        requests_table.empty();
        
        for(var r_item_type in this.requests){
            //list of items by this type, e.g.: vehicle, blueprint, resource, ...
            var items = this.requests[r_item_type];
            
            //o_item === item name
            for(var r_item in items){
                var item_amount = items[r_item];
                var display_name = this.Core.Game.getItemDisplayNameByType(r_item, r_item_type); //display name of the item
                
                var html = '<tr name="'+ r_item_type +'-'+ r_item +'" style="color:white;cursor:pointer;"><td style="width:30%;">'+ fn_numberFormat(item_amount) +'</td><td style="width:70%;"><span style="color:'+ this.getItemTypeColor(r_item_type) +';">('+ r_item_type +')</span> '+ display_name +'</td></tr>';
                
                requests_table.append(html);
            }
        }
        
        //alternating row colors
        fn_colorTable_AltBg('div[name="interface-'+ this.id +'"] div[name="offers"] table', '#404040', '#707070');
        fn_colorTable_AltBg('div[name="interface-'+ this.id +'"] div[name="requests"] table', '#404040', '#707070');
        
        //make tables even
        var offer_count = this.getOfferCount();
        var request_count = this.getRequestCount();
        
        if(offer_count !== request_count){
            var difference = Math.abs(offer_count - request_count);
            var target_table = (offer_count > request_count) ? requests_table : offers_table;
            
            for(var i = 0; i < difference; i++){
                target_table.append('<tr style="visibility:hidden;"><td style="width:30%;">&nbsp;</td><td style="width:70%;">&nbsp;</td></tr>');
            }
        }
        
        //update counts
        this.updateCounts();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
        
        //highlight effects for changed listings
        for(var i = 0; i < this.changed_items.length; i++){
            var data = this.changed_items[i].split('-');
            
            $('div[name="interface-'+ this.id +'"] div[name="'+ data[2] +'"] tr[name="'+ data[0] +'-'+ data[1] +'"]').effect('highlight', {}, 2000);
        }
        
        this.changed_items = [];
    }
    
    trade.prototype.updateCounts = function(){
        var offer_remaining = this.max_offers - this.getOfferCount();
        var request_remaining = this.max_requests - this.getRequestCount();
        
        $('div[name="interface-'+ this.id +'"] div[name="offers"] span[name="remaining"]').text(offer_remaining);
        $('div[name="interface-'+ this.id +'"] div[name="requests"] span[name="remaining"]').text(request_remaining);
    }
    
    trade.prototype.addItem = function(type){
        var el_select = $('div[name="interface-'+ this.id +'"] div[name="'+ type +'"] select');
        var el_input = $('div[name="interface-'+ this.id +'"] div[name="'+ type +'"] input[name="add_amount"]');
        
        var item_data = el_select.val().split('-');
        var item_type = item_data[0];
        var item_name = item_data[1];
        
        //get appropriate item amount
        var item_amount = 0;
        if(item_type === 'blueprint'){
            item_amount = 1;
        }else{
            item_amount = this.isValidInput(el_input.val());
            
            
            if(!item_amount){
                this.Core.Gui.popup(1, 'Error', 'This is not a valid amount.', {});
                
                return;
            }
        }
        
        //add item
        if(type === 'offers'){
            //ensure they aren't going over max amount
            var offer_count = this.getOfferCount();
            
            if(offer_count < this.max_offers){
                if(!this.offers[item_type]){
                    this.offers[item_type] = {};
                }
                
                //check if item is being updated. set for highlighting if true.
                if(this.offers[item_type][item_name]){
                    this.changed_items.push(item_type +'-'+ item_name+'-offers');
                }

                this.offers[item_type][item_name] = item_amount;
            }else{
                this.Core.Gui.popup(1, 'Error', 'You cannot add anymore items to your offers.', {});
            }
        }else{
            //ensure they aren't going over max amount
            var request_count = this.getRequestCount();
            
            if(request_count < this.max_requests){
                if(!this.requests[item_type]){
                    this.requests[item_type] = {};
                }
                
                //check if item is being updated. set for highlighting if true.
                if(this.requests[item_type][item_name]){
                    this.changed_items.push(item_type +'-'+ item_name+'-requests');
                }

                this.requests[item_type][item_name] = item_amount;
            }else{
                this.Core.Gui.popup(1, 'Error', 'You cannot add anymore items to your requests.', {});
            }
        }
        
        this.updateListings();
    }
    
    trade.prototype.deleteItem = function(type, e){
        var item_data = $(e.target).closest('tr').attr('name').split('-');
        var item_type = item_data[0];
        var item_name = item_data[1];
        var display_name = this.Core.Game.getItemDisplayNameByType(item_name, item_type);
        
        var self = this;
        
        this.Core.Gui.popup(1, 'Confirm', 'Are you sure you wish to remove <b>'+ display_name +'</b> from '+ type +'?', {
            buttons : [
                ['Yes, proceed', function(){
                    var list = (type === 'offers') ? self.offers : self.requests;
                    
                    list[item_type][item_name] = 0;
                    delete list[item_type][item_name];
                    
                    self.updateListings();
                }],
                ['No']
            ]
        });
    }
    
    trade.prototype.itemSelected = function(e){
        var el = $(e.target);
        var type = el.attr('name');
        var item_data = el.val().split('-');
        var item_type = item_data[0];
        var item_name = item_data[1];
        
        //get appropriate item display name
        item_name = this.Core.Game.getItemDisplayNameByType(item_name, item_type);
        
        var target_el = $('div[name="interface-'+ this.id +'"] div[name="'+ type +'"] div[name="item"]');
        
        var html = '<div style="width:100%;background-color:black;border:1px solid grey;margin-top:7px;">';
            html += '<div style="width:100%;margin:6px;">';
                html += '<span style="font-size:13px;display:block;">Add '+ fn_htmlEnc(item_name) +' ('+ item_type +') to trade</span>';

                if(item_type !== 'blueprint'){
                    html += '<input name="add_amount" style="width:200px;margin-right:3px;" placeholder="amount to trade">';
                }

                html += '<button name="add_item" style="float:none;margin:0;height:23px;">Add</button>';
                html += '<span style="font-size:13px;display:block;margin-top:4px;">You have 100,00 of this item.</span>';
                html += '</div>';
            html += '</div>';
        
        target_el.html(html);
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    trade.prototype.formatItemsIntoOptions = function(items){
        var html = '';
        
        console.log(items)
        
        for(var resource in items.resources){
            var color = this.getItemTypeColor('resource');
            html += '<option value="resource-'+ resource +'" style="color:'+ color +';">Resource, '+ resource.toUpperCase() +'</option>';
        }
        
        for(var i = 0; i < items.blueprints.length; i++){
            var color = this.getItemTypeColor('blueprint');
            var name = this.Core.Game.getItemDisplayNameByType(items.blueprints[i], 'blueprint');
            html += '<option value="blueprint-'+ items.blueprints[i] +'" style="color:'+ color +';">Blueprint, '+ name +'</option>';
        }
        
        for(var vehicle in items.equipment.vehicles){
            var color = this.getItemTypeColor('vehicle');
            var name = this.Core.Game.getItemDisplayNameByType(vehicle, 'vehicle');
            html += '<option value="vehicle-'+ vehicle +'" style="color:'+ color +';">Vehicle, '+ name +'</option>';
        }
        
        for(var firearm in items.equipment.firearms){
            var color = this.getItemTypeColor('firearm');
            var name = this.Core.Game.getItemDisplayNameByType(firearm, 'firearm');
            html += '<option value="firearm-'+ firearm +'" style="'+ color +'">Firearm, '+ name +'</option>';
        }
        
        return html;
    }
    
    trade.prototype.submitTrade = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var offer_count = this.getOfferCount();
        var request_count = this.getRequestCount();
        
        if(offer_count <= this.max_offers && request_count <= this.max_requests){
            var city_items = this.getCityItemList(city.city_id);
            
            if(this.cityHasTradeItems(this.offers, true, city_items)){
                var data = {
                    sender_city_id : city.city_id,
                    sender_player_id : Player.id,
                    receiver_city_id : this.real_target_city_id,
                    receiver_player_id : this.real_target_player_id,
                    offer : this.offers,
                    request : this.requests
                };

                
                //is this a counter-offer?
                if(this.existing_trade && this.my_turn){
                    data.parent_trade = this.trade_id;
                }

                this.Core.Events.emit('GAME:SUBMIT_TRADE', data);

                //subtract costs
                Player.tradeSubOffer(city.city_id, this.offers);

                //update resource info immediately after purchase
                Player.updateResources(city.city_id);

                this.Core.InterfaceManager.unloadInterface(this.id);
            }else{
                this.Core.Gui.popup(1, 'Error', 'You do not have the required resources to submit this trade.', {});
            }
        }else{
            this.Core.Gui.popup(1, 'Error', 'You have exceeded the limit for requests or offers.', {});
        }
    }
   
    trade.prototype.acceptTrade = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        if(this.existing_trade && this.my_turn){
            var city_items = this.getCityItemList(city.city_id);
            
            if(1){
                this.Core.Events.emit('GAME:ACCEPT_TRADE', {
                    trade_id : this.trade_id
                });

                //remove & update resources
                Player.tradeSubOffer(city.city_id, this.offers);
                Player.updateResources(city.city_id);
                
                this.Core.InterfaceManager.unloadInterface(this.id);
            }else{
                this.Core.Gui.popup(1, 'Error', 'You do not have the required resources to accept this trade.', {});
            }
        }
    }
   
    trade.prototype.cancelTrade = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var data = {};
        
        if(this.my_turn){
            data = {
                trade_id : this.trade_id,
                sender_city_id : city.city_id,
                sender_player_id : Player.id,
                receiver_city_id : this.real_target_city_id,
                receiver_player_id : this.real_target_player_id
            };
        }else{
            data = {
                trade_id : this.trade_id,
                sender_city_id : city.city_id,
                sender_player_id : Player.id,
                receiver_city_id : this.real_target_city_id,
                receiver_player_id : this.real_target_player_id
            };
        }
        
        this.Core.Events.emit('GAME:CANCEL_TRADE', data);
        
        this.Core.InterfaceManager.unloadInterface(this.id);
    }
    
    trade.prototype.getCityItemList = function(city_id){
        var city = this.Core.Player.cities[city_id];
        var resources = city.resources;

        var items = {
            resources : {
                money   : resources.money,
                gold    : resources.gold,
                coal    : resources.coal,
                iron    : resources.iron,
                steel   : resources.steel,
                silver  : resources.silver,
                oil     : resources.oil,
                wood    : resources.wood,
                fuel    : resources.fuel,
                food    : resources.food
            },
            blueprints  : city.research.blueprints,
            equipment   : city.equipment
        };

        return items;
    }
    
    trade.prototype.getTradeableItems = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        //get latest resources
        Player.updateResources(city.city_id);
        
        var html = this.formatItemsIntoOptions(this.getCityItemList(city.city_id));
        
        return html;
    }
    
    trade.prototype.getTargetTradeableItems = function(){
        this.Core.Events.emit('GAME:GET_CITY_TRADEABLES', {
            city_id : this.real_target_city_id,
            player_id : this.real_target_player_id
        });
    }
    
    trade.prototype.targetTradeableItemsRetrieved = function(items){
        var html = this.formatItemsIntoOptions(items);
        
        $('div[name="interface-'+ this.id +'"] div[name="requests"] div[name="retrieving_items"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="requests"] select').html(html);
        $('div[name="interface-'+ this.id +'"] div[name="requests"] div[name="items_retrieved"]').show();
    }
    
    trade.prototype.cityHasTradeItems = function(item_list, check_amounts, city_items){
        for(var item_type in item_list){
            var items = item_list[item_type];

            //loop through each item in this item type.
            //e.g.: every firearm in the firearm type, ...
            for(var item in items){
                var offer_amount = parseInt(item_list[item_type][item]);
                var city_amount = 0;

                //exit upon invalid amount
                if(isNaN(offer_amount) || offer_amount < 0){
                    return false;
                }

                //get city amount based on type of item
                switch(item_type){
                    case 'resource':
                        city_amount = city_items.resources[item];
                        break;
                    case 'blueprint':
                        city_amount = (city_items.blueprints.indexOf(item) !== -1) ? 1 : 0;
                        break;
                    case 'firearm':
                        city_amount = city_items.equipment.firearms[item];
                        break;
                    case 'vehicle':
                        city_amount = city_items.equipment.vehicles[item];
                        break;
                }

                //ensure we have enough, if not, exit
                //else only checks for existance of item. so must have at least 1 in inventory.
                if(check_amounts && (city_amount < offer_amount)){
                    return false;
                }else if(city_amount <= 0){
                    return false;
                }
            }
        }

        return true;
    }
    
    trade.prototype.getOfferCount = function(){
        var i = 0;
        
        for(var type in this.offers){
            for(var item in this.offers[type]){
                i++;
            }
        }
        
        return i;
    }
    
    trade.prototype.getRequestCount = function(){
        var i = 0;
        
        for(var type in this.requests){
            for(var item in this.requests[type]){
                i++;
            }
        }
        
        return i;
    }
    
    trade.prototype.getItemTypeColor = function(type){
        switch(type){
            case 'blueprint':
                return 'lightblue';
            case 'firearm':
                return 'red';
            case 'vehicle':
                return 'orange';
            case 'resource':
                return 'yellow';
            default:
                return 'white';
        }
    }
    
    trade.prototype.isValidInput = function(input){
        var amount = parseInt(input);
        
        if(isNaN(input)){
            return false;
        }else if(input < 0){
            return false;
        }else{
            return amount;
        }
    }
    
    trade.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    trade.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    trade.prototype.unload = function(){
        //load event handlers
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"],div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="submit_trade"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="submit_counter_trade"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="accept_trade"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="cancel_trade"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('change', 'div[name="interface-'+ this.id +'"] select');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="offers"] button[name="add_item"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="requests"] button[name="add_item"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="offers"] tr');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="requests"] tr');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['trade'] = trade;
})();