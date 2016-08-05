/*
 *  CLIENT
 */

(function(){
    function war_myWars(Core){
        this.Core = Core;
        this.id = 'war_myWars';
        
        //current page
        this.page = 1;
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    war_myWars.prototype.load = function(){
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:700px;">';
            html += '<div class="title">My Wars</b></div>';
            html += '<div style="margin:10px;">';
            html += '<div name="content-loading">Loading information ... <div style="margin-right:6px;"><button name="ok">Ok</button></div></div>';
            html += '<div name="content-main" class="hidden">';
            
            html += '<div name="wars"></div>';
            html += '<div name="pagination" class="hidden" style="margin-top:30px;"></div>';
            html += '<div style="margin-top:30px;font-size:12px;color:grey;">* this page is cached, updated every minute</div>';
            html += '<div style="margin-right:6px;"><button name="ok">Ok</button></div>';
            
            html += '</div>';
            html += '<div name="content-battles" class="hidden"></div>';
            html += '<div name="content-battle" class="hidden"></div>';
            html += '</div></div>';
            
        $('body').append(html);
        
        this.loadHistory(this.page)
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] li[name|="page"]', this.pageButtonPressed.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] a[name|="battles"]', this.showBattles.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] a[name|="battle"]', this.showBattle.bind(this));
    }
    
    war_myWars.prototype.historyLoaded = function(data, unique){
        if(unique){
           this.page = data.page;
           this.Core.Player.warHistoryCache = data; 
        }
        
        var wars = data.wars;
        var numWars = wars.length;
        
        var html = '';
        
        if(numWars > 0){
                html += '<table cellpadding="8">';
                html += '<tr><th>Enemy</th><th>Nation</th><th>Start</th><th>End</th></tr>';

            for(var i = 0; i < numWars; i++){
                var war = wars[i];

                html += '<tr style="color:orange;">' +
                        '<td>'+ war.username +'</td>' +
                        '<td>'+ war.nation +'</td>' +
                        '<td>'+ war.start +'</td>' +
                        '<td>'+ ((war.end) ? war.end : '<span style="color:red;font-weight:bold;">AT WAR</span>') +'</td>' +
                        '<td><a href="#" name="battles-'+ war.warID +'">View Battles</a></td>' +
                        '</tr>';
            }

            html += '</table>';
            
            var divPagination = $('div[name="interface-'+ this.id +'"] div[name="content-main"] div[name="pagination"]');
            
            divPagination.html(this.getPaginationHTML(data.page, data.pages));
            divPagination.show();
        }else{
            html += 'You have no wars on record to display.';
        }
        
        $('div[name="interface-'+ this.id +'"] div[name="content-main"] div[name="wars"]').html(html);
        
        this.showTab(null, 'main');
    }
    
    war_myWars.prototype.showBattles = function(e){
        var warID = parseInt($(e.target).attr('name').split('-')[1]);
        
        var html = '';
        
        var war = this.Core.Player.getWarHistoryByID(warID);
        
        if(war){
            var numBattles = war.battles.length;
            if(war.battles.length > 0){
                html += '<table cellpadding="8">';
                html += '<tr><th>Enemy</th><th>Nation</th><th>Target</th><th>Attack Time</th></tr>';

                for(var i = 0; i < numBattles; i++){
                    var battle = war.battles[i];

                    html += '<tr>' +
                            '<td>'+ war.username +'</td>' +
                            '<td>'+ war.nation +'</td>' +
                            '<td>'+ battle.target +'</td>' +
                            '<td>'+ battle.attackTime +'</td>' +
                            '<td><a href="#" name="battle-'+ warID +'/'+ battle.id +'">View Battle</a></td>' +
                            '</tr>';
                }

                html += '</table>';
            }else{
                html += 'There have been no battles in this war.';
            }
        }else{
            html += 'This war does not exist.';
        }
        
        html += '<div style="margin-right:6px;"><button name="ok">Ok</button><button name="back-main">Back</button></div>';
        
        $('div[name="interface-'+ this.id +'"] div[name="content-battles"]').html(html);
        
        this.showTab(null, 'battles');
    }
    
    war_myWars.prototype.showBattle = function(e){
        //battle-1/4 ......... battle-(warID)/(battleID)
        var data = ($(e.target).attr('name').split('-')[1]).split('/');
        
        var warID = parseInt(data[0]);
        var battleID = parseInt(data[1]);
        
        var html = '';
        
        var war = this.Core.Player.getWarHistoryByID(warID);
        var battle = this.Core.Player.getWarHistoryBattle(warID, battleID);
        
        if(battle){
            var amAttacker = (war.attacker === this.Core.Player.id) ? true : false;
            
            var attacker_losses = battle.data.attacker;
            var defender_losses = battle.data.defender;
            
            html += '<div style="background-color:#ffcccc;border:1px solid #330000;margin-bottom:30px;">';
            html += '<div style="background-color:#660000;font-size:20px;color:#ff9999;margin-bottom:20px;padding-left:3px;">'+ ((amAttacker) ? 'Your' : 'Enemy\'s') +' Losses</div>';
            html += '<div name="losses-attacker" style="color:#660000;max-height:200px;">';
            html += '<div style="margin-left:3px;">';
            
                for(var commander in attacker_losses){
                    html += '<div style="width:90%;padding-left:3px;background-color:#660000;font-size:17px;color:#ff9999;margin-bottom:8px;">General John</div>';
                    
                    for(var i = 0; i < attacker_losses[commander].length; i++){
                        var commanderLosses = attacker_losses[commander][i];
                        var equipment = commanderLosses.equipment;
                        
                        for(var x = 0; x < equipment.length; x++){
                            var lost = equipment[x];

                            var item = lost[0];
                            var amount = lost[1];

                            var obj = this.Core.Game.getMilitaryItemObj(item);

                            html += '<div style="position:relative;display:inline-block;margin-right:6px;margin-bottom:8px;float:left;border:1px solid black;cursor:pointer;width:80px;">';
                            html += '<div style="position:absolute;background-color:black;color:white;"><div style="margin:4px;font-size:11px;">'+ amount +'</div></div>';
                            html += '<div style="width:100%;text-align:center;"><img src="'+ obj.thumbnail_src +'" width="64" height="64"></div>';
                            html += '<div style="width:100%;line-height:20px;background-color:black;color:white;font-size:13px;text-align:center;max-height:20px;overflow:hidden;">'+ obj.name +'</div>';
                            html += '</div>';
                            html += '<div class="clear"></div>';
                        }
                    }
                }
                
            html += '</div>';
            html += '</div>';
            html += '</div>';
            
            html += '<div style="background-color:#c1f0c1;border:1px solid #0a290a;margin-bottom:15px;">';
            html += '<div style="background-color:#196719;font-size:20px;color:#c1f0c1;margin-bottom:20px;padding-left:3px;">'+ ((amAttacker) ? 'Enemy\'s' : 'Your') +' Losses</div>';
            html += '<div name="losses-defender" style="color:#196719;max-height:200px;">';
            html += '<div style="margin-left:3px;">';
                
                for(var commander in defender_losses){
                    html += '<div style="width:90%;padding-left:3px;background-color:#660000;font-size:17px;color:#ff9999;margin-bottom:8px;">General John</div>';
                    
                    for(var i = 0; i < defender_losses[commander].length; i++){
                        var commanderLosses = defender_losses[commander][i];
                        var equipment = commanderLosses.equipment;

                        for(var x = 0; x < equipment.length; x++){
                            var lost = equipment[x];

                            var item = lost[0];
                            var amount = lost[1];

                            var obj = this.Core.Game.getMilitaryItemObj(item);

                            html += '<div style="position:relative;margin-right:6px;margin-bottom:8px;float:left;border:1px solid black;cursor:pointer;width:80px;">';
                            html += '<div style="position:absolute;background-color:black;color:white;"><div style="margin:4px;font-size:11px;">'+ amount +'</div></div>';
                            html += '<div style="width:100%;text-align:center;"><img src="'+ obj.thumbnail_src +'" width="64" height="64"></div>';
                            html += '<div style="width:100%;line-height:20px;background-color:black;color:white;font-size:13px;text-align:center;max-height:20px;overflow:hidden;">'+ obj.name +'</div>';
                            html += '</div>';
                            html += '<div class="clear"></div>';
                        }
                    }
                }
                    
                html += '<div class="clear"></div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }else{
            html += 'This battle does not exist.';
        }
        
        html += '<div style="margin-right:6px;"><button name="ok">Ok</button><button name="back-battles">Back</button></div>';
        
        $('div[name="interface-'+ this.id +'"] div[name="content-battle"]').html(html);
        
        this.showTab(null, 'battle');
        
        //init devConsole scroll bar
        $('div[name="interface-'+ this.id +'"] div[name="content-battle"] div[name="losses-attacker"]').jScrollPane();
        $('div[name="interface-'+ this.id +'"] div[name="content-battle"] div[name="losses-defender"]').jScrollPane();
    }
    
    war_myWars.prototype.getPaginationHTML = function(page, pages){
        var html = '';
        
        if(pages > 0){
                html += '<ul class="inline">';
                html += '<li style="margin-right:5px;">Page</li>';

            //pagination
            for(var i = 1; i <= pages; i++){
                var style = (i === page) ? 'pagination selected' : 'pagination';

                html += '<li name="page-'+ i +'" class="'+ style +'">'+ i +'</li>';
            }

            html += '</ul>';
            
        }

        return html;
    }
    
    war_myWars.prototype.loadHistory = function(page){
        var d = Date.now();
        
        if(d - this.Core.Player.warHistoryLastLoad > (this.Core.Game.gameCfg.war_history_cooldown * 1000)){
            //request members from server
            this.Core.Events.emit('WAR:GET_HISTORY', page);
            
            this.Core.Player.warHistoryLastLoad = d;
        }else{
            this.historyLoaded(this.Core.Player.warHistoryCache);
        }
    }
    
    war_myWars.prototype.pageButtonPressed = function(e){
        var page = parseInt($(e.target).attr('name').split('-')[1]);
        this.loadHistory(page);
    }
    
    war_myWars.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    war_myWars.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    war_myWars.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] li[name|="page"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] a[name|="battles"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] a[name|="battle"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['war_myWars'] = war_myWars;
})();