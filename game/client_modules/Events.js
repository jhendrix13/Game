(function(){
    function Events(){}
    
    Events.prototype.construct = function(Core){
        this.Core = Core;
        
        this.fireEventTimeout = false
        
        //e.g.: player logouts, connection to server destroyed. but now...they want to login.
        //so they click enter on login form, but we can't just send the message toconnect first. so the login event will be queued.
        this.eventQueue = [];
        
        //here is the name of most events that can be passed
        //to the server. Stored in one place for organization
        //some events dont need to be placed here
        //player has to have JOINED the game on the server for
        //these events to register
        this.events = {
            PLAYER : {
                LOGOUT          : 'logout',
                SELECT_CITY     : 'Game_select_city'
            },
            GLOBALMAP : {
                INIT            : 'GlobalMap_init',
                MOVE            : 'GlobalMap_move',
                REFRESH         : 'GlobalMap_refresh',
                REQUEST_CHUNK   : 'GlobalMap_request_chunk',
                BUILDING_CREATE : 'GlobalMap_building_create',
                SELL_BUILDING   : 'GlobalMap_building_sell',
                COMMANDER_MOVE  : 'GlobalMap_commander_move'
            },
            BASE : {
                MOVE            : '',
                BUILDING_CREATE         : 'Base_building_create',
                SELL_BUILDING           : 'Base_building_sell'
            },
            GAME : {
                UPDATE_VALUE        : 'Game_update_value',
                RECRUIT_MILITARY    : 'Game_military_recruit',
                COMMANDERS_REFRESH  : 'Game_commanders_refresh',
                COMMANDER_RECRUIT   : 'Game_commander_recruit',
                COMMANDER_DISCHARGE : 'Game_commander_discharge',
                START_RESEARCH      : 'Game_start_research',
                STOP_RESEARCH       : 'Game_stop_research',
                PURCHASE_ARMS       : 'Game_purchase_arms',
                ASSIGN_SOLDIERS     : 'Game_assign_soldiers',
                ASSIGN_EQUIPMENT    : 'Game_assign_equipment',
                START_REFINING      : 'Game_start_refining',
                CANCEL_QUEUE        : 'Game_cancel_queue',
                GET_CITY_TRADEABLES : 'Game_get_city_tradeables',
                SUBMIT_TRADE        : 'Game_submit_trade',
                CANCEL_TRADE        : 'Game_cancel_trade',
                ACCEPT_TRADE        : 'Game_accept_trade'
            },
            ALLIANCE : {
                CREATE_ALLIANCE     : 'Alliance_create_alliance',
                GET_MY_ALLIANCE     : 'Alliance_get_my_alliance',
                UPDATE_ALLIANCE     : 'Alliance_update_alliance',
                DONATE              : 'Alliance_donate',
                GET_MEMBERS         : 'Alliance_get_members',
                GET_PERMS           : 'Alliance_get_perms',
                SET_PERMS           : 'Alliance_set_perms',
                KICK_USER           : 'Alliance_kick_user',
                LEAVE               : 'Alliance_leave',
                MASS_MSG            : 'Alliance_mass_msg',
                INVITE_SEARCH       : 'Alliance_invite_search',
                INVITE_USER         : 'Alliance_invite_user',
                ACCEPT_INVITE       : 'Alliance_accept_invite'
            },
            MSGCENTER : {
                SEND_MESSAGE        : 'MsgCenter_send_message',
                EXECUTE_ACTION      : 'MsgCenter_execute_action',
                MESSAGE_READ        : 'MsgCenter_message_read'
            },
            WAR : {
                INITIATE_MISSION    : 'War_initiate_mission',
                UPDATE_PEACE        : 'War_update_peace',
                GET_HISTORY         : 'War_get_history'
            }
        };
        
        this.loadDOMEventHandlers();
    }
    
    Events.prototype.setClientEventHandlers = function(client){
        var Core = this.Core;
        var Player = this.Core.Player;
        var Game = this.Core.Game;
        var CreateCity = this.Core.CreateCity;
        
        //incoming server messages
        client.on('connect', Core.connected.bind(Core));
        client.on('reconnect', function(){
            console.log('Reconnected.');
        });
        client.on('initData', Core.handleInitData.bind(Core));
        client.on('syncTimeResponse', Core.syncTime.bind(Core));
        client.on('disconnect', Core.disconnected.bind(Core));
        client.on('popup', Player.handlePopup.bind(Player));
        client.on('notify', Player.handleNotify.bind(Player));
        client.on('kicked', Player.handleKick.bind(Player));
        client.on('requireLogin', Core.MainMenu.requireLogin.bind(Core.MainMenu));
        client.on('loggedIn', Player.handleLogin.bind(Player));
        client.on('loggedOut', Player.handleLogout.bind(Player));
        client.on('registrationFailed', Player.handleRegister.bind(Player));
        client.on('gameLoaded', Core.gameLoaded.bind(Core));
        client.on('haveNoCity', function(){
            Core.Canvas.setScreen(Core.CreateCity);
        });
        client.on('createCityError', CreateCity.setFormError.bind(CreateCity));
        
        client.on('lostCity', Player.lostCity.bind(Player));
        client.on('gainedCity', Player.gainedCity.bind(Player));
        client.on('lostGMBuilding', Player.lostGMBuilding.bind(Player));
        client.on('gainedGMBuilding', Player.gainedGMBuilding.bind(Player));
        
        client.on('updateCityHealth', Player.updateCityHealth.bind(Player));
        client.on('sc_GlobalMap_chunkLoaded', Core.GlobalMap.chunkLoaded.bind(Core.GlobalMap));
        client.on('globalMap_building_sold', Core.GlobalMap.buildingSold.bind(Core.GlobalMap));
        client.on('newMission', Core.GlobalMap.newMissionNearby.bind(Core.GlobalMap));
        client.on('cityLoaded', Player.cityLoaded.bind(Player));
        client.on('commanderRefresh', Game.commanderRefresh.bind(Game));
        client.on('commanderRecruited', Player.commanderRecruited.bind(Player));
        client.on('commanderRelocated', Player.commanderRelocated.bind(Player));
        client.on('commanderInventoryUpdate', Player.commanderInventoryUpdate.bind(Player));
        client.on('retrievedCityTradeables', Game.retrievedCityTradeables.bind(Game));
        client.on('activeTradeOffers', Player.setActiveTradeOffers.bind(Player));
        client.on('activeTradeDeleted', Player.activeTradeDeleted.bind(Player));
        client.on('activeTradeAdded', Player.activeTradeAdded.bind(Player));
        client.on('activeTradeAccepted', Player.activeTradeAccepted.bind(Player));
        client.on('tradeCreationFailed', Player.tradeCreationFailed.bind(Player));
        client.on('tradeMissionComplete', Player.tradeComplete.bind(Player));
        client.on('gameUpdate', Core.handleGameUpdate.bind(Core));
        client.on('gameUpdateCanceled', Core.cancelGameUpdate.bind(Core));
        client.on('gameUpdateCompleted', Core.gameUpdateCompleted.bind(Core));
        client.on('allianceCreation', Player.handleAllianceCreation.bind(Player));
        client.on('allianceData', Player.cacheAllianceData.bind(Player));
        client.on('allianceUserPermissions', Player.handleAllianeUserPermissions.bind(Player));
        client.on('allianceMembersLoaded', Player.handleAllianceMembersLoaded.bind(Player));
        client.on('allianceMyPermsUpdated', Player.handleAllianceMyPermsUpdate.bind(Player));
        client.on('allianceInviteSearch', Player.handleAllianceInviteMembers.bind(Player));
        client.on('allianceInviteResponse', Player.handleAllianceInviteResponse.bind(Player));
        client.on('allianceAcceptInviteResponse', Player.handleAllianceAcceptInviteResponse.bind(Player));
        client.on('allianceInvited', Player.handleAllianceInvited.bind(Player));
        client.on('allianceKicked', Player.handleAllianceKick.bind(Player));
        client.on('playerMessages', Player.loadMessages.bind(Player));
        client.on('sendMessageResponse', Player.handleSendMessageResponse.bind(Player));
        client.on('newMessage', Player.handleNewMessage.bind(Player));
        client.on('warDeclared', Player.handleWarDeclaration.bind(Player));
        client.on('peaceOffered', Player.handlePeaceOffer.bind(Player));
        client.on('peaceDeclared', Player.handlePeaceDeclaration.bind(Player));
        client.on('warHistory', Player.handleWarHistory.bind(Player));
    }
    
    Events.prototype.loadDOMEventHandlers = function(){
        var self = this;
        var Core = this.Core;
        var Canvas = this.Core.Canvas;
        var Gui = this.Core.Gui;
        var InterfaceManager = this.Core.InterfaceManager;
        var MainMenu = this.Core.MainMenu;
        var CreateCity = this.Core.CreateCity;
        
        //block contextmenus
        $(document).on('contextmenu', 'canvas', function(){ return false; });
        
        //disallow image dragging
        $(document).on('dragstart', '#notifications div[name="notification"] img', function(e){
            e.preventDefault();
        });
        $(document).on('dragstart', '#loading_icon', function(e){
            e.preventDefault();
        });
        
        //dev console
        $(document).keypress(function(e){
            if(e.keyCode === 96){
                e.preventDefault();
                Core.toggleDevConsole();
            }
        });
        $(document).on('keypress', '#devConsole', function(e){
            if(e.keyCode === 13){
                Core.devConsoleEnter();
            }
        });
        
        //no contextmenu on right click for notifications
        $(document).on('contextmenu', '#notifications div[name="notification"] img', function(e){ return false; });
        
        //add some "latency" to resize event.
        window.addEventListener('resize', function(){
            if(!self.fireEventTimeout){
                self.fireEventTimeout = setTimeout(function(){
                    Gui.windowResized();
                    Canvas.windowResized();
                    InterfaceManager.centerActiveInterfaces();
                    MainMenu.windowResized();
                    CreateCity.windowResized();
                    Core.windowResized();
                    
                    //current screen
                    var currScreen = self.Core.Canvas.screen;
                    
                    if(currScreen.positionPanel){
                        currScreen.positionPanel();
                    }
                    
                    self.fireEventTimeout = false;
                },300);
            }
        });
        
        document.addEventListener('mousemove', Canvas.setMousePos.bind(Canvas));
        document.getElementById('game').addEventListener('mousedown', Canvas.mouseDown.bind(Canvas));
        document.getElementById('game').addEventListener('mouseup', Canvas.mouseUp.bind(Canvas));
     
        //popup stuff
        $(document).on('click', '#popup button[name|="guiButton"]', Gui.handleAction.bind(Gui));
        $(document).on('mouseover', '#popup', Gui.mouseWithinExternElement.bind(Gui, true));
        $(document).on('mouseout', '#popup', Gui.mouseWithinExternElement.bind(Gui, false));
        $(document).on('mouseover', '#notifications div[name="notification"],#panel,#base_tabcontent div[name|="tabcontent"],div[name="globalmap_position"] input,div[name|="interface"]', Gui.mouseWithinExternElement.bind(Gui, true));
        $(document).on('mouseout', '#notifications div[name="notification"],#panel,#base_tabcontent div[name|="tabcontent"],div[name="globalmap_position"] input,div[name|="interface"]', Gui.mouseWithinExternElement.bind(Gui, false));
    
    
        //dismiss message when link is clicked
        $(document).on('click', '#updateNotifier a[name="dismiss"]', function(e){
            e.preventDefault();
            $('#updateNotifier').fadeOut(2000);
        });
    }
    
    Events.prototype.emit = function(event, data){
        var eventPaths = event.split(':');

        //go through the defined events in this.events
        //and get the defined constant name for the event path
        var defEvent = this.events;
        for(var i = 0; i < eventPaths.length; i++){
            defEvent = defEvent[eventPaths[i]];
        }

        //debug mode
        if(this.Core.debug){
            console.log('Emitting event to server: '+ defEvent +' ('+ event +').');
        }

        //send the event to the server for handling!
        this.Core.client.emit(defEvent, data);
    }
    
    Events.prototype.pushEvent = function(event, data){
        this.eventQueue.push([event, data]);
    }
    
    /*
     *  need to eventually add a delay to this. but atm not necessary
     */
    Events.prototype.flushQueue = function(){
        var queue = this.eventQueue;
        for(var i = 0; i < queue.length; i++){
            var event = queue[i];
            
            this.emit(event[0], event[1]);
        }
    }
    
    Client.Events = Events;
})();