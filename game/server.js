var mysql                       = require('mysql');
var module_phash                = require('password-hash-and-salt');
var module_Core                 = require('./server_modules/Core');
var module_Funcs                = require('./server_modules/Funcs');
var module_Game                 = require('./server_modules/Game');
var module_WorldBank            = require('./server_modules/WorldBank');
var module_WorldCourt           = require('./server_modules/WorldCourt');
var module_Resources            = require('./server_modules/Resources');
var module_Comm                 = require('./server_modules/Comm');
var module_Events               = require('./server_modules/Events');
var module_Player               = require('./server_modules/Player');
var module_Alliance             = require('./server_modules/Alliance');
var module_GlobalMap            = require('./server_modules/screens/GlobalMap');
var module_Base                 = require('./server_modules/screens/Base');
var module_GameCfg              = require('./server_modules/GameCfg');
var module_MessageCenter        = require('./server_modules/MessageCenter');
var module_Account              = require('./server_modules/Account');
var module_War                  = require('./server_modules/War');
var module_adm_Authenticate     = require('./server_modules/admin/Authenticate');
var module_adm_Dashboard        = require('./server_modules/admin/Dashboard');
var module_adm_Admin            = require('./server_modules/admin/Admin');

//start server
var server = require('socket.io').listen(3002);

//anti-spam module
var antiSpam = require('socket-anti-spam');
var antiSpam = new antiSpam({
    spamCheckInterval: 2000, // define in how much miliseconds the antispam script gives a minus spamscore point
    spamMinusPointsPerInterval: 3, // how many minus spamscore points after x miliseconds?
    spamMaxPointsBeforeKick: 9, // needed points before kick
    spamEnableTempBan: true, // Enable the temp ban system (temp ban users after x amount of kicks within x amount of time)
    spamKicksBeforeTempBan: 3, // This many kicks needed for a temp ban
    spamTempBanInMinutes: 2, // This many minutes temp ban will be active
    removeKickCountAfter: 1, // This many minutes until the kick counter is decreasing with 1 for the user
    debug: false // debug? not needed
});

//establish connection pool to database
var mpool = mysql.createPool({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'ww2',
    connectionLimit : 100,
    waitForConnections : false
});

//maintenance mode flag
var maintenance_mode = false;

//game versions
var game_version = 1.0;
var required_client_version = 1.0;

//create module instances
var Core = new module_Core.Core();

Core.addGlobalVariable('maintenance_mode', maintenance_mode);
Core.addGlobalVariable('server', server);
Core.addGlobalVariable('mpool', mpool);

Core.addCoreModules({
    Funcs       : new module_Funcs.Funcs,
    Game        : new module_Game.Game,
    Alliance    : new module_Alliance.Alliance,
    Comm        : new module_Comm.Comm,
    Resources   : new module_Resources.Resources,
    Events      : new module_Events.Events,
    GlobalMap   : new module_GlobalMap.GlobalMap,
    Base        : new module_Base.Base,
    GameCfg     : new module_GameCfg.GameCfg,
    MsgCenter   : new module_MessageCenter.MessageCenter,
    WorldBank   : new module_WorldBank.WorldBank,
    WorldCourt  : new module_WorldCourt.WorldCourt,
    War         : new module_War.War
}, Core.constructModules.bind(Core));

var Funcs       = Core.modules.Funcs,
    Game        = Core.modules.Game,
    Alliance    = Core.modules.Alliance,
    GameCfg     = Core.modules.GameCfg,
    Comm        = Core.modules.Comm, 
    Map         = Core.modules.Map,
    Resources   = Core.modules.Resources,
    Events      = Core.modules.Events,
    GlobalMap   = Core.modules.GlobalMap,
    MsgCenter   = Core.modules.MsgCenter,
    WorldBank   = Core.modules.WorldBank,
    WorldCourt  = Core.modules.WorldCourt,
    War         = Core.modules.War,
    Account     = new module_Account.Account(Game, mpool, module_phash); //module not done through addCoreModules, doesnt need references
   
//pre-load news
var news = false;
var world_bank_loaded = false;

Game.getNews(function(loadedNews){
    news = loadedNews;
    startGame();
});

