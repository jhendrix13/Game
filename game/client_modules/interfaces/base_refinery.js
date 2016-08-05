/*
 *  CLIENT
 */

(function(){
    function base_refinery(Core){
        this.Core = Core;
        this.id = 'base_refinery';
        
        //if player cancels a queue, it will shift the index of
        //the production_queue array elements. so we need to
        //keep track of this.
        this.queue_indexes = {
            
        };
        
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    base_refinery.prototype.load = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var resource = this.Core.Resources.base.buildings['refinery'];
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:550px;">';
            html += '<div class="title">'+ resource.name.toUpperCase() +'</div>';
            html += '<div style="margin:10px;">'; 
            html += '<div class="description"><div style="margin:10px;">'+ resource.description +'</div></div>';
            
            html += '<div name="tab_selection" class="tabs">';
            html += '<div name="tab-production" class="tab">Production</div>';
            html += '<div name="tab-methods" class="tab">Refining Methods</div>';
            html += '</div>';

            html += '<div name="content-production">';
            //current refining queues the city is running
            var queues = city.production_queues.refining;
            
            if(queues.length > 0){
                for(var i = 0; i < queues.length; i++){
                    var queue = queues[i];
                    var item = queue.item_name;
                    var queue_info = Player.getQueueInfo(queue);

                    html += '<div name="production-'+ i +'" style="width:100%;border:1px solid black;margin-bottom:10px;background-color:#212121;">';
                    html += '<div style="width:100%;background-color:black;color:white;text-align:center;margin-bottom:5px;"><div style="margin:0px;">'+ queue.item_name +'</div></div>';
                    html += '<div style="float:left;margin-left:8px;margin-right:12px;"><img src="game/resources/images/thumbnails/random.png"></div>';
                    html += '<div style="float:left;width:300px;">';
                    html += 'Produced: '+ fn_numberFormat(queue_info.totalProduced) +'/'+ fn_numberFormat(queue_info.productionAmount) + '<br/>';
                    html += 'Remaining: '+ fn_timeLeft(queue_info.timeLeft);
                    html += '</div>';
                    html += '<div style="float:right;margin-right:15px;"><button name="cancel-'+ i +'" style="height:30px;">Cancel Production</button></div>';
                    html += '<div class="clear" style="margin-bottom:6px;"></div>'
                    html += '</div>';

                    this.queue_indexes[i] = i;
                }
            }else{
                html += 'This refinery is currently not producing anything.';
            }
            
            html += '<div class="clear"></div>';
            html += '<button name="ok">Ok</button>';
            html += '</div>'; 

            html += '<div name="content-methods" class="hidden">';
            var methods = this.Core.Game.gameCfg.refining_methods;
            for(var method in methods){
                html += '<div name="method-'+ method +'" style="float:left;background-color:black;color:white;border:1px solid yellow;cursor:pointer;margin-right:10px;">';
                html += '<div style="font-size:21px;margin:10px;">'+ method.toUpperCase() +'</div>';
                html += '</div>';
            }
            html += '<div class="clear"></div>';
            html += '<button name="ok">Ok</button>';
            html += '</div>';

            html += '<div name="content-methodinfo"></div>';
            html += '</div></div>';
            
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="method"]', this.showMethod.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('keyup', 'div[name="interface-'+ this.id +'"] input[name|="refine_amount"]', this.updateRequiredResources.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="refine"]', this.refine.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="cancel"]', this.cancelProduction.bind(this));
    }
    
    base_refinery.prototype.showMethod = function(e){
        var Player = this.Core.Player;
        var method = $(e.target).closest('div[name|="method"]').attr('name').split('-')[1];
        var obj = this.Core.Game.gameCfg.refining_methods[method];
        
        var html = '<table cellpadding="7" style="color:yellow;">';
            html += '<tr><td>Amount to Produce</td><td><input name="refine_amount-'+ method +'" type="text" value="1" style="width:60px;"></td></tr>';
            html += '<tr><td>Production Per Minute</td><td>'+ fn_numberFormat(obj.ppm) +'</td></tr>';
            
            var required_research = obj.research_required;
            if(obj.research_required){
                html += '<tr><td>Required Research</td><td>';
                
                for(var i = 0; i < required_research.length; i++){
                    var research = this.Core.Game.gameCfg.research_projects[required_research[i]];
                    var name = research.name;
                    
                    if(Player.hasBlueprints(research)){
                        html += name +'<br/>';
                    }else{
                        html += '<span style="color:red;">'+ name +'</span><br/>';
                    }
                }
                
                html += '</td></tr>';
            }
            
            html += '<tr><td>Resources Required</td><td name="required_resources">'+ this.getMethodRequiredHTML(method, 1) +'</td></tr>';
            html += '</table>';
        
        html += '<button name="ok">Cancel</button><button name="back-methods">Back</button><button name="refine-'+ method +'">Start Refining</button>';
        
        $('div[name="interface-'+ this.id +'"] div[name="content-methodinfo"]').html(html);
        this.showTab(null, 'methodinfo');
    }
    
    base_refinery.prototype.updateRequiredResources = function(e){
        var input = $(e.target);
        var method = input.attr('name').split('-')[1];
        var val = parseInt(input.val());
        
        //sanitize
        if(isNaN(val)){
            val = 0;
        }else if(val < 0){
            val = 0;
        }
        
        //update
        $('div[name="interface-'+ this.id +'"] td[name="required_resources"]').html(this.getMethodRequiredHTML(method, val));
    }
    
    base_refinery.prototype.getMethodRequiredHTML = function(method, amount){
        var obj = this.Core.Game.gameCfg.refining_methods[method];
        
        var required_resources_html = '';
        
        for(var resource in obj.input_resources){
            var required = obj.input_resources[resource] * amount;
            
            if(resource === 'money'){
                required_resources_html += '$ '+ fn_numberFormat(required) +'<br/>';
            }else{
                required_resources_html += 'x'+ fn_numberFormat(required) +' '+ resource.toUpperCase() +'<br/>';
            }
            
        }
        
        return required_resources_html;
    }
    
    base_refinery.prototype.refine = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var method = $(e.target).attr('name').split('-')[1];
        var amount = parseInt($('div[name="interface-'+ this.id +'"] input[name|="refine_amount"]').val());
        var obj = this.Core.Game.gameCfg.refining_methods[method];
        
        var cost = {};
        for(var resource in obj.input_resources){
            cost[resource] = obj.input_resources[resource] * amount;
        }
        
        if(amount > 0){
            if(Player.canAfford(city.resources, cost)){
                if(Player.hasBlueprints(obj.research_required)){
                    if(!Player.isQueueFull(city.city_id, 'refining')){
                        //unload interface
                        this.Core.InterfaceManager.unloadInterface(this.id);

                        //tell the serber
                        this.Core.Events.emit('GAME:START_REFINING', {
                            city_id : city.city_id,
                            method : method,
                            amount : amount
                        });

                        //subtract costs & update
                        Player.subCost(city.city_id, cost);
                        Player.updateResources(city.city_id);

                        //add to production queue
                        Player.addQueue(city.city_id, 'refining', method, amount, obj.ppm);

                        this.Core.Gui.popup(0, 'Refining', 'The city has begun refining resources into <span style="font-weight:bold;color:white;">'+ method+'</span>.');
                   }else{
                       this.Core.Gui.popup(0, 'Error', 'You have reached the maximum amount of queues. Please let your previous refinery processes finish before starting more.');
                   }
                }else{
                    this.Core.Gui.popup(0, 'Error', 'You do not have the blueprints necessary to start refining this.');
                }
            }else{
                this.Core.Gui.popup(0, 'Error', 'You do not have the resources to start refining this.');
            }
        }else{
            this.Core.Gui.popup(0, 'Error', 'The amount you wish to refine must be a positive value.');
        }
    }
    
    base_refinery.prototype.cancelProduction = function(e){
        this.Core.Gui.popup(0, 'Confirm', 'Are you sure you wish to cancel the refining of this resource?', {
            buttons : [
                ['Yes, proceed', function(){
                    var Player = this.Core.Player;
                    var city = Player.cities[Player.current_city];

                    //the id that is in the name of the div clicked.
                    //MIGHT not be the actual id of element in array
                    var div_id = parseInt($(e.target).attr('name').split('-')[1]);

                    var type = 'refining';
                    var queue_id = this.queue_indexes[div_id];

                    this.Core.Events.emit('GAME:CANCEL_QUEUE', {
                        city_id : city.city_id,
                        type : type,
                        queue_id : queue_id
                    });

                    //ensure we update queue to latest
                    Player.updateResources(city.city_id);

                    //cancel the queue
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
                        $('div[name="interface-'+ this.id +'"] div[name="content-production"]').html('This refinery is currently not producing anything.<br/><button name="ok">Ok</button>');
                    }

                    this.Core.Gui.popup(0, 'Production Canceled', 'You have successfully canceled production of this item.');
                }.bind(this)],
                ['No']
            ]
        });
    }
    
    base_refinery.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    base_refinery.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    base_refinery.prototype.unload = function(){
        //load event handlers
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="method"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('keyup', 'div[name="interface-'+ this.id +'"] input[name|="refine_amount"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="refine"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="cancel"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['base_refinery'] = base_refinery;
})();