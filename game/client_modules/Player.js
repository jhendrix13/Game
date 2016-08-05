/* global this */

(function(){
    function Player(){}
    
    Player.prototype.construct = function(Core){
        this.Core = Core;
        
        //has the client already tried to login?
        this.loggedIn = false;
        this.requireLogin = false;
        
        this.id = 0;
        this.username = false;
        this.nation = '';
        this.rights = 0;
        
        //alliance st00f
        this.alliance = 0;
        this.alliance_perms = {};
        this.alliance_leader = false;
        this.alliance_data = false;
        this.alliance_invites = [];
        
        this.allianceLastLoadRequest = 0;
        this.warHistoryLastLoad = 0;
        
        //player game data
        this.cities = {};
        this.current_city = 0;
        this.current_city_loaded = false;
        
        //flag will be set if the user has created an alliance and is awaiting server response
        this.created_alliance = false;
        
        //trade offers
        this.tradeOffers = [];
        
        //wars
        this.wars = [];
        this.warHistoryCache = {};
        
        //messages
        this.messages = {
            inbox : [],
            sent : []
        };
        
        //if a message fails to send
        this.failed_messages = [];
        
        this.loginCallback = false;
        this.registerCallback = false;
        
        this.resourcesUpdateInterval = false;
    }
    
    /*
     *  get's the dat aof the current city the player is in
     */
    Player.prototype.getCityData = function(){
        return this.cities[this.current_city];
    }
    
    Player.prototype.switchCity = function(city_id){
        city_id = parseInt(city_id);
        
        if(city_id !== this.current_city){
            this.current_city = city_id;
            this.Core.Events.emit('PLAYER:SELECT_CITY', city_id);
        
            //only do this if it's the first city to be loaded since joining the game
            if(!this.current_city){
                this.Core.MainMenu.update();
            }
        }else{
            this.Core.Canvas.setScreen(this.Core.Base);
        }
    }
    
    Player.prototype.cityLoaded = function(data){
        if(data){
            //data == id of city
            this.current_city = data;
            
            this.Core.Base.loadCity(function(){
                //set resource income rates for city, then update
                this.setResourceRates(this.current_city);
                this.updateResources(this.current_city);
                
                //clear any existing resource update interval
                if(this.resourcesUpdateInterval){
                    clearInterval(this.resourcesUpdateInterval);
                }
                
                //set resource update interval
                this.resourcesUpdateInterval = setInterval(this.updateResources.bind(this, this.current_city),3000);
                
                //city loaded!
                this.current_city_loaded = true;
                
                this.Core.Canvas.setScreen(this.Core.Base);
            }.bind(this));
        }else{
            console.error('Error loading city with ID '+ data);
        }
    }
    
    Player.prototype.lostCity = function(city_id){
        var name = this.cities[city_id].city_name;
        
        //kill research
        this.denitResearch(city_id);
        
        if(this.current_city === city_id){
            this.current_city = 0;
            
            clearInterval(this.resourcesUpdateInterval);
            this.Core.Gui.clearNotifications();
        }
        
        //remove from client
        this.cities[city_id] = null;
        delete this.cities[city_id];
        
        //update mainmenu before switchign to it.
        //need to reflect new city list.
        this.Core.MainMenu.update();
        this.Core.Canvas.setScreen(this.Core.MainMenu);
        
        this.Core.Gui.popup(0, 'Oh no ...', 'Your city, '+ fn_htmlEnc(name) +', was conquered. It is now in possession of its new ruler.');
    }
    
    Player.prototype.gainedCity = function(data){
        this.cities[data.city_id] = data.city;
        
        //init research
        this.initResearch(data.city_id);
        
        this.Core.Gui.popup(0, 'The Mighty', 'You have conquered the city of '+ fn_htmlEnc(data.city.city_name) +'.');
    }
    
    Player.prototype.lostGMBuilding = function(data){
        var city = this.cities[data.city_id];
        
        if(city){
            var buildings = city.gm_buildings;
            
            for(var i = 0; i < buildings.length; i++){
                var building = buildings[i];
                
                if(building.id === data.buildingID){
                    var name = this.Core.Resources.globalmap.buildings[building.type].name;
                    
                    if(building.type === 'military_base'){
                        //recall all military commanders from that base
                        var commanders = city.commanders;
                        
                        for(var commanderID in commanders){
                            var commander = commanders[commanderID];
                            
                            if(commander.station_x === building.x && commander.station_y === building.y){
                                this.Core.GlobalMap.addMission({
                                    city_id : city.id,
                                    x : building.x,
                                    y : building.y,
                                    destination_x : city.city_x,
                                    destination_y : city.city_y,
                                    action : 'commander_baseLost_forceReturn',
                                    data : {
                                        commanderID : commanderID
                                    }
                                });
                                
                                commander.mission_x = city.city_x;
                                commander.mission_y = city.city_y;
                                commander.mission_type = 'ommander_baseLost_forceReturn';
                            }
                        }
                        
                        this.Core.Gui.notify([
                            0,
                            'Building lost to enemy',
                            'You have lost a Military Base to an enemy on the world map ('+ building.x+','+ building.y +'). All stationed commanders are returning.',
                            {}
                        ]);
                    }else{
                        this.Core.Gui.notify([
                            0,
                            'Building lost to enemy',
                            'You have lost a building <span style="font-weight:bold;color:white;">('+ name +')</span> to an enemy on the world map ('+ building.x+','+ building.y +').',
                            {}
                        ]);
                    }
                    
                    //now remove
                    city.gm_buildings.splice(i, 1);
                }
            }
        }
    }
    
    Player.prototype.gainedGMBuilding = function(data){
        this.cities[data.city_id].gm_buildings.push(data.building);
        
        this.Core.Gui.notify([
            0,
            'GM Building Conquered',
            'You have successfully conquered a new GM Building.',
            {}
        ]);
    }
    
    Player.prototype.canAfford = function(resources, cost){
        for(var resource in cost){
            if(!resources[resource]){
                return false;
            }
            
            if(resources[resource] < cost[resource]){
                return false;
            }
        }

        return true;
    }
    
    Player.prototype.subCost = function(city_id, cost, add){
        if(cost){
            for(var resource in cost){
                if(add){
                    this.cities[city_id].resources[resource] += cost[resource];
                }else{
                    this.cities[city_id].resources[resource] -= cost[resource];
                }
            }
        }
    }
    
    Player.prototype.subWeapons = function(city_id, weapons, add){
        if(weapons){
            var city = this.cities[city_id];
            
            for(var weapon in weapons){
                if(!city.equipment.weapons[weapon]){
                    city.equipment.weapons[weapon] = 0;
                }
                
                if(add){
                    city.equipment.weapons[weapon] += weapons[weapon];
                }else{
                    city.equipment.weapons[weapon] -= weapons[weapon];
                }


                if(city.equipment.weapons[weapon] <= 0){
                    delete city.equipment.weapons[weapon];
                }
            }
        }
    }

    Player.prototype.subVehicles = function(city_id, vehicles, add){
        if(vehicles){
            var city = this.cities[city_id];
        
            for(var vehicle in vehicles){
                if(!city.equipment.vehicles[vehicle]){
                    city.equipment.vehicles[vehicle] = 0;
                }
                
                if(add){
                    city.equipment.vehicles[vehicle] += vehicles[vehicle];
                }else{
                    city.equipment.vehicles[vehicle] -= vehicles[vehicle];
                }

                if(city.equipment.vehicles[vehicle] <= 0){
                    delete city.equipment.vehicles[vehicle];
                }
            }
        }
    }

    /*
     *  takes an existing connection. does not create its own.
     */
    Player.prototype.subResource = function(city_id, resource, x){
        this.cities[city_id].resources[resource] -= x;
    }

    Player.prototype.addResource = function(city_id, resource, x){
        this.cities[city_id].resources[resource] += x;
    }
    
    /*
     *  set the current income rate for each resource per minute
     */
    Player.prototype.setResourceRates = function(city_id){
        var city = this.cities[city_id];
        var rates = {};
        var usedFactors = {};
        
        //populate
        for(var f in this.Core.Game.gameCfg.factor_bonuses){
            usedFactors[f] = 0;
        }
        
        //get both city and gm buildings!
        var city_buildings = city.city_buildings;
        var gm_buildings = city.gm_buildings;
        
        /*
         *  CITY BUILDINGS
         */
        for(var i = 0; i < city_buildings.length; i++){
            var building_type = city_buildings[i].type;
            var building_obj = this.Core.Resources.base.buildings[building_type];
            
            if(building_obj.base_income){
                //this type of building's income for each resource
                var resources = building_obj.base_income;

                for(var resource in resources){
                    //if this resource rate hasn't been set yet, make it an int
                    if(!rates[resource]){
                        rates[resource] = 0;
                    }

                    //add to rate
                    rates[resource] += resources[resource];
                }
            }
            
            //building has upkeep costs
            if(building_obj.cost_upkeep){
                var costs = building_obj.cost_upkeep;
                for(var resource in costs){
                    //if this resource rate hasn't been set yet, make it an int
                    if(!rates[resource]){
                        rates[resource] = 0;
                    }

                    //subtract from rate
                    rates[resource] -= costs[resource];
                } 
            }
            
            //factors
            if(building_obj.factors){
                for(var factor in building_obj.factors){
                    var amount = building_obj.factors[factor];
                    var bonus = amount * this.Core.Game.gameCfg.factor_bonuses[factor];

                    //make sure we don't go over allowed amount
                    var used = usedFactors[factor];
                    var minmax = this.Core.Game.gameCfg.factor_bonuses_minmax[factor];

                    var max = minmax.max;
                    var min = minmax.min;

                    var newUsed = used + amount;

                    //limit the amount
                    if(newUsed > max){
                        amount = amount - (newUsed - max);
                    }else if(newUsed < min){
                        amount = (min - used);
                    }

                    usedFactors[factor] += amount;

                    var earned = Math.floor(city.population * bonus * city.taxRate);
                    
                    //add to money
                    rates['money'] += earned;
                }
            }
        }
        
        /* 
         * GLOBALMAP BUILDINGS
         */
        for(var i = 0; i < gm_buildings.length; i++){
            var building_type = gm_buildings[i].type;
            var building_obj = this.Core.Resources.globalmap.buildings[building_type];
            
            if(building_obj.base_income){
                //this type of building's income for each resource
                var resources = building_obj.base_income;

                for(var resource in resources){
                    //if this resource rate hasn't been set yet, make it an int
                    if(!rates[resource]){
                        rates[resource] = 0;
                    }

                    //add to rate
                    rates[resource] += resources[resource];
                }
            }
            
            //building has upkeep costs
            if(building_obj.cost_upkeep){
                var costs = building_obj.cost_upkeep;
                for(var resource in costs){
                    //if this resource rate hasn't been set yet, make it an int
                    if(!rates[resource]){
                        rates[resource] = 0;
                    }

                    //subtract from rate
                    rates[resource] -= costs[resource];
                } 
            }
            
            //factors
            if(building_obj.factors){
                for(var factor in building_obj.factors){
                    var amount = building_obj.factors[factor];
                    var bonus = amount * this.Core.Game.gameCfg.factor_bonuses[factor];

                    //make sure we don't go over allowed amount
                    var used = usedFactors[factor];
                    var minmax = this.Core.Game.gameCfg.factor_bonuses_minmax[factor];

                    var max = minmax.max;
                    var min = minmax.min;

                    var newUsed = used + amount;

                    //limit the amount
                    if(newUsed > max){
                        amount = amount - (newUsed - max);
                    }else if(newUsed < min){
                        amount = (min - used);
                    }

                    usedFactors[factor] += amount;

                    var earned = Math.floor(city.population * bonus * city.taxRate);
                    
                    //add to money
                    rates['money'] += earned;
                }
            }
        }
        
        this.cities[city_id].resource_rates = rates;
        this.cities[city_id].usedFactors = usedFactors;
    }
    
    Player.prototype.isQueueFull = function(city_id, type){
        var city = this.cities[city_id];
        var existing_queues = city.production_queues[type];
        var max_queues = this.Core.Game.gameCfg.max_queues_per_type[type];
        
        
        //make sure they are at max queues for this type of queue
        if(existing_queues.length >= max_queues){
            return true;
        }else{
            return false;
        }
    }
    
    Player.prototype.addQueue = function(city_id, type, item, amount, ppm){
        var city = this.cities[city_id];

        //make sure they are at max queues for this type of queue
        if(!this.isQueueFull(city_id, type)){
            var d = Date.now() - this.Core.serverTimeDifference;
            var timeTarget = d + ((Math.abs(amount/ppm)) * 60 * 1000);

            //add to queue
            city.production_queues[type].push({
                item_name : item,
                ppm : ppm,
                timeStart : d,
                timeTarget : timeTarget,
                deduction : (amount < 0) ? true : false,
                lastUpdate : 0
            });
        }
    }
    
    Player.prototype.cancelQueue = function(data){
        var city = this.cities[this.current_city];

        var queue = city.production_queues[data.type][data.queue_id];

        //ensure queue exists
        if(queue){
            //update st00f
            this.updateResources(city.city_id);

            //queue info
            var info = this.getQueueInfo(queue);

            //item being produced
            var item = queue.item_name;

            //amount of items that did not actually get produced
            //return resources based on this number
            var unproduced = info.productionAmount - info.totalProduced;

            //resources to return per item
            var resources_per_item = {};

            //return their resources
            switch(data.type){
                case 'arms_order':
                    resources_per_item = this.Core.Game.getMilitaryItemObj(item).cost;
                    break;
                case 'refining':
                    resources_per_item = this.Core.Game.gameCfg.refining_methods[item].input_resources;
                    break;
            }

            //add each back
            for(var resource in resources_per_item){
                this.addResource(city.city_id, resource, resources_per_item[resource] * unproduced);
            }

            //remove queue
            city.production_queues[data.type].splice(data.queue_id, 1);
        }
    }
    
    Player.prototype.getQueueInfo = function(queue){
        var d = Date.now() - this.Core.serverTimeDifference;
        
        //time left in queue life
        var timeLeft = queue.timeTarget - d;
        
        //adjusted relative to lastUpdate.
        var adjustedTime = (!queue.lastUpdate) ? queue.timeStart : (queue.timeStart + (queue.lastUpdate - queue.timeStart));

        //amount of time in milliseconds this queue was actually active.
        var timeActive;
        if(queue.forceEnd || d > queue.timeTarget){
            //dead
            timeActive = (queue.forceEnd) ? queue.forceEnd - adjustedTime : queue.timeTarget - adjustedTime;
        }else{
            //alive
            timeActive = d - adjustedTime;
        }
        //convert to >>MINUTES<<.
        //queues work in MINUTES, not DAYS!
        timeActive = timeActive / 1000 / 60;

        //target production amount
        var productionAmount = Math.floor((queue.timeTarget - queue.timeStart) / 60 / 1000 * queue.ppm);

        //produced relative to timeActive/lastUpdate
        var produced = Math.floor(queue.ppm * timeActive);
        
        //total produce in queue life
        var totalProduced = Math.floor(queue.ppm * ((d - queue.timeStart) / 1000 / 60));

        if(queue.deduction){
            produced = produced * -1;
        }

        return {
            timeActive : timeActive,
            produced : produced,
            productionAmount : productionAmount,
            totalProduced : totalProduced,
            timeLeft : timeLeft
        };
    }
    
    Player.prototype.updateResources = function(city_id){
        //city obj
        var city = this.cities[city_id];
        
        //this will keep track of how much of each type of factor is being applied.
        //e.g.: there is a min of -10 and max of 105 happiness that can be applied to a city, no more or less.
        //this will keep track of what has been applied so we don't over do it m8
        // ... also stringify & parse to defreference the object
        var usedFactors = JSON.parse(JSON.stringify(city.usedFactors));
        
        var daily_gdp = 0;
        
        //account for server and client time offset
        var d = Date.now() - this.Core.serverTimeDifference;
        
        //population growth/food management
        if(city.lastPopulationGrowth > 0){
            var startPop = city.population;
            var growth_daysPassed = (d - city.lastPopulationGrowth) / 1000 / 60 / 60 / 24;
            
            //some basic food variables
            var food = city.resources.food;
            var food_per = this.Core.Game.gameCfg.population_food_upkeep;
            var food_upkeep = city.population * food_per;
            var food_cost = Math.floor(food_upkeep * growth_daysPassed);
            
            //had enough food to feed existing population.
            if(food - food_upkeep > 0){
                var population_increase = Math.floor(city.population * ((city.population_growth_rate / 100) * growth_daysPassed));
                
                if(city.population + population_increase < this.Core.Game.gameCfg.population_max){
                    //increase population as much as we can without making the city starve
                    city.population += population_increase;
                }
                
                //remove food. we don't include the newly added citizens in this
                city.resources.food -= food_cost;
            }else{
                var population_decrease = Math.floor(city.population * ((city.population_starve_rate / 100) * growth_daysPassed));
                
                //city is starving
                city.population -= population_decrease;
            }
            
            //this makes sure enough time has actually passed since the last calculation
            //in order for us to update the last growth variable.
            if(city.population !== startPop){
                city.lastPopulationGrowth = d;
            }
        }else{
            city.lastPopulationGrowth = d;
        }
        
        var lastCalc = this.cities[city_id].lastResourceCalculation;
        
        if(lastCalc){
            //net resources gained (some values may be negative)
            var resourcesGained = {};
            
            //time passed since last calculation
            var minutesPassed = (d - lastCalc) / 1000 / 60;
            var hoursPassed = minutesPassed / 60;
            var daysPassed = hoursPassed / 24;
            
            //amount of taxes the city would get PER >>FULL<< DAY
            var taxRevenueDaily = Math.floor(city.population * city.population_avg_gross_income * city.taxRate);
            
            //taxes relative to days passed, so it's actual tax revenue earned so far
            var actualTaxRevenue = taxRevenueDaily*daysPassed;
            
            /*
            *  CALCULATE RESOURCES EARNED FROM DEAD/ALIVE FACTOR TIMESPANS.
            */
            
            for(var factor in city.factors){
                for(var i = 0; i < city.factors[factor].length; i++){
                    var obj = city.factors[factor][i];
                    
                    var amount      = obj[0];
                    var start       = obj[1];
                    var endDate     = obj[2];
                    var lastUpdated = obj[3];
                    var forceEnd    = obj[4];
                    
                    //make sure we don't go over allowed amount
                    var used = usedFactors[factor];
                    var minmax = this.Core.Game.gameCfg.factor_bonuses_minmax[factor];
                    
                    var max = minmax.max;
                    var min = minmax.min;
                    
                    var newUsed = used + amount;

                    //limit the amount
                    if(newUsed > max){
                        amount = amount - (newUsed - max);
                    }else if(newUsed < min){
                        amount = (min - used);
                    }

                    //update used amount
                    usedFactors[factor] += amount;

                    //multiply each factor point by the monetary bonus value it generates
                    var bonus = amount * this.Core.Game.gameCfg.factor_bonuses[factor];
                    
                    var dead = (forceEnd || d >= endDate);
                    var timeActive = 0;
                    
                    if(forceEnd){
                        timeActive = forceEnd - d;
                    }else{
                        if(d >= endDate){
                            timeActive = (!lastUpdated) ? endDate - start : endDate - lastUpdated;
                        }else{
                            timeActive = (!lastUpdated) ? d - start : (d - lastUpdated);
                        }
                    }
                    
                    //convert to days
                    timeActive = timeActive / 1000 / 60 / 60 / 24;
                    
                    //amount earned from factor
                    var earned = Math.floor(city.population * bonus * city.taxRate * timeActive);
                    
                    if(dead){
                        //remove income factor, it is dead.
                        city.factors[factor].splice(i, 1);
                        i--;
                    }else{
                        //update last updated field if it exists
                        city.factors[factor][i][3] = d;
                    }
                    
                    taxRevenueDaily += earned;
                    
                    //add amount earned from factor to actualTaxRevenue
                    actualTaxRevenue += earned;
                }
            }
            
            /*
             *  PROCESS QUEUES
             */
        
            for(var queue in city.production_queues){
                var type = queue;

                for(var i = 0; i < city.production_queues[type].length; i++){
                    var data = city.production_queues[type][i];
                    var info = this.getQueueInfo(data);
                    
                    var produced = info.produced;
                    var timeActive = info.timeActive;

                    //switch(type)
                    var daysPassed = timeActive / 60 / 24;
                    switch(type){
                        case 'recruitment':
                            city.population_military += produced;

                            //soldier upkeep for these soldiers too!
                            if(produced > 0){
                                actualTaxRevenue -= Math.floor(this.Core.Game.gameCfg.soldier_upkeep * produced * daysPassed);
                            }

                            break;
                        case 'arms_order':
                            var category = this.Core.Game.getMilitaryItemCategory(data.item_name);
                            
                            console.log(info)
                            
                            if(!city.equipment[category][data.item_name]){
                                city.equipment[category][data.item_name] = 0;
                            }

                            city.equipment[category][data.item_name] += produced;

                            break;
                        case 'refining':
                            city.resources[data.item_name] += produced;
                            break;
                    }

                    if(data.forceEnd || d > data.timeTarget){
                        //remove from queue if dead
                        city.production_queues[type].splice(i, 1);
                        i--;
                        
                        if(type === 'recruitment'){
                            this.Core.Gui.notify([
                                0,
                                'Recruitment Complete',
                                'Your city has finished its '+ ((data.deduction) ? 'discharging' : 'recruitment') +' of soldiers.',
                                {}
                            ]);
                        }else if(type === 'arms_order'){
                            var category = this.Core.Game.getMilitaryItemCategory(data.item_name);
                           
                            var item = this.Core.Game.getMilitaryItemObj(data.item_name);
                            
                            this.Core.Gui.notify([
                                0,
                                'Production Finished',
                                'Your city has finished arms production of <span style="color:white;font-weight:bold;">'+ item.name +'</span>.',
                                {}
                            ]);
                        }else if(type === 'refining'){
                            this.Core.Gui.notify([
                                0,
                                'Refining Complete',
                                'Your city has finished refining of <span style="color:white;font-weight:bold;">'+ data.item_name +'</span>.',
                                {}
                            ]);
                        }
                    }else{
                        //update last updated field if it's still alive
                        city.production_queues[type][i].lastUpdate = d;
                    }
                }
            }

            //tax revenue goes towards GDP :)
            daily_gdp += taxRevenueDaily;
            
            //deduct military upkeep costs from tax revenue
            actualTaxRevenue -= city.population_military * this.Core.Game.gameCfg.soldier_upkeep * daysPassed;
            
            //add resources
            resourcesGained.money = Math.floor(actualTaxRevenue);
            
            //rates of this city
            var rates = this.cities[city_id].resource_rates;
            
            //build resourcesGained object with rate values
            for(var rate in rates){
                //if this resource rate hasn't been set yet, make it an int
                if(!resourcesGained[rate]){
                    resourcesGained[rate] = 0;
                }
                
                //how much they are making for this resource
                //can be negative is cost > income
                var income = rates[rate];
                
                //add to total gdp if making money from this rate
                if(income > 0){
                    if(rate === 'money'){
                        daily_gdp += income;
                    }else{
                        daily_gdp += income * this.Core.Game.getResourceValue(rate); 
                    }
                }
                
                //rate = type of resource, rates[rate] amount of resource per minute
                //amount of resources gained since last calculation
                resourcesGained[rate] += Math.floor(income * daysPassed);
            }
            
            //add gains to player
            for(var resource in resourcesGained){
                this.addResource(city_id, resource, resourcesGained[resource]);
            }
            
            //update national daily gdp
            city.daily_gdp = daily_gdp;
        }
            
        city.lastResourceCalculation = d;
        
        //get city resources
        var resources = city.resources;
        
        //update resources ui
        $('#panel table[name="resources"] td[name="money"]').text(fn_numberFormat(resources.money));
        $('#panel table[name="resources"] td[name="iron"]').text(fn_numberFormat(resources.iron));
        $('#panel table[name="resources"] td[name="gold"]').text(fn_numberFormat(resources.gold));
        $('#panel table[name="resources"] td[name="wood"]').text(fn_numberFormat(resources.wood));
        $('#panel table[name="resources"] td[name="oil"]').text(fn_numberFormat(resources.oil));
        $('#panel table[name="resources"] td[name="population"]').text(fn_numberFormat(city.population));
        $('#panel table[name="resources"] td[name="population_happiness"]').text(fn_numberFormat(city.population_happiness)+'%');
        $('#panel table[name="resources"] td[name="taxrate"]').text(fn_numberFormat(city.taxRate * 100)+'%');
    }
    
    Player.prototype.numInInventory = function(city_id, item_name){
        var city = this.cities[city_id];
        var category = this.Core.Game.getMilitaryItemCategory(item_name);
        
        if(category === 'weapons'){
            return numInventory = (city.equipment.weapons[item_name]) ? city.equipment.weapons[item_name] : 0;
        }else if(category === 'vehicles'){
            return numInventory = (city.equipment.vehicles[item_name]) ? city.equipment.vehicles[item_name] : 0;
        }else{
            return numInventory = (city.equipment.missiles[item_name]) ? city.equipment.missiles[item_name] : 0;
        }
    }
    
    
    Player.prototype.addToInventory = function(city_id, item, amount){
        var city = this.cities[city_id];
        var category = this.Core.Game.getMilitaryItemCategory(item);

        if(typeof city.equipment[category][item] === 'undefined'){
            city.equipment[category][item] = amount;
        }else{
            city.equipment[category][item] += amount;
        }
    }
    
    Player.prototype.setInventoryAmount = function(city_id, item_name, amount){
        var city = this.cities[city_id];
        var category = this.Core.Game.getMilitaryItemCategory(item_name);
        
        if(category === 'weapons'){
            city.equipment.weapons[item_name] = amount;
        }else if(category === 'vehicles'){
            city.equipment.vehicles[item_name] = amount;
        }else{
            city.equipment.missiles[item_name] = amount;
        }
    }
    
    Player.prototype.commanderNumUsedSlots = function(commander){
        var slots = 0;
        for(var item in commander.equipment){
            slots++;
        }
        return slots;
    }
   
    Player.prototype.commanderNumInInventory = function(commander, item){
        return (commander.equipment[item]) ? commander.equipment[item] : 0;
    }
    
    Player.prototype.numFreeSoldiers = function(city_id){
        var city = this.cities[city_id];
        var total = city.population_military;
        var assigned = 0;
        
        for(var commander in city.commanders){
            assigned += city.commanders[commander].soldiers;
        }
        
        return (total-assigned);
    }
    
    Player.prototype.hasBlueprints = function(blueprints){
        var city = this.cities[this.current_city];
        
        if(typeof blueprints === 'string'){
            return (city.research.blueprints.indexOf(blueprints) !== -1) ?  true : false;
        }else{
            for(var i = 0; i < blueprints.length; i++){
                if(city.research.blueprints.indexOf(blueprints[i]) === -1){
                    return false;
                }
            }

            return true;
        }
    }
    
    Player.prototype.isActiveResearchProject = function(name){
        var city = this.cities[this.current_city];
        return (city.research.active[name]) ? true : false;
    }
    
    Player.prototype.initResearch = function(city_id){
        var city = this.cities[city_id];
        
        if(city){
            var projects = city.research.active;
            
            for(var project in projects){
                var myObj = projects[project];
                
                this.startResearch(city_id, project, myObj.started);
            }
        }
    }
    
    Player.prototype.denitResearch = function(city_id){
        var city = this.cities[city_id];
        
        if(city){
            var projects = city.research.active;
            
            for(var project in projects){
                var myObj = projects[project];
                
                this.cancelResearch(city_id, project);
            }
        }
    }
    
    Player.prototype.startResearch = function(city_id, project, startTime){
        var Player = this;
        
        var city = this.cities[city_id];
        var projObj = this.Core.Game.gameCfg.research_projects[project];
        
        if(city){
            //get server time
            var d = Date.now() - this.Core.serverTimeDifference;

            //time until research will be finished
            var timeUntil = projObj.time * 60 * 1000;
            
            // > 0?
            if(startTime){
                var timePassed = d - startTime;
                
                timeUntil -= timePassed;
            }

            var timeout = setTimeout(function(city_id, project){
                this.researchFinished(city_id, project);
            }.bind(Player), timeUntil, city.city_id, project);
            
            //add project to active projects
            city.research.active[project] = {
                started : (startTime) ? startTime : d,
                timeout : timeout
            };
            
            //is this set, even if === 0
            if(typeof startTime === 'undefined'){
                //subtract costs
                Player.subCost(city.city_id, projObj.cost);
                Player.setResourceRates(city.city_id);

                //update resource info immediately after purchase
                Player.updateResources(city.city_id);
            }
            
            //force garbage collection because of evil timeout
            Player = null;
            city = null;
            name = null;
            project = null;
            projObj = null;
            d = null;
        }
    }
	
    Player.prototype.researchFinished = function(city_id, project){
        var city = this.cities[city_id];
        var obj = this.Core.Game.gameCfg.research_projects[project];
        
        console.log('~~~~~~~~~~~researchFinished~~~~~~~~~~')
        console.log(project)
        
        console.log('~~')
        console.log(city.research.active)
        
        //clear timeout just in case
        var research = city.research.active[project];
        
        if(research){
            var timeout = research.timeout;
            
            if(timeout){
                clearTimeout(timeout);
            }
            
            //remove from active
            city.research.active[project] = null;
            delete city.research.active[project];

            //add to blueprints
            city.research.blueprints.push(project);

            this.Core.Gui.notify([
                0,
                'Research Completed',
                'You have aquired the blueprints for <span style="font-weight:bold;color:white;">'+ obj.name+'</span>.',
                {}
            ]);
        }
        
        console.log(city.research.active)
    }
    
    Player.prototype.cancelResearch = function(city_id, project){
        var city = this.cities[city_id];
        var obj = this.Core.Game.gameCfg.research_projects[project];
        
        //clear timeout just in case
        var timeout = city.research.active[project].timeout;
        if(timeout){
            clearTimeout(timeout);
        }
        
        //percent resources back
        var time = Date.now() - this.Core.serverTimeDifference;
        var percent_back = 1 - (time - city.research.active[project].started)/(obj.time * 60 * 1000);
        
        for(var resource in obj.cost){
            var amount = Math.floor(obj.cost[resource] * percent_back);
            this.addResource(city_id, resource, amount);
        }
        
        //update resources
        this.setResourceRates(city_id);
        this.updateResources(city_id);
        
        //remove from active
        city.research.active[project] = null;
        delete city.research.active[project];
    }
    
    Player.prototype.getNumActiveResearchProjects = function(city_id){
        var projects = this.cities[city_id].research.active;

        var i = 0;
        for(var project in projects){
            i++;
        }
        return i;
    }
    
    Player.prototype.commanderRecruited = function(data){
        //add new commander to city commander object
        this.cities[data.city_id].commanders[data.commanderID] = {
            name : data.name,
            rank : data.rank,
            capacity : data.capacity,
            soldiers : 0,
            equipment : {},
            station_x : data.station_x,
            station_y : data.station_y
        };
    }
    
    Player.prototype.commanderRelocated = function(data){
        var commander = this.cities[data.city_id].commanders[data.commanderID];
        
        commander.station_x = data.x;
        commander.station_y = data.y;
        commander.mission_x = 0;
        commander.mission_y = 0;
    }
    
    Player.prototype.commanderInventoryUpdate = function(data){
        var commander = this.cities[data.city_id].commanders[data.commanderID];
        
        commander.soldiers = data.soldiers;
        commander.equipment = data.equipment;
    }
    
    Player.prototype.dischargeCommander = function(city_id, commanderID){
        var city = this.cities[city_id];
        var commander = city.commanders[commanderID];

        //does the commander exist, and do they have less than the max commander amount?
        if(city){
            //does commander exist?
            if(commander){
                var equipment = commander.equipment;

                //return assigned equipment to city inventory
                for(var item in equipment){
                    this.addToInventory(city.city_id, item, equipment[item]);
                }

                //remove troops
                city.population_military += commander.soldiers;

                //now discharge commander
                city.commanders[commanderID] = null;
                delete city.commanders[commanderID];
            }
        }
    }

    Player.prototype.getUniqueCommanderID = function(city_id){
        var commanders = this.cities[city_id].commanders;

        var highest_id = 0;
        for(var commanderID in commanders){
            var id = parseInt(commanderID);

            if(id > highest_id){
                highest_id = id;
            }
        }

        return (highest_id+1);
    }
    
    Player.prototype.getNumCommanders = function(city_id){
        var i = 0;
        var commanders = this.cities[city_id].commanders;

        for(var commander in commanders){
            i++;
        }

        return i;
    }
    
    Player.prototype.getNumAvailableCommanders = function(city_id){
        var city = this.cities[city_id];
        var commanders = city.commanders;
        
        var i = 0;

        for(var commander in commanders){
            var obj = commanders[commander];
            
            if(!this.commanderHasMission(obj)){
                i++;
            }
        }

        return i;
    }

    Player.prototype.getNumTempCommanders = function(city_id){
        var i = 0;
        var commanders = this.cities[city_id].temp_commanders;

        for(var commander in commanders){
            i++;
        }

        return i;
    }
    
    Player.prototype.removeGMBuilding = function(city_id, x, y){
        var buildings = this.cities[city_id].gm_buildings;

        for(var i = 0; i < buildings.length; i++){
            var building = buildings[i];

            if(building.x === x && building.y === y){
                this.cities[city_id].gm_buildings.splice(i, 1);
                return true;
            }
        }

        return false;
    }
    
    Player.prototype.cacheAllianceData = function(data){
        this.alliance_data = data;
        
        //is the base_recruitmentoffice interface active?
        if(this.Core.InterfaceManager.isInterfaceLoaded('alliance')){
            this.Core.InterfaceManager.loaded_interfaces['alliance'].loadAllianceData(data);
        }
    }
    
    Player.prototype.handleAllianceMembersLoaded = function(members){
        //is the base_recruitmentoffice interface active?
        if(this.Core.InterfaceManager.isInterfaceLoaded('alliance_members')){
            this.Core.InterfaceManager.loaded_interfaces['alliance_members'].loadAllianceMembers(members);
        }
    }
    
    Player.prototype.handleAllianceInviteMembers = function(data){
        if(this.Core.InterfaceManager.isInterfaceLoaded('alliance_invite')){
            this.Core.InterfaceManager.loaded_interfaces['alliance_invite'].loadUserResults(data);
        }
    }
    
    Player.prototype.handleAllianceInviteResponse = function(data){
        if(this.Core.InterfaceManager.isInterfaceLoaded('alliance_invite')){
            this.Core.InterfaceManager.loaded_interfaces['alliance_invite'].handleInviteResponse(data);
        }
    }
    
    Player.prototype.handleAllianceAcceptInviteResponse = function(data){
        //remove alliance invite
        this.removeInvite(data.alliance.alliance_data.id);
        
        this.alliance = data.alliance.alliance_data.id;
        this.alliance_perms = data.alliance.alliance_perms;
        this.alliance_leader = false;
        this.alliance_data = data.alliance.alliance_data;
        
        if(this.Core.InterfaceManager.isInterfaceLoaded('alliance_invites')){
            this.Core.InterfaceManager.loaded_interfaces['alliance_invites'].handleAcceptResponse(data);
        }
    }
    
    Player.prototype.handleAllianeUserPermissions = function(data){
        //is the base_recruitmentoffice interface active?
        if(this.Core.InterfaceManager.isInterfaceLoaded('alliance_user')){
            this.Core.InterfaceManager.loaded_interfaces['alliance_user'].loadData(data);
        }
    }
    
    Player.prototype.handleAllianceMyPermsUpdate = function(perms){
        for(var perm in perms){
            this.alliance_perms[perm] = (perms[perm]) ? 1 : 0;
        }
    }
    
    Player.prototype.handleAllianceInvited = function(allianceID){
        this.alliance_invites.push(allianceID);
    }
    
    Player.prototype.handleAllianceKick = function(){
        this.alliance = false;
        this.alliance_data = false;
    }
    
    Player.prototype.handleAllianceCreation = function(id){
        if(id){
            this.alliance = id;
            this.alliance_leader = true;
        }else{
            this.Core.Gui.popup('Error', 'The server failed to create your alliance.', {}, 'error');
        }
    }
    
    Player.prototype.removeInvite = function(allianceID){
        var invites = this.alliance_invites;
        
        for(var i = 0; i < invites.length; i++){
            if(invites[i].allianceID === allianceID){
                //remove invite
                invites.splice(i, 1);
                return true;
            }
        }

        return false;
    }
    
    Player.prototype.activeTradeAccepted = function(id){
        for(var i = 0; i < this.tradeOffers.length; i++){
            var trade = this.tradeOffers[i];
            
            if(trade.id === id){
                //add mission to the globalmap
                this.Core.GlobalMap.addMission({
                    city_id : trade.sender_city_id,
                    x : trade.sender_x,
                    y : trade.sender_y,
                    destination_x : trade.receiver_x,
                    destination_y : trade.receiver_y,
                    action : 'trade_mission',
                    data : {
                        offer : trade.offer,
                        request : trade.request,
                        sender_city_id : parseInt(trade.sender_city_id),
                        sender_userid : parseInt(trade.sender_userid),
                        receiver_city_id : parseInt(trade.receiver_city_id),
                        receiver_userid : parseInt(trade.receiver_userid)
                    }
                });
                
                if(trade.sender_userid === this.id){
                    this.Core.Gui.notify([0, 'Trade Accepted', 'A trade offer you sent to <span style="color:white;font-weight:bold;">'+ trade.receiver_username +'</span> and their city <span style="color:white;font-weight:bold;">'+ trade.receiver_city +'</span> has been accepted.'], 'trade_accepted');
                }else{
                    this.Core.Gui.notify([0, 'Trade Canceled', 'A trade offer with <span style="color:white;font-weight:bold;">'+ trade.sender_username +'</span> and their city <span style="color:white;font-weight:bold;">'+ trade.sender_city +'</span> has been accepted.'], 'trade_canceled');
                }
                
                this.tradeOffers.splice(i, 1);
                
                return true;
            }
        }
    }
    
    Player.prototype.activeTradeDeleted = function(id, silent){
        for(var i = 0; i < this.tradeOffers.length; i++){
            var trade = this.tradeOffers[i];
            
            if(trade.id === id){
                //return items
                if(trade.sender_userid === this.id){
                    var city = this.cities[trade.sender_city_id];
                    
                    this.tradeAddOffer(city.city_id, trade.offer);

                    //update resource info immediately after purchase
                    this.updateResources(city.city_id);
                }
                
                if(!silent){
                    if(trade.sender_userid === this.id){
                        this.Core.Gui.notify([0, 'Trade Canceled', 'A trade offer with <span style="color:white;font-weight:bold;">'+ trade.receiver_username +'</span> and their city <span style="color:white;font-weight:bold;">'+ trade.receiver_city +'</span> has been canceled.'], 'trade_canceled');
                    }else{
                        this.Core.Gui.notify([0, 'Trade Canceled', 'A trade offer with <span style="color:white;font-weight:bold;">'+ trade.sender_username +'</span> and their city <span style="color:white;font-weight:bold;">'+ trade.sender_city +'</span> has been canceled.'], 'trade_canceled');
                    }
                }
                
                this.tradeOffers.splice(i, 1);
                
                return true;
            }
        }
    }
    
    Player.prototype.activeTradeAdded = function(data){
        if(data.sender_userid === this.id){
            this.Core.Gui.notify([0, 'Trade Offer Sent', 'You have sent a trade offer to <span style="color:white;font-weight:bold;">'+ data.receiver_username +'</span> and their city <span style="color:white;font-weight:bold;">'+ data.receiver_city +'</span>.'], 'trade_sent');
        }else{
            this.Core.Gui.notify([0, 'Trade Offer Received', '<span style="color:white;font-weight:bold;"><b>'+data.sender_username +'</b></span> has sent you a trade offer from <span style="color:white;font-weight:bold;">'+ data.sender_city +'</span>.'], 'trade_received');
        }
        
        if(data.parent_trade){
            this.activeTradeDeleted(data.parent_trade, true);
        }
        
        this.tradeOffers.unshift(data);
    }
    
    Player.prototype.setActiveTradeOffers = function(trades){
        this.tradeOffers = trades;
        
        var stats = {};
        var outgoing_trades = 0;
        var has_incoming_trades = false;
        
        //get each city and the # of active trade offers for each city
        for(var i = 0; i < trades.length; i++){
            var city = trades[i].receiver_city;
            var userid = trades[i].receiver_userid;
            
            if(userid === this.id){
                if(!stats[city]){
                    stats[city] = 1;
                }else{
                    stats[city]++;
                }
                
                if(!has_incoming_trades){
                    has_incoming_trades = true;
                }
            }else{
                outgoing_trades++;
            }
        }
        
        //list each city that has a trade offer, and the amount of trade offers
        var cities_html = '';
        
        if(has_incoming_trades){
            cities_html += 'You have active trade offer(s) for the following citie(s):<br/>';
            cities_html += '<ul>';
            for(var city in stats){
                cities_html += '<li>'+city +' <b>('+ stats[city] +')</b></li>';
            }
            cities_html += '</ul>';
        }
        
        
        if(outgoing_trades > 0){
            cities_html += 'You have '+ outgoing_trades +' outgoing trades, waiting a response from the targeted player.<br/>';
        }
        
        var self = this;
        this.Core.Gui.notify([0, 'Active Trade Offers', cities_html, {
            buttons : [
                ['View Trades', function(){
                    self.Core.InterfaceManager.loadInterface('my_trades');
                }],
                ['OK']
            ]
        }], 'trade');
    }
    
    Player.prototype.tradeComplete = function(mission){
        var city_id = 0;
        console.log(mission)
        if(mission.sender_userid === this.Core.Player.id){
            //sender
            this.Core.Gui.notify([0, 'Trade Arrived', 'A plane full of trading goods has reached its target destination.'], 'trade_completed');
            
            //set city id
            city_id = mission.sender_city_id;
            //add goods
            this.tradeAddOffer(city_id, mission.request);
        }else{
            //receiver
            this.Core.Gui.notify([0, 'Trade Arrived', 'A plane full of trading goods has arrived to your city.'], 'trade_completed');
            
            //set city id
            city_id = mission.receiver_city_id;
            
            //add goods
            this.tradeAddOffer(city_id, mission.offer);
        }
        
        //update resource info immediately after purchase
        this.updateResources(city_id);
    }
    
    /*
     *  returns our goods on a failed trade attempt
     */
    Player.prototype.tradeCreationFailed = function(data){
        if(data){
            this.tradeAddOffer(data.city_id, data.offer);
            this.updateResources(data.city_id);
        }
    }
    
    Player.prototype.tradeSubOffer = function(city_id, offer){
        //subtract resources
        this.subCost(city_id, offer.resource);

        //subtract weapons
        this.subWeapons(city_id, offer.weapons);

        //subtract ak47s
        this.subVehicles(city_id, offer.vehicle);
    }

    Player.prototype.tradeAddOffer = function(city_id, offer){
        //subtract resources
        this.subCost(city_id, offer.resource, true);

        //subtract weapons
        this.subWeapons(city_id, offer.weapons, true);

        //subtract ak47s
        this.subVehicles(city_id, offer.vehicle, true);
    }
    
    Player.prototype.loadMessages = function(messages){
        for(var i = 0; i < messages.length; i++){
            var msg = messages[i];
            
            //sort by inbox/sent mail
            if(msg.receiver_id === this.id || msg.global === 1){
                this.messages.inbox.push(msg);
            }else{
                this.messages.sent.push(msg);
            }
        }
    }
    
    Player.prototype.getNumUnreadMessages = function(){
        var num = 0;
        var messages = this.messages.inbox;
        
        for(var i = 0; i < messages.length; i++){
            var hasRead = messages[i].hasRead;
            
            if(hasRead === 0){
                num++;
            }
        }
        
        return num;
    }
    
    Player.prototype.getMessageById = function(id){
        var inbox = this.messages.inbox;
        for(var i = 0; i < inbox.length; i++){
            if(inbox[i].id === id){
                return inbox[i];
            }
        }
        
        var sent = this.messages.sent;
        for(var i = 0; i < sent.length; i++){
            if(sent[i].id === id){
                return sent[i];
            }
        }
        
        return false;
    }
    
    Player.prototype.deleteMessageById = function(id){
        var inbox = this.messages.inbox;
        for(var i = 0; i < inbox.length; i++){
            if(inbox[i].id === id){
                this.messages.inbox.splice(i, 1);
                return true;
            }
        }
        
        var sent = this.messages.sent;
        for(var i = 0; i < sent.length; i++){
            if(sent[i].id === id){
                this.messages.sent.splice(i, 1);
                return true;
            }
        }
        
        return false;
    }
    
    Player.prototype.markReadById = function(id, status){
        var inbox = this.messages.inbox;
        for(var i = 0; i < inbox.length; i++){
            if(inbox[i].id === id){
                this.messages.inbox[i].hasRead = (status) ? 1 : 0;
                return true;
            }
        }
        
        return false;
    }
    
    Player.prototype.handleSendMessageResponse = function(data){
        if(data.success){
            this.messages.sent.push(data.message);
            
            //if the interface is open at the time they get this message
            if(this.Core.InterfaceManager.isInterfaceLoaded('my_messages')){
                this.Core.InterfaceManager.loaded_interfaces['my_messages'].handleSentMessage();
            }
        }else{
            this.failed_messages.unshift({
                retry   : data.canRetry,
                err     : data.err,
                type    : data.message.type,
                to      : data.message.to,
                subject : data.message.subject,
                content : data.message.content
            });

            this.Core.Gui.notify([
                0,
                'Sending Failed',
                'The sending of your message to '+ fn_htmlEnc(data.message.to) +' failed.',
                {}
            ], 'pm_failed');
            
            //if the interface is open at the time they get this message
            if(this.Core.InterfaceManager.isInterfaceLoaded('my_messages')){
                this.Core.InterfaceManager.loaded_interfaces['my_messages'].handleFailedMessage();
            }
        }
    }
    
    Player.prototype.handleNewMessage = function(msg){
        this.messages.inbox.push(msg);
        
        if(msg.global){
            this.Core.Gui.notify([
                0,
                'New Global Message',
                'You have received a global message.',
                {}
            ], 'global_msg');
        }else{
            if(msg.type === 2){
                this.Core.Gui.notify([
                    0,
                    'New Private Message',
                    'You have received a new system message.',
                    {}
                ], 'pm_received');
            }else{
                this.Core.Gui.notify([
                    0,
                    'New Private Message',
                    'You have received a new private message from '+ fn_htmlEnc(msg.sender_username) +'.',
                    {}
                ], 'pm_received');
            }
            
        }
    }
    
    Player.prototype.handleWarDeclaration = function(war){
        //add new war to our player war variable
        this.wars.push(war);
    }
    
    Player.prototype.handleWarHistory = function(data){
        if(this.Core.InterfaceManager.isInterfaceLoaded('war_myWars')){
            this.Core.InterfaceManager.loaded_interfaces['war_myWars'].historyLoaded(data, true);
        }
    }
    
    Player.prototype.handlePeaceOffer = function(data){
        var warID = parseInt(data.warID);
        var type = parseInt(data.type);
        
        var index = this.getWarIndex(warID);
        var war = this.wars[index];
        var amAttacker = (war.attacker === this.id);
        
        //enemy has offered peace/taken away peace. update the war data to reflect that
        if(amAttacker){
            war.defenderOfferedPeace = type;
        }else{
            war.attackerOfferedPeace = type;
        }
        
        
        this.Core.Gui.notify([0, 'Peace Offer', 'The enemy nation of [?] has '+ ((type) ? 'offered' : 'revoked') +' an offer of peace.']);
    }
    
    Player.prototype.handlePeaceDeclaration = function(warID){
        this.Core.Gui.notify([0, 'Peace Declared, War Over', 'Your nation and your enemies nation have both declared peace. The war between your nations has ended.']);
        
        //war over, go home lads! remove the war from our player war variable
        var index = this.getWarIndex(warID);
        this.wars.splice(index, 1);
    }
    
    Player.prototype.updateCityHealth = function(data){
        var city = this.cities[data.city_id];
        
        //update values
        city.health = data.health;
        city.lastHealthUpdate = data.lastHealthUpdate;
        
        console.log('Updated city health');
    }
    
    Player.prototype.getWarIndex = function(warID){
        var wars = this.wars;
    
        for(var i = 0; i < wars.length; i++){
            var war = wars[i];

            if(war.id === warID){
                return i;
            }
        }

        return -1;
    }
    
    Player.prototype.getWarHistoryByID = function(warID){
        var wars = this.warHistoryCache.wars;
        
        for(var i = 0; i < wars.length; i++){
            if(wars[i].warID === warID){
                return wars[i];
            }
        }
        
        return false;
    }
    
    Player.prototype.getWarHistoryBattle = function(warID, battleID){
        var wars = this.warHistoryCache.wars;
        
        for(var i = 0; i < wars.length; i++){
            var war = wars[i];
            
            if(war.warID === warID){
                for(var x = 0; x < war.battles.length; x++){
                    var battle = war.battles[x];
                    
                    if(battle.id === battleID){
                        return battle;
                    }
                }
            }
        }
        
        return false;
    }
    
    Player.prototype.commanderHasMission = function(commander){
        return (commander.mission_x > 0 || commander.mission_y > 0) ? true : false;
    }
    
    Player.prototype.amAtWar = function(userid){
        if(userid){
            for(var i = 0; i < this.wars.length; i++){
                if(this.wars[i].attacker === userid || this.wars[i].defender === userid){
                    return this.wars[i].id;
                }
            }
            
            return false;
        }else{
            return this.wars.length;
        }
    }
    
    Player.prototype.amAttacker = function(warID){
        var war = this.wars[warID];
        
        if(war && war.attacker === this.id){
            return true;
        }
        
        return false;
    }
    
    Player.prototype.login = function(data, callback){
        if(!this.Core.clientConnected){
            //reconnect
            var self = this;
            this.Core.connect(function(){
                self.loginCallback = callback;
                self.Core.client.emit('validateLogin', data);
            });
        }else{
            this.loginCallback = callback;
            this.Core.client.emit('validateLogin', data);
        }
    }
   
    Player.prototype.handleLogin = function(data){
        if(data){
            console.log('Logged in.');
            
            //set player data
            this.id                 = data.userid;
            this.username           = data.username;
            this.nation             = data.nation;
            this.alliance           = data.alliance;
            this.alliance_perms     = data.alliance_perms;
            this.alliance_leader    = data.alliance_leader;
            this.alliance_invites   = data.alliance_invites;
            this.rights             = data.rights;
            this.locked             = data.locked;
            
            //if the server generated a new session, set cookie
            if(data.session){
                fn_setCookie('session', data.session, 2);
            }
            
            //if newly registered
            if(data.registered){
                this.registerCallback = null;
                this.Core.MainMenu.waitingRegisterResponse = false;
            }else{
                this.loginCallback = null;
                this.Core.MainMenu.waitingLoginResponse = false;
            }
            
            this.loggedIn = true;
            this.Core.MainMenu.update();
        }else{
            //cookie validaiton failed, force them to login
            if(!this.requireLogin){
                this.requireLogin = true;
                this.Core.MainMenu.update();
            }else{
                this.loginCallback(false);
            }
        }
    }
    
    Player.prototype.register = function(data, callback){
        if(!this.Core.clientConnected){
            //reconnect
            var self = this;
            this.Core.connect(function(){
                self.registerCallback = callback;
                self.Core.client.emit('validateRegistration', data);
            });
        }else{
            this.registerCallback = callback;
            this.Core.client.emit('validateRegistration', data);
        }
    }
    
    /* only called when server encounters error registering */
    Player.prototype.handleRegister = function(error){
        this.registerCallback((error === true) ? 'Server error' : error);
    }
    
    Player.prototype.clearUserData = function(){
        fn_eraseCookie('session');
        
        this.loggedIn = false;
        this.requireLogin = true;
        this.cities = {};
        this.current_city = 0;
        this.current_city_loaded = false;
        this.messages.sent = [];
        this.messages.inbox = [];
        
        //flag will be set if the user has created an alliance and is awaiting server response
        this.created_alliance = false;
    }
    
    Player.prototype.handleLogout = function(){
        //clear update interval
        clearInterval(this.resourcesUpdateInterval);
        
        this.Core.Gui.clearNotifications();
    }
    
    Player.prototype.handlePopup = function(data){
        this.Core.Gui.popup(0, data.title, data.content, data.options);
    }
    
    Player.prototype.handleNotify = function(data){
        this.Core.Gui.notify([
            0,
            data.title,
            data.content,
            data.options
        ], data.type);
    }
    
    Player.prototype.handleKick = function(data){
        this.kickReason = data.reason;
        
        this.Core.Gui.popup(0, 'Server Kick', data.reason, {});
        
        if(data.hit_the_road){
            $('body').append('<audio src="game/resources/audio/banned.mp3" autoplay loop></audio>');
        }
    }
    
    Player.prototype.logout = function(){
        this.Core.Events.emit('PLAYER:LOGOUT', true);
    }
    
    Client.Player = Player;
})();