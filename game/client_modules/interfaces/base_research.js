/*
 *  CLIENT
 */

(function(){
    function base_research(Core){
        this.Core = Core;
        this.id = 'base_research';
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    base_research.prototype.load = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var resource = this.Core.Resources.base.buildings['research_facility'];
        
        //get current time, milliseconds
        var d = Date.now() - this.Core.serverTimeDifference;
        
        //get max allowed
        var buildings = this.Core.Base.getNumOfSameBuildingsInCity('research_facility');
        var active_projects = Player.getNumActiveResearchProjects(city.city_id);
        var per_building = this.Core.Game.gameCfg.research_projects_per_building;
        var allowed = (buildings * per_building);
        
        //get all the categories of research projects
        var categories = [];
        var research = this.Core.Game.gameCfg.research_projects;
        for(var project in research){
            var category = research[project].category;
            if(categories.indexOf(category) === -1){
                categories.push(category);
            }
        }
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:650px;">';
            html += '<div class="title">'+ resource.name.toUpperCase() +'</div>';
            html += '<div style="margin:10px;">'; 
            html += '<div class="description"><div style="margin:10px;">'+ resource.description +'</div></div>';
            
            html += '<div name="tab_selection" class="tabs">';
            html += '<div name="tab-myresearch" class="tab">My Research</div>';
            
            //research categories as tabs
            for(var i = 0; i < categories.length; i++){
                html += '<div name="tab-'+ categories[i] +'" class="tab">'+ categories[i] +'</div>';
            }
            
            html += '</div>';
            
            //my research tab content
            var my_research = city.research.active;
            var active_projects = 0;
            
            for(var x in my_research){
                active_projects++;
            }
            
            //start of parent tab
            html += '<div name="parent">';
            html += '<div name="content-myresearch" style="margin:0 auto;width:100%;margin-bottom:9px;">';
            
            if(active_projects > 0){
                html += '<div class="description" style="border:1px dashed grey;"><div style="margin:6px;">You have <span name="active_num" style="font-weight:bold;color:white;">'+ active_projects +' out of '+ allowed +'</span> active research projects.</div></div>';
                
                //loop through each active project
                console.log('~~~~~~~~~~~~~~~~')
                console.log(my_research)
                for(project in my_research){
                    console.log(project)
                    
                    var obj = research[project];
                    var myobj = my_research[project];
                    
                    var percent_completed = Math.floor((d - myobj.started)/(obj.time * 60 * 1000) * 100);
                    
                    html += '<div name="myproject-'+ project +'" style="color:white;border:1px solid orange;margin-bottom:7px;background-color:black;cursor:pointer;">';
                    html += '<div style="margin:6px;">';
                    html += '<div style="font-size:19px;">'+obj.name+'</div>';
                    html += '<div style="font-size:14px;">'+ percent_completed +'% completed</div>';
                    html += '</div>';
                    html += '</div>';
                }
            }else{
                html += 'You have no active research projects.';
            }
            html += '<div><button name="ok">Ok</button></div>';
            html += '</div>';
            
            //each project for this research category
            for(var i = 0; i < categories.length; i++){
                var category = categories[i];
                var available_projects = 0;
                
                html += '<div name="content-'+ category +'" style="margin:0 auto;width:100%;margin-bottom:9px;" class="hidden">';
                
                for(var project in research){
                    var obj = research[project];
                    
                    if(!Player.hasBlueprints(project) && !Player.isActiveResearchProject(project)){
                        if(obj.category === category){
                            html += '<div name="project-'+ project +'" style="display:inline-block;margin:7px;border:1px solid black;background-color:black;border:1px solid grey;width:47%;cursor:pointer;">';
                            html += '<div style="margin:6px;color:white;">';
                            html += '<div style="font-size:18px;">'+ obj.name +'</div>';
                            html += '<div style="font-size:13px;">'+ obj.time +' minute(s)</div>';
                            
                            //project requirements
                            if(obj.requires.length > 0){
                                html += '<div style="font-size:13px;">Requires <span style="color:red">'+ obj.requires.join() +'</span></div>';
                            }else{
                                html += '<div style="font-size:13px;">Requires nothing</div>';
                            }
                            
                            
                            html += '</div>';
                            html += '</div>';
                            
                            available_projects++;
                        }
                    }
                }
                
                //no projects available to research :(
                if(available_projects === 0){
                    html += 'No research projects are available for this category.';
                }
                
                //end of category content div
                html += '<div><button name="ok">Ok</button></div>';
                html += '</div>';
            }
            
            //end of parent div
            html += '<div name="content-projectinfo"></div>';
            html += '<div name="content-activeprojectinfo"></div>';
            html += '</div></div></div>';
            
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="project"]', this.showProject.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="myproject"]', this.showActiveProject.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="start_research"]', this.startResearch.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="stop_research"]', this.stopResearch.bind(this));
    }
    
    base_research.prototype.startResearch = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var buildings = this.Core.Base.getNumOfSameBuildingsInCity('research_facility');
        var active_projects = Player.getNumActiveResearchProjects(city.city_id);
        var per_building = this.Core.Game.gameCfg.research_projects_per_building;
        
        if(active_projects < buildings * per_building){
            var name = $(e.target).attr('name').split('-')[1];
            var project = this.Core.Game.gameCfg.research_projects[name];
            
            if(Player.canAfford(city.resources, project.cost)){
                if(Player.hasBlueprints(project.requires)){
                    //tell server, have server verify it
                    this.Core.Events.emit('GAME:START_RESEARCH', {
                        project : name
                    });

                    //get that research started brah!
                    Player.startResearch(city.city_id, name);

                    //close interface
                    this.Core.InterfaceManager.unloadInterface(this.id);
                }else{
                    this.Core.Gui.popup(0, 'Error', 'You do not have the research requirements/prerequisites to start this project.');
                }
            }else{
                this.Core.Gui.popup(0, 'Error', 'You do not have the resources to start this research project.');
            }
        }else{
            this.Core.Gui.popup(0, 'Error', 'You already have the maximum allowed research projects at a given time.');
        }
    }
    
    base_research.prototype.stopResearch = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var name = $(e.target).attr('name').split('-')[1];
        var project = this.Core.Game.gameCfg.research_projects[name];
        var myproject = city.research.active[name];
        var percent_completed = Math.floor((Date.now() - myproject.started)/(project.time * 60 * 1000) * 100);
        var percent_back = 100 - percent_completed;
        
        var msg = 'Are you sure you wish to cancel this project? You\'ve already completed '+ percent_completed +'% of the project, so you will only receive '+ percent_back+'% of your funds back.';
            msg += 'You will also have to restart completely if you wish to research this again, including paying for 100% of the cost.';
        
        this.Core.Gui.popup(0, 'Confirm', msg, {
            buttons : [
                ['Yes, I wish to cancel', function(){
                    //tell server, have server verify it
                    this.Core.Events.emit('GAME:STOP_RESEARCH', {
                        project : name,
                        city_id : city.city_id
                    });
                    
                    //handle client st00f
                    Player.cancelResearch(city.city_id, name);
                    
                    //active num message
                    var active_span = $('div[name="interface-'+ this.id +'"] span[name="active_num"]');
                    active_span.html(parseInt(active_span.html()) - 1);
                    
                    $('div[name="interface-'+ this.id +'"] div[name="myproject-'+ name +'"]').remove();
                    
                    this.showTab(null, 'myresearch');
                }.bind(this)],
                ['I do not wish to cancel']
            ]
        });
    }
    
    base_research.prototype.showProject = function(e){
        var name = $(e.target).closest('div[name|="project"]').attr('name').split('-')[1];
        var project = this.Core.Game.gameCfg.research_projects[name];
        
        var html = '<div style="font-size:22px;border-bottom:1px solid yellow;margin-bottom:6px;margin-top:10x;color:white;">Research: '+ project.name +'</div>';
            html += '<div style="font-size:18px;margin-bottom:15px;">'+ project.description +'</div>';
            html += '<table cellpadding="6" style="color:yellow;font-size:18px;">';
            html += '<tr><td>Time</td><td>'+ project.time +' minute(s)</td></tr>';
            
            if(project.requires.length > 0){
                html += '<tr><td>Requires</td><td>'+ project.requires.join() +'</td></tr>';
            }
            
            html += '<tr><td>Cost</td><td>';
            
            //costs
            for(var resource in project.cost){
                var amount = project.cost[resource];
                
                if(resource === 'money'){
                    html += '$ '+ fn_numberFormat(amount) +'<br/>';
                }else{
                    html += fn_numberFormat(amount) +' '+ resource.toUpperCase() +'<br/>';
                }
            }
            
            html += '</td></tr>';
            
            html += '</table>';
            html += '<button name="back-'+ project.category +'">Back</button><button name="start_research-'+ name +'">Start Research</button>';
            
        $('div[name="interface-'+ this.id +'"] div[name="content-projectinfo"]').html(html);
        this.showTab(null, 'projectinfo');
    }
    
    base_research.prototype.showActiveProject = function(e){
        var name = $(e.target).closest('div[name|="myproject"]').attr('name').split('-')[1];
        var project = this.Core.Game.gameCfg.research_projects[name];
        
        var html = '<div style="font-size:22px;border-bottom:1px solid yellow;margin-bottom:6px;margin-top:10x;color:white;">Research: '+ project.name +'</div>';
            html += '<div style="font-size:18px;margin-bottom:15px;">'+ project.description +'</div>';
            html += '<table cellpadding="6" style="color:yellow;font-size:18px;">';
            html += '<tr><td>Time</td><td>'+ project.time +' minute(s)</td></tr>';
            
            if(project.requires.length > 0){
                html += '<tr><td>Requires</td><td>'+ project.requires.join() +'</td></tr>';
            }
            
            html += '<tr><td>Cost</td><td>';
            
            //costs
            for(var resource in project.cost){
                var amount = project.cost[resource];
                
                if(resource === 'money'){
                    html += '$ '+ fn_numberFormat(amount) +'<br/>';
                }else{
                    html += fn_numberFormat(amount) +' '+ resource.toUpperCase() +'<br/>';
                }
            }
            
            html += '</td></tr>';
            
            html += '</table>';
            html += '<button name="back-'+ project.category +'">Back</button><button name="stop_research-'+ name +'">Stop Research</button>';
        
        $('div[name="interface-'+ this.id +'"] div[name="content-activeprojectinfo"]').html(html);
        this.showTab(null, 'activeprojectinfo');
    }
    
    base_research.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    base_research.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    base_research.prototype.unload = function(){
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="project"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="myproject"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="start_research"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="stop_research"]');
        $('div[name="interface-base_research"]').remove();
    }
    
    Client.interfaces['base_research'] = base_research;
})();