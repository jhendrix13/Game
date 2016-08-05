/*
 *  CLIENT
 */

(function(){
    function my_messages(Core, username, x){
        this.Core = Core;
        this.id = 'my_messages';
        
        this.inbox_page = 1;
        this.inbox_filter = false;
        
        this.sent_page = 1;
        this.sent_filter = false;
        
        //if set
        this.target_user = (username) ? username : '';
        
        //max messages per page
        this.per_page = 8;
        
        this.msg_types = {
            0 : 'Normal',
            1 : 'Alliance',
            2 : 'System'
        };
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    my_messages.prototype.load = function(){
        var Player = this.Core.Player;
        
        var unread = Player.getNumUnreadMessages();
        
        var inbox = Player.messages.inbox;
        var inbox_amount = inbox.length;
        var inbox_max = this.Core.Game.gameCfg.message_center_inbox_max;
        
        var failed_messages = Player.failed_messages;
        var num_failed_messages = failed_messages.length;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:750px;">';
            html += '<div class="title">Message Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //top info
            html += '<div name="info">';
            html += '<div style="float:left;">Welcome <span style="color:white;font-weight:bold;">'+ fn_htmlEnc(Player.username) +'</span>! You have '+ unread +' new messages.</span></div>';
            html += '<div style="float:right;padding:4px;background-color:black;border:1px solid yellow;">INBOX '+ inbox_amount +'/'+ inbox_max +'</div>';
            html += '<div class="clear"></div>';
            html += '</div>';
            
            //spacer
            html += '<div name="spacer" style="margin-bottom:30px;"></div>';
            
            //tabs
            html += '<div name="tab_selection" class="tabs">';
            html += '<div name="tab-inbox" class="tab">Inbox <span name="unread_messages" style="color:orangered;font-weight:bold;">';
        
            if(unread > 0){
                html += unread;
            }
        
            html += '</span></div>';
            html += '<div name="tab-sent" class="tab">Sent</div>';
            html += '<div name="tab-create" class="tab">Create Message</div>';
            html += '<div name="tab-failed" class="tab" style="display:none;">Failed Messages <span name="failed_messages" style="color:orangered;font-weight:bold;">'+ num_failed_messages +'</div>';
            html += '</div>';
            
            /* INBOX */
            html += '<div name="content-inbox">';
            
            html += '<div name="messages">'+this.getInboxHTML(this.inbox_page,false)+'</div>';
            
            //pagination
            
            
            //filter & action selection
            html += '<div style="width:100%;">';
            html += '<div style="float:left;">';
            html += 'Message filter <select name="filter" class="field_padding" style="margin-top:25px;">';
            html += '<option value="all">All</option>';
            html += '<option value="0">Normal</option>';
            html += '<option value="1">Alliance</option>';
            html += '<option value="2">System</option>';
            html += '</select>';
            html += '</div>';
            
            html += '<div style="float:right;">';
            html += 'Action for selected <select name="action" class="field_padding" style="margin-top:25px;">';
            html += '<option value="mark_read">Mark Read</option>';
            html += '<option value="mark_unread">Mark Unread</option>';
            html += '<option value="delete">Delete</option>';
            html += '<option value="report">Report</option>';
            html += '</select>';
            html += '<button name="action_go" style="float:none;padding:6px;">GO</button>';
            html += '</div>';
            
            html += '<div class="clear"></div>';
            html += '</div>';
            
            html += '</div>';
            
            /*END INBOX*/
            
            /* SENT */
            html += '<div name="content-sent" class="hidden">';
            
            html += '<div name="messages">'+this.getSentHTML(this.sent_page,false)+'</div>';
            
            //pagination
            
            //filter & action selection
            html += '<div style="width:100%;">';
            html += '<div style="float:left;">';
            html += 'Message filter <select name="filter" class="field_padding" style="margin-top:25px;">';
            html += '<option value="all">All</option>';
            html += '<option value="0">Normal</option>';
            html += '<option value="1">Alliance</option>';
            html += '</select>';
            html += '</div>';
            
            html += '<div style="float:right;">';
            html += 'Action for selected <select name="action" class="field_padding" style="margin-top:25px;">';
            html += '<option value="delete">Delete</option>';
            html += '</select>';
            html += '<button name="action_go" style="float:none;padding:6px;">GO</button>';
            html += '</div>';
            
            html += '<div class="clear"></div>';
            html += '</div>';
            
            html += '</div>';
            
            html += '</div>';
            /* END SENT*/
            
            /* CREATE MESSAGE */
            
            html += '<div name="content-create" style="margin:6px;" class="hidden">';
            html += '<table style="width:100%;">';
            html += '<tr><td colspan="2"><span name="error_msg" style="color:red;"></span></td></tr>';
            
            var toValue = (this.target_user.length > 0) ? fn_htmlEnc(this.target_user) : '';
            
            html += '<tr><td>To</td><td><input type="text" name="to" size="15" class="field_padding" maxlength="12" value="'+ toValue +'"></td></tr>';
            html += '<tr><td>Subject</td><td><input type="text" name="subject" size="40" class="field_padding" maxlength="55"></td></tr>';
            html += '<tr><td>Message<br/>Content</td><td><textarea name="content" style="height:230px;width:450px;" placeholder="Content of your message..." maxlength="500"></textarea></td></tr>';
            html += '<tr><td></td><td><button name="send" style="float:none;margin:0;width:456px;padding:8px;">Send Message</button></td></tr>';
            html += '</table>';
            html += '</div>';
            
            /* END CREATE MESSAGE */
            
            /* FAILED MESSAGES */
            html += '<div name="content-failed" style="margin:6px;" class="hidden">';
            html += '<div name="messages">'+this.getFailedHTML()+'</div>';
            html += '</div>';
             
            /* END FAILED MESSAGES */
            
            /* MESSAGE VIEWER */
            html += '<div name="content-view_message" style="margin:6px;" class="hidden message">';
            
            //LEFT PANEL
            html += '<div class="leftPanel">';
            html += '<div name="user_info" class="leftPanelContent"></div>';
            html += '</div>';
            
            //RIGHT PANEL
            html += '<div class="rightPanel">';
            html += '<div name="msg_content" class="rightPanelContent">';
            html += '<div name="date" class="msgDate"></div>';
            html += '<div name="msgContent" class="msgContent">fdsfdsfsfsdff</div>';
            html += '</div>';
            html += '</div>';
            
            html += '<div class="clear"></div>';
            html += '</div>';
            
            /* END MESSAGE VIEWER */
              
            html += '<div style="margin-right:6px;margin-top:8px;"><button name="ok">Ok</button></div>';
            html += '</div></div>';
            
            
        $('body').append(html);
        
        if(num_failed_messages > 0){
            $('div[name="interface-'+ this.id +'"] div[name="tab-failed"]').show(0);
        }
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="send"]', this.sendMessage.bind(this));
        $(document).on('change', 'div[name="interface-'+ this.id +'"] input[name="mark_all"]', this.markAll.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="action_go"]', this.executeAction.bind(this));
        $(document).on('change', 'div[name="interface-'+ this.id +'"] select[name="filter"]', this.changeFilter.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="open"]', this.openMessage.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="pagination"] li[name|="page"]', this.changePange.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        
        if(this.target_user.length > 0){
            this.showTab(null, 'create');
        }
    }
    
    my_messages.prototype.openMessage = function(e){
        var Player = this.Core.Player;
        
        var msg_tr = $(e.target).closest('tr');
        var msg_id = parseInt(msg_tr.attr('name').split('-')[1]);
        var msg = Player.getMessageById(msg_id);
        
        if(msg){
            if(msg.global || msg.type === 2){
                username = '<b>SYSTEM</b>';
                content = msg.content;
            }else{
                username = '<b>'+ fn_htmlEnc(msg.sender_username) +'</b>';
                content = fn_htmlEnc(msg.content);
            }
            
            $('div[name="content-view_message"] div[name="user_info"]').html(username);
            $('div[name="content-view_message"] div[name="date"]').html(msg.create_date);
            $('div[name="content-view_message"] div[name="msgContent"]').html(content);
            
            //show message
            this.showTab(null, 'view_message');
            
            //mark as read
            if(!msg.hasRead){
                if(this.markRead(msg_id, true)){
                    //send read report to server
                    this.Core.Events.emit('MSGCENTER:MESSAGE_READ', msg_id);
                }
            }
        }
    }
    
    my_messages.prototype.validateMessage = function(to, subject, content){
        if(content.length <= 0){
            return 'Message content cannot be empty.';
        }
        
        if(content.length > 1500){
            return 'Message content length cannot be greater than 1,500 characters.';
        }
        
        if(to.length > 12){
            return 'Target username cannot be greater than 12 characters.';
        }
        
        if(to.length <= 0){
            return 'Target username cannot be empty.';
        }
        
        if(to === this.Core.Player.username){
            return 'You cannot send a message to yourself.';
        }
        
        if(subject.length > 55){
            return 'Subject length cannot be greater than 55 characters.';
        }
        
        if(subject.length < 3){
            return 'Subject length cannot be less than 3 characters.';
        }
        
        return false;
    }
    
    my_messages.prototype.sendMessage = function(){
        var to_input = $('div[name="interface-'+ this.id +'"] div[name="content-create"] input[name="to"]');
        var subject_input = $('div[name="interface-'+ this.id +'"] div[name="content-create"] input[name="subject"]');
        var content_input = $('div[name="interface-'+ this.id +'"] div[name="content-create"] textarea[name="content"]');
        
        var to = to_input.val();
        var subject = subject_input.val();
        var content = content_input.val();
        
        var err = this.validateMessage(to, subject, content);
        
        if(!err){
            //validated
            this.setCreateMessageError('');
            
            //send message
            this.Core.Events.emit('MSGCENTER:SEND_MESSAGE', {
                to : to,
                subject : subject,
                content : content,
                type : 0
            });
            
            //clear form
            to_input.val('');
            subject_input.val('');
            content_input.val('');
        }else{
            this.setCreateMessageError(err);
        }
    }
    
    my_messages.prototype.getInboxHTML = function(page){
        var inbox = this.Core.Player.messages.inbox;
        var messages = [];
        
        //if a filter is applied, get the actual # of messages
        var filter = this.inbox_filter;
        for(var i = 0; i < inbox.length; i++){
            if(filter === false || (inbox[i].type === filter)){
                messages.unshift(inbox[i]);
            }
        }
        
        //# of messages
        var amount = messages.length;
        
        //total pages
        var pages = Math.ceil(amount/this.per_page);
        
        //start,stop index
        var start = ((page - 1) * this.per_page);
        var end = start + this.per_page;
        
        if(end > amount){
            end = amount;
        }
        
        var html = '<table name="type-inbox" cellpadding="5" cellspacing="1" style="width:100%;text-align:center;" class="msgTable">';
        
        if(amount > 0){
            html += '<tr style="color:white;"><th><input name="mark_all" type="checkbox"></th><th>Type</th><th>Received</th><th>Title</th><th>Sent By</th><th>&nbsp;</th></tr>';

            for(var i = start; i < end; i++){
                var msg = messages[i];
                
                var style = '';
                var username;

                if(!msg.hasRead){
                    style += 'font-weight:bold;';
                }

                //if is a global message (e.g.: announcement)
                if(msg.global || msg.type === 2){
                    if(msg.global){
                        style += 'background-color:#3687C1;color:#D1ECFF;';
                    }
                    
                    username = 'SYSTEM';
                    subject = msg.subject;
                }else{
                    username = fn_htmlEnc(msg.sender_username);
                    subject = fn_htmlEnc(msg.subject);
                }

                html += '<tr name="id-'+ msg.id +'" style="'+ style +'"><td><input name="id-'+ msg.id +'" type="checkbox"></td><td>'+ this.msg_types[msg.type] +'</td><td>'+ msg.create_date +'</td><td>'+ subject +'</td><td>'+ username +'</td><td><button name="open" style="width:100%;">Open</button></td></tr>';
            }
        }else{
            if(filter === false){
                html += '<tr><td>You do not have any messages in your inbox.</td></tr>';
            }else{
                html += '<tr><td>You do not have any messages with this filter.</td></tr>';
            }
        }
        
        html += '</table>';
        
        //pagination
        if(pages > 0){
            html += '<div name="pagination">';
            html += '<ul class="inline">';
            html += '<li style="margin-right:5px;">Page</li>';
            
            //pagination
            for(var i = 1; i <= pages; i++){
                var style = (i === page) ? 'pagination selected' : 'pagination';
                
                html += '<li name="page-'+ i +'" class="'+ style +'">'+ i +'</li>';
            }
            html += '</ul>';
            html += '</div>';
        }
        
        return html;
    }
    
    my_messages.prototype.getSentHTML = function(page){
        var sent = this.Core.Player.messages.sent;
        var messages = [];
        
        //if a filter is applied, get the actual # of messages
        var filter = this.sent_filter;
        for(var i = 0; i < sent.length; i++){
            if(filter === false || (sent[i].type === filter)){
                messages.unshift(sent[i]);
            }
        }
        
        //# of messages
        var amount = messages.length;
        
        //total pages
        var pages = Math.ceil(amount/this.per_page);
        
        //start,stop index
        var start = ((page - 1) * this.per_page);
        var end = start + this.per_page;
        
        if(end > amount){
            end = amount;
        }
        
        var html = '<table name="type-inbox" cellpadding="5" cellspacing="1" style="width:100%;text-align:center;" class="msgTable">';
        
        if(amount > 0){
            html += '<tr style="color:white;"><th><input name="mark_all" type="checkbox"></th><th>Sent</th><th>Title</th><th>Sent To</th></tr>';
            
            for(var i = start; i < end; i++){
                var msg = messages[i];
                html += '<tr name="id-'+ msg.id +'"><td><input name="id-'+ msg.id +'" type="checkbox"></td><td>'+ msg.create_date +'</td><td>'+ fn_htmlEnc(msg.subject) +'</td><td>'+ fn_htmlEnc(msg.receiver_username) +'</td></tr>';
            }
        }else{
            if(filter === false){
                html += '<tr><td>You do not have any sent messages.</td></tr>';
            }else{
                html += '<tr><td>You do not have any messages with this filter.</td></tr>';
            }
        }
        
        html += '</table>';
        
        //pagination
        if(pages > 0){
            html += '<div name="pagination">';
            html += '<ul class="inline">';
            html += '<li style="margin-right:5px;">Page</li>';
            
            //pagination
            for(var i = 1; i <= pages; i++){
                var style = (i === page) ? 'pagination selected' : 'pagination';
                
                html += '<li name="page-'+ i +'" class="'+ style +'">'+ i +'</li>';
            }
            html += '</ul>';
            html += '</div>';
        }
        
        return html;
    }
    
    my_messages.prototype.getFailedHTML = function(){
        var failed_messages = this.Core.Player.failed_messages;
        var num_failed_messages = failed_messages.length;
        
        var html = '<table cellpadding="5" cellspacing="1" style="width:100%;text-align:center;" class="msgTable">';
            html += '<tr style="color:white;"><th>Target</th><th>Subject</th><th>Error</th><th>&nbsp;</th></tr>';

            for(var i = 0; i < num_failed_messages; i++){
                var msg = failed_messages[i];

                html += '<tr><td>'+ fn_htmlEnc(msg.to) +'</td><td>'+ fn_htmlEnc(msg.subject) +'</td><td>'+ msg.err +'</td><td><button name="retry" style="padding:6px;float:none;">Retry</button></td></tr>';
            }

            html += '</table>';
            
        return html;
    }
    
    my_messages.prototype.changePange = function(e){
        var target = $(e.target);
        var page = parseInt(target.attr('name').split('-')[1]);
        var parent = target.closest('div[name|="content"]').attr('name').split('-')[1];
        var msg_div = $('div[name="interface-'+ this.id +'"] div[name="content-'+ parent +'"] div[name="messages"]');
        
        if(parent === 'inbox'){
            this.inbox_page = page;
            msg_div.html(this.getInboxHTML(page));
        }else if(parent === 'sent'){
            this.sent_page = page;
            msg_div.html(this.getSentHTML(page));
        }
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    my_messages.prototype.changeFilter = function(e){
        var target = $(e.target);
        var filter = target.val();
        var parent = target.closest('div[name|="content"]').attr('name').split('-')[1];
        var msg_div = $('div[name="interface-'+ this.id +'"] div[name="content-'+ parent +'"] div[name="messages"]');
        
        if(filter === 'all'){
            filter = false;
        }else{
            filter = parseInt(filter);
        }

        if(parent === 'inbox'){
            this.inbox_filter = filter;
            msg_div.html(this.getInboxHTML(1));
        }else if(parent === 'sent'){
            this.sent_filter = filter;
            msg_div.html(this.getSentHTML(1));
        }
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    my_messages.prototype.handleNewMessage = function(){
        var unread = this.Core.Player.getNumUnreadMessages();
        
        $('div[name="interface-'+ this.id +'"] div[name="content-inbox"] div[name="messages"]').html(this.getInboxHTML(1));
        $('div[name="interface-'+ this.id +'"] div[name="tab-inbox"] span[name="unread_messages"]').text(unread);
    }
    
    my_messages.prototype.handleSentMessage = function(){
        $('div[name="interface-'+ this.id +'"] div[name="content-sent"] div[name="messages"]').html(this.getSentHTML(1));
    }
    
    my_messages.prototype.handleFailedMessage = function(){
        var num_failed_messages = this.Core.Player.failed_messages.length;
        
        $('div[name="interface-'+ this.id +'"] div[name="content-failed"] div[name="messages"]').html(this.getFailedHTML());
        $('div[name="interface-'+ this.id +'"] div[name="tab-failed"] span[name="failed_messages"]').text(num_failed_messages);
        $('div[name="interface-'+ this.id +'"] div[name="tab-failed"]').show(0);
    }
    
    my_messages.prototype.markRead = function(id, status){
        var Player = this.Core.Player;
        
        //if function successful
        if(Player.markReadById(id, status)){
            //msg
            var msg_tr = $('div[name="interface-'+ this.id +'"] div[name="content-inbox"]').find('tr[name="id-'+ id +'"]');

            //read = unbold, notRead = bold
            if(msg_tr.length > 0){
                msg_tr.css('font-weight', (status) ? '' : 'bold');
            }

            //update unread msg count
            var unread = Player.getNumUnreadMessages();
            
            if(unread === 0){
                unread = '';
            }
            
            $('div[name="interface-'+ this.id +'"] div[name="tab-inbox"] span[name="unread_messages"]').text(unread);
            
            return true;
        }
        
        return false;
    }
    
    my_messages.prototype.executeAction = function(e){
        var parent = $(e.target).closest('div[name|="content"]');
        var action = parent.find('select[name="action"]').val();
        var checked = parent.find('input[type="checkbox"]:checked').not('input[name="mark_all"]');
        var ids = [];
        
        $.each(checked, function(index, obj){
            var id = parseInt($(obj).attr('name').split('-')[1]);
            ids.push(id);
        });
        
        this.Core.Events.emit('MSGCENTER:EXECUTE_ACTION', {
            action      : action,
            message_ids : ids
        });
        
        //now do it locally
        this.handleAction(ids, action);
    }
    
    my_messages.prototype.handleAction = function(ids, action){
        var Player = this.Core.Player;
        
        switch(action){
            case 'delete':
                for(var i = 0; i < ids.length; i++){
                    var id = ids[i];
                    
                    var tr = $('div[name="interface-'+ this.id +'"] tr[name="id-'+ id +'"]');
                    
                    if(tr.length > 0){
                        tr.remove();
                    }
                    
                    Player.deleteMessageById(id);
                }
                
                break;
            case 'mark_read':
                for(var i = 0; i < ids.length; i++){
                    this.markRead(ids[i], true);
                }
                
                break;
            case 'mark_unread':
                for(var i = 0; i < ids.length; i++){
                    this.markRead(ids[i], false);
                }
                break;
        }
    }
    
    my_messages.prototype.markAll = function(e){
        var checkbox = $(e.target);
        var status = checkbox.prop('checked');
        var checkboxes = checkbox.closest('div[name|="content"]').find('input[type="checkbox"]');
                
        $.each(checkboxes, function(index, obj){
            $(obj).prop('checked', status);
        });
    }
    
    my_messages.prototype.setCreateMessageError = function(err){
        $('div[name="interface-'+ this.id +'"] div[name="content-create"] span[name="error_msg"]').text(err);
    }
    
    my_messages.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    my_messages.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).closest('div[name|="tab"]').attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    my_messages.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="send"]');
        $(document).off('change', 'div[name="interface-'+ this.id +'"] input[name="mark_all"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="action_go"]');
        $(document).off('change', 'div[name="interface-'+ this.id +'"] select[name="filter"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="open"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="pagination"] li[name|="page"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['my_messages'] = my_messages;
})();