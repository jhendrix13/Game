/*
 *  CLIENT
 */

(function(){
    function MainMenu(){}
    
    MainMenu.prototype.construct = function(Core){
        this.Core = Core;
        this.GUI_Elements = [];
        
        this.lastLoginAttempt = 0;
        this.lastRegisterAttempt = 0;
        
        this.waitingLoginResponse = false;
        this.waitingRegisterResponse = false;
        
        this.errorLoginTimeout = false;
        this.errorRegisterTimeout = false;
        
        //news position holder
        this.news = false;
        this.newsIndex = 0;
    }
    
    MainMenu.prototype.draw = function(){
        var ctx = this.Core.Canvas.ctx;
        var canvas = this.Core.Canvas.canvas;
        
        //draw animated background
        this.Core.scripts.AnimatedBg.draw(ctx, canvas);
    }
    
    MainMenu.prototype.update = function(){
        var Player = this.Core.Player;
        var Resources = this.Core.Resources;
        
        if(this.news && (Player.requireLogin || Player.loggedIn)){
            if(Player.loggedIn && ((Resources.loadedServerResources < Resources.totalServerResources) || (Player.current_city && !Player.current_city_loaded))){
                this.showMenu(false);
                this.showLoadingIcon(true);
            }else{
                this.showLoadingIcon(false);
                this.showTab('news');
                this.showMenu(true);
            }
        }else{
            this.showMenu(false);
            this.showLoadingIcon(true);
        }
        
        this.center();
    }
    
    MainMenu.prototype.requireLogin = function(){
        $('#menu div[name="area-require_login"]').show();
    }
    
    MainMenu.prototype.showTab = function(tabName){
        var tab = $('#menu div[name="tab-'+ tab +'"]');
        
        var allTabs = $('#menu div[name|="tab"]');
        var allTabsContent = $('#menu div[name|="content"]');
        
        allTabs.removeClass('selected');
        allTabsContent.hide();
        tab.addClass('selected');
        $('#menu div[name="content-'+ tabName +'"]').show();
    }
    
    MainMenu.prototype.handleTabAction = function(e){
        e.preventDefault();
        
        var tabName = $(e.currentTarget).attr('name').split('-')[1];
        this.showTab(tabName);
    }
    
    MainMenu.prototype.validateLoginForm = function(){
        if(!this.waitingLoginResponse){
            var usernameField = $('#menu div[name="content-login"] input[name="username"]');
            var passwordField = $('#menu div[name="content-login"] input[name="password"]');

            var username = usernameField.val();
            var password = passwordField.val();

            var date = new Date();
                date = date.getTime();

            if(date - this.lastLoginAttempt < 5000){
                this.setLoginFormError('Please wait at least 5 seconds.');
            }else if(username.length < 3){
                this.setLoginFormError('Username too short!');
            }else if(username.length > 12){
                this.setLoginFormError('Username too long!');
            }else{
                var regex = /^[\w ]*[^\W_][\w ]*$/.exec(username);

                if(regex){
                    this.waitingLoginResponse = true;

                    this.Core.Player.login({
                        username : username,
                        password : password
                    }, function(status){
                        this.waitingLoginResponse = false;
                        
                        //if failed login
                        if(!status){
                            this.setLoginFormError('Invalid login!');
                        }
                    }.bind(this));

                    usernameField.val('');
                    passwordField.val('');

                    this.lastLoginAttempt = date;
                }else{
                    this.setLoginFormError('Invalid characters!');
                }
            }
        }
    }
    
    MainMenu.prototype.validateRegisterForm = function(){
        if(!this.waitingRegisterResponse){
            var usernameField = $('#menu div[name="content-register"] input[name="username"]');
            var passwordField = $('#menu div[name="content-register"] input[name="password"]');
            var nationField = $('#menu div[name="content-register"] input[name="nation"]');
            var verifyField = $('#menu div[name="content-register"] input[name="verify_password"]');
            var emailField = $('#menu div[name="content-register"] input[name="email"]');

            var username = usernameField.val().trim();
            var password = passwordField.val();
            var verifyPassword = verifyField.val();
            var nation = nationField.val().trim();
            var email = emailField.val().trim();
            

            var date = Date.now();

            if(date - this.lastRegisterAttempt < 5000){
                this.setRegistrationFormError('Please wait at least 5 seconds.');
            }else if(username.length < 3){
                this.setRegistrationFormError('Username too short!');
            }else if(username.length > 12){
                this.setRegistrationFormError('Username too long!');
            }else if(password.length < 4){
                this.setRegistrationFormError('Password too short!');
            }else if(password !== verifyPassword){
                this.setRegistrationFormError('Passwords don\'t match!');
            }else if(email.length > 0 && !/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.exec(email)){
                this.setRegistrationFormError('Invalid email syntax!');
            }else if(!/^[\w ]*[^\W_][\w ]*$/.exec(username)){
                this.setRegistrationFormError('Invalid username characters!');
            }else if(nation.length < 3){
                this.setRegistationFormError('Nation name too short.');
            }else if(nation.length > 18){
                this.setRegistrationFormError('Nation name too long.');
            }else{
                this.waitingRegisterResponse = true;

                this.Core.Player.register({
                    username    : username,
                    password    : password,
                    nation      : nation,
                    email       : email
                }, function(error){
                    //function only called if there was an error ...
                    this.waitingRegisterResponse = false;
                    this.setRegistrationFormError(error);
                }.bind(this));

                this.lastRegisterAttempt = date;
            }
        }
    }
    
    MainMenu.prototype.setLoginFormError = function(error){
        var el = $('#menu div[name="content-login"] div[name="error"]');
        
        el.text(error);
        el.stop(true);
        el.show(0);
        clearTimeout(this.errorLoginTimeout);
        
        this.errorLoginTimeout = setTimeout(function(){
            el.fadeOut(2000);
        },5000);
    }
    
    MainMenu.prototype.setRegistrationFormError = function(error){
        var el = $('#menu div[name="content-register"] div[name="error"]');
        
        el.text(error);
        el.stop(true);
        el.show(0);
        clearTimeout(this.errorRegisterTimeout);
        
        this.errorRegisterTimeout = setTimeout(function(){
            el.fadeOut(2000);
        },5000);
    }
    
    /*
     *  server will send the news data to this function
     */
    MainMenu.prototype.loadNews = function(news){
        this.news = news;
        this.setNews(0);
    }
    
    MainMenu.prototype.setNews = function(index){
        var articles = this.news.length;
        
        //keep index in appropriate range
        index = ((index > articles - 1) || index < 0) ? false : index;
        
        var title = this.news[index].title;
        var content = this.news[index].content;
        var date = this.news[index].date;
        
        $('div[name="news_container"] span[name="title"]').html(title);
        $('div[name="news_container"] span[name="date"]').html('posted '+date);
        $('div[name="news_container"] span[name="content"]').html(fn_nl2br(content));
        
        //reset scroll pos
        $('div[name="news_container"]').scrollTop(0);
        
        var buttonNew = $('div[name="content-news"] div[name="news_more-new"]');
        var buttonOld = $('div[name="content-news"] div[name="news_more-old"]');
        
        if(index > 0){
            //if at the last article
            if(index === articles - 1){
                buttonOld.hide();
                buttonNew.width('100%');
                buttonNew.show();
            }else{
                buttonOld.width('50%');
                buttonNew.width('50%');
                buttonOld.show();
                buttonNew.show();
            }
        }else{
            buttonOld.width('100%');
            buttonNew.hide();
            buttonOld.show();
        }

        //update current news index
        this.newsIndex = index;
        
        this.update();
    }
    
    MainMenu.prototype.newsControl = function(e){
        e.preventDefault();
        
        var button = $(e.target).attr('name').split('-')[1];
        
        //figure out new news index
        var newIndex = this.newsIndex;
        if(button === 'old'){
            newIndex++;
        }else{
            newIndex--;
        }
        
        //load new news article
        this.setNews(newIndex);
    }
    
    MainMenu.prototype.showMenu = function(bool){
        var el = $('#menu');
        
        if(bool){
            var Player = this.Core.Player;
            
            if(Player.loggedIn){
                $('#menu div[name|="area"]').hide();
                $('#menu div[name="area-logged_in"]').show();
                
                if(!this.Core.maintenance_mode || (this.Core.maintenance_mode && this.Core.Player.rights >= 3)){
                    if(this.Core.required_client_version === this.Core.clientV){
                        if(Player.locked === 0){
                            //CITIES SCREEN
                            $('#menu div[name="content-play"]').html(this.getCitiesHTML());
                        }else{
                            //LOCKED ACCOUNT SCREEN
                            var html = '<div style="text-align:justify;margin-bottom:15px;">Your account has been locked. You cannot join the game while your account is locked.</div>';
                                html += '<div style="width:100%;text-align:center;"><img src="resources/locked.png"></div>';
                                
                            $('#menu div[name="content-play"]').html(html);
                        }
                    }else{
                        //OUTDATED CLIENT SCREEN
                        var html = 'The server does not support this client version. Please ensure you have the latest client version by clearing cache for this website (try pressing <b>CTRL + F5</b> on your keyboard).';
                        
                        $('#menu div[name="content-play"]').html(html);
                    }
                }else{
                    //OUTDATED MAINTENANCE SCREEN
                    var html = '<div style="text-align:justify;margin-bottom:15px;">The server is currently in maintenance mode. While the server remains in maintenance mode, you cannot join the game. We sincerely apologize for any inconvenience this may cause you!</div>';
                        html += '<div style="width:100%;text-align:center;"><img src="resources/maintenance.png"></div>';
                        
                    $('#menu div[name="content-play"]').html(html);
                }
            }else{
                $('#menu div[name|="area"]').hide();
                $('#menu div[name="area-require_login"]').show();
            }

            this.center();
            el.show(0);
        }else{
            el.hide(0);
        }
    }
    
    MainMenu.prototype.showLoadingIcon = function(bool){
        //display loading icon
        var el = $('#loading_icon');
        
        if(bool){
            var pos = $('#game').offset();

            var offsetX = this.Core.Canvas.canvas.width/2;
            var offsetY = this.Core.Canvas.canvas.height/2;

            offsetX -= el.width()/2;
            offsetY -= el.height()/2;

            el.css({
                top : pos.top + offsetY,
                left : pos.left + offsetX
            });
            el.show(0);
        }else{
            el.hide(0);
        }
    }
    
    MainMenu.prototype.getCitiesHTML = function(){
        var cities = this.Core.Player.cities;
        var html = '<h3>CHOOSE CITY</h3>';
        
        var i = 0;
        for(var city in cities){
            var city = cities[city];
            
            html += '<div name="entercity-'+ city.city_id +'" class="city_listing">';
            html += '<div style="margin:10px;">';
            
            if(city.city_main){
                html += '<b> <span style="color:red;">*</span>'+ city.city_name +'</b>';
            }else{
                html += '<b>'+ city.city_name +'</b>';
            }
            
            html += '<span class="stat">$ '+ fn_numberFormat(city.resources.money) +'</span>';
            html += '</div>';
            html += '</div>';
            
            i++;
        }
        
        if(i === 0){
            html += 'You do not have any cities.';
        }
        
        return html;
    }
    
    MainMenu.prototype.selectCity = function(e){
        e.preventDefault();
        var city_id = $(e.currentTarget).attr('name').split('-')[1];
        
        this.Core.Player.switchCity(city_id);
    }
    
    MainMenu.prototype.center = function(){
        var el = $('#menu');
        
        var pos = $('#game').offset();

        var offsetX = this.Core.Canvas.canvas.width/2;
        var offsetY = this.Core.Canvas.canvas.height/2;

        offsetX -= el.width()/2;
        offsetY -= el.height()/2;
        
        el.css({
            top : pos.top + offsetY,
            left : pos.left + offsetX
        });
    }
    
    MainMenu.prototype.windowResized = function(){
        this.center();
    }
    
    MainMenu.prototype.onSwitchedTo = function(){
        var self = this;
        
        //this must be called before update, otherwise ... we'll have problems
        $('#MainMenu').show();
        
        this.update();
        
        //add event listeners
        $(document).on('click', '#menu div[name|="tab"]', this.handleTabAction.bind(this));
        $(document).on('click', '#menu div[name="content-login"] button[name="login"]', this.validateLoginForm.bind(this));
        $(document).on('keypress', '#menu div[name="content-login"] input', function(e){
            if(e.keyCode === 13) {
                self.validateLoginForm.bind(self)();
            }
        });
        $(document).on('click', '#menu div[name="content-register"] button[name="register"]', this.validateRegisterForm.bind(this));
        $(document).on('keypress', '#menu div[name="content-register"] input', function(e){
            if(e.keyCode === 13) {
                self.validateRegisterForm.bind(self)();
            }
        });
        $(document).on('click', 'div[name="content-news"] div[name|="news_more"]', this.newsControl.bind(this));
        $(document).on('click', 'div[name="content-play"] div[name|="entercity"]', this.selectCity.bind(this));
    }
    
    MainMenu.prototype.onSwitchedFrom = function(){
        //remove event listeners
        $(document).off('click', '#menu div[name|="tab"]');
        $(document).off('click', '#menu div[name="content-login"] button[name="login"]');
        $(document).off('keypress', '#menu div[name="content-login"] input');
        $(document).off('click', '#menu div[name="content-register"] button[name="register"]');
        $(document).off('keypress', '#menu div[name="content-register"] input');
        $(document).off('click', 'div[name="content-news"] div[name|="news_more"]');
        $(document).off('click', 'div[name="content-play"] div[name|="entercity"]');
        
        //hide elements
        $('#MainMenu').hide();
    }
    
    /*
     *  any provided background will automatically center.
     *  @param  img     should be an already loaded image resource
     */
    MainMenu.prototype.setBackground = function(img){
        
    }
    
    Client.MainMenu = MainMenu;
})();