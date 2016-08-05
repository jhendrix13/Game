/*
 *  CLIENT
 */

(function(){
    function alliance_invites(Core, userid){
        this.Core = Core;
        this.id = 'alliance_invites';
        
        this.userid = userid;
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    alliance_invites.prototype.load = function(){
        var Player = this.Core.Player;
        var invites = Player.alliance_invites;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:750px;">';
            html += '<div class="title">Alliance Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //left side
            html += '<div style="width:70%;float:left;">';
            html += '<div style="margin:6px;">';
            
            //main content
            html += '<div name="main_content">';
            html += '<p>Your alliance invites:</p>';
            html += '<ul>';
            
            for(var i = 0; i < invites.length; i++){
                var invite = invites[i];
                html += '<li>'+ invite.allianceID +' <a href="#" name="join-'+ invite.allianceID +'">[JOIN ALLIANCE]</a></li>';
            }
            
            html += '</ul>';
            html += '</div>';
            
            //page content
            html += '<div name="page_content"></div>';
            html += '</div>';
            html += '</div>';
            
            //right side
            html += '<div style="width:30%;float:right;margin-bottom:25px;">';
            
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
        $(document).on('click', 'div[name="interface-'+ this.id +'"] a[name|="join"]', this.acceptInvite.bind(this));
    }
    
    alliance_invites.prototype.acceptInvite = function(e){
        var self = this;
        
        this.Core.Gui.popup(0, 'Confirm', 'Are you sure you wish to join this alliance?', {
            buttons : [
                ['Accept', function(){
                    var id = parseInt($(e.target).attr('name').split('-')[1]);
        
                    //request most recent alliance data.
                    self.Core.Events.emit('ALLIANCE:ACCEPT_INVITE', id);
                }],
                ['Cancel']
            ]
        });
    }
    
    alliance_invites.prototype.handleAcceptResponse = function(data){
        if(data.error){
            this.Core.Gui.popup(0, 'Error', data.error);
        }else{
            this.Core.Gui.popup(0, 'Accepted Invite', 'You have successfully accepted the invite and joined the alliance.');
        }
    }
    
    alliance_invites.prototype.buttonPressed = function(e){
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
    
    alliance_invites.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] a[name|="join"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance_invites'] = alliance_invites;
})();