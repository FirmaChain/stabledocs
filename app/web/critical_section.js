export default class {
    constructor(){
        this.isLock = false
    }

    lock(){
        return new Promise(async (r)=>{
            while(1){
                if(this.isLock == false){
                    this.isLock = true;
                    return r()
                }

                await new Promise(r=>setTimeout(r,1))
            }
        })
    }

    unlock(){
        this.isLock = false;
    }
}