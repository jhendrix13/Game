/*
 *  CLIENT
 */

(function(){
    function alliance_members(Core){
        this.Core = Core;
        this.id = 'alliance_members';
        
        this.loaded = false;
        
        //flag true if waiting on server response
        this.waiting = false;
        
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
    
    alliance_members.prototype.load = function(){
        var Player = this.Core.Player;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:925px;">';
            html += '<div class="title">Alliance Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //left side
            html += '<div style="width:70%;float:left;">';
            html += '<div style="margin:6px;">';
            
            //mainc content
            html += '<div name="main_content">';
            
            if(Player.alliance){
                if(Player.alliance_data){
                    var perms = Player.alliance_perms;
                    
                    html += '<div name="loading">';
                    html += 'Loading member list ...';
                    html += '</div>';
                    
                    html += '<div name="loaded" class="hidden">';
                    html += '<table cellpadding="4" name="search" style="margin-bottom:10px;">';
                    html += '<tr><td>';
                    html += '<input type="text" name="search_query" style="padding:6px;width:80px;"> ';
                    html += '<select name="search_type" style="padding:6px;">';
                    html += '<option value="username" selected>By username</option><option value="nation">By nation</option><option value="city">By city</option>';
                    
                    if(perms.can_set_permissions){
                        html += '<option value="permission">By permission</option>';
                    }
                    
                    html += '</select> ';
                    html += '<button name="search" style="padding:6px;float:none;">Search</button>';
                    html += '</td>';
                    html += '<td name="clear_search" class="hidden" style="font-size:13px;"><a href="#" name="clear_search" style="color:orangered;">Clear Search</a></td></tr>';
                    html += '</table>';
                    
                    html += '<div name="members">';
                    html += '</div>';
                    
                    html += '<div name="pagination">';
                    html += '</div>';
                    html += '</div>';
                }else{
                    html += 'Alliance data not loaded. Please return to the main page of the alliance center and wait for the alliance data to load.';
                }
            }else{
                html += 'You are not in an alliance.';
            }
            
            html += '</div>';
            html += '</div>';
            html += '</div>';
            
            //right side
            html += '<div style="width:30%;float:right;margin-bottom:25px;">';
            html += '<button name="nav-back" class="alliBigButton">Back</button>';
            html += '<button name="exit" class="alliBigButton">Exit</button>';
            html += '</div>';
            
            //hidden element
            html += '<div name="action_container"></div>';
            
            html += '</div></div>';
            
            
        $('body').append(html);
        
        //load members data
        this.getMembersData(1);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]', this.buttonPressed.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] li[name|="page"]', this.pageButtonPressed.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="search"]', this.getMembersDataBySearch.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] a[name="clear_search"]', this.clearSearch.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] a[name|="action"]', this.handleAction.bind(this));
    }
    
    alliance_members.prototype.getMembersHTML = function(members){
        var per_page = this.Core.Game.gameCfg.alliance_members_per_page;
        
        var html = '<table cellpadding="6">';
            html += '<tr style="color:white;text-align:center;"><th>#</th><th>Username</th><th>Nation</th><th>Capital</th><th>Member Since</th></tr>';
        
        for(var i = 0; i < members.length; i++){
            var data = members[i];
            var pos = ( i + ( per_page*( this.page - 1 ) ) ) + 1;
            
            html += '<tr name="user-'+ data.id +'">';
            html += '<td>'+ pos +'</td><td><a href="#" name="user-'+ data.id +'" style="color:orangered;">'+ fn_htmlEnc(data.username) +'</a></td>';
            html += '<td>'+ fn_htmlEnc(data.nation) +'</td><td>'+ fn_htmlEnc(data.capital) +'</td><td>Oct. 12th, 1997</td>';
            html += '<td style="font-size:13px;color:orangered;">';
            
            html += '<a href="#" name="action-pm" style="color:orangered;">[PM]</a>';
            
            if(1===1){
                html += '<a href="#" name="action-mod" style="color:orangered;">[MOD]</a>';
            }
            
            html += '</td>';
            html += '</tr>';
        }
        
        html += '</table>';
        
        return html;
    }
    
    alliance_members.prototype.getPaginationHTML = function(page, pages){
        var html = '<ul class="inline">';
            html += '<li style="margin-right:5px;">Page</li>';
            
        //pagination
        for(var i = 1; i <= pages; i++){
            var style = (i === page) ? 'pagination selected' : 'pagination';

            html += '<li name="page-'+ i +'" class="'+ style +'">'+ i +'</li>';
        }
        
        html += '</ul>';
        
        return html;
    }
    
    alliance_members.prototype.loadAllianceMembers = function(data){
        if(!this.loaded){
            $('div[name="interface-'+ this.id +'"] div[name="loading"]').hide();
            $('div[name="interface-'+ this.id +'"] div[name="loaded"]').show();
            
            this.loaded = true;
        }
        
        //set flag to false. no longer awaiting response from server.
        this.waiting = false;
        
        //current page
        this.page = data.page;
        
        //cache page
        this.pages[data.page] = data;
        
        var membersHTML = this.getMembersHTML(data.members);
        var paginationHTML = this.getPaginationHTML(data.page, data.pages);
        
        $('div[name="interface-'+ this.id +'"] div[name="members"]').html(membersHTML);
        $('div[name="interface-'+ this.id +'"] div[name="pagination"]').html(paginationHTML);
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    alliance_members.prototype.pageButtonPressed = function(e){
        var page = parseInt($(e.target).attr('name').split('-')[1]);
        this.getMembersData(page);
    }
    
    alliance_members.prototype.handleAction = function(e){
        var target = $(e.target);
        var action = target.attr('name').split('-')[1];
        
        var userid = parseInt(target.closest('tr').attr('name').split('-')[1]);
        var username = this.getUsernameById(userid);
        
        //close this interface
        this.Core.InterfaceManager.unloadInterface(this.id);
        
        switch(action){
            case 'pm':
                this.Core.InterfaceManager.loadInterface('my_messages', username);
                break;
            case 'mod':
                this.Core.InterfaceManager.loadInterface('alliance_user', userid);
                break;
        }
    }
    
    alliance_members.prototype.getUsernameById = function(userid){
        var members = this.pages[this.page].members;
        
        for(var i = 0; i < members.length; i++){
            var data = members[i];
            
            if(data.id === userid){
                return data.username;
            }
        }
    }
    
    alliance_members.prototype.getMembersData = function(page){
        if(!this.waiting){
            if(this.search_type.length > 0 && this.search_query.length > 0){
              //request members from server
              this.Core.Events.emit('ALLIANCE:GET_MEMBERS', {
                  page            : page,
                  search_type     : this.search_type,
                  search_query    : this.search_query
              });
            }else{
              //request members from server
              this.Core.Events.emit('ALLIANCE:GET_MEMBERS', {
                  page : page
              });
            } 
        }else{
            this.Core.Gui.popup(0, 'Error', 'Cannot complete this action while still awaiting a server response.');
        }
    }
    
    alliance_members.prototype.getMembersDataBySearch = function(){
        var search_type = $('div[name="interface-'+ this.id +'"] select[name="search_type"]').val();
        var search_query = $('div[name="interface-'+ this.id +'"] input[name="search_query"]').val();
        
        if(search_query.length >= 3){
            this.search_type = search_type;
            this.search_query = search_query;
            
            $('div[name="interface-'+ this.id +'"] td[name="clear_search"]').show(0);
        }else{
            this.Core.Gui.popup(0, 'Search error', 'Your search query must be at least 3 characters.');
        }
        
        //request data from server
        this.getMembersData(1);
    }
    
    alliance_members.prototype.clearSearch = function(){
        this.search_type = '';
        this.search_query = '';
        
        $('div[name="interface-'+ this.id +'"] input[name="search_query"]').val('');
        $('div[name="interface-'+ this.id +'"] td[name="clear_search"]').hide(0);
        
        //request data from server
        this.getMembersData(1);
    }
    
    alliance_members.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        //unload
        if(name !== 'continue'){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }
        
        switch(name){
            case 'back':
                this.Core.InterfaceManager.loadInterface('alliance');
                break;
        }
    }
    
    alliance_members.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] li[name|="page"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="search"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] a[name="clear_search"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] a[name|="action"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance_members'] = alliance_members;
})();