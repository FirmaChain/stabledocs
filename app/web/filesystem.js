window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

class FileSystem {
    constructor(){
    }

    init(size = 1024*1024*1024){
        return new Promise((resolve, reject)=>{
            window.webkitStorageInfo.requestQuota(window.PERSISTENT, size, (grantedBytes)=>{
                window.requestFileSystem(window.PERSISTENT, size, (fs)=>{
                    this.fs = fs;
                    resolve()
                }, (err)=>{
                    reject("open failed : "+err)
                });
            }, (e)=>{
                reject("request failed")
            });
        })
    }

    _read(type, path){
        return new Promise((resolve, reject)=>{
            this.fs.root.getFile(path, {create: true}, (fileEntry)=>{
                fileEntry.file((file)=>{
                    let reader = new FileReader();

                    reader.onloadend = (e)=>{
                        resolve(reader.result)
                    };

                    reader[type](file);
                }, ()=>{
                    reject(err)
                });
            }, (err)=>{
                reject(err)
            });
        })
    }

    _write(type, path, data){
        return new Promise((resolve, reject)=>{
            this.fs.root.getFile(path, {create: true}, (fileEntry)=>{
                fileEntry.createWriter((fileWriter)=> {
                    fileWriter.truncate(0);

                    fileEntry.createWriter((fileWriter)=> {
                        fileWriter.onwriteend = (e)=>{
                            resolve();
                        };
    
                        fileWriter.onerror = (e)=>{
                            console.log('Write failed: ' + e.toString());
                        };
    
                        let blob = new Blob(data, {type: type});
                        fileWriter.write(blob);
                        fileWriter.write
                    })
                })
            }, (err)=>{
                reject(err)
            });
        })
    }

    async readAsText(path){
        return await this._read("readAsText", path)
    }

    async readAsBinary(path){
        return await this._read("readAsBinaryString", path)
    }

    async readAsArrayBuffer(path){
        return await this._read("readAsArrayBuffer", path)
    }

    async readAsJson(path){
        let data = await this._read("readAsText", path)
        try{
            return JSON.parse(data)
        }catch(err){
            return data;
        }
    }

    async read(path){
        return await this.readAsJson(path)
    }

    async writeAsText(path, data){
        return await this._write('text/plain', path, [data])
    }

    async writeAsJson(path, data){
        return await this._write('text/plain', path, [JSON.stringify(data)])
    }

    async writeAsBinary(path, data){
        return await this._write('application/octet-stream', path, [data])
        
    }

    async write(path, data){
        return await this.writeAsJson(path, data)
    }
}


export default new FileSystem;