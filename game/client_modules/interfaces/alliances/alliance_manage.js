/*
 *  CLIENT
 */

(function(){
    function alliance_manage(Core){
        this.Core = Core;
        this.id = 'alliance_manage';
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    alliance_manage.prototype.load = function(){
        var access = false;
        
        var Player = this.Core.Player;
        var perms = Player.alliance_perms;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:700px;">';
            html += '<div class="title">Alliance Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //left side
            html += '<div style="width:70%;float:left;">';
            html += '<div style="margin:6px;">';
            
            //mainc content
            html += '<div name="main_content">';
            
            
            if(Player.alliance && (Player.alliance_leader || perms.can_set_motd)){
                var data = Player.alliance_data;
                
                if(data){
                    access = true;
                    
                    html += '<table cellpadding="6">';
                    
                    html += '<tr><td>Name</td><td><input type="text" name="name" value="'+ fn_htmlEnc(data.name) +'" style="padding:6px;" '+ ((!Player.alliance_leader) ? 'disabled' : '') +'></td></tr>';
                    html += '<tr><td>Privacy</td><td><select name="privacy" class="field_padding" '+ ((!Player.alliance_leader) ? 'disabled' : '') +'><option value="0" '+ ((data.privacy === 0) ? 'selected' : '') +'>Public</option><option value="1" '+ ((data.privacy === 1) ? 'selected' : '') +'>Private</option></select></td></tr>';
                    
                    html += '<tr><td>MOTD</td><td><textarea name="motd" style="width:280px;height:120px;" maxlength="300" class="field_padding">'+ fn_htmlEnc(data.motd) +'</textarea></td></tr>';
                    html += '</table>';
                    html += '<div name="error" style="color:red;"></div>';
                }else{
                    html += 'Alliance data has not been loaded. Please go back and try again.';
                }
            }else{
                html += 'You cannot access this interface.';
            }
            
            html += '</div>';
            
            //page content
            html += '<div name="page_content"></div>';
            html += '</div>';
            html += '</div>';
            
            //right side
            html += '<div style="width:30%;float:right;margin-bottom:25px;">';
            
            if(access){
                html += '<button name="nav-update" class="alliBigButton">Update</button>';
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
    }
    
    alliance_manage.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        //unload
        if(name !== 'update'){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }
        
        switch(name){
            case 'back':
                this.Core.InterfaceManager.loadInterface('alliance');
                break;
            case 'update':
                this.updateInfo();
                break;
        }
    }
    
    alliance_manage.prototype.updateInfo = function(){
        var Player = this.Core.Player;
        
        var name = $('div[name="interface-'+ this.id +'"] div[name="main_content"] input[name="name"]').val();
        var privacy = $('div[name="interface-'+ this.id +'"] div[name="main_content"] select[name="privacy"]').val();
            privacy = (parseInt(privacy) === 1) ? 1 : 0;
        var motd = $('div[name="interface-'+ this.id +'"] div[name="main_content"] textarea[name="motd"]').val();
        var err = $('div[name="interface-'+ this.id +'"] div[name="error"]');
        
        if(name.length > 25 || name.length < 3){
            err.html('Alliance name must be 3 characters or more, and must be less than or equal to 25 characters.');
        }else if(motd.length > 300){
            err.html('MOTD cannot be greater than 300 characters.');
        }else{
            err.html('');
            
            //submit
            this.Core.Events.emit('ALLIANCE:UPDATE_ALLIANCE', {
                name    : name,
                privacy : privacy,
                motd    : motd
            });
            
            //update client data
            Player.alliance_data.name = name;
            Player.alliance_data.motd = motd;
            Player.alliance_data.privacy = privacy;
            
            $('div[name="interface-'+ this.id +'"] button[name="nav-update"]').hide(0);
            $('div[name="interface-'+ this.id +'"] div[name="main_content"]').html('Your alliance data has been updated. Please wait a few minutes for the changes to update for everyone.');
        }
    }
    
    alliance_manage.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance_manage'] = alliance_manage;
})();