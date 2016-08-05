/*
 *  CLIENT
 */

(function(){
    function base_recruitmentoffice(Core){
        this.Core = Core;
        this.id = 'base_recruitmentoffice';
        
        this.ui_currTab = false;
        this.ui_tabPath = []; // e.g.: buildings -> building category -> building info
        
        //interface options
        this.unload_on_screen_switch = true;
    }
    
    base_recruitmentoffice.prototype.load = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var resource = this.Core.Resources.base.buildings['recruitment_office'];
        
        //vars
        var totalPop = city.population;
        var militaryPop = city.population_military;
        var percentMilitary = Math.floor(militaryPop/totalPop * 100);

        var soldierCost = this.Core.Game.gameCfg.soldier_upkeep;
        var gdp = city.daily_gdp;

        var upkeep = militaryPop * soldierCost;
        var gdpPercent = Math.round(upkeep/gdp * 100);
        
        var freeSoldiers = Player.numFreeSoldiers(city.city_id);
        var assignedSoldiers = militaryPop - freeSoldiers;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="max-width:550px;">';
            html += '<div class="title">'+ resource.name.toUpperCase() +'</div>';
            html += '<div style="margin:10px;">'; 
            html += '<div class="description"><div style="margin:10px;">'+ resource.description +'</div></div>';
            
            html += '<div name="tab_selection" class="tabs">';
            html += '<div name="tab-soldiers" class="tab">Soldiers</div><div name="tab-commanders" class="tab">Commanders</div>';
            html += '</div>';
            
            /* RECRUITS */
            
            html += '<div name="content-soldiers">';
            
            //do they already have an active recruitment queue?
            if(Player.isQueueFull(city.city_id, 'recruitment')){
                var queue = city.production_queues['recruitment'][0];
                var info = Player.getQueueInfo(queue);
                var type = (queue.deduction) ? 'Discharging' : 'Recruitment';
                
                html += '<div name="queues" style="margin-bottom:10px;">';
                html += '<div class="description" style="border:1px dashed grey;"><div style="margin:8px;">You currently have an active recruitment queue.</div></div>';
                html += '<div style="float:left;margin-right:15px;">';
                html += '<div style="margin-bottom:8px;">'+ type +' of <b>'+ fn_numberFormat(info.productionAmount) +'</b> soldiers.</div>';
                html += '<div>Time left: '+ fn_timeLeft(info.timeLeft) +'</div>';
                html += '</div>';
                html += '<div style="float:left;">';
                html += '<button name="cancel_queue" style="height:25px;">Cancel</button>';
                html += '</div>';
                html += '<div class="clear"></div>'
                html += '<hr>';
                html += '</div>';
            }
            
            html += '<table cellpadding="6" style="color:yellow;">';
            html += '<tr><td>Total population</td><td name="total_pop">'+ fn_numberFormat(totalPop) +'</td></tr>';
            html += '<tr><td>Military population</td><td name="military_pop">'+ fn_numberFormat(militaryPop) +' ('+ percentMilitary +'%)</td></tr>';
            html += '<tr><td>Assigned Soldiers</td><td>'+ fn_numberFormat(militaryPop - freeSoldiers) +'</td></tr>';
            html += '<tr><td>Daily Upkeep</td><td name="upkeep">$ '+ fn_numberFormat(upkeep) +' &nbsp;&nbsp;('+ gdpPercent +'% of GDP)</td></tr>';
            html += '<tr><td>Recruit(s) <span name="recruitValue">0</span></td><td><div name="slider" class="ui-slider-handle"></div></td><td><input type="text" name="recruitValue" value="0" size="10"></td></tr>';
            html += '</table>';
            html += '<button name="cancel">Cancel</button> <button name="submit">Issue Recruitment</button>';
            html += '</div>';
            
            /* COMMANDERS */
            
            //time until next commander refresh in minutes
            var d = Date.now() - this.Core.serverTimeDifference;
            
            var timePassed = (d - city.lastCommanderGeneration) / 1000 / 60;
            var timeUntilRefresh = Math.ceil(this.Core.Game.gameCfg.commander_refresh_interval - timePassed);
                timeUntilRefresh = (timeUntilRefresh <= 0) ? 'NOW' : timeUntilRefresh + ' minute(s)';
            
            html += '<div name="content-commanders" class="hidden">';
            html += '<div class="description" style="text-align:center;"><p>Time until next refresh: <span name="timeUntilRefresh">'+ timeUntilRefresh + '</span></p></div>';
            html += '<div name="commander_listings"></div>';
            html += '<button name="cancel">Cancel</button> <button name="refresh">Refresh</button>';
            html += '</div>';
            html += '<div name="clear"></div></div></div>';
        
        //add to document
        $('body').append(html);
        
        //load commanders
        this.loadCommanders();
        
        //events
        $('div[name="slider"]').slider({
            range : 'max',
            min : assignedSoldiers,
            max : totalPop,
            value : militaryPop,
            slide : function(e, slider){
                var recruits = slider.value - militaryPop;
                var newMilitaryPop = recruits + militaryPop;
                var percentMilitary = Math.floor(newMilitaryPop/totalPop * 100);
                var upkeep = newMilitaryPop * soldierCost;
                var gdpPercent = Math.round(upkeep/gdp * 100);
                
                $('div[name="interface-'+ this.id +'"] input[name="recruitValue"]').val(recruits);
                $('div[name="interface-'+ this.id +'"] span[name="recruitValue"]').html(fn_numberFormat(recruits));
                $('div[name="interface-'+ this.id +'"] td[name="military_pop"]').html(fn_numberFormat(newMilitaryPop) + ' ('+ percentMilitary +'%)');
                $('div[name="interface-'+ this.id +'"] td[name="upkeep"]').html('$ '+ fn_numberFormat(upkeep) +' &nbsp;&nbsp;('+ gdpPercent +'% of GDP)');
            }.bind(this)
        });
        $('div[name="interface-'+ this.id +'"] input[name="recruitValue"]').on('change', function(e){
            var input = $(e.target);
            var recruits = parseInt(input.val());
            
            //if recrutis is defined
            if(recruits){
                if(recruits > totalPop){
                    recruits = totalPop;
                    input.val(recruits);
                }else if(recruits + militaryPop <= assignedSoldiers){
                    recruits = -freeSoldiers;
                    input.val(recruits);
                }

                var newMilitaryPop = recruits + militaryPop;
                var percentMilitary = Math.floor(newMilitaryPop/totalPop * 100);
                var upkeep = newMilitaryPop * soldierCost;
                var gdpPercent = Math.round(upkeep/gdp * 100);

                $('div[name="interface-'+ this.id +'"] div[name="slider"]').slider('value', recruits + militaryPop);
                $('div[name="interface-'+ this.id +'"] span[name="recruitValue"]').html(fn_numberFormat(recruits));
                $('div[name="interface-'+ this.id +'"] td[name="military_pop"]').html(fn_numberFormat(newMilitaryPop) + ' ('+ percentMilitary +'%)');
                $('div[name="interface-'+ this.id +'"] td[name="upkeep"]').html('$ '+ fn_numberFormat(upkeep) +' &nbsp;&nbsp;('+ gdpPercent +'% of GDP)');
            }
                
        }.bind(this));
        
        //buttons
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="cancel"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="submit"]', this.recruit.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="refresh"]', this.refresh.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="commander_listings"] div[name|="commander"]', this.commanderChosen.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="cancel_queue"]', this.cancelRecruitment.bind(this));
    }
    
    base_recruitmentoffice.prototype.recruit = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var recruits = parseInt($('div[name="interface-'+ this.id +'"] input[name="recruitValue"]').val());
        
        if(!Player.isQueueFull(city.city_id, 'recruitment')){
            //notify server
            this.Core.Events.emit('GAME:RECRUIT_MILITARY', {
                city_id : city.city_id,
                soldiers : recruits
            });

            //unload interface
            this.Core.InterfaceManager.unloadInterface(this.id);

            var title;
            var content;

            if(recruits > 0){
                title = 'Recruited';
                content = 'The city has begun recruiting '+ fn_numberFormat(recruits) +' soldiers.';
            }else{
                title = 'Discharged';
                content = 'The city has begun honorably discharging '+ fn_numberFormat(recruits) +' soldiers.';
            }

            //add to production queue
            Player.addQueue(city.city_id, 'recruitment', 'soldiers', recruits, this.Core.Game.gameCfg.soldier_ppm);

            this.Core.Gui.popup(0, title, content);
        }else{
            this.Core.Gui.popup(0, 'Error', 'The recruitment office already has an active recruitment order processing.');
        }
    }
    
    base_recruitmentoffice.prototype.commanderChosen = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var numCommanders = this.Core.Player.getNumCommanders(Player.current_city);
        var maxCommanders = this.Core.Game.gameCfg.commander_max;
        
        if(numCommanders < maxCommanders){
            var div = $(e.target).closest('div[name|="commander"]');
            
            var tempCommanderID = div.attr('name').split('-')[1];

            //remove commander from temp generals
            city.temp_commanders[tempCommanderID] = null;
            delete city.temp_commanders[tempCommanderID];

            //request commander
            this.Core.Events.emit('GAME:COMMANDER_RECRUIT', {
                city_id : city.city_id,
                tempCommanderID : tempCommanderID
            });
            
            //remove commander div
            div.remove();
            
            this.Core.Gui.popup(0, 'Error', 'You have successfully recruited this commander.');

            //recenter interface
            this.Core.InterfaceManager.centerInterface(this.id);
        }else{
            this.Core.Gui.popup(0, 'Error', 'Your city already has the max amount of commanders!');
        }
    }
    
    base_recruitmentoffice.prototype.loadCommanders = function(){
        var Player = this.Core.Player;
        var commanders = Player.cities[Player.current_city].temp_commanders;
        
        var div = $('div[name="commander_listings"]');
        var html = '';
        
        for(var commander in commanders){
            var data = commanders[commander];
            var rank = this.Core.Game.gameCfg.commander_ranks[data.rank];
            var divclass = (rank.rare) ? 'rare' : 'normal';

            html += '<div name="commander-'+ commander +'" class="rank_'+ divclass +'">';
            html += '<div style="float:left;margin-right:6px;"><img src="game/resources/images/other/rank_'+ data.rank +'.gif"></div>';
            html += '<div style="float:left;">';
            html += '<div style="font-size:18px;">'+ data.name +'</div>';
            html += '<div style="font-size:15px;">'+ rank.rank +'</div>';
            html += '<table>';
            html += '<tr><td>Troop Capacity</td><td>'+ fn_numberFormat(data.capacity) +'</td></tr>';
            html += '</table>'; 
            html += '</div><div class="clear"></div></div>';
        }
        
        //clear div contents
        div.html('');
        div.append(html);
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    base_recruitmentoffice.prototype.refresh = function(){
        //time until next commander refresh in minutes
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var d = Date.now() - this.Core.serverTimeDifference;

        var interval = this.Core.Game.gameCfg.commander_refresh_interval;
        var timePassed = (d - city.lastCommanderGeneration) / 1000 / 60;
        
        if(timePassed > interval){
            $('div[name="commander_listings"]').html('Loading ...');
            $('span[name="timeUntilRefresh"]').html(interval +' minute(s)');
            
            //request new generated generals from the server
            this.Core.Events.emit('GAME:COMMANDERS_REFRESH', city.city_id);
            
            city.lastCommanderGeneration = d;
        }
    }
    
    base_recruitmentoffice.prototype.cancelRecruitment = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var type = 'recruitment';
        var queue_id = 0;
        
        this.Core.Events.emit('GAME:CANCEL_QUEUE', {
            city_id : city.city_id,
            type : type,
            queue_id : queue_id
        });
        
        //ensure we update queue to latest
        Player.updateResources(city.city_id);
        
        //remove queue now
        city.production_queues[type].splice(queue_id, 1);
        
        //remove queue info div
        $('div[name="interface-'+ this.id +'"] div[name="queues"]').remove();
        
        this.Core.Gui.popup(0, 'Queue Canceled', 'You have successfully canceled this queue.');
    }
    
    base_recruitmentoffice.prototype.showTab = function(e){
        var tab = $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    base_recruitmentoffice.prototype.unload = function(){
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="cancel"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="submit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="refresh"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="commander_listings"] div[name|="commander"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="cancel_queue"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['base_recruitmentoffice'] = base_recruitmentoffice;
})();