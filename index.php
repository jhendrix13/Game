<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    
    <title>WW2</title>
    <link href="style/main.css" rel="stylesheet" type="text/css">
    <link href="style/jquery.jscrollpane.css" rel="stylesheet" type="text/css">
    <link href="http://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.css" rel="stylesheet" type="text/css">
    <link href="http://fonts.googleapis.com/css?family=PT+Sans+Narrow" rel="stylesheet" type="text/css">
    
    <!-- j goodness -->
    <script type="text/javascript" src="resources/jquery2.js"></script>
    <script type="text/javascript" src="resources/jquery-ui.js"></script>
    <script type="text/javascript" src="resources/socket.io.js"></script>
    <script type="text/javascript" src="resources/jquery.jscrollpane.min.js"></script>
    <script type="text/javascript" src="resources/jquery.mousewheel.js"></script>
    
    <!-- Game modules -->
    <script type="text/javascript" src="game/client.js?v=1"></script>
    <script type="text/javascript" src="game/client_modules/Core.js"></script>
    <script type="text/javascript" src="game/client_modules/Game.js"></script>
    <script type="text/javascript" src="game/client_modules/Events.js"></script>
    <script type="text/javascript" src="game/client_modules/Player.js"></script>
    <script type="text/javascript" src="game/client_modules/Canvas.js"></script>
    <script type="text/javascript" src="game/client_modules/Gui.js"></script>
    <script type="text/javascript" src="game/client_modules/Resources.js"></script>
    <!-- <script type="text/javascript" src="game/client_modules/Animation.js"></script> -->
    <script type="text/javascript" src="game/client_modules/InterfaceManager.js"></script>
    <script type="text/javascript" src="game/client_modules/screens/GlobalMap.js"></script>
    <script type="text/javascript" src="game/client_modules/screens/Base.js"></script>
    <script type="text/javascript" src="game/client_modules/screens/MainMenu.js"></script>
    <script type="text/javascript" src="game/client_modules/screens/CreateCity.js"></script>
    
    <!-- GUI Elements -->
    <script type="text/javascript" src="game/client_modules/gui/Button.js"></script>
    
    <!-- Interfaces -->
    <script type="text/javascript" src="game/client_modules/interfaces/gm_mapobject.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/gm_military_base.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/base_capitol.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/base_recruitmentoffice.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/base_research.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/base_armory.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/base_heavy_arms_factory.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/base_light_arms_factory.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/base_refinery.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/trade.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/my_trades.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance_create.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance_manage.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance_donate.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance_members.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance_invite.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance_user.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance_leave.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance_masspm.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/alliances/alliance_invites.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/war/war_myWars.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/war/war_gmActions.js"></script>
    <script type="text/javascript" src="game/client_modules/interfaces/my_messages.js"></script>
    
    <!-- Scripts -->
    <script type="text/javascript" src="game/client_modules/scripts/AnimatedBg.js"></script>
    
    <!-- google charts -->
    <script type="text/javascript"
        src="https://www.google.com/jsapi?autoload={
          'modules':[{
            'name':'visualization',
            'version':'1',
            'packages':['corechart']
          }]
        }"></script>
    
    <?php
        @include_once('includes/analytics.php');
    ?>
