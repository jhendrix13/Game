/*
 *  CLIENT
 */

(function(){
    function alliance_create(Core){
        this.Core = Core;
        this.id = 'alliance_create';
        
        this.fee_agreed = false;
        this.at_register_screen = false;
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    alliance_create.prototype.load = function(){
        var Player = this.Core.Player;
        var city = this.Core.Player.cities[Player.current_city];
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:700px;">';
            html += '<div class="title">Alliance Center</b></div>';
            html += '<div style="margin:10px;">';
            
            //left side
            html += '<div style="width:70%;float:left;">';
            html += '<div style="margin:6px;">';
            
            //main content
            if(!Player.alliance){
                if(!Player.created_alliance){
                    var fee = this.Core.Game.gameCfg.alliance_creation_fee;
                
                    html += '<div name="main_content">'

                    //FEE WARNING
                    html += '<div name="fee_warning">';

                    if(city.resources.money >= fee){
                        html += '<p>Before registering your alliance, you must pay a <span style="color:white;">$'+ fn_numberFormat(fee) +'</span> fee to the World Bank. ';
                        html += 'The money will be withdrawn from your account automatically.</p>';
                        html += '<p><input name="fee_agree" type="checkbox"> I agree to pay the fee to the World Bank</p>';
                    }else{
                        html += 'In order to create an alliance, you need to pay a <span style="color:white;">$'+ fn_numberFormat(fee) +'</span> fee to the World Bank. You do not have the necessary money to cover this fee.';
                    }

                    html += '</div>';

                    //REGISTRATION FORM
                    html += '<div name="registration" class="hidden">';

                    html += '<table cellpadding="6">';
                    html += '<tr><td>Alliance Name</td><td><input name="alliance_name" type="text" maxlength="25" style="padding:6px;"></td></tr>';
                    html += '<tr><td>Privacy</td><td><select name="privacy" class="field_padding"><option value="0">Public</option><option value="1">Private</option></select></td></tr>';
                    html += '</table>';
                    html += '<div name="error" style="color:red;"></div>';

                    //registration div ending
                    html += '</div>';

                    //main ending
                    html += '</div>';
                }else{
                    html += 'You have recently created an alliance. Please wait for the server to process the registration of your alliance.';
                }
            }else{
                html += '<div name="main_content">'
                html += 'You cannot create an alliance while you are in an alliance.';
                html += '</div>';
            }
            
            //page content
            html += '<div name="page_content"></div>';
            html += '</div>';
            html += '</div>';
            
            //right side
            html += '<div style="width:30%;float:right;margin-bottom:25px;">';
            html += '<button name="nav-continue" class="alliBigButton hidden">Continue</button>';
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
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name="fee_warning"] input[name="fee_agree"]', this.agreeToFee.bind(this));
    }
    
    alliance_create.prototype.agreeToFee = function(){
        if(!this.fee_agreed){
            $('button[name="nav-continue"]').show(0);
            $('button[name="nav-continue"]').effect('highlight', 2000);
            
            this.fee_agreed = true;
        }else{
            $('button[name="nav-continue"]').hide(0);
            
            this.fee_agreed = false;
        }
    }
    
    alliance_create.prototype.buttonPressed = function(e){
        var name = $(e.target).attr('name').split('-')[1];
        
        //unload
        if(name !== 'continue'){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }
        
        switch(name){
            case 'back':
                this.Core.InterfaceManager.loadInterface('alliance');
                break;
            case 'continue':
                if(!this.at_register_screen){
                    $('div[name="interface-'+ this.id +'"] div[name="fee_warning"]').hide(0);
                    $('div[name="interface-'+ this.id +'"] div[name="registration"]').show(0);
                    $('div[name="interface-'+ this.id +'"] button[name="nav-continue"]').text('Complete');

                    this.at_register_screen = true;
                }else{
                    this.submitRegistration();
                }
                
                break;
        }
    }
    
    alliance_create.prototype.submitRegistration = function(){
        var alliance_name = $('div[name="interface-'+ this.id +'"] div[name="registration"] input[name="alliance_name"]').val().trim();
        var alliance_privacy = $('div[name="interface-'+ this.id +'"] div[name="registration"] select[name="privacy"]').val();
        var err = $('div[name="interface-'+ this.id +'"] div[name="registration"] div[name="error"]');

        if(alliance_name.length < 3){
            err.html('Alliance name must be at least 3 characters.');
        }else if(alliance_name.length > 25){
            err.html('Alliance name cannot be greater than 25 characters.');
        }else{
            var Player = this.Core.Player;
            var city = this.Core.Player.cities[Player.current_city];
            var fee = this.Core.Game.gameCfg.alliance_creation_fee;

            this.Core.Events.emit('ALLIANCE:CREATE_ALLIANCE', {
                city_id         : city.city_id,
                alliance_name   : alliance_name,
                alliance_privacy   : alliance_privacy
            });

            //subtract resources
            Player.subResource(city.city_id, 'money', fee);
            Player.updateResources(city.city_id);
            
            //set player flag
            Player.created_alliance = true;
            
            var successMessage = 'Your alliance has been registered, and the payment to the World Bank has been deducted from your cities\' treasury.';
            
            $('div[name="interface-'+ this.id +'"] div[name="registration"]').html(successMessage);
            $('div[name="interface-'+ this.id +'"] button[name="nav-continue"]').hide(0);
        }
    }
    
    alliance_create.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="exit"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="nav"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name="fee_warning"] input[name="fee_agree"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['alliance_create'] = alliance_create;
})();