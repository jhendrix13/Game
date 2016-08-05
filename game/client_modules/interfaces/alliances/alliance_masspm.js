/*
 *  CLIENT
 */

(function(){
    function alliance_masspm(Core, userid){
        this.Core = Core;
        this.id = 'alliance_masspm';
        
        this.userid = userid;
        
        this.data = {};
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    alliance_masspm.prototype.load = function(){
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
            
            if(perms.can_mass_pm){
                html += 'Send a message to all of your alliance members.';
                html += '<table style="margin-top:30px;">'
                html += '<tr><td>Title</td><td><input type="text" name="title"></td></tr>';
                html += '<tr><td>Content</td><td><textarea name="content" style="height:230px;width:350px;" placeholder="Content of your message..." maxlength="500"></textarea></td></tr>';
                html += '</table>';
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
            html += '<button name="nav-send" class="alliBigButton">Send Message</button>';
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
    
    alliance_masspm.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        //unload on exit or transition
        if(['send'].indexOf(name) === -1){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }
        
        switch(name){
            case 'back':
                this.Core.InterfaceManager.loadInterface('alliance');
                break;
            case 'send':
                this.sendMessage();
                break;
        }
    }
    
    alliance_masspm.prototype.sendMessage = function(){
        var title_div = $('div[name="interface-'+ this.id +'"] input[name="title"]');
        var content_div = $('div[name="interface-'+ this.id +'"] textarea[name="content"]');
        
        var title = title_div.val();
        var content = content_div.val();
        
        var err = this.validateMessage(title, content);
        
        if(!err){
            this.Core.Events.emit('ALLIANCE:MASS_MSG', {
                title : title,
                content : content
            });
            
            //clear form
            title_div.val('');
            content_div.val('');
        }else{
            this.Core.Gui.popup(0, 'Error', err);
        }
    }
    
    alliance_masspm.prototype.validateMessage = function(title, content){
        if(title.length > 55){
            return 'Subject length cannot be greater than 55 characters.';
        }
        
        if(title.length < 3){
            return 'Subject length cannot be less than 3 characters.';
        }
        
        if(content.length <= 0){
            return 'Message content cannot be empty.';
        }
        
        if(content.length > 1500){
            return 'Message content length cannot be greater than 1,500 characters.';
        }
        
        return false;
    }
    
    alliance_masspm.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance_masspm'] = alliance_masspm;
})();