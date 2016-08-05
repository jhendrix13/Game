(function(){
    function Game(){}
    
    Game.prototype.construct = function(Core){
        this.Core = Core;
        
        this.gameCfg = {};
    }
    
    Game.prototype.getResourceValue = function(resource){
        return this.gameCfg.resource_prices[resource];
    }
    
    Game.prototype.getFormattedName = function(resource){
        return this.getIcon() + ' '+ resource; 
    }
    
    Game.prototype.getIcon = function(resource){
        return '';
    }
    
    Game.prototype.commanderRefresh = function(data){
        this.Core.Player.cities[data.city_id].temp_commanders = data.commanders;
        
        //is the base_recruitmentoffice interface active?
        if(this.Core.InterfaceManager.isInterfaceLoaded('base_recruitmentoffice')){
            this.Core.InterfaceManager.loaded_interfaces['base_recruitmentoffice'].loadCommanders();
        }
    }
    
    Game.prototype.retrievedCityTradeables = function(data){
        //is the base_recruitmentoffice interface active?
        if(this.Core.InterfaceManager.isInterfaceLoaded('trade')){
            this.Core.InterfaceManager.loaded_interfaces['trade'].targetTradeableItemsRetrieved(data);
        }
    }
    
    Game.prototype.getMilitaryItemCategory = function(item){
        if(this.gameCfg.military_vehicles[item]){
            return 'vehicles';
        }else if(this.gameCfg.military_weapons[item]){
            return 'weapons';
        }else{
            return 'missiles';
        }
    }
    
    Game.prototype.getMilitaryItemObj = function(item){
        if(this.gameCfg.military_vehicles[item]){
            return this.gameCfg.military_vehicles[item];
        }else if(this.gameCfg.military_weapons[item]){
            return this.gameCfg.military_weapons[item];
        }else{
            return this.gameCfg.military_missiles[item]
        }
    }
    
    Game.prototype.getItemDisplayNameByType = function(item_name, type){
        switch(type){
            case 'blueprint':
                return this.getBlueprintDisplayName(item_name);
            case 'weapon':
                return this.getFirearmDisplayName(item_name);
            case 'vehicle':
                return this.getVehicleDisplayName(item_name);
            case 'missile':
                return this.getMissileDisplayName(item_name);
            default:
                return item_name;
        }
    }
    
    Game.prototype.getBlueprintDisplayName = function(blueprint){
        return this.gameCfg.research_projects[blueprint].name;
    }
    
    Game.prototype.getVehicleDisplayName = function(vehicle){
        return this.gameCfg.military_vehicles[vehicle].name;
    }
    
    Game.prototype.getFirearmDisplayName = function(firearm){
        return this.gameCfg.military_weapons[firearm].name;
    }
    
    Game.prototype.getMissileDisplayName = function(missile){
        return this.gameCfg.military_missiles[missile].name;
    }
    
    Game.prototype.getFuelCost = function(distance){
        return (this.gameCfg.mission_fuel_cost_per_tile * distance);
    }
    
    Game.prototype.getDistance = function(x, y, dx, dy){
        return Math.sqrt(Math.pow( dx - x , 2) + Math.pow( dy - y , 2));
    }
    
    Game.prototype.calculateHealth = function(health, lastUpdate){
        var d = this.Core.now();

        if(lastUpdate > 0){
            var cfg = this.gameCfg;

            //how much hp gain per hour
            var perHour = Math.round(cfg.city_base_hp / cfg.city_regen_hours);

            //hours since last update
            var hoursSince = (d - lastUpdate) / 1000 / 60 / 60;

            //add hp gain
            health += Math.round(hoursSince * perHour);

            //don't go over max
            if(health > cfg.city_base_hp){
                health = cfg.city_base_hp;
            }
        }

        return health;
    }
    
    Game.prototype.parseOnTileData = function(unparsed_json){
        if(unparsed_json && unparsed_json.length > 0){
            return JSON.parse(unparsed_json);
        }else{
            return false;
        }
    }
    
    Client.Game = Game;
})();