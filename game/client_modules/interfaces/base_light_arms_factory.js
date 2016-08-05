/*
 *  CLIENT
 */

(function(){
    function base_light_arms_factory(Core){
        this.Core = Core;
        this.id = 'base_light_arms_factory';
        
        //if player cancels a queue, it will shift the index of
        //the production_queue array elements. so we need to
        //keep track of this.
        this.queue_indexes = {
            
        };
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    base_light_arms_factory.prototype.load = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var resource = this.Core.Resources.base.buildings['light_arms_factory'];
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:550px;">';
            html += '<div class="title">'+ resource.name.toUpperCase() +'</div>';
            html += '<div style="margin:10px;">'; 
            html += '<div class="description"><div style="margin:10px;">'+ resource.description +'</div></div>';
            
            html += '<div name="tab_selection" class="tabs">';
            html += '<div name="tab-production" class="tab">Production</div>';
            html += '<div name="tab-weapons" class="tab">Weapons</div><div name="tab-vehicles" class="tab">Vehicles</div>';
            html += '</div>';
            
            html += '<div name="content-production">';
            
            var queues = city.production_queues['arms_order'];
            var producing = false;
            
            if(queues.length > 0){
                for(var i = 0; i < queues.length; i++){
                    //is this a heavy arms queue?
                    var queue = queues[i];
                    var item = queue.item_name;
                    var obj = this.Core.Game.getMilitaryItemObj(item);

                    if(obj.classification === 'light'){
                        if(!producing){
                            producing = true;
                        }
                        
                        var queue_info = Player.getQueueInfo(queue);

                        html += '<div name="production-'+ i +'" style="width:100%;border:1px solid black;margin-bottom:10px;background-color:#212121;">';
                        html += '<div style="width:100%;background-color:black;color:white;text-align:center;margin-bottom:5px;"><div style="margin:0px;">'+ obj.name +'</div></div>';
                        html += '<div style="float:left;margin-left:8px;margin-right:12px;"><img src="'+ obj.thumbnail_src +'"></div>';
                        html += '<div style="float:left;width:300px;">';
                        html += 'Produced: '+ fn_numberFormat(queue_info.totalProduced) +'/'+ fn_numberFormat(queue_info.productionAmount) + '<br/>';
                        html += 'Remaining: '+ fn_timeLeft(queue_info.timeLeft);
                        html += '</div>';
                        html += '<div style="float:right;margin-right:15px;"><button name="cancel-'+ i +'" style="height:30px;">Cancel Production</button></div>';
                        html += '<div class="clear" style="margin-bottom:6px;"></div>'
                        html += '</div>';
                        
                        this.queue_indexes[i] = i;
                    }
                }
            }
            
            if(!producing){
                html += 'This factory is currently not producing anything.';
            }
            
            html += '<div class="clear"><button name="ok">Ok</button></div>';
            html += '</div>';
            
            html += '<div name="content-weapons" class="hidden">';
            var weapons = this.Core.Game.gameCfg.military_weapons;
            
            for(var weapon in weapons){
                var obj = weapons[weapon];
                
                if(obj.classification === 'light'){
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
            }
            html += '<div class="clear"><button name="ok">Ok</button></div>';
            html += '</div>';
            
            html += '<div name="content-vehicles" class="hidden">';
            var vehicles = this.Core.Game.gameCfg.military_vehicles;
            
            for(var vehicle in vehicles){
                var obj = vehicles[vehicle];
                
                if(obj.classification === 'light'){
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
            }
            html += '<div class="clear"><button name="ok">Ok</button></div>';
            html += '</div>';
            
            html += '<div name="content-item"></div>';
            html += '</div></div>';
        
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface('base_light_arms_factory');
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] img[name|="item"]', this.showItem.bind(this));
        $(document).on('keyup', 'div[name="interface-'+ this.id +'"] input[name|="order_amount"]', this.updateCost.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="order_item"]', this.purchaseItem.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="cancel"]', this.cancelProduction.bind(this));
    }
    
    base_light_arms_factory.prototype.showItem = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var info = $(e.target).attr('name').split('-')[1].split('/');
        var name = info[1];
        var category = info[0];
        
        //weapon or vehicle?
        var item = this.Core.Game.getMilitaryItemObj(name);
        
        var html = '<div style="float:left;width:28%;border-right:1px dashed grey;">';
            html += '<img src="'+ item.thumbnail_large_src +'" style="width:128px;height:128px;">';
            html += '<table cellpadding="6" style="color:white;">';
            html += '<tr style="font-size:18px;color:yellow;"><td colspan="2">'+ item.name +'</td></tr>';
            html += '<tr><td>Attack</td><td>&nbsp;'+ fn_numberFormat(item.attack) +'</td></tr>';
            
            if(typeof item.defense !== 'undefined'){
                html += '<tr><td>Defense</td><td>&nbsp;'+ fn_numberFormat(item.defense) +'</td></tr>';
            }
            
            if(typeof item.range !== 'undefined'){
                html += '<tr><td>Range</td><td>&nbsp;'+ fn_numberFormat(item.range) +'</td></tr>';
            }
            
            if(typeof item.speed !== 'undefined'){
                html += '<tr><td>Speed</td><td>&nbsp;'+ fn_numberFormat(item.speed) +'</td></tr>';
            }
            
            if(typeof item.capacity !== 'undefined'){
                html += '<tr><td>Capacity</td><td>&nbsp;'+ fn_numberFormat(item.capacity) +'</td></tr>';
            }
            
            html += '<tr><td>PPM</td><td>&nbsp;'+ fn_numberFormat(item.ppm) +'</td></tr>';
            html += '</table>';
            html += '</div>';
            html += '<div style="float:right;width:69%">';
            html += '<div class="description" style="width:100%;border:1px dashed grey;border-color:grey;"><div style="margin:6px;text-align:justify;">'+ item.description +'</div></div>';
            html += '<table cellpadding="6" style="color:white;">';
            html += '<tr><td style="color:yellow;font-weight:bold;">Cost</td><td>';
            
            //costs
            for(var resource in item.cost){
                var amount = item.cost[resource];
                
                if(resource === 'money'){
                    html += '$ '+ fn_numberFormat(amount) +'<br/>';
                }else{
                    html += fn_numberFormat(amount) +' '+ resource.toUpperCase() +'<br/>';
                }
            }
            
            html += '</td></tr>';
            
            var research_required = item.research_required;
            if(research_required.length > 0){
                html += '<tr><td style="color:yellow;font-weight:bold;">Blueprints</td><td>';
            
                //income
                for(var i = 0; i < research_required.length; i++){
                    var obj = this.Core.Game.gameCfg.research_projects[research_required[i]];
                    html += obj.name+'<br/>';
                }

                html += '</td></tr>';
            }
            
            html += '</table>';
            html += '</div>';
            html += '<div class="clear"></div>';
            html += '<div style="width:100%;border-top:1px dashed grey;color:white;">';
            html += '<div style="margin:6px;">';
            
            var numInventory = Player.numInInventory(city.city_id, name);
            
            html += fn_htmlEnc(city.city_name) +' has <b>'+ fn_numberFormat(numInventory) + '</b> '+ item.name +' items in inventory.<br/><br/>';
            html += 'Order <input type="text" name="order_amount-'+ category +'/'+ name +'" placeholder="amount of" style="width:70px;"> new items.';
            html += '<div name="purchase_costs"></div>';
            html += '</div></div>';
            html += '<button name="back-'+ category +'">Back</button>';
            html += '<button name="order_item-'+ category +'/'+ name +'">Place Order</button>';
        
        $('div[name="interface-'+ this.id +'"] div[name="content-item"]').html(html);
        this.showTab(null, 'item');
    }
    
    base_light_arms_factory.prototype.updateCost = function(e){
        var object = $(e.target);
        var order_amount = object.val();
        
        var info = object.attr('name').split('-')[1].split('/');
        var name = info[1];
        var category = info[0];
        
        var div = $('div[name="interface-'+ this.id +'"] div[name="purchase_costs"]');
        
        if(order_amount.length > 0){
            order_amount = parseInt(order_amount);
            
            //weapon or vehicle?
            var obj = this.Core.Game.getMilitaryItemObj(name);
        
            var html = '<table cellpadding="6" style="color:white;">';
                html += '<tr><td style="color:yellow;font-weight:bold;">Purchase Cost</td><td>';

                //costs
                for(var resource in obj.cost){
                    var amount = obj.cost[resource] * order_amount;

                    if(resource === 'money'){
                        html += '$ '+ fn_numberFormat(amount) +'<br/>';
                    }else{
                        html += fn_numberFormat(amount) +' '+ resource.toUpperCase() +'<br/>';
                    }
                }

                html += '</td></tr>';

            div.html(html);
            div.show(0);
        }else{
            div.hide(0);
        }
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    base_light_arms_factory.prototype.purchaseItem = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        //get # wanting to purchase from input
        var amount = parseInt($('div[name="interface-'+ this.id +'"] input[name|="order_amount"]').val());
        
        if(amount > 0){
            var info = $(e.target).attr('name').split('-')[1].split('/');
            var name = info[1];
            var category = info[0];
        
            //weapon or vehicle?
            var item = this.Core.Game.getMilitaryItemObj(name);
            
            var cost = {};
            
            //costs
            for(var resource in item.cost){
                if(typeof cost[resource] === 'undefined'){
                    cost[resource] = 0;
                }
                
                cost[resource] += item.cost[resource] * amount;
            }
            
            //can they afford?
            
            if(Player.canAfford(city.resources, cost)){
                if(Player.hasBlueprints(item.research_required)){
                    if(!Player.isQueueFull(city.city_id, 'arms_order')){
                         //unload interface
                        this.Core.InterfaceManager.unloadInterface(this.id);

                        this.Core.Events.emit('GAME:PURCHASE_ARMS', {
                            item : name,
                            category : category,
                            amount : amount
                        });

                        //subtract costs & update
                        Player.subCost(city.city_id, cost);
                        Player.updateResources(city.city_id);

                        //add queue
                        Player.addQueue(city.city_id, 'arms_order', name, amount, item.ppm);

                        this.Core.Gui.popup(0, 'Order Placed', 'Your order has been placed.');
                    }else{
                        this.Core.Gui.popup(0, 'Error', 'You have reached the maximum amount of queues. Please let your previous arms order(s) finish production before ordering more.');
                    }
                }else{
                    this.Core.Gui.popup(0, 'Error', 'You do not have the blueprints necessary to place this order.');
                }
            }else{
                this.Core.Gui.popup(0, 'Error', 'You do not have the resources to complete this order.');
            }
        }
    }
    
    base_light_arms_factory.prototype.cancelProduction = function(e){
        this.Core.Gui.popup(0, 'Confirm', 'Are you sure you wish to cancel production?', {
            buttons : [
                ['Yes, proceed', function(){
                    var Player = this.Core.Player;
                    var city = Player.cities[Player.current_city];

                    //the id that is in the name of the div clicked.
                    //MIGHT not be the actual id of element in array
                    var div_id = parseInt($(e.target).attr('name').split('-')[1]);

                    var type = 'arms_order';
                    var queue_id = this.queue_indexes[div_id];

                    this.Core.Events.emit('GAME:CANCEL_QUEUE', {
                        city_id : city.city_id,
                        type : type,
                        queue_id : queue_id
                    });

                    //ensure we update queue to latest
                    Player.updateResources(city.city_id);

                    //remove/cancel the queue
                    Player.cancelQueue({
                        queue_id : queue_id,
                        type : type
                    });

                    //shift indexes
                    for(var index in this.queue_indexes){
                        var value = this.queue_indexes[index];

                        //we don't care about any indexes below the
                        //spliced/removed element
                        if(value > queue_id){
                            this.queue_indexes[index] -= 1;
                        }
                    }

                    //remove queue info div
                    $('div[name="interface-'+ this.id +'"] div[name="content-production"] div[name="production-'+ div_id +'"]').remove();
                    
                    if($('div[name="interface-'+ this.id +'"] div[name="content-production"] div[name|="production"]').length === 0){
                        $('div[name="interface-'+ this.id +'"] div[name="content-production"]').html('This factory is currently not producing anything.<br/><button name="ok">Ok</button>');
                    }

                    this.Core.Gui.popup(0, 'Production Canceled', 'You have successfully canceled production of this item.');
                }.bind(this)],
                ['No']
            ]
        });
    }
    
    base_light_arms_factory.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    base_light_arms_factory.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    base_light_arms_factory.prototype.unload = function(){
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] img[name|="item"]');
        $(document).off('keyup', 'div[name="interface-'+ this.id +'"] input[name|="order_amount"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="order_item"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="cancel"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['base_light_arms_factory'] = base_light_arms_factory;
})();

