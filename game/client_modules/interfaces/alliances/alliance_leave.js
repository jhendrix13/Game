/*
 *  CLIENT
 */

(function(){
    function alliance_leave(Core){
        this.Core = Core;
        this.id = 'alliance_leave';
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    alliance_leave.prototype.load = function(){
        var Player = this.Core.Player;
        var access = false;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:700px;">';
            html += '<div class="title">Alliance Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //left side
            html += '<div style="width:70%;float:left;">';
            html += '<div style="margin:6px;">';
            
            //mainc content
            html += '<div name="main_content">';
            
            
            if(Player.alliance){
                access = true;
                
                if(Player.alliance_leader){
                    html += 'Are you sure you wish to leave this alliance? You are the leader of your alliance. If you leave, the alliance will automatically disband.';
                    html += '<br/><br/>Any remaining troops, equipment, or money will be dissolved.';
                }else{
                    html += 'Are you sure you wish to leave this alliance?';
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
                html += '<button name="nav-leave" class="alliBigButton">Leave</button>';
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
    
    alliance_leave.prototype.leave = function(){
        var Player = this.Core.Player;
        
        var self = this;
        this.Core.Gui.popup(1, 'Are you sure?', 'Are you sure you wish to leave your alliance?', {
            buttons : [
                ['Continue', function(){
                    self.Core.Events.emit('ALLIANCE:LEAVE', true);
                    
                    Player.alliance = false;
                    Player.created_alliance = false;
                    
                    if(Player.alliance_leader){
                        Player.alliance_leader = false;
                    }
                    
                    $('div[name="interface-'+ self.id +'"] button[name="nav-leave"]').remove();
                    $('div[name="interface-'+ self.id +'"] div[name="main_content"]').html('You have left your alliance.');
                }],
                ['Cancel']
            ]
        });
    }
    
    alliance_leave.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        if(name !== 'leave'){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }
        
        switch(name){
            case 'back':
                this.Core.InterfaceManager.loadInterface('alliance');
                break;
            case 'leave':
                this.leave();
                break;
        }
    }
    
    alliance_leave.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance_leave'] = alliance_leave;
})();