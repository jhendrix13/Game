/*
 *  CLIENT
 */

(function(){
    function my_trades(Core){
        this.Core = Core;
        this.id = 'my_trades';
        
        //get tradeOffer state upon interface creation
        this.trades = Core.Player.tradeOffers;
        
        //interface options
        this.unload_on_screen_switch = true;
        this.z_index = 1;
    }
    
    my_trades.prototype.load = function(){
        var trades = this.trades;
        
        var html = '<div name="interface-'+ this.id +'" class="interface" style="width:550px;">';
            html += '<div class="title">Active Trade Offers</b></div>';
            html += '<div style="margin:10px;">';
            html += '<table cellpadding="6">';
            html += '<tr style="color:white;"><th>Sender</th><th>Receiver</th><th>Origin</th><th>Destination</th></tr>';
            
            if(trades.length > 0){
                for(var i = 0; i < trades.length; i++){
                    var trade = trades[i];

                    html += '<tr><td>'+ trade.sender_username +'</td><td>'+ trade.receiver_username +'</td><td>'+ trade.sender_city +'</td><td>'+ trade.receiver_city +'</td><td><button name="viewtrade-'+ trade.id +'">VIEW OFFER</button></td></tr>';
                }
            }else{
                html += '<tr><td colspan="4">You do not currently have any active trades.</td></tr>';
            }
            
            
            html += '</table>';
            html += '<div style="margin-right:6px;"><button name="ok">Ok</button></div>';
            html += '</div></div>';
            
            
        $('body').append(html);
        
        //load event handlers
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]', function(){
            this.Core.InterfaceManager.unloadInterface(this.id);
        }.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]', this.back.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]', this.showTab.bind(this));
        $(document).on('click', 'div[name="interface-'+ this.id +'"] button[name|="viewtrade"]', this.showTrade.bind(this));
    }
    
    my_trades.prototype.showTrade = function(e){
        //get the trade ID that user wants to view
        var tradeID = $(e.target).attr('name').split('-')[1];
        
        //close this interface
        this.Core.InterfaceManager.unloadInterface(this.id);
        
        //get data
        var existing_trade = this.getTradeDataByID(tradeID);
        
        this.Core.InterfaceManager.loadInterface('trade', false, existing_trade);
    }
    
    my_trades.prototype.getTradeDataByID = function(id){
        var tid = parseInt(id);
        
        for(var i = 0; i < this.trades.length; i++){
            if(this.trades[i].id === tid){
                return this.trades[i];
            }
        }
    }
    
    my_trades.prototype.back = function(e){
        //get button destination
        var destination = $(e.target).attr('name').split('-')[1];
        
        this.showTab(null, destination);
    }
    
    my_trades.prototype.showTab = function(e, name){
        var tab = (name) ? name : $(e.target).attr('name').split('-')[1];
        
        $('div[name="interface-'+ this.id +'"] div[name|="content"]').hide();
        $('div[name="interface-'+ this.id +'"] div[name="content-'+ tab +'"]').show();
        
        //recenter interface
        this.Core.InterfaceManager.centerInterface(this.id);
    }
    
    my_trades.prototype.unload = function(){
        //load event handler
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name="ok"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="back"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] div[name|="tab"]');
        $(document).off('click', 'div[name="interface-'+ this.id +'"] button[name|="viewtrade"]');
        $('div[name="interface-'+ this.id +'"]').remove();
    }
    
    Client.interfaces['my_trades'] = my_trades;
})();