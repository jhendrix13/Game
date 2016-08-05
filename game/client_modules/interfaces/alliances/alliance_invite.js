/*
 *  CLIENT
 */

(function(){
    function alliance_invite(Core, userid){
        this.Core = Core;
        this.id = 'alliance_invite';
        
        this.userid = userid;
        
        //current page
        this.page = 1;
        
        //store id of clicked user
        this.clicked_user = 0;
        
        //current search data
        this.search_type = '';
        this.search_query = '';
        
        //cache member page results
        this.pages = {};
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    alliance_invite.prototype.load = function(){
        var Player = this.Core.Player;
        var perms = Player.alliance_perms;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:925px;">';
            html += '<div class="title">Alliance Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //left side
            html += '<div style="width:70%;float:left;">';
            html += '<div style="margin:6px;">';
            
            //main content
            html += '<div name="main_content">';
            
            if(Player.alliance_leader || perms.can_invite_members){
                html += 'To invite a user to your alliance, search for their username below, then invite them.<br/><br/>';
                html += '<input type="text" name="username" style="padding:6px;"> <button name="search" style="float:none;" class="field_padding">Search Users</button>';
                
                html += '<div name="users">';
                html += '</div>';

                html += '<div name="pagination">';
                html += '</div>';
                html += '</div>';
            }else{
                html += 'You do not have the rights to access this page.';
            }
            
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
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="search"]', this.search.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] a[name|="action"]', this.handleAction.bind(this));
    }
    
    alliance_invite.prototype.getUsersHTML = function(users){
        var per_page = this.Core.Game.gameCfg.alliance_members_per_page;
        
        var html = '<table cellpadding="6">';
            html += '<tr style="color:white;text-align:center;"><th>#</th><th>Username</th><th>Nation</th><th>Capital</th><th>Member Since</th></tr>';
        
        for(var i = 0; i < users.length; i++){
            var data = users[i];
            var pos = ( i + ( per_page*( this.page - 1 ) ) ) + 1;
            
            html += '<tr name="user-'+ data.id +'">';
            html += '<td>'+ pos +'</td><td><a href="#" name="user-'+ data.id +'" style="color:orangered;">'+ fn_htmlEnc(data.username) +'</a></td>';
            html += '<td>'+ fn_htmlEnc(data.nation) +'</td><td>'+ fn_htmlEnc(data.capital) +'</td><td>Oct. 12th, 1997</td>';
            html += '<td style="font-size:13px;color:orangered;">';
            
            html += '<a href="#" name="action-invite" style="color:orangered;">[INVITE]</a>';
            
            html += '</td>';
            html += '</tr>';
        }
        
        html += '</table>';
        
        return html;
    }
    
    alliance_invite.prototype.getPaginationHTML = function(page, pages){
        var html = '<ul class="inline">';
            html += '<li style="margin-right:5px;">Page</li>';
            
        //pagination
        for(var i = 1; i <= pages; i++){
            var style = (i === this.page) ? 'pagination selected' : 'pagination';

            html += '<li name="page-'+ i +'" class="'+ style +'">'+ i +'</li>';
        }
        
        html += '</ul>';
        
        return html;
    }
    
    alliance_invite.prototype.loadUserResults = function(data){
        //set flag to false. no longer awaiting response from server.
        this.waiting = false;
        
        //current page
        this.page = data.page;
        
        //cache page
        this.pages[data.page] = data;
        
        if(data.users.length > 0){
            var usersHTML = this.getUsersHTML(data.users);
            var paginationHTML = this.getPaginationHTML(data.page, data.pages);

            $('div[name="interface-'+ this.id +'"] div[name="users"]').html(usersHTML);
            $('div[name="interface-'+ this.id +'"] div[name="pagination"]').html(paginationHTML);
        }else{
            $('div[name="interface-'+ this.id +'"] div[name="users"]').html('<p>No users matched the search criteria.</p>');
        }
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    alliance_invite.prototype.search = function(){
        var username = $('div[name="interface-'+ this.id +'"] input[name="username"]').val();
        
        if(!this.waiting){
            if(username.length > 2){
                this.Core.Events.emit('ALLIANCE:INVITE_SEARCH', {
                    page : this.page,
                    search_query : username
                });
            }else{
                this.Core.Gui.popup(0, 'Error', 'Username must be at least 4 characters.');
            }
        }else{
            this.Core.Gui.popup(0, 'Error', 'Cannot complete this action while still awaiting a server response.');
        }
    }
    
    alliance_invite.prototype.inviteUser = function(userid){
        this.Core.Events.emit('ALLIANCE:INVITE_USER', {
            userid : userid
        });
    }
    
    alliance_invite.prototype.handleInviteResponse = function(data){
        if(data.error){
            this.Core.Gui.popup(0, 'Error', data.error);
        }else{
            this.Core.Gui.popup(0, 'Invited Player', 'You have successfully invited this player to your alliance.');
        }
    }
    
    alliance_invite.prototype.handleAction = function(e){
        var target = $(e.target);
        var action = target.attr('name').split('-')[1];
        
        var userid = parseInt(target.closest('tr').attr('name').split('-')[1]);
        
        //close this interface
        //this.Core.InterfaceManager.unloadInterface(this.id);
        
        switch(action){
            case 'invite':
                this.inviteUser(userid);
                break;
        }
    }
    
    alliance_invite.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        //unload on exit or transition
        this.Core.InterfaceManager.unloadInterface(this.id);
        
        switch(name){
            case 'back':
                this.Core.InterfaceManager.loadInterface('alliance');
                break;
        }
    }
    
    alliance_invite.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="search"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] a[name|="action"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance_invite'] = alliance_invite;
})();