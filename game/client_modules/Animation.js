/*
 *  CLIENT
 */

(function(){
    function Animation(img, x, y, frameWidth, frameHeight, frameCount){
        this.img = img;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.offsetX = 0;
        this.speed = 10;
        this.tick = 0;
    }
    
    Animation.prototype.draw = function(ctx){
        ctx.drawImage(this.img, this.offsetX, 0, this.frameWidth, this.frameHeight, this.x, this.y, this.frameWidth, this.frameHeight);
    }
    
    Animation.prototype.update = function(){
        if(this.tick >= this.speed){
            this.tick = 0;
            
            if((this.frame+1) > this.frameCount){
                this.frame = 0;
            }else{
                this.frame++;
            }
            
            this.offsetX = (this.frame * this.frameWidth);
        }
        
        this.tick++;
    }
    
    Animation.prototype.setSpeed = function(speed){
        this.speed = speed;
    }
    
    Animation.prototype.setPos = function(x, y){
        this.x = x;
        this.y = y;
    }
    
    Client.Animation = Animation;
})();