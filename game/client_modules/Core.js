(function(){
    function Core(){
        this.debug = true;
        
        //game modules
        this.client = false;
        this.clientIP = 'http://localhost:3002';
        
        this.clientV = 1.0;
        this.required_client_version = false;
        
        this.clientConnected = false;
        this.connectCallback = false;
        this.maintenance_mode = false;
        this.originalConnection = true;
        this.kickReason = ''; //this will be set if the player is kicked
        
        //sever and client time difference
        this.serverTimeDifference = 0;
        this.syncRequestTime = 0;
        
        //doc directory
        this.doc_directory = 'game/docs/';
        
        //supported languages, corresponds to lang/____.js
        //e.g.: lang/english.js
        this.official_langs = ['english'];
        
        //items in readyStatus are required to be set/loaded
        //before we can set the screen
        this.readyStatus = {
            clientResourcesLoaded   : false,
            scriptsLoaded           : false
        };
        
        //load game modules
        this.Game = new Client.Game();
        this.InterfaceManager = new Client.InterfaceManager();
        this.Events = new Client.Events();
        this.Player = new Client.Player();
        this.Canvas = new Client.Canvas();
        this.Gui = new Client.Gui();
        this.Resources = new Client.Resources();
        this.GlobalMap = new Client.GlobalMap();
        this.Base = new Client.Base();
        this.MainMenu = new Client.MainMenu();
        this.CreateCity = new Client.CreateCity();
        
        //now we want to call each module's init function. if we simply
        //construct the objects with arguments above, some of the modules
        //will have "Core" objects that lack other modules. e.g.: Events.Core
        //will not have an Events.Core.Canvas because it's Core object was set
        //before Canvas was even constructed.
        this.Game.construct(this);
        this.InterfaceManager.construct(this);
        this.Events.construct(this);
        this.Player.construct(this);
        
        //construct Gui with GUIElements
        this.Gui.construct(this, {
            Button : Client.Button,
            LBar : Client.LBar
        });
        
        this.Resources.construct(this);
        this.Canvas.construct(this, document.getElementById('game'));
        
        //screens must be constructed before Canvas
        this.GlobalMap.construct(this);
        this.Base.construct(this);
        this.MainMenu.construct(this);
        this.CreateCity.construct(this);
        
        this.Resources.loadClientResources();
        
        //accepted dev console commands
        this.dev_commands = ['help', 'info', 'connect', 'disconnect', 'setheight', 'interface', 'uinterface', 'gamecfg_value', 'gamecfg_list', 'clear', 'max_resources', 'api', 'screen'];
        
        //init devConsole scroll bar
        //$('#devConsole').jScrollPane();
        
        var loadMsg = 'Client v_'+ this.clientV +' loaded.';
        
        //add to dev console
        this.addDevConsoleMessage('Client v_'+ this.clientV +' loaded.', 'yellow');
        this.addDevConsoleMessage('Use command "help" for more commands and information.', 'yellow');
        
        //don't remove
        console.log(loadMsg);
        
        //connect to server
        this.connect();
    }
    
    /*
     *  on successfull connection to the server, server will send
     *  some basic necessary init data such as news
     */
    Core.prototype.handleInitData = function(data){
        this.required_client_version = data.required_client_version;
        this.maintenance_mode = data.maintenance_mode;
        
        //tell main menu to load news
        this.MainMenu.loadNews(data.news);
    }
   
    /*
     *  @response : response will be set when the server sends a response with data
     *  syncTime helps sync client & server time.
     */
    Core.prototype.syncTime = function(response){
        var time = Date.now();
        
        if(!response){
            this.syncRequestTime = time;
            this.client.emit('syncTime', time);
        }else{
            //the time the server sent us
            var serverTime = response;
            
            //time it took to get a response
            var requestTime = time - this.syncRequestTime;
            
            this.serverTimeDifference = (time - requestTime) - serverTime;
        }
    }
    
    Core.prototype.now = function(){
        return (Date.now() - this.serverTimeDifference);
    }
    
    Core.prototype.loadScripts = function(){
        if(!this.scripts){
            this.scripts = {};
            
            var scripts = Client.scripts;
        
            for(var i = 0; i < scripts.length; i++){
                var scriptName = Client.scripts[i][0];
                var scriptObj = Client.scripts[i][1];
                
                //initiate script with Core
                this.scripts[scriptName] = new scriptObj(this);
            }
            
            //remove scripts
            Client.scripts = null;
            
            //set scripts status as ready
            this.setReady('scriptsLoaded');
        }else{
            console.warn('Scripts already loaded.');
        }
    }
    
    Core.prototype.gameLoaded = function(data){
		//set resource prices
        this.Game.gameCfg = data.gameCfg;
		
        //get player game info
        this.Player.cities = data.player.cities;
        this.Player.wars = data.player.wars;
		
        //init research for cities
        var cities = this.Player.cities;
        
        for(var city in cities){
            var id = cities[city].city_id;
            
            //init that research for this city
            this.Player.initResearch(id);
        }
		
        //set resources
        this.Resources.setup(data.resources);
        this.Resources.loadServerResources(function(){
            console.log('Server resources loaded.');
            
            //get & set view settings
            this.GlobalMap.setChunkFormat(data.globalmap);
            
            //set base settingss
            this.Base.setFormat(data.base);
            this.Base.init();
            
            if(this.Canvas.screen !== this.MainMenu){
                this.Canvas.setScreen(this.MainMenu);
            }else{
                this.MainMenu.update();
            }
        }.bind(this));
        
        console.log('Server has loaded game data.');
    }
    
    /*
     *  is the game ready? returns boolean
     */
    Core.prototype.ready = function(){
        var ready = true;
        
        for(var item in this.readyStatus){
            if(!this.readyStatus[item]){
                ready = false;
            }
        }
        
        return ready;
    }
    
    Core.prototype.setReady = function(obj){
        if(!this.ready()){
            this.readyStatus[obj] = true;
            
            if(this.ready()){
                var session = fn_getCookie('session');

                if(session){
                    this.client.emit('validateCookie', session);
                }else{
                    this.Player.requireLogin = true;
                }

                this.Canvas.setScreen(this.MainMenu);
                this.Canvas.main();
            }
            
            //if resources have loaded, load scripts too
            if(obj === 'clientResourcesLoaded'){
                this.loadScripts();
            }
        }
    }
    
    Core.prototype.connect = function(callback){
        if(!this.clientConnected && !this.reconnecting){
            if(callback){
                this.connectCallback = callback;
            }
            
            this.client = io.connect(this.clientIP, {forceNew : 'true'});
            this.Events.setClientEventHandlers(this.client);
            
            //are we reconnecting?
            if(!this.originalConnection){
                this.reconnecting = true;
            }
        }
    }
    
    Core.prototype.connected = function(){
        console.log('Connected to the server.');
        
        this.addDevConsoleMessage('Connected to the server.');
            
        //set client state to connected
        this.clientConnected = true;
        this.reconnecting = false;
        
        if(this.connectCallback){
            this.connectCallback();
        }
        
        this.syncTime();
    }
    
    Core.prototype.disconnect = function(){
        this.client.disconnect();
    }
    
    Core.prototype.disconnected = function(){
        console.log('Disconnected from server.');
        
        this.addDevConsoleMessage('Disconnected from server.');
        
        this.clientConnected = false;
        this.originalConnection = false;
        this.Player.loggedIn = false;
        this.Player.requireLogin = true;
        this.MainMenu.update();
        this.Canvas.setScreen(this.MainMenu);
        this.Player.clearUserData();
        this.client.removeAllListeners();
    }
    
    Core.prototype.losingConnection = function(){
        console.log('Losing connection ...');
    }
    
    Core.prototype.toggleDevConsole = function(){
        var el = $('#devConsole');
        
        if(!el.is(':visible')){
            var input = $('#devConsole input');
            
            //position the message to the top of the game screen, and same width as the game
            var canvas = this.Canvas.canvas;
            var pos = $('#game').offset();

            var posX = pos.left;
            var posY = pos.top;

            el.css({
                top : posY,
                left : posX,
                width : canvas.width
            });

            el.slideDown(750);
            
            input.focus();
        }else{
            el.slideUp(750);
        }
    }
    
    Core.prototype.addDevConsoleMessage = function(msg, color){
        if(color){
            $('#devMessages').append('<div class="msg" style="color:'+ color +'">'+ fn_htmlEnc(msg) +'</div>');
        }else{
            $('#devMessages').append('<div class="msg">'+ fn_htmlEnc(msg) +'</div>');
        }
    }
    
    Core.prototype.clearDevConsole = function(){
        $('#devMessages').html('');
    }
    
    Core.prototype.devConsoleEnter = function(){
        var self = this;
        var input = $('#devConsole input');
        var msg = input.val();
        
        var results = /(.+?)($|\s)(.+)?/g.exec(msg);
        var command = results[1];
        var param = results[3];
        
        switch(command){
            case 'help':
                var helpMsg = 'Available commands: '+ this.dev_commands.join(', ') +'.';
                this.addDevConsoleMessage(helpMsg, 'yellow');
                break;
            case 'info':
                this.addDevConsoleMessage('You are running client v_'+ this.clientV +'.');
                break;
            case 'max_resources':
                //this was a waste of precious development time, all 60 seconds of it.
                //this is why nothing can get done around here.
                if(!this.givingMaxResources){
                    this.givingMaxResources = true;

                    this.addDevConsoleMessage('Requesting authorization for max resources ...');

                    setTimeout(function(){
                        self.addDevConsoleMessage('Server authorized max resources ...', 'green');

                        setTimeout(function(){
                            self.addDevConsoleMessage('Server updating player\'s resource values.');

                            setTimeout(function(){
                                self.addDevConsoleMessage('Max resource values achieved.');

                                $('#panel table[name="resources"] td[name="money"]').text(fn_numberFormat(2147000000));
                                $('#panel table[name="resources"] td[name="iron"]').text(fn_numberFormat(2147000000));
                                $('#panel table[name="resources"] td[name="gold"]').text(fn_numberFormat(2147000000));
                                $('#panel table[name="resources"] td[name="wood"]').text(fn_numberFormat(2147000000));
                                $('#panel table[name="resources"] td[name="oil"]').text(fn_numberFormat(2147000000));
                                $('#panel table[name="resources"] td[name="population"]').text(fn_numberFormat(2147000000));

                                setTimeout(function(){
                                    self.addDevConsoleMessage('(∩ ͡° ͜ʖ ͡°)⊃━☆ﾟ. * ・ ｡ﾟ Just kidding.');
                                    self.givingMaxResources = false;
                                }, 2000);
                            }, 1000);
                        }, 750);
                    }, 2500);
                }

                break;
            case 'screen':
                if(param){
                    switch(param.toLowerCase()){
                        case 'mainmenu':
                            this.Canvas.setScreen(this.MainMenu);
                            this.addDevConsoleMessage('Set screen to MainMenu.');
                            break;
                        case 'globalmap':
                            this.Canvas.setScreen(this.GlobalMap);
                            this.addDevConsoleMessage('Set screen to GlobalMap.');
                            break;
                        case 'base':
                            this.Canvas.setScreen(this.Base);
                            this.addDevConsoleMessage('Set screen to Base.');
                            break;
                        default:
                            this.addDevConsoleMessage('Failed to set screen.', 'red');
                    }
                }else{
                    this.addDevConsoleMessage(command +' requires a parameter.', 'red');
                }
                
                break;
            case 'setheight':
                if(param){
                    var height = parseInt(param);

                    if(height > 600) height = 600;
                    if(height < 100) height = 100;

                    $('#devConsole').height(height);

                    this.addDevConsoleMessage('Set dev console height to '+ height +'px.');
                }else{
                    this.addDevConsoleMessage(command +' requires a parameter.', 'red');
                }

                break;
            case 'interface':
                if(param){
                    if(this.InterfaceManager.loadInterface(param)){
                        this.addDevConsoleMessage('Opened interface '+ param +'.');
                    }else{
                        this.addDevConsoleMessage('Failed to load interface. Does it exist?');
                    }
                }else{
                    this.addDevConsoleMessage(command +' requires a parameter.', 'red');
                }

                break;
            case 'uinterface':
                if(param){
                    this.addDevConsoleMessage('Unloaded interface '+ param +'.');
                }else{
                    this.InterfaceManager.unloadInterface();
                }

                break;
            case 'gamecfg_value':
                var cfg = this.Game.gameCfg;

                if(cfg){
                    if(param){
                        var value = cfg[param];

                        if(typeof value === 'object'){
                            this.addDevConsoleMessage(JSON.stringify(value), 'green');
                        }else{
                            this.addDevConsoleMessage(value, 'green');
                        }
                    }else{
                        this.addDevConsoleMessage(command +' requires a parameter.', 'red');
                    }
                }else{
                    this.addDevConsoleMessage('GameCfg is not loaded.');
                }
                break;
            case 'gamecfg_list':
                var cfg = this.Game.gameCfg;

                if(cfg){
                    var props = [];

                    for(var key in cfg){
                        props.push(key);
                    }

                    this.addDevConsoleMessage('GameCfg variables: '+ props.join(', '));
                }else{
                    this.addDevConsoleMessage('GameCfg is not loaded.');
                }
                break;
            case 'clear':
                this.clearDevConsole();
                break;
            case 'disconnect':
                this.disconnect();
                break;
            default:
                this.addDevConsoleMessage('Unknown command. See "help" command.', 'red');
                break;
        }
        
        input.val('');
    }
    
    Core.prototype.handleGameUpdate = function(seconds){
        console.log('Update forced in '+ seconds +' seconds.');
        
        var msg = 'An update has been detected. The update will take effect in approximately <span name="countdown">'+ fn_timeLeft(seconds*1000) +'</span>.';
        
        var el = $('#updateNotifier');
        
        $('#updateNotifier div[name="message"]').html(msg+'<a href="#" name="dismiss" style="inline-block;float:right;">dismiss</a>');
        
        //position the message to the top of the game screen, and same width as the game
        var canvas = this.Canvas.canvas;
        var pos = $('#game').offset();
        
        var posX = pos.left;
        var posY = pos.top;
        
        el.css({
            top : posY,
            left : posX,
            width : canvas.width
        });
        
        el.fadeIn(2000);
       
        var targetDate = Date.now() + (seconds*1000);
        
        var self = this;
        this.updateCountdownInterval = setInterval(function(){
            var timeLeft = targetDate - Date.now();
            
            if(timeLeft < 0){
                timeLeft = 0;
            }
            
            $('#updateNotifier span[name="countdown"]').text(fn_timeLeft(timeLeft));
            
            //clear interval
            if(timeLeft <= 0){
                $('#updateNotifier').fadeOut(2000);
                clearInterval(self.updateCountdownInterval);
            }
        }, 1000);
    }
    
    Core.prototype.cancelGameUpdate = function(){
        clearInterval(this.updateCountdownInterval);
        $('#updateNotifier div[name="message"]').html('The game updated has been canceled. <a href="#" name="dismiss" style="inline-block;float:right;">dismiss</a>');
    }
    
    Core.prototype.gameUpdateCompleted = function(){
        this.maintenance_mode = true;
        
        if(this.Player.rights < 3){
            if(this.Canvas.currScreen === this.MainMenu){
                this.MainMenu.update();
            }else{
                this.Canvas.setScreen(this.MainMenu);
            }
        }
    }
    
    Core.prototype.windowResized = function(){
        var el = $('#devConsole');
        
        if(el.is(':visible')){
            //position the message to the top of the game screen, and same width as the game
            var canvas = this.Canvas.canvas;
            var pos = $('#game').offset();

            var posX = pos.left;
            var posY = pos.top;

            el.css({
                top : posY,
                left : posX,
                width : canvas.width
            });
        }
    }
    
    Client.Core = Core;
})();