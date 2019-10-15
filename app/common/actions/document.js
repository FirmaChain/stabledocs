import Web3 from "../Web3"
import Store from "../Store"
import {
    request,
    decrypt_with_pin,
} from "../global"

export const RELOAD_DOCUMENTS = "RELOAD_DOCUMENTS"
export const NEW_RECV_DOCUMENT = "NEW_RECV_DOCUMENT"
export const RELOAD_IMPORTABLE_DOCUMENTS = "RELOAD_IMPORTABLE_DOCUMENTS"

async function LoadDocument(docId){
    let docPath = fs.DocumentDirectoryPath
    let info_file = `${docPath}/${docId}_info`
    let doc_file = `${docPath}/${docId}_file`
    
    let get_signature = (name,c)=>async function(){
        return c.signature || (c.signature = await window.readFile(`${docPath}/${docId}_${name}_sign`,"utf8"))
    }
    try{
        let text = await window.readFile(info_file,"utf8")
        let data = JSON.parse(text)
        data.get_content = async()=> data.cache_content || (data.cache_content = await window.readFile(doc_file,"utf8"))
        data.author.get_signature = get_signature("author", data.author)
        for(let c of data.counterparties){
            c.get_signature = get_signature(`counterparty_${c.ether}`, c)
        }
        return data
    }catch(err){
        // console.log(err)
    }
    return null
}

async function SaveDocument(data){
    data = {...data}

    let docId = data.id;
    let docPath = fs.DocumentDirectoryPath
    let info_file = `${docPath}/${docId}_info`
    let doc_file = `${docPath}/${docId}_file`

    if(data.file_content){
        window.writeFile(doc_file, data.file_content, "utf8")
        data.file_size = data.file_content.length
        delete data["file_content"];
    }
    delete data["get_content"];

    async function SaveSign(name,c){ 
        if(c.signature){
            window.writeFile(`${docPath}/${docId}_${name}_sign`, c.signature, "utf8")
            c.signed = true
            delete c["signature"];
        }
        delete c["get_signature"];
    }

    SaveSign("author",data.author)
    for(let c of data.counterparties){
        SaveSign(`counterparty_${c.ether}`, c)
    }

    await window.writeFile(info_file, JSON.stringify(data), 'utf8')
}

async function _ReadAllDocument(){
    let ret = {
        recv : [],
        req : []
    }
    try{
        let user = Store().getState().user
        let accounts = Web3.allAccounts()
        
        let docIds = await window.Storage.getItem("docIds", [])
        for(let id of docIds){
            let doc = await LoadDocument(id)
            if(doc.author.email != user.email || accounts.find((r)=>doc.author.ether != r.address)){
                ret.recv.push(doc)
            }else{
                ret.req.push(doc)
            }
        }
    }catch(err){
        console.log("Read All Doc Error", err)
    }
    return ret
}

async function _AddDocument(data){
    let docIds = await window.Storage.getItem("docIds", [])
    await window.Storage.setItem("docIds", [data.id , ...docIds])
    await SaveDocument(data);
    return data.id
}

export function NewDocument(data){
	return async function (dispatch){

        let docId = await _AddDocument(data)

        dispatch({
            type: RELOAD_DOCUMENTS,
            payload: await _ReadAllDocument()
        })
    }
}

export function ReloadDocuments(){
	return async function (dispatch){        
        dispatch({
            type: RELOAD_DOCUMENTS, 
            payload: await _ReadAllDocument()
        })
	}
}

export function DocumentUpdateSignature(documentId, sign){
    return async function(dispatch){
        let doc = await LoadDocument(documentId)

        // 카운터 파티의 signature가 없는지 체크 한 뒤 없는 애들은 ipfs에서 데이터를 다운받아 로컬에 저장해둔다.
        for(let o of doc.counterparties){
            if(!o.signed && sign[o.ether] != "0x0" && sign[o.ether] != undefined){
                let data = await window.ipfs_download(sign[o.ether])
                try{
                    let e = JSON.parse(data)
                    if(e.Code == 0){
                        console.log("err ipfs download : ", sign[o.ether], e)
                    }
                }catch(err){
                    o.signature = decrypt_with_pin(data, doc.pin)
                }
            }
        }

        await SaveDocument(doc)
        dispatch({
            type: RELOAD_DOCUMENTS,
            payload: await _ReadAllDocument(),
        })
    }
}

export function RecvDocument(doc){
    return async function (dispatch){
        let old = await LoadDocument(doc.id)
        if( old ){
        }else{
            await _AddDocument(doc)
        }

        dispatch({
            type: RELOAD_DOCUMENTS,
            payload: await _ReadAllDocument(),
        })
    }
}

export function FetchImportableDocuments(docIds){
    return async function(dispatch){
        let accounts = Web3.allAccounts()
        let resp = await request(`/documents?address=${accounts[0].address}`);
        
        dispatch({
            type: RELOAD_IMPORTABLE_DOCUMENTS,
            payload: resp.list,
        })
    }
}