</head>
<body>
    <div id="container">
        <div id="gameContainer">
            <!-- update notifier div -->
            <div id="updateNotifier" class="hidden fullMsg updateNotification">
                <div name="message" class="content"></div>
            </div>
            
            <div id="devConsole" class="hidden fullMsg">
                <div id="devMessages"></div>
                <div class="commandInput"> <div style="margin-left:4px;margin-right:2px;display:inline-block;">></div> <input id="devCommand"></div>
            </div>
            
            <!-- game canvas -->
            <canvas id="game" style="background-color:white;">
                <div class="error">
                    Your browser does not support the HTML5 Canvas element. Please upgrade your browser to a modern browser.
                </div>
            </canvas>
            
            <!-- notifications container -->
            <div id="notifications"></div>
            
            <!-- lobby menu -->
            <div id="MainMenu" class="hidden">
                <div id="menu" class="greypage hidden">
                    <!-- TABS WILL BE SHOWN IF LOGIN IS REQUIRED -->
                    <div name="area-require_login" class="hidden">
                        <div name="tab-news" class="tab selected">
                            <span class="title">news</span>
                        </div>
                        <div name="tab-login" class="tab">
                        <span class="title">login</span>
                        </div>
                        <div name="tab-register"  class="tab">
                            <span class="title">register</span>
                        </div>
                    </div>

                    <!-- TABS WILL BE SHOWN IF PLAYER LOGGED IN -->
                    <div name="area-logged_in" class="hidden">
                        <div name="tab-news" class="tab selected" style="width:50%;">
                            <span class="title">news</span>
                        </div>
                        <div name="tab-play" class="tab selected" style="width:50%;">
                            <span class="title">play</span>
                        </div>
                    </div>

                    <!-- clipping -->
                    <div class="clear"></div>

                    <!-- NEWS CONTENT -->
                    <div name="content-news" class="content" style="margin-right:3px;">
                        <div name="news_container" style="height:630px;overflow:scroll;text-align:justify;padding-right:4px;">
                            <span name="title" style="font-size:19px;font-weight:bold;margin-bottom:6px;display:block;">Loading news....</span>
                            <span name="date" style="display:block;font-size:15px;margin-bottom:6px;">posted 6/16/15</span>
                            <span name="content">....</span>
                        </div>
                    </div>

                    <!-- NEWS BUTTON -->
                    <div name="content-news" class="button_big_grey">
                        <div name="news_more-new" class="txt hidden" style="width:50%;">newer</div>
                        <div name="news_more-old" class="txt" style="width:100%;">older</div>
                        <div class="clear"></div>
                    </div>

                    <!-- LOGIN CONTENT -->
                    <div name="content-login" class="hidden content">
                        <table>
                            <tr>
                                <td>Username</td>
                                <td><input type="text" name="username" maxlength="12" class="big_input"></td>
                            </tr>
                            <tr>
                                <td> Password</td>
                                <td><input type="password" name="password" class="big_input"></td>
                            </tr>
                            <tr>
                                <td>&nbsp;</td>
                                <td><button name="login" >Login</button></td>
                            </tr>
                        </table>
                        <div name="error" style="color:red;font-weight:bold;"></div>
                    </div>

                    <!-- REGISTER CONTENT -->
                    <div name="content-register" class="hidden content">
                        <table>
                            <tr>
                                <td><span style="color:orangered;">*</span></td>
                                <td>Username</td>
                                <td><input type="text" name="username" maxlength="12" class="big_input"></td>
                            </tr>
                            <tr>
                                <td><span style="color:orangered;">*</span></td>
                                <td>Password</td>
                                <td><input type="password" name="password" class="big_input"></td>
                            </tr>
                            <tr>
                                <td><span style="color:orangered;">*</span></td>
                                <td>Verify Password</td>
                                <td><input type="password" name="verify_password" class="big_input"></td>
                            </tr>
                            <tr>
                                <td><span style="color:orangered;">*</span></td>
                                <td>Nation Name</td>
                                <td><input type="text" name="nation" class="big_input"></td>
                            </tr>
                            <tr>
                                <td>&nbsp;</td>
                                <td>Email</td>
                                <td><input type="email" name="email" class="big_input"></td>
                            </tr>
                            <tr>
                                <td>&nbsp;</td>
                                <td>Referral</td>
                                <td><input type="text" name="referral" maxlength="12" class="big_input"></td>
                            </tr>
                            <tr>
                                <td colspan="2">&nbsp;</td>
                                <td><button name="register">Create Account</button></td>
                            </tr>
                        </table>
                        <div name="error" style="color:red;font-weight:bold;"></div>
                        <div style="margin-top:10px;font-size:13px;"><span style="color:orangered;">*</span> indicates a required field</div>
                    </div>

                    <!-- PLAY CONTENT -->
                    <div name="content-play" class="hidden content">
                        <button id="play_game">Enter game</button>
                    </div>
                </div>
                
                <!-- LOADING ICON -->
                <img id="loading_icon" src="game/resources/images/other/loading_icon.GIF" class="hidden">
            </div>
            
            <div id="create_city" class="greypage hidden" style="width:700px;">
                <div name="loading" class="content hidden" style="margin-right:3px;">
                    Waiting for server response ...
                </div>
                <div name="create_form" class="content" style="margin-right:3px;">
                    <table>
                        <tr>
                            <td><span style="color:orangered;">*</span></td>
                            <td>Capital Name</td>
                            <td><input type="text" name="capital" maxlength="18" class="big_input" style="width:100%;"></td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td><a href="game/docs/destined_spot_code.php" target="_blank">DSC</a></td>
                            <td><input type="text" name="dsc" maxlength="6" class="big_input" style="width:100%;text-transform:uppercase;"></td>
                        </tr>
                        <tr>
                            <td colspan="2">&nbsp;</td>
                            <td><button name="create">Enter Capital</button></td>
                        </tr>
                    </table>
                    <div name="error" style="color:red;font-weight:bold;"></div>
                    <div style="margin-top:10px;font-size:13px;"><span style="color:orangered;">*</span> indicates a required field</div>
                </div>
            </div>
            
            <!-- BASE PANEL -->
            <div id="base_tabcontent">
               <!-- BUILDING CATEGORIES -->
               <div name="tabcontent-buildings" class="hidden">
                    <span style="font-size:18px;margin-bottom:10px;display:block;">Building Category</span>
                    <img name="building_category-government" src="game/resources/images/thumbnails/base_icon_government.png">
                    <img name="building_category-resources" src="game/resources/images/thumbnails/base_icon_resources.png"> <br/>
                    <img name="building_category-military" src="game/resources/images/thumbnails/base_icon_military.png">
                    <img name="building_category-production" src="game/resources/images/thumbnails/base_icon_production.png">
                </div>
                
               <!-- OTHER TAB CONTENT -->
                <div name="tabcontent-building_category" class="hidden">
                    
                </div>
                
                <div name="tabcontent-building_info" class="hidden">
                    
                </div>
            </div>
            
            <div id="panel" class="hidden">
                <table name="resources" cellpadding="7" class="left" style="margin-right:15px;">
                    <tr>
                        <td>$</td>
                        <td name="money">0</td>
                        <td>IRON</td>
                        <td name="iron">0</td>
                        <td>POP.</td>
                        <td name="population">0</td>
                        <td>POP HAPP.</td>
                        <td name="population_happiness">0 %</td>
                    </tr>
                    <tr>
                        <td>GOLD</td>
                        <td name="gold">0</td>
                        <td>WOOD</td>
                        <td name="wood">0</td>
                        <td>OIL</td>
                        <td name="oil">0</td>
                        <td>Tax Rate</td>
                        <td name="taxrate">0 %</td>
                    </tr>
                    <tr>
                </table>
                <div name="base" class="hidden">
                    <img name="tab-buildings" src="game/resources/images/thumbnails/base_buildingmenu.png" style="margin-right:10px;" class="left">
                    <img name="tab-lawmaking" src="game/resources/images/thumbnails/base_lawmaking.png" class="left">
                </div>
                <div name="globalmap" class="hidden">
                    <span style="color:red;">globalmap</span>
                </div>
            </div>
        </div>
    </div>
    <div name="globalmap_position" class="absolute hidden">
        <input type="text" name="gm_x" class="grey nofocus" style="margin-right:6px;width:40px;padding:4px;">
        <input type="text" name="gm_y" class="grey nofocus" style="width:40px;padding:4px;">
    </div>
</body>
</html>