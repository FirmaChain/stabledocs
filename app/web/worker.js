import fs from "./filesystem"
import critical from "./critical_section"

let default_master_json = {
    queue:[]
}

class BackgroundWorker{
    constructor(){
        this.worker = {}
        this.master_json_file = "worker-master.json"
        this.section = new critical();
    }

    uuid(){
        let d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        })
    }

    addWorker(type, func){
        this.worker[type] = func;
        return this
    }

    start(){
        setTimeout(this.onUpdate, 50)
    }

    async add(type, json){
        await this.section.lock()

        let master = ( await fs.read(this.master_json_file) ) || default_master_json
        let id = this.uuid()
        master.queue.push(id)

        await fs.write(`work_${id}`,{
            type:type,
            json:json
        })

        await fs.write(this.master_json_file, master)
        this.section.unlock()
    }

    onUpdate = async()=>{
        await this.section.lock()
        let master = await fs.read(this.master_json_file)
        if(master.queue.length > 0){
            let id = master.queue[0]
            if(id){
                let item = await fs.read(`work_${id}`)
                if(await this.worker[item.type](item.json)){
                }

                master.queue.shift()
                await fs.write(this.master_json_file, master)
            }
        }

        this.section.unlock()
        setTimeout(this.onUpdate, 10);
    }
}

export default new BackgroundWorker