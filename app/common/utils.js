
let platform = null;

try{
    if(window == null){
        platform = "desktop"
    }else{
        if(window.__proto__.constructor.name == "Window"){
            platform = "web";
        }else{
            platform = "app"
        }
    }
}catch(err){
    platform = "desktop"
}

export function current_platform(){
    return platform;
}

current_platform();
