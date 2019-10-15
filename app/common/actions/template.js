import {
    api_add_template,
    api_update_template,
    api_remove_template,
    api_get_template,
    api_list_template,
    api_folder_list_template,
    api_add_folder_template,
    api_remove_folder_template,
    api_change_folder_template,
} from "../../../gen_api"

import {
    aes_decrypt,
    aes_encrypt,
    generate_random,
    getMasterSeed,
    SeedToMasterKeyPublic,
} from "../../common/crypto_test"

import { sha256 } from 'js-sha256'

export const LIST_TEMPLATE = "LIST_TEMPLATE"
export const ADD_TEMPLATE = "ADD_TEMPLATE"
export const GET_TEMPLATE = "GET_TEMPLATE"
export const UPDATE_TEMPLATE = "UPDATE_TEMPLATE"
export const REMOVE_TEMPLATE = "REMOVE_TEMPLATE"

export const FOLDER_LIST_TEMPLATE = "FOLDER_LIST_TEMPLATE"
export const ADD_FOLDER_TEMPLATE = "ADD_FOLDER_TEMPLATE"


export function list_template(folder_id = "all", page = 0, corp_key = null){
    return async function(dispatch){
        let resp = await api_list_template(folder_id, page)

        dispatch({
            type:LIST_TEMPLATE,
            payload:resp.payload
        })
        return resp.payload
    }
}

export function folder_list_template() {
    return async function(dispatch) {
        let resp = await api_folder_list_template()
        dispatch({
            type:FOLDER_LIST_TEMPLATE,
            payload:resp.payload
        })
        return resp.payload
    }
}

export function add_folder_template(folder_name) {
    return async function() {
        let resp = await api_add_folder_template(folder_name)
        return resp.payload
    }
}

export function remove_folder_template(folder_ids) {
    return async function() {
        let resp = await api_remove_folder_template(JSON.stringify(folder_ids))
        return resp.payload
    }
}

export function change_folder_template(folder_id, folder_name) {
    return async function() {
        let resp = await api_change_folder_template(folder_id, folder_name)
        return resp.payload
    }
}

export function add_template(subject, folder_id, html, corp_key = null){
    return async function(){
        /*let entropy = localStorage.getItem("entropy");
        imgs = imgs.map(e=>aes_encrypt(e,entropy))*/

        let encrypted_html;
        if(!corp_key) {
            let masterKeyPublic = SeedToMasterKeyPublic(getMasterSeed())
            encrypted_html = aes_encrypt(html, masterKeyPublic)
        } else {
            encrypted_html = aes_encrypt(html, Buffer.from(corp_key, 'hex'))
        }

        let resp = await api_add_template(subject, folder_id, encrypted_html)
        return resp.payload
    }
}

export function get_template(template_id, corp_key = null){
    return async function(){
        // let entropy = localStorage.getItem("entropy");

        let resp = await api_get_template(template_id)

        if(!corp_key) {
            let masterKeyPublic = SeedToMasterKeyPublic(getMasterSeed())
            resp.payload.html = aes_decrypt(Buffer.from(resp.payload.html, 'hex'), masterKeyPublic)
        } else {
            resp.payload.html = aes_decrypt(Buffer.from(resp.payload.html, 'hex'), Buffer.from(corp_key, 'hex'))
        }

        /*if(resp.payload.html){
            try{
               resp.payload.html = JSON.parse(aes_decrypt(resp.payload.html,entropy))
            }catch(err){
            }
        }

        resp.payload.html = resp.payload.html || []*/

        return resp.payload
    }
}

export function update_template(template_id, folder_id, subject, html, corp_key = null){
    return async function(){
        /*let entropy = localStorage.getItem("entropy");
        html = aes_encrypt(JSON.stringify(html),entropy)*/

        let encrypted_html;
        if(!corp_key) {
            let masterKeyPublic = SeedToMasterKeyPublic(getMasterSeed())
            encrypted_html = aes_encrypt(html, masterKeyPublic)
        } else {
            encrypted_html = aes_encrypt(html, Buffer.from(corp_key, 'hex'))
        }

        let resp = await api_update_template(template_id, folder_id, subject, encrypted_html)

        return resp.payload
    }
}

export function remove_template(template_ids){
    return async function(dispatch){
        let resp = await api_remove_template(JSON.stringify(template_ids))

        return resp.payload
    }
}
