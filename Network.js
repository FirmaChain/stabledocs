import config from "./config"
let HOST = window.HOST = config.HOST

export async function get(path,param={},headers={}){
    param = Object.keys(param).map(i=>`${encodeURIComponent(i)}=${encodeURIComponent(param[i])}`)
    try{
        let resp = await fetch(`${HOST}${path}${param.length > 0 ? `?${param.join("&")}` : ''}`,{
            method:"GET",
            headers:{
                'Access-Control-Allow-Origin':'*',
                ...headers
            }
        })
        let blob = await resp.text()

        try{
            return JSON.parse(blob)
        }catch(err){
            return blob
        }
    }catch(err){
        console.log(err)
        return null
    }
}

export async function post(path,param={},headers={}){
    try{
        let isFormdata = param instanceof FormData
        let resp = await fetch(`${HOST}${path}`,{
            method:"POST",
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
                'Accept': 'application/json',
                // 'Content-Type': isFormdata ? 'multipart/form-data; boundary=----WebKitFormBoundaryyEmKNDsBKjB7QEqu' : 'application/json',
                ...headers
            },
            body:param ? ( isFormdata ? param : JSON.stringify(param)) : null
        })

        let blob = await resp.text()

        try{
            return JSON.parse(blob)
        }catch(err){
        }

        return blob
    }catch(err){
        console.log(err)
        return null
    }
}
