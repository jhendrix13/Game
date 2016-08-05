/*
 *  CLIENT
 */

(function(){
    function alliance_user(Core, userid){
        this.Core = Core;
        this.id = 'alliance_user';
        
        this.userid = userid;
        
        this.data = {};
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    alliance_user.prototype.load = function(){
        var Player = this.Core.Player;
        var perms = Player.alliance_perms;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:750px;">';
            html += '<div class="title">Alliance Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //left side
            html += '<div style="width:70%;float:left;">';
            html += '<div style="margin:6px;">';
            
            //main content
            html += '<div name="main_content">';
            
            console.log(perms);
            
            if(perms.can_set_permissions || perms.can_kick){
                html += '<div name="loading">Loading data ...</div>';
                
                html += '<div name="user" class="hidden">';
                html += '<h2>User <span name="username" style="color:white;"></span></h2>';
                
                if(!isNaN(this.userid) && this.userid > 0){
                    if(perms.can_set_permissions){
                        html += '<div name="permissions" style="border:1px solid yellow;">';
                        html += '<div name="title" style="background-color:yellow;color:black;text-align:center;">Permissions</div>';
                        
                        html += '<table cellpadding="4" cellspacing="5" style="text-align:center;">';
                        
                        html += '<tr><td>Edit Permissions</td><td>View Armory</td><td>Manage Armory</td><td>View Treasury</td><td>Manage Treasury</td><td>Can Donate</td></tr>';
                        html += '<tr>';
                        html += '<td><input type="checkbox" name="can_set_permissions"></td>';
                        html += '<td><input type="checkbox" name="armory_can_view"></td>';
                        html += '<td><input type="checkbox" name="armory_can_manage"></td>';
                        html += '<td><input type="checkbox" name="treasury_can_view"></td>';
                        html += '<td><input type="checkbox" name="treasury_can_manage"></td>';
                        html += '<td><input type="checkbox" name="can_donate"></td>';
                        html += '</tr>';
                        
                        html += '<tr><td>Can Declare War</td><td>Can set MOTD</td><td>Can Kick</td><td>Can Accept Members</td><td>Can Invite Members</td><td>Mass PM Members</td></tr>';
                        html += '<tr>';
                        html += '<td><input type="checkbox" name="can_declare_war"></td>';
                        html += '<td><input type="checkbox" name="can_set_motd"></td>';
                        html += '<td><input type="checkbox" name="can_kick"></td>';
                        html += '<td><input type="checkbox" name="can_accept_members"></td>';
                        html += '<td><input type="checkbox" name="can_invite_members"></td>';
                        html += '<td><input type="checkbox" name="can_mass_pm"></td>';
                        html += '</tr>';
                        
                        html += '</table>';
                        html += '</div>';
                    }
                    
                    html += '</div>';
                }else{
                    html += 'Error! No user selected.';
                }
            }else{
                html += 'You do not have the rights to access this page.';
            }
            
            html += '</div>';
            
            //page content
            html += '<div name="page_content"></div>';
            html += '</div>';
            html += '</div>';
            
            //right side
            html += '<div style="width:30%;float:right;margin-bottom:25px;">';
            
            if(perms.can_set_permissions){
                html += '<button name="nav-update" class="alliBigButton hidden">Set Permissions</button>';
            }
            
            if(perms.can_kick){
                html += '<button name="nav-kick" class="alliBigButton hidden">Kick User</button>';
            }
            
            html += '<button name="nav-back" class="alliBigButton">Back</button>';
            html += '<button name="exit" class="alliBigButton">Exit</button>';
            html += '</div>';
            
            html += '</div></div>';
            
            
        $('body').append(html);
        
        //get user's permissions from server
        this.getPermissions();
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]', this.buttonPressed.bind(this));
    }
    
    alliance_user.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        //unload on exit or transition
        if(['update','kick'].indexOf(name) === -1){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }
        
        switch(name){
            case 'back':
                this.Core.InterfaceManager.loadInterface('alliance');
                break;
            case 'update':
                this.updatePerms();
                break;
            case 'kick':
                this.kickUser();
                break;
        }
    }
    
    alliance_user.prototype.loadData = function(data){
        this.data = data;
        
        var perms = data.perms;
        var username = data.username;
        
        for(var perm in perms){
            var bool = perms[perm];
            var el = $('div[name="interface-'+ this.id +'"] input[name="'+ perm +'"]');
            
            if(el.length > 0){
                el.prop('checked', bool);
            }
        }
        
        $('div[name="interface-'+ this.id +'"] div[name="loading"]').hide(0);
        $('div[name="interface-'+ this.id +'"] div[name="user"] span[name="username"]').text(fn_htmlEnc(username));
        $('div[name="interface-'+ this.id +'"] div[name="user"]').show(0);
        $('div[name="interface-'+ this.id +'"] button[name="nav-update"],div[name="interface-'+ this.id +'"] button[name="nav-kick"]').show(0);
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    alliance_user.prototype.getPermissions = function(){
        this.Core.Events.emit('ALLIANCE:GET_PERMS', {
            userid : this.userid
        });
    }
    
    alliance_user.prototype.kickUser = function(){
        this.Core.Events.emit('ALLIANCE:KICK_USER', {
            userid : this.userid
        });
        
        $('div[name="interface-'+ this.id +'"] button[name="nav-kick"]').remove();
    }
    
    alliance_user.prototype.updatePerms = function(){
        var perms = this.data.perms;
        var newPerms = {};
        
        if(perms){
            for(var perm in perms){
                var el = $('div[name="interface-'+ this.id +'"] input[name="'+ perm +'"]');
                newPerms[perm] = el.prop('checked');
            }
            
            this.Core.Events.emit('ALLIANCE:SET_PERMS', {
                userid  : this.userid,
                perms   : newPerms
            });
        }
    }
    
    alliance_user.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance_user'] = alliance_user;
})();