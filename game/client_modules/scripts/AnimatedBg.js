/*
 *  CLIENT
 */

(function(){
    function AnimatedBg(Core){
        this.Core = Core;
        
        this.bgImg = Core.Resources.images['gm_tiles_render'][1];
        this.bgImg_width = this.bgImg.width;
        this.bgImg_height = this.bgImg.height;
        
        //start camera pos in center of background
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraStep = 1;
        
        this.maxX = 1786;
        this.minX = 1700;
        this.maxY = 600;
        this.minY = 450;
        
        this.directions = ['left','forward','right','backward','upright','downleft','upleft','downright']; //0,1,2,3,...
        this.currentDir = 0;
        this.dirLimit = 150; //how often dir will change
        this.tick = 0;
    }
    
    AnimatedBg.prototype.draw = function(ctx, canvas){
        this.updateCamera();
        
        ctx.drawImage(this.bgImg, this.cameraX, this.cameraY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.Core.Resources.images['bg_transparent_black_pixel'][1], 0,0, canvas.width, canvas.height);
        
        this.tick++;
    }
    
    AnimatedBg.prototype.updateCamera = function(){
        var self = this;
        var getNewDir = false;
        
        var x = this.cameraX;
        var y = this.cameraY;
        
        var newX, newY;
        
        switch(this.currentDir){
            case 0: //LEFT
                newX = x - self.cameraStep;
                newY = y;
                break;
            case 1: //FORWARD
                newX = x;
                newY = y - self.cameraStep;
                break;
            case 2: //RIGHT
                newX = x + self.cameraStep;
                newY = y;
                break;
            case 3: //BACKWARD
                newX = x;
                newY = y + self.cameraStep;
                break;
            case 4: //UPRIGHT
                newX = x + self.cameraStep;
                newY = y - self.cameraStep;
                break;
            case 5: //DOWNLEFT
                newX = x - self.cameraStep;
                newY = y + self.cameraStep;
                break;
            case 6: //UPLEFT
                newX = x - self.cameraStep;
                newY = y - self.cameraStep;
                break;
            case 7: //DOWNRIGHT
                newX = x + self.cameraStep;
                newY = y + self.cameraStep;
                break;
        }
        
        //boundaries for x
        if(newX > this.maxX){
            newX = this.maxX;
            getNewDir = true;
        }else if(newX < this.minX){
            newX = this.minX;
            getNewDir = true;
        }
        
        //boundaries for y
        if(newY > this.maxY){
            newY = this.maxY;
            getNewDir = true;
        }else if(newY < this.minY){
            newY = this.minY;
            getNewDir = true;
        }
        
        /*if(this.tick > this.dirLimit){
            this.tick = 0;
            getNewDir = true;
        }*/
        
        this.cameraX = newX;
        this.cameraY = newY;
        
        //we've hit the edge. get new dir!
        if(getNewDir){
            this.currentDir = this.getRandDir();
        }
    }
    
    AnimatedBg.prototype.reset = function(){
        this.cameraX = this.bgImg_width/2;
        this.cameraY = this.bgImg_height/2;
    }
    
    AnimatedBg.prototype.getRandDir = function(){
        var newDir;
        
        do {
            newDir = fn_rand(0,this.directions.length-1);
        } while (newDir === this.currentDir);
        
        return newDir;
    }
    
    Client.scripts.push(['AnimatedBg', AnimatedBg]);
})();