//start listening for clients
function startGame(){
    server.sockets.on('connection', function(client){
        //event flood protection
        antiSpam.onConnect(client, Game);
        
        //init player module
        var Player = Core.addFlexModule(
                client.id,
                { client : client },
                new module_Player.Player(client),
                ['Events', 'GameCfg', 'Game', 'War']
        );
        
        //override to catch all incoming events to run wildcard function(s)
        var emit = client.emit;
        client.emit = function(){
            Player.lastAction = Date.now();
            emit.apply(client, arguments);
        };
        
        //send client start/init data
        client.emit('initData', {
            required_client_version : required_client_version,
            maintenance_mode : Core.vars.maintenance_mode,
            news : news
        });
        
        //syncs client time
        client.on('syncTime', function(){
            var d = Date.now();
            client.emit('syncTimeResponse', d);
        });
        
        //Login. If successful login, continue game loading.
        client.on('validateLogin', function(data){
            var d = Date.now();
            if(d - Player.lastLoginAttempt > 5000){
                Account.validateLogin(Player, data);
                Player.lastLoginAttempt = d;
            }
        });
        
        //Login via cookie
        client.on('validateCookie', function(cookie){
            var d = Date.now();
            if(d - Player.lastLoginAttempt > 5000){
                Account.validateCookie(Player, cookie);
                Player.lastLoginAttempt = d;
            }
        });
        
        client.on('validateRegistration', function(data){
            var d = Date.now();
            if(d - Player.lastRegistrationAttempt > 5000){
                Account.validateRegistration(Player, data);
                Player.lastRegistrationAttempt = d;
            }
        });
        
        client.on('registerCity', function(data){
            var d = Date.now();
            if(d - Player.lastCityRegisterAttempt > 5000){
                Game.registerCity(Player, data);
                Player.lastCityRegisterAttempt = d;
            }
        });

        client.on('disconnect', function(){
            var id = Player.id;
            
            //i really hope you remember what this does because I dont feel like explaining
            //it with this comment.
            if(Game.players[id] && Game.players[id].Player.joined && Player.joined){
                Game.playerLeave(Player.id);
            }

            //let's hope every reference to play is destroyed....
            clearInterval(Player.afkInterval);
            Player = null;
            
            //unload module
            Core.unloadFlexModule(client.id);
        });
        
        //afk restriction
        Player.afkInterval = setInterval(function(){
            Game.checkIfAFK(Player);
        }, 60000);
    });
    
    /*
     *  START OF ADMIN NAMESPACE
     *  AND ALL THINGS ADMIN! :)
     */
    var adm = server.of('/adm');
    
    //admin module
    var adm_Authenticate    = new module_adm_Authenticate.Authenticate(mpool);
    var adm_Dashboard       = new module_adm_Dashboard.Dashboard(adm, Core, server.sockets);
    
    adm.on('connection', function(client){
        var Admin = new module_adm_Admin.Admin(client);
            Admin.ip = client.handshake.address;
        
        //override to catch all incoming events to run wildcard function(s)
        var emit = client.emit;
        client.emit = function(){
            if(Admin){
                Admin.lastAction = Date.now();
                emit.apply(client, arguments);
            }
        };
        
        client.on('authenticate', function(session){
            console.log('[ADM] Authenticating ... '+ session);
            
            //check if session is authorized
            adm_Authenticate.authorize(Admin.ip, session, function(r){
                if(r){
                    console.log('[ADM] '+ r.name +' authenticated.');
                    
                    Admin.id                = r.id;
                    Admin.name              = r.name;
                    Admin.avatar_id         = r.avatar_id;
                    Admin.login             = Date.now();
                    Admin.authenticated     = true;
                    
                    //init the admin
                    Admin.init();
                    adm_Dashboard.addUser(Admin);
                }else{
                    console.log('[ADM] Authentication failed.');
                }
            });
        });
        
        client.on('addChatMessage', function(data){
            adm_Dashboard.addChatMessage(Admin, data);
        });
        
        client.on('getChat', function(){
            Admin.client.emit('loadChat', adm_Dashboard.chatMessages);
        });
        
        client.on('getPlayers', function(){
            Admin.client.emit('playersOnline', {});
        });
        
        client.on('getGameVersions', function(){
            Admin.client.emit('gameVersions', {
                client_version  : required_client_version,
                game_version    : game_version
            });
        });
        
        client.on('initUpdate', function(newRequiredClientV){
            adm_Dashboard.initUpdate(Admin, newRequiredClientV);
        });
        
        client.on('cancelUpdate', function(){
            adm_Dashboard.cancelUpdate(Admin);
        });
        
        client.on('createGlobalMessage', function(data){
            adm_Dashboard.createGlobalMessage(Admin, data);
        });
        
        client.on('disconnect', function(){
            adm_Dashboard.removeUser();
            clearInterval(Admin.afkInterval);
            Admin = null;
        });
        
        //afk restriction
        Admin.afkInterval = setInterval(function(){
            Admin.checkIfAFK();
        }, 62000);
    });
}