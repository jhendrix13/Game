/*
 *  CLIENT
 */

(function(){
    function alliance(Core){
        this.Core = Core;
        this.id = 'alliance';
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    alliance.prototype.load = function(){
        var Player = this.Core.Player;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:700px;">';
            html += '<div class="title">Alliance Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //left side
            html += '<div style="width:70%;float:left;">';
            html += '<div style="margin:6px;">';
            
            //main content
            html += '<div name="main_content">';
            
            if(Player.alliance){
                var data = Player.alliance_data;
                var perms = Player.alliance_perms;
                
                //LOADING
                html += '<div name="loading_data">Please wait ... loading alliance data.</div>';

                html += '<div name="alliance_data" class="hidden">';
                html += '<img src="game/resources/images/flags/flag_default.png" width="120" height="80" style="border:1px solid black;float:left;margin-right:7px;">';
                html += '<div name="float:left;">';

                //flag
                html += '<span name="alliance_name" style="font-size:23px;display:block;"></span>';

                html += '<table cellpadding="3" style="font-size:14px;">';

                //basic info
                html += '<tr><td>Leader</td><td name="alliance_leader"></td></tr>';
                html += '<tr><td>field1</td><td name="field1"></td></tr>';
                html += '<tr><td>field2</td><td name="field2"></td></tr>';
                
                html += '</table>';
                html += '</div>';

                //MOTD
                html += '<div class="motd" style="margin-top:10px;"><div style="margin:10px;"><div style="color:white;text-align:center;">Message of the Day</div><span name="alliance_motd"></span></div></div>';

                html += '<div class="title">Alliance Details</div>';
                html += '<table name="alliance_details" cellpadding="6" style="color:white;width:100%;">';
                html += '<tr><td style="color:yellow;">Military Status</td><td>Peace</td></tr>';
                html += '<tr><td style="color:yellow;">Join Policy</td><td name="privacy"></td></tr>';
                html += '</table>';

                html += '</div>';
            }else if(Player.created_alliance){
                html += 'You have recently created an alliance. Please wait while your alliance data is created and retrieved ...';
            }else{
                html += '<div class="p-header">What is an alliance?</div>';
                html += '<p>Alliances can bring together hundreds of players into a single group. These alliances are led by the alliance officers, and their power and way into office is determined by alliance type.</p>';
                html += '<div class="p-header">Why join an alliance?</div>';
                html += '<p>Alliances are one of the largest influences on the global diplomacy of XYZ. They allow players and their cities to unite, combining their power and resources to give them extreme capabilities.</p>';
                html += '<p>It is up to the leadership and officers of an alliance to determine what is done with such power, whether it\'s projecting your power on a global scale or taking control of specific regions.</p>';
                html += '<div class="p-header">Links & Resources</div>';
                html += '<ul id="alliance_resources">';
                html += '<li><a href="#" name="docpage-alliances">Alliance Doc. Directory</a></li>';
                html += '</ul>';
            }
            
            //end main content
            html += '</div>';
            
            //page content
            html += '<div name="page_content"></div>';
            html += '</div>';
            html += '</div>';
            
            //right side
            if(Player.alliance){
                html += '<div style="width:30%;float:right;margin-bottom:25px;">';
               
                if(perms.can_set_motd){
                    html += '<button name="nav-manage" class="alliBigButton">Manage</button>';
                }
                
                if(perms.can_mass_pm){
                    html += '<button name="nav-masspm" class="alliBigButton">Mass PM</button>';
                }
                
                if(perms.can_invite_members){
                    html += '<button name="nav-invite" class="alliBigButton">Invite Members</button>';
                }
                
                if(perms.armory_can_view){
                    html += '<button name="nav-armory" class="alliBigButton">Armory</button>';
                }
                
                if(perms.treasury_can_view){
                    html += '<button name="nav-treasury" class="alliBigButton">Treasury</button>';
                }
                
                html += '<button name="nav-members" class="alliBigButton">Members</button>';
                html += '<button name="nav-donate" class="alliBigButton">Donate</button>';
                html += '<button name="nav-leave" class="alliBigButton">Leave</button>';
                html += '<button name="exit" class="alliBigButton">Exit</button>';
                html += '</div>';
            }else{
                html += '<div style="width:30%;float:right;margin-bottom:25px;">';
                html += '<button name="nav-create" class="alliBigButton">Create</button>';
                html += '<button name="nav-rankings" class="alliBigButton">Rankings</button>';
                html += '<button name="nav-invites" class="alliBigButton">My Invites ('+ Player.alliance_invites.length +')</button>';
                html += '<button name="exit" class="alliBigButton">Exit</button>';
                html += '</div>';
            }
            
            html += '<div class="clear"></div>';
            
            if(Player.alliance){
                html += '<div style="margin-top:10px;font-size:12px;color:grey;">* this page is cached, updated every few minutes</div>';
            }
            
            html += '</div></div>';
            
            
        $('body').append(html);
        
        //load alliance data
        if(Player.alliance){
            this.getAllianceData();
        }
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="return_home"]', this.returnHome.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] a[name|="docpage"]', this.loadDocPage.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]', this.buttonPressed.bind(this));
    }
    
    alliance.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        //unload
        this.Core.InterfaceManager.unloadInterface(this.id);
        
        switch(name){
            case 'create':
                this.Core.InterfaceManager.loadInterface('alliance_create');
                break;
            case 'manage':
                this.Core.InterfaceManager.loadInterface('alliance_manage');
                break;
            case 'donate':
                this.Core.InterfaceManager.loadInterface('alliance_donate');
                break;
            case 'members':
                this.Core.InterfaceManager.loadInterface('alliance_members');
                break;
            case 'invite':
                this.Core.InterfaceManager.loadInterface('alliance_invite');
                break;
            case 'leave':
                this.Core.InterfaceManager.loadInterface('alliance_leave');
                break;
            case 'masspm':
                this.Core.InterfaceManager.loadInterface('alliance_masspm');
                break;
            case 'invites':
                this.Core.InterfaceManager.loadInterface('alliance_invites');
                break;
        }
    }
    
    alliance.prototype.returnHome = function(e){
        e.preventDefault();
        
        $('div[name="interface-'+ this.id +'"] div[name="page_content"]').hide(0);
        $('div[name="interface-'+ this.id +'"] div[name="main_content"]').show(0);
    }
    
    alliance.prototype.loadDocPage = function(e){
        e.preventDefault();
        
        var page_path = $(e.target).attr('name').split('-')[1];
        
        if(page_path.indexOf('/') === -1){
            page_path += '/index';
        }
        
        var url = this.Core.doc_directory + page_path +'.php';
        
        if(!this.lastDocRequest){
            this.lastDocRequest = 0;
        }
        
        var self = this;
        var d = Date.now();
        if(d - this.lastDocRequest > 1000){
            this.lastDocRequest = d;
            
            $.ajax({
                url : url,
                type : 'GET',
                success : function(html){
                    html += '<br/><button name="return_home" style="margin-top:15px;height:25px;float:none;">&laquo; Back</button>';
                    
                    $('div[name="interface-'+ self.id +'"] div[name="main_content"]').hide(0);
                    $('div[name="interface-'+ self.id +'"] div[name="page_content"]').html(html);
                    $('div[name="interface-'+ self.id +'"] div[name="page_content"]').show(0);
                }
            });
        }
    }
    
    alliance.prototype.getAllianceData = function(){
        var Player = this.Core.Player;
        
        var d = Date.now();
        var cooldown = this.Core.Game.gameCfg.alliance_request_page_cooldown * 1000;
        
        //can only request so often!
        if(d - Player.allianceLastLoadRequest > cooldown){
            //request most recent alliance data.
            this.Core.Events.emit('ALLIANCE:GET_MY_ALLIANCE', true);
            
            Player.allianceLastLoadRequest = d;
        }else if(Player.alliance_data){
            this.loadAllianceData(Player.alliance_data);
        }
    }
    
    alliance.prototype.loadAllianceData = function(data){
        var Player = this.Core.Player;
        var privacy = (data.privacy === 0) ? 'Public' : 'Private';

        $('div[name="interface-'+ this.id +'"] div[name="main_content"] div[name="loading_data"]').hide(0);

        $('div[name="interface-'+ this.id +'"] div[name="main_content"] div[name="alliance_data"] span[name="alliance_name"]').text(fn_htmlEnc(data.name));
        $('div[name="interface-'+ this.id +'"] div[name="main_content"] div[name="alliance_data"] span[name="alliance_motd"]').text(fn_htmlEnc(data.motd));
        $('div[name="interface-'+ this.id +'"] div[name="main_content"] div[name="alliance_data"] td[name="alliance_leader"]').text(fn_htmlEnc(data.leader_username));

        $('div[name="interface-'+ this.id +'"] div[name="main_content"] table[name="alliance_details"] td[name="privacy"]').text(privacy);

        $('div[name="interface-'+ this.id +'"] div[name="main_content"] div[name="alliance_data"]').show(0);
        
        if(Player.alliance_rank === 'leader' && data.reps.length < 4){
            $('div[name="interface-'+ this.id +'"] button[name="nav-appoint"]').show(0);
        }
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    alliance.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="return_home"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] a[name|="docpage"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance'] = alliance;
})();