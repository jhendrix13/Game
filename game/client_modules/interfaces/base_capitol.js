/*
 *  CLIENT
 */

(function(){
    function base_capitol(Core){
        this.Core = Core;
        this.id = 'base_capitol';
        
        this.chart = false;
        this.chart_data = [];
        this.chart_options = {};
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    base_capitol.prototype.load = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        var resource = this.Core.Resources.base.buildings['capitol'];
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="max-width:450px;">';
            html += '<div class="title">'+ resource.name.toUpperCase() +'</div>';
            html += '<div style="margin:10px;">'; 
            html += '<div class="description"><div style="margin:10px;">'+ resource.description +'</div></div>';
            
            html += '<div name="tab_selection" class="tabs">';
            html += '<div name="tab-info" class="tab">City Info</div><div name="tab-economy" class="tab">Economy</div>';
            html += '<div name="tab-resources" class="tab">Resources</div><div name="tab-trades" class="tab">Trade</div>';
            html += '</div>';
            html += '<div name="content-info"><table cellpadding="6" style="color:yellow;">';
            html += '<tr><td style="max-width:90px;">City Name</td><td>'+ city.city_name +'</td></tr>';
            html += '<tr><td style="max-width:90px;">Daily GDP</td><td>$ '+ fn_numberFormat(city.daily_gdp) +'</td></tr>';
            html += '<tr><td style="max-width:90px;">Tax Rate</td><td><input name="editable-tax_rate" style="width:50px;" value="'+ (city.taxRate * 100) +'"> % <button name="editable-tax_rate" style="display:none;height:23px;">Update</button></td></tr>';
            html += '<tr><td style="max-width:90px;">Avg. Daily Income per citizen</td><td>$ '+ fn_numberFormat(city.population_avg_gross_income);
            
            for(var factor in city.factors){
                var totalBonus = 0;
                
                for(var i = 0; i < city.factors[factor].length; i++){
                    var obj = city.factors[factor][i];
                    totalBonus += obj[0] * this.Core.Game.gameCfg.factor_bonuses[factor];
                }
                
                if(totalBonus > 0){
                    html += '<br/>+ $ '+ totalBonus.toFixed(2) +' '+ factor.toUpperCase();
                }
            }
            
            html += '</td></tr>';
            html += '<tr><td style="max-width:90px;">Population Happiness</td><td>'+ city.population_happiness +' %</td></tr>';
            html += '</table></div>';
            
            html += '<div name="content-economy" style="margin:0 auto;width:100%;margin-bottom:9px;" class="hidden">';
            html += '<div id="economy_gdp_chart" style="border:1px solid yellow;width:100%;height:300px;">Not enough economic data gathered to display growth chart.</div>';
            html += '</div>';
            
            html += '<div name="content-resources" style="margin:0 auto;width:100%;margin-bottom:9px;" class="hidden">';
            html += '<table cellpadding="6" style="color:yellow;">';
            
            for(var resource in city.resources){
                html += '<tr><td style="text-transform:capitalize;">'+ resource +'</td><td>'+ fn_numberFormat(city.resources[resource]) +'</td></tr>';
            }
            
            html += '</table>';
            html += '</div>';
        
            html += '<button name="ok">Ok</button>';
            html += '<div name="clear"></div></div></div>';
            
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('focus', 'div[name="interface-'+ this.id +'"] input[name|="editable"]', this.editableFieldFocus.bind(this));
        $(document).on('blur', 'div[name="interface-'+ this.id +'"] input[name|="editable"]', this.editableFieldBlur.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="editable"]', this.updateEditable.bind(this));
    }
    
    base_capitol.prototype.editableFieldFocus = function(e){
        var button = $(e.target).parent('td').children('button[name|="editable"]');
        button.show(0);
    }
    
    base_capitol.prototype.editableFieldBlur = function(e){
        //var button = $(e.target).parent('td').children('button[name|="editable"]');
        //button.hide(0);
    }
    
    base_capitol.prototype.updateEditable = function(e){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        var button = $(e.target);
        var input = button.parent('td').children('input[name|="editable"]');
        var value = input.val();
        var field = input.attr('name').split('-')[1];
        
        var val;
        switch(field){
            case 'tax_rate':
                val = fn_validateInteger(value, 0, this.Core.Game.gameCfg.max_tax_rate, city.taxRate * 100) / 100;
                city.taxRate = val;
                input.val(val * 100);
                break;
        }
        
        //notify server
        if(typeof val !== 'undefined'){
            this.Core.Events.emit('GAME:UPDATE_VALUE', {
                city_id : city.city_id,
                field : field,
                value : value
            });
        }
        
        
        button.hide(0);
    }
    
    base_capitol.prototype.buildChart = function(){
        var Player = this.Core.Player;
        var city = Player.cities[Player.current_city];
        
        //google chart vars
        var checkpoints = city.economy_checkpoints;
        if(checkpoints.length > 1){
            var data_arr = [['Date', 'GDP']];

            //build data array
            for(var i = 0; i < checkpoints.length; i++){
                var gdp = checkpoints[i][1];
                var localTime = new Date(checkpoints[i][0] - this.Core.serverTimeDifference);
                var timeString = (localTime.getMonth()+1)+'/'+localTime.getDate();
                
                data_arr.push([timeString, gdp]);
            }
            
            var formatting = new google.visualization.NumberFormat({
                prefix : '$',
                pattern : '###,###'
            });
            
            this.chart_data = google.visualization.arrayToDataTable(data_arr);
            
            formatting.format(this.chart_data, 1);
            
            this.chart_options = {
                title: 'Daily GDP Growth',
                curveType: 'function',
                legend: { position: 'bottom' },
                backgroundColor: 'black',
                legendTextStyle: { color: 'white' },
                titleTextStyle: { color: 'white' },
                vAxis : {
                    textStyle : {
                      color : 'white'
                  }
                },
                hAxis : {
                    textStyle : {
                      color : 'white'
                  }
                },
                colors : ['yellow']
            };

            this.chart = new google.visualization.LineChart(document.getElementById('economy_gdp_chart'));
        }
    }
    
    base_capitol.prototype.showTab = function(e){
        var tab = $(e.target).attr('name').split('-')[1];
        
        if(tab === 'trades'){
            this.Core.InterfaceManager.unloadInterface(this.id);
            this.Core.InterfaceManager.loadInterface('my_trades');
        }else{
            $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
            $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();

            if(tab === 'economy'){
                this.buildChart();
                this.chart.draw(this.chart_data, this.chart_options);
            }

            //recenter interface
            this.Core.InterfaceManager.centerInterface(this.id);
        }
    }
    
    base_capitol.prototype.unload = function(){
        if(this.chart){
            this.chart.clearChart();
            this.chart = null;
        }
        
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('focus', 'div[name="interface-'+ this.id +'"] input[name|="editable"]');
        $(document).off('blur', 'div[name="interface-'+ this.id +'"] input[name|="editable"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="editable"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['base_capitol'] = base_capitol;
})();