import React from "react"
import ReactDOM from "react-dom"
import ReactDOMServer from 'react-dom/server';
import translate from "../../common/translate"
import {
    api_new_contract,
    api_get_contracts,
    api_update_epin_account,
    api_update_epin_group,
    api_get_contract,
    api_add_counterparties,
    api_update_contract_model,
    api_update_contract_user_info,
    api_update_contract_sign,
    api_update_contract_sign_info,
    api_move_contract_can_edit_account_id,
    api_get_chats,
    api_folder_list_contract,
    api_add_folder_contract,
    api_remove_folder_contract,
    api_change_folder_contract,
    api_add_folder_in_contract,
    api_get_lock_count,
    api_send_chat,
    api_get_contract_logs,
    api_modify_contract_user_info,
    api_remove_counterparty,
    api_get_contract_public_link,
    api_update_contract_sign_public,
    api_get_chats_public,
    api_update_contract_model_public,
    api_move_contract_can_edit_account_id_public,
    api_add_contract_user,
    api_remove_contract_self,
} from "../../../gen_api"

import {
    getUserEntropy,
    makeAuth,
    makeSignData,
    getContractKey,
    sealContractAuxKey,
    unsealContractAuxKey,
    unsealContractAuxKeyGroup,
    get256bitDerivedPublicKey,
    encryptPIN,
    decryptPIN,
    decrypt_user_info,
    aes_decrypt,
    aes_encrypt,
    aes_decrypt_async,
    aes_encrypt_async,
    generate_random,
    generateRandomKey,
    makeMnemonic,
    showMnemonic,
    SeedToEthKey,
} from "../../common/crypto_test"

import { sha256 } from 'js-sha256'
import Web3 from "../Web3"
/*
export const LOAD_FODLERS = "LOAD_FODLERS"
export const LOAD_CONTRACT_LIST = "LOAD_CONTRACT_LIST"*/

export const GET_CONTRACTS = "GET_CONTRACTS";
export const FOLDER_LIST_CONTRACT = "FOLDER_LIST_CONTRACT";
const DUMMY_CORP_ID = 0;

export function select_subject(infos, groups, account_id, corp_id, is_pin_used = false) {
    groups = groups ? groups : []
    let my_infos = infos.filter(e=>{
        if(is_pin_used && e.is_pin_null == 1)
            return false
        return (e.corp_id == DUMMY_CORP_ID && e.entity_id == account_id) || e.corp_id == corp_id || (corp_id == -1 && e.entity_id == account_id)
    });

    let group_ids = groups.map(e=>e.group_id)
    let my_info = my_infos.find(e=>e.corp_id == DUMMY_CORP_ID) || my_infos.find(e=>group_ids.indexOf(e.entity_id) != -1) || my_infos.find(e=>e.corp_id == -1 && e.entity_id == account_id) 
    my_info = my_info ? my_info : null;
    return {
        my_info,
        isAccount: my_info && my_info.corp_id == DUMMY_CORP_ID,
    };
}

export function genPIN(digit=6) {
    let text = "";
    let possible = "0123456789";
  
    for (let i = 0; i < digit; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

export function getGroupKey(user_info, group_id) {
    if (user_info.account_type == 1) {
        return get256bitDerivedPublicKey(Buffer.from(user_info.corp_master_key, 'hex'), "m/0'/"+group_id+"'").toString('hex');
    } else {
        return user_info.group_keys[group_id];
    }
}

export function new_contract(subject, creator_email, message, counterparties, set_pin, necessary_info, can_edit_account_id, payer_account_id, is_pin_used = false, model = null) {
    return async function(dispatch){
        let pin = set_pin ? set_pin : "000000";
        if(!set_pin)
            is_pin_used = false
        let shared_key = generate_random(31);
        let the_key = getContractKey(pin, shared_key);

        let no_sign_user_index = -1;
        let counterparties_mapped = counterparties.map(e=>{
            let temp_corp_id = e.user_type == 2 ? e.corp_id : DUMMY_CORP_ID
            if(e.user_type == -1)
                temp_corp_id = -1;

            let temp_entity_id = e.user_type == 2 ? e.group_id : e.account_id
            if(e.user_type == -1) {
                temp_entity_id = no_sign_user_index;
                no_sign_user_index--;
            }

            let mapped_data = {
                user_type: e.user_type,
                entity_id: temp_entity_id,
                corp_id: temp_corp_id,
                role: e.role,
                user_info: aes_encrypt(JSON.stringify(e), the_key),
            };
            if(!!e.email) mapped_data.email = e.email;

            if(e.user_type != -1)
                mapped_data.eckai = sealContractAuxKey(e.public_key, shared_key);
            else {
                mapped_data.encrypted_key = aes_encrypt(Buffer.from(the_key, 'hex').toString('hex'), Buffer.from(e.contract_open_key))
                mapped_data.cell_phone_number = e.cell_phone_number;
                mapped_data.contract_open_key = e.contract_open_key;
                mapped_data.username = e.username;
            }

            return mapped_data
        });

        let encrypted_model = null
        if(!!model) {
            encrypted_model = aes_encrypt(model, the_key)
        }

        let encrypted_message = null
        if(!!message) {
            encrypted_message = aes_encrypt(message, the_key)
        }

        let resp = await api_new_contract(subject, creator_email, JSON.stringify(counterparties_mapped), JSON.stringify(necessary_info), can_edit_account_id, payer_account_id, is_pin_used, encrypted_model, encrypted_message, message);
        /*if(resp.code == 1) {
            sessionStorage.setItem(`contract:${resp.payload.contract_id}`, encryptPIN(pin));
        }*/
        return resp;
    }
}

export function get_contracts(type, status, page, display_count = 10, sub_status = -1, group_id = -1, user_info, groups = [], search_text = "") {
    return async function(dispatch) {
        let resp = await api_get_contracts(type, status, page, display_count, sub_status, group_id, search_text)
        if(resp.code == 1) {
            let corp_id = user_info.corp_id || -1
            for(let v of resp.payload.list) {
                let infos = []
                v.entities_id.split(",").map( (entity_id, k) => {
                    let duplicate = infos.find(e=>e.entity_id == entity_id && e.corp_id == v.corps_id.split(",")[k]);
                    if(!duplicate) {
                        infos.push({
                            entity_id:Number(entity_id),
                            corp_id:Number(v.corps_id.split(",")[k]),
                            epin:Buffer.from(v.epins.split(window.SEPERATOR)[k], "hex"),
                            eckai:Buffer.from(v.eckais.split(window.SEPERATOR)[k], "hex"),
                            is_pin_null:Number(v.is_pin_nulls.split(",")[k])
                        })
                    }
                })


                let subject = select_subject(infos, groups, user_info.account_id, corp_id, v.is_pin_used);
                if (!subject.my_info) continue;


                let shared_key;
                let pin = "000000";
                if(subject.isAccount) {
                    let entropy = localStorage.getItem("entropy");
                    if (!entropy) return null;
                    if (v.is_pin_used && v.is_pin_null == 0) {
                        pin = decryptPIN(Buffer.from(subject.my_info.epin, 'hex').toString('hex'));
                    }
                    shared_key = unsealContractAuxKey(entropy, Buffer.from(subject.my_info.eckai, 'hex').toString('hex'));
                } else {
                    let group_key = getGroupKey(user_info, subject.my_info.entity_id);
                    if (v.is_pin_used && v.is_pin_null == 0) {
                        pin = decryptPIN(Buffer.from(subject.my_info.epin, 'hex').toString('hex'), Buffer.from(group_key, 'hex'));
                    }
                    shared_key = unsealContractAuxKeyGroup(group_key, Buffer.from(subject.my_info.eckai, 'hex').toString('hex'));
                }
                let the_key = getContractKey(pin, shared_key);

                v.user_infos = v.user_infos.split(window.SEPERATOR).map( e => {
                    let result;
                    try{
                        result = JSON.parse(aes_decrypt(e/*Buffer.from(e, 'hex').toString('hex')*/, the_key))
                    } catch(err) {
                        result = {
                            err:"not decrypt",
                            data:e
                        }
                    }
                    return result
                })
                v.the_key = the_key
            }
            dispatch({
                type:GET_CONTRACTS,
                payload:resp.payload
            })
        }
        return resp
    }
}

export function get_contract(contract_id, user_info, groups = []) {
    return async function(dispatch) {
        let resp = await api_get_contract(contract_id)
        if(resp.code == 1) {
            let corp_id = user_info.corp_id || -1;
            let subject = select_subject(resp.payload.infos, groups, user_info.account_id, corp_id, resp.payload.contract.is_pin_used);
            if (!subject.my_info) return null;

            let shared_key, the_key;
            let pin = "000000";

            if(subject.isAccount) {
                let entropy = localStorage.getItem("entropy");
                if (!entropy) return null;
                if (resp.payload.contract.is_pin_used && subject.my_info.is_pin_null == 0) {
                    pin = decryptPIN(Buffer.from(subject.my_info.epin, 'hex').toString('hex'));
                }
                shared_key = unsealContractAuxKey(entropy, Buffer.from(subject.my_info.eckai, 'hex').toString('hex'));
            } else {
                let group_key = getGroupKey(user_info, subject.my_info.entity_id);
                if (resp.payload.contract.is_pin_used && subject.my_info.is_pin_null == 0) {
                    pin = decryptPIN(Buffer.from(subject.my_info.epin, 'hex').toString('hex'), Buffer.from(group_key, 'hex'));
                }
                shared_key = unsealContractAuxKeyGroup(group_key, Buffer.from(subject.my_info.eckai, 'hex').toString('hex'));
            }
            the_key = getContractKey(pin, shared_key);

            try {
                JSON.parse(aes_decrypt(Buffer.from(resp.payload.infos[0].user_info, 'hex').toString('hex'), the_key))
            } catch( err ) {
                console.log(err)
                return false
            }
                
            resp.payload.infos = resp.payload.infos.map( (e) => {
                let user_info = JSON.parse(aes_decrypt(Buffer.from(e.user_info, 'hex').toString('hex'), the_key))
                return {
                    ...e,
                    user_info,
                    sign_info : e.sign_info ? JSON.parse(aes_decrypt(Buffer.from(e.sign_info, 'hex').toString('hex'), the_key)) : e.sign_info,
                    signature : e.signature ? aes_decrypt(Buffer.from(e.signature, 'hex').toString('hex'), the_key) : e.signature,
                }
            })
            resp.payload.contract.html = resp.payload.contract.html ? aes_decrypt(Buffer.from(resp.payload.contract.html, 'hex').toString('hex'), the_key) : resp.payload.contract.html
            resp.payload.contract.message = resp.payload.contract.message ? aes_decrypt(Buffer.from(resp.payload.contract.message, 'hex').toString('hex'), the_key) : resp.payload.contract.message
            resp.payload.contract.necessary_info = JSON.parse(resp.payload.contract.necessary_info)
            resp.payload.contract.the_key = the_key
            resp.payload.contract.pin = pin
        }
        return resp
    }
}

export function is_correct_pin(contract, pin_to_be_verified, infos, user_info, groups = []) {
    return async function() {
        let corp_id = user_info.corp_id || -1;
        let subject = select_subject(infos, groups, user_info.account_id, corp_id);
        if (!subject.my_info) return null;

        let shared_key;
        let pin = "000000";
        if(subject.isAccount) {
            let entropy = localStorage.getItem("entropy");
            if (!entropy) return null;
            if (contract.is_pin_used) {
                pin = pin_to_be_verified
            }
            shared_key = unsealContractAuxKey(entropy, Buffer.from(subject.my_info.eckai, 'hex').toString('hex'));
        } else {
            let group_key = getGroupKey(user_info, subject.my_info.entity_id);
            if (contract.is_pin_used) {
                pin = pin_to_be_verified
            }
            shared_key = unsealContractAuxKeyGroup(group_key, Buffer.from(subject.my_info.eckai, 'hex').toString('hex'));
        }
        let the_key = getContractKey(pin, shared_key);
        let _ = [...contract.user_infos]

        if( typeof(contract.user_infos) != "object" ) {
            _ = contract.user_infos.split(window.SEPERATOR).map(e=>{ return {data:e} })
        }

        try {
            JSON.parse(aes_decrypt(_[0].data, the_key))
            return true
        } catch(err) {
            return false
        }
    }
}

export function add_counterparties(contract_id, counterparties, groups, user_info, infos, is_pin_used, real_pin = "000000") {
    return async function() {
        let corp_id = user_info.corp_id || CONST.DUMMY_CORP_ID;
        let subject = select_subject(infos, groups, user_info.account_id, corp_id);
        if (!subject.my_info) return null;

        let shared_key;
        let pin = real_pin;
        if(subject.isAccount) {
            let entropy = localStorage.getItem("entropy");
            if (!entropy) return null;
            if (is_pin_used && pin == "000000") {
                pin = decryptPIN(Buffer.from(subject.my_info.epin, 'hex').toString('hex'));
            }
            shared_key = unsealContractAuxKey(entropy, Buffer.from(subject.my_info.eckai, 'hex').toString('hex'));
        } else {
            if (is_pin_used && pin == "000000") {
                let group_key = getGroupKey(user_info, subject.entity_id);
                pin = decryptPIN(Buffer.from(subject.my_info.epin, 'hex').toString('hex'), Buffer.from(group_key, 'hex'));
            }
            shared_key = unsealContractAuxKeyGroup(getGroupKey(user_info, subject.my_info.entity_id), Buffer.from(subject.my_info.eckai, 'hex').toString('hex'));
        }
        let the_key = getContractKey(pin, shared_key);

        let no_sign_user_index = 1;
        let counterparties_mapped = counterparties.map(e=>{
            let temp_corp_id = e.user_type == 2 ? e.corp_id : DUMMY_CORP_ID;
            if(e.user_type == -1)
                temp_corp_id = -1;

            let temp_entity_id = e.user_type == 2 ? e.group_id : e.account_id;
            if(e.user_type == -1) {
                temp_entity_id = no_sign_user_index;
                no_sign_user_index++;
            }

            let mapped_data = {
                user_type: e.user_type,
                entity_id: temp_entity_id,
                corp_id: temp_corp_id,
                role: e.role,
                user_info: aes_encrypt(JSON.stringify(e), the_key),
            };

            if(!!e.email) mapped_data.email = e.email;

            if(e.user_type != -1)
                mapped_data.eckai = sealContractAuxKey(e.public_key, shared_key);
            else {
                mapped_data.encrypted_key = aes_encrypt(Buffer.from(the_key, 'hex').toString('hex'), Buffer.from(e.contract_open_key))
                mapped_data.cell_phone_number = e.cell_phone_number;
                mapped_data.contract_open_key = e.contract_open_key;
                mapped_data.username = e.username;
            }


            return mapped_data;
        });
        let res = await api_add_counterparties( contract_id, JSON.stringify(counterparties_mapped) )
        return res
    }
}

export function remove_contract_self(contract_id) {
    return async function() {
        return (await api_remove_contract_self(contract_id));
    }
}

export function add_contract_user(contract_id, counterparty, groups, user_info, infos, is_pin_used, real_pin = "000000") {
    return async function() {
        let corp_id = user_info.corp_id || CONST.DUMMY_CORP_ID;
        let subject = select_subject(infos, groups, user_info.account_id, corp_id);
        if (!subject.my_info) return null;

        let shared_key;
        let pin = real_pin;
        if(subject.isAccount) {
            let entropy = localStorage.getItem("entropy");
            if (!entropy) return null;
            if (is_pin_used && pin == "000000") {
                pin = decryptPIN(Buffer.from(subject.my_info.epin, 'hex').toString('hex'));
            }
            shared_key = unsealContractAuxKey(entropy, Buffer.from(subject.my_info.eckai, 'hex').toString('hex'));
        } else {
            console.log("privilege 2 not add user");
            return;
        }
        let the_key = getContractKey(pin, shared_key);

        let no_sign_user_index = 1;

        let temp_corp_id = counterparty.user_type == 2 ? counterparty.corp_id : DUMMY_CORP_ID;
        if(counterparty.user_type == -1)
            temp_corp_id = -1;

        let temp_entity_id = counterparty.user_type == 2 ? counterparty.group_id : counterparty.account_id;
        if(counterparty.user_type == -1) {
            temp_entity_id = no_sign_user_index;
            no_sign_user_index++;
        }

        let mapped_data = {
            user_type: counterparty.user_type,
            entity_id: temp_entity_id,
            corp_id: temp_corp_id,
            role: counterparty.role,
            user_info: aes_encrypt(JSON.stringify(counterparty), the_key),
        };

        if(!!counterparty.email) mapped_data.email = counterparty.email;

        if(counterparty.user_type != -1)
            mapped_data.eckai = sealContractAuxKey(counterparty.public_key, shared_key);
        else {
            mapped_data.encrypted_key = aes_encrypt(Buffer.from(the_key, 'hex').toString('hex'), Buffer.from(counterparty.contract_open_key))
            mapped_data.cell_phone_number = counterparty.cell_phone_number;
            mapped_data.contract_open_key = counterparty.contract_open_key;
            mapped_data.username = counterparty.username;
        }
        let res = await api_add_contract_user( contract_id, JSON.stringify(mapped_data) )
        return res;
    }
}

export function get_contract_public_link(link) {
    return async function() {
        return await api_get_contract_public_link(link);
    }
}

export function remove_counterparty(contract_id, corp_id, entity_id) {
    return async function() {
        return await api_remove_counterparty(contract_id, corp_id, entity_id);
    }
}

export function update_epin_account(contract_id, pin){
    return async function(){
        let epin = encryptPIN(pin);
        return (await api_update_epin_account(contract_id, epin)).payload;
    };
}

export function update_epin_group(corp_id, group_id, contract_id, user_info, pin){
    return async function(){
        let group_key = getGroupKey(user_info, group_id);
        let epin = encryptPIN(pin, Buffer.from(group_key, 'hex'));
        return (await api_update_epin_group(corp_id, group_id, contract_id, epin)).payload;
    };
}


export function update_contract_model(contract_id, model, the_key){
    return async function(){
        let encrypted_model = aes_encrypt(model, the_key)
        return (await api_update_contract_model(contract_id, encrypted_model));
    };
}

export function update_contract_model_public(contract_id, entity_id, link, cell_phone_number, model, the_key) {
    return async function() {
        let encrypted_model = aes_encrypt(model, the_key)
        return (await api_update_contract_model_public(contract_id, entity_id, link, cell_phone_number, encrypted_model));
    }
}


//unused
export function update_contract_user_info(contract_id, entity_id, corp_id, e, user_info, isAccount, pin = "000000"){
    return async function(){
        /*let the_key = getContractKey(pin, shared_key);
        let encrypted_user_info = aes_encrypt(JSON.stringify(e), the_key)
        return (await api_update_contract_user_info(contract_id, entity_id, corp_id, encrypted_user_info)).payload;*/
        return false
    };
}

export function update_contract_sign(contract_id, signature, the_key, email_list, hashValue, random_web3_account = false){
    return async function(){
        if(random_web3_account) {
            let auth = makeAuth(generateRandomKey(16), generateRandomKey(32));
            let encryptedMasterSeed = makeMnemonic(auth)
            let rawMnemonic = showMnemonic(auth);
            let keyPair = SeedToEthKey(rawMnemonic, "0'/0/0");
            let privateKey = "0x"+keyPair.privateKey.toString('hex');
            Web3.addAccount(privateKey)
        }
        let sign = Web3.sign(JSON.stringify({hash:hashValue}));
        let signText = JSON.stringify(sign)
        let encrypted_signature = aes_encrypt(signature, the_key)
        return (await api_update_contract_sign(contract_id, encrypted_signature, email_list, signText));
    };
}

export function update_contract_sign_public(contract_id, entity_id, signature, the_key, email_list, hashValue, cell_phone_number, certificate_number, random_web3_account = false) {
    return async function() {
        if(random_web3_account) {
            let auth = makeAuth(generateRandomKey(16), generateRandomKey(32));
            let encryptedMasterSeed = makeMnemonic(auth)
            let rawMnemonic = showMnemonic(auth);
            let keyPair = SeedToEthKey(rawMnemonic, "0'/0/0");
            let privateKey = "0x"+keyPair.privateKey.toString('hex');
            Web3.addAccount(privateKey)
        }
        let sign = Web3.sign(JSON.stringify({hash:hashValue}));
        let signText = JSON.stringify(sign)
        let encrypted_signature = aes_encrypt(signature, the_key)
        return (await api_update_contract_sign_public(contract_id, entity_id, encrypted_signature, email_list, signText, cell_phone_number, certificate_number));
    }
}

export function update_contract_sign_info(contract_id, sign_info, the_key) {
    return async function() {
        let encrypted_sign_info = aes_encrypt(JSON.stringify(sign_info), the_key)
        return (await api_update_contract_sign_info(contract_id, encrypted_sign_info ));
    }
}


export function move_contract_can_edit_account_id(contract_id, can_edit_corp_id, move_account_id, move_email){
    return async function(){
        return (await api_move_contract_can_edit_account_id(contract_id, can_edit_corp_id, move_account_id, move_email));
    };
}

export function move_contract_can_edit_account_id_public(contract_id, entity_id, link, cell_phone_number, can_edit_corp_id, move_account_id, move_email){
    return async function(){
        return (await api_move_contract_can_edit_account_id_public(contract_id, entity_id, link, cell_phone_number, can_edit_corp_id, move_account_id, move_email));
    };
}


export function get_chats(contract_id, page = 0, display_count = 20, last_chat_id = 0){
    return async function(){
        return (await api_get_chats(contract_id, page, display_count, last_chat_id));
    };
}

export function get_chats_public(contract_id, entity_id, link, cell_phone_number, page = 0, display_count = 20, last_chat_id = 0) {
    return async function() {
        return (await api_get_chats_public(contract_id, entity_id, link, cell_phone_number, page, display_count, last_chat_id))
    }
}

export function send_chat(contract_id, entity_id, corp_id, message){
    return async function(){
        return (await api_send_chat(contract_id, entity_id, corp_id, message));
    };
}

export function folder_list_contract(group_id = null) {
    return async function(dispatch) {
        let resp = await api_folder_list_contract(group_id)
        dispatch({
            type:FOLDER_LIST_CONTRACT,
            payload:resp.payload
        })
        return resp
    }
}

export function add_folder_contract(folder_name, group_id = null) {
    return async function() {
        let resp = await api_add_folder_contract(folder_name, group_id)
        return resp
    }
}

export function remove_folder_contract(folder_ids, group_id = null) {
    return async function() {
        let resp = await api_remove_folder_contract(JSON.stringify(folder_ids), group_id)
        return resp
    }
}

export function change_folder_contract(folder_id, folder_name, group_id = null) {
    return async function() {
        let resp = await api_change_folder_contract(folder_id, folder_name, group_id)
        return resp
    }
}

export function add_folder_in_contract(folder_id, contract_ids, group_id = null) {
    return async function() {
        let resp = await api_add_folder_in_contract(folder_id, JSON.stringify(contract_ids), group_id)
        return resp
    }
}

export function get_lock_count(group_id) {
    return async function() {
        let resp = await api_get_lock_count(group_id)
        return resp
    }
}


export function get_contract_logs(contract_id, page = 0, display_count = 6) {
    return async function() {
        let resp = await api_get_contract_logs(contract_id, page, display_count)
        return resp
    }
}

export function modify_contract_user_info(contract_id, entity_id, corp_id, user_info, the_key) {
    return async function() {
        let resp = await api_modify_contract_user_info(contract_id, entity_id, corp_id, aes_encrypt(JSON.stringify(user_info), the_key))
        return resp
    }
}

export function createContractHtml(contract, infos) {
    let head = <head>
        <title>E-Contract</title>
        <meta charSet="utf-8" />
    </head>

    let model = contract.html;
    for(let v of infos) {
        let regex = new RegExp(`<\\s*span\\s*class="t-sign corp_${v.corp_id} entity_${v.entity_id}"[^>]*>(.*?)<\\s*\/\\s*span>`, "gi")
        let aa = model.match(regex);

        if(v.signature)
            model = model.replace(regex, `<img src="${v.signature}" style="margin-left: 20px;height: 100px;"/>`)
        else
            model = model.replace(regex, `<span class="no-sign-place">${translate("no_sign_place", [v.user_info.username])}</span>`)
    }

    let body = <body>
        <div className="preview-contract-page">
            <div className="header-page">
                <div className="header">
                    <div className="left-icon">
                    </div>
                    <div className="title">{contract.name}</div>
                </div>
                <div className="container">
                    <div className="contract-main-text">
                        <div className="fr-element fr-view" dangerouslySetInnerHTML={{__html:model}} />
                        {/*<div className="sign-info">
                            {infos.map( (e, k) => {
                                if(e.privilege != 1)
                                    return
                                return <div className="item" key={k}>
                                    <div className="title">{translate("signer_counter", [k+1])}</div>
                                    {e.sign_info ? Object.entries(e.sign_info).map( (ee, kk) => {
                                        let title = ee[0].substring(1, ee[0].length)
                                        return <div className="info" key={kk}><span className="first">{title}</span> : <span className="last">{ee[1]}</span></div>
                                    }) : <div className="info">{translate("not_yet_register_sign_info")}</div>}
                                    {e.sign_info ? <div className="signature">
                                        {translate("sign")}
                                        {e.signature ? <img src={e.signature} /> : null }
                                    </div> : null}
                                </div>
                            })}
                        </div>*/}
                    </div>
                </div>
            </div>
        </div>
    </body>

    let exclude_sign_body = <body>
        <div className="preview-contract-page">
            <div className="header-page">
                <div className="header">
                    <div className="left-icon">
                    </div>
                    <div className="title">{contract.name}</div>
                </div>
                <div className="container">
                    <div className="contract-main-text">
                        <div className="fr-element fr-view" dangerouslySetInnerHTML={{__html:contract.html}} />
                        {/*<div className="sign-info">
                            {infos.map( (e, k) => {
                                if(e.privilege != 1)
                                    return
                                return <div className="item" key={k}>
                                    <div className="title">{translate("signer_counter", [k+1])}</div>
                                    {e.sign_info ? Object.entries(e.sign_info).map( (ee, kk) => {
                                        let title = ee[0].substring(1, ee[0].length)
                                        return <div className="info" key={kk}><span className="first">{title}</span> : <span className="last">{ee[1]}</span></div>
                                    }) : <div className="info">{translate("not_yet_register_sign_info")}</div>}
                                </div>
                            })}
                        </div>*/}
                    </div>
                </div>
            </div>
        </div>
    </body>

    let style = `
    <style type="text/css">
.font0 {
  font-size: 11px;
}
.font1 {
  font-size: 13px;
}
.font2 {
  font-size: 14px;
}
.font3 {
  font-size: 15px;
}
.font4 {
  font-size: 18px;
}
.font5 {
  font-size: 21px;
}
.font6 {
  font-size: 24px;
}
.font-bold {
  font-weight: bold;
}
body {
  font-family: "Nanum Gothic", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 0;
  margin: 0;
  color: #181818;
  font-size: 14px;
}
a {
  text-decoration: none;
}
a:link {
  color: inherit;
}
a:visited {
  color: inherit;
}
a:hover {
  color: inherit;
}
a:active {
  color: inherit;
}
input:focus {
  outline: none;
}
button:focus {
  outline: none;
}
select:focus {
  outline: none;
}
::placeholder {
  /* Chrome, Firefox, Opera, Safari 10.1+ */
  color: #a7a4a5;
  opacity: 1;
  /* Firefox */
}
:-ms-input-placeholder {
  /* Internet Explorer 10-11 */
  color: #a7a4a5;
}
::-ms-input-placeholder {
  /* Microsoft Edge */
  color: #a7a4a5;
}
::-webkit-scrollbar {
  position: absolute;
  width: 6px;
  height: 1px;
}
::-webkit-scrollbar-track {
  background: #f4f4f4;
}
::-webkit-scrollbar-thumb {
  background: #dadadc;
}
::-webkit-scrollbar-thumb:hover {
  background: #a7a4a5;
}
.fr-toolbar {
  border-top: none !important;
  border-radius: 0 !important;
  -moz-border-radius: 0 !important;
  -webkit-border-radius: 0 !important;
  -webkit-box-shadow: none !important;
  -moz-box-shadow: none !important;
  box-shadow: none !important;
  border-right: 1px solid #dadadc !important;
  border-bottom: 1px solid #dadadc !important;
}
.fr-wrapper {
  background-color: #a7a4a5 !important;
  max-height: calc(100% - 111px) !important;
  padding: 0 20px !important;
}
.fr-view {
  margin: 20px auto !important;
  max-width: 900px;
  padding: 50px 70px !important;
  background-color: white !important;
  min-height: 100% !important;
  word-break: break-all !important;
}
a.fr-command {
  padding: 10px 24px !important;
}
.fr-element table td {
  padding: 10px;
}
.header-page > .header {
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid #dadadc;
}
.header-page > .header > .left-icon {
  padding: 15px 10px;
  text-align: left;
  box-sizing: border-box;
  margin-right: 20px;
}
.header-page > .header > .left-icon > i {
  margin-left: 20px;
  cursor: pointer;
  font-size: 40px;
  color: #181818;
}
.header-page > .header > .title {
  text-align: left;
  font-size: 18px;
  color: #181818;
  font-weight: bold;
  padding:20px 0px;
  margin-right: 20px;
  padding-right: 20px;
  margin-left: 20px;
}
.preview-contract-page {
  height: 100%;
  width: 100%;
  background: white;
  overflow-y: auto;
}
.preview-contract-page > .header-page .container {
  background-color: #a7a4a5;
  padding: 40px 0;
}
.preview-contract-page > .header-page .container > .contract-main-text {
  margin: auto;
  max-width: 1000px;
  min-height: 100%;
  padding: 55px;
  background-color: white;
  box-sizing: border-box;
}
.preview-contract-page > .header-page .container > .contract-main-text > .sign-info {
  margin-bottom: 50px;
  display: flex;
}
.preview-contract-page > .header-page .container > .contract-main-text > .sign-info > .item {
  display: inline-block;
  width: 50%;
  box-sizing: border-box;
  padding: 0 40px;
  margin-top: 70px;
  font-size: 15px;
  color: #181818;
}
.preview-contract-page > .header-page .container > .contract-main-text > .sign-info > .item > .title {
  font-weight: bold;
}
.preview-contract-page > .header-page .container > .contract-main-text > .sign-info > .item > .info {
  margin-top: 10px;
  display: flex;
  flex-direction: row;
}
.preview-contract-page > .header-page .container > .contract-main-text > .sign-info > .item > .info > .first {
  margin-right: 10px;
  word-break: break-all;
}
.preview-contract-page > .header-page .container > .contract-main-text > .sign-info > .item > .info > .last {
  flex: 1;
  margin-left: 10px;
  word-break: break-all;
}
.preview-contract-page > .header-page .container > .contract-main-text > .sign-info > .item > .signature {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
}
.preview-contract-page > .header-page .container > .contract-main-text > .sign-info > .item > .signature > img {
  /*position:absolute;
   left:50px;
   top:-40px;*/
  margin-left: 20px;
  height: 100px;
}
        </style>`

    return {
        html: "<html>" + ReactDOMServer.renderToStaticMarkup(head) + ReactDOMServer.renderToStaticMarkup(body) + style + "</html>",
        body: ReactDOMServer.renderToStaticMarkup(body),
        exclude_sign_body: ReactDOMServer.renderToStaticMarkup(exclude_sign_body),
    }
}




// function removePIN(contract_id){
//     sessionStorage.removeItem(`contract:${contract_id}`);
// }
/*
async function getPIN(contract_id) {
    let epin = sessionStorage.getItem(`contract:${contract_id}`);
    if (!epin) {
        let contract_info = (await api_load_contract_info(contract_id)).payload;
        if (contract_info && contract_info.epin) {
            epin = contract_info.epin.slice(0, 32);
        } else {
            return null;
        }
    }
    return decryptPIN(epin);
}

async function getTheKey(contract_id, pin) {
    let contract_info = (await api_load_contract_info(contract_id)).payload;
    let entropy = localStorage.getItem("entropy");
    if (!contract_info || !entropy) return null;
    let shared_key = unsealContractAuxKey(entropy, contract_info.eckai);
    let the_key = getContractKey(pin, shared_key);
    return the_key;
}

async function parse_html(account, contract_id, html, the_key){
    try{
        html = aes_decrypt(html, the_key)
        html = JSON.parse(html)
        for(let page of html){
            for(let k in page){
                let obj = page[k]
                if (obj.type == "img") {
                    let resp = await fetch(`${window.HOST}/${contract_id}-${account.id}-${obj.data}`,{encoding:null})
                    obj.data = aes_decrypt(await resp.text() , the_key)
                }
                obj.account_id = account.id
                obj.name = account.name
                obj.code = account.code
            }
        }

        return html
    }catch(err){
        
    }

    return []
}

async function fetch_img(name, the_key){
    let resp = await fetch(`${window.HOST}/${name}`,{encoding:null})
    let text = await resp.text();
    console.log(text.length, the_key)
    let buffered = await aes_decrypt_async(text, the_key, true);
    var blob = new Blob([buffered], {type: 'image/png'});
    var url = URL.createObjectURL(blob);
    return url;
}
export function get_pin_from_storage(contract_id){
    return async function(){
        return await getPIN(contract_id);
    }
}

export function load_contract_info(contract_id){
    return async function(){
        return (await api_load_contract_info(contract_id)).payload;
    };
}

export function load_contract(contract_id, pin, load_listener = null){
    return async function(){
        try{
            let the_key = await getTheKey(contract_id, pin);
            let contract = (await api_load_contract(contract_id)).payload;

            contract.html = await parse_html({
                id:contract.account_id,
                code:contract.author_code,
                name:contract.author_name
            }, contract_id, contract.html, the_key)

            try{ contract.author_msg = aes_decrypt(contract.author_msg, the_key) }catch(err){}
            
            for(let counterparty of contract.counterparties){
                counterparty.html = await parse_html({
                    id:counterparty.account_id,
                    code:counterparty.code,
                    name:counterparty.name
                }, contract_id, counterparty.html, the_key)
                
                try{ counterparty.reject = aes_decrypt(counterparty.reject, the_key) }catch(err){}
            }

            let img_base64 = []
            let i = 0;
            for(let img of contract.imgs ) {
                img_base64.push(await fetch_img(img, the_key))
                i++;
                if(load_listener != null)
                    load_listener(i, contract.imgs.length)
            }
            contract.imgs = img_base64;

            // if(contract.ipfs){
            //     let payload = await window.ipfs_download(contract.ipfs);
            //     contract.pdf = aes_decrypt(payload, the_key)
            //     console.log(contract.pdf)
            // }
            
            sessionStorage.setItem(`contract:${contract_id}`, encryptPIN(pin))
            //localStorage.setItem(`contract:${contract_id}`, pin)
            return contract
        }catch(err){
            console.log(err)
            // removePIN(contract_id);
        }
        return null;
    }
}

export function all_folders(){
    return async function(dispatch){
        return (await api_all_folders()).payload
    }
}

export function folder_list(page=0){
    return async function(dispatch){
        let list = (await api_folder_list(page)).payload
        dispatch({
            type:LOAD_FODLERS,
            payload:list
        })
        return list
    }
}

export function folder_in_contracts(folder_id,page=0){
    return async function(dispatch){
        let folder = (await api_folder_in_contracts(folder_id,page)).payload
        dispatch({
            type:LOAD_CONTRACT_LIST,
            payload:folder
        })
        return folder
    }
}

export function recently_contracts(page=0){
    return async function(dispatch){
        let list = (await api_recently_contracts(page)).payload
        dispatch({
            type:LOAD_CONTRACT_LIST,
            payload:list
        })
        return list
    }
}

export function edit_contract(contract_id, pin, edit){
    return async function(dispatch){
        let encrypt_data = []
        let the_key = await getTheKey(contract_id, pin);
        for(let page of edit){
            for(let k in page){
                let obj = page[k]
                if(obj.type == "img"){
                    await new Promise(r=>setTimeout(r,100))
                    encrypt_data.push(aes_encrypt(obj.data, the_key))
                    obj.data = encrypt_data.length - 1
                }
            }
        }

        let encrypt_edit = aes_encrypt(JSON.stringify(edit), the_key)
        return (await api_edit_contract(contract_id, encrypt_data, encrypt_edit)).payload
    }
}

export function send_chat(contract_id, msg){
    return async function(dispatch){
        let pin = await getPIN(contract_id);
        if(pin){
            let the_key = await getTheKey(contract_id, pin);
            let encrypt_msg = aes_encrypt(msg || "  ", the_key)
            let resp = (await api_send_chat(contract_id, encrypt_msg)).payload
            if(resp){
                return true
            }
        }
        return false
    }
}

export function fetch_chat(contract_id, cursor=0){
    return async function(dispatch){
        let pin = await getPIN(contract_id);
        if(pin){
            let the_key = await getTheKey(contract_id, pin);
            let resp = (await api_fetch_chat(contract_id, cursor)).payload
            for(let chat of resp){
                try{
                    if(Number(chat.msg) == chat.msg){
                        chat.msg = {
                            type:Number(chat.msg)
                        }
                    }else{
                        chat.msg = aes_decrypt(chat.msg, the_key)
                    }
                }catch(err){}
            }
            return resp
        }
        return null
    }
}

export function confirm_contract(contract_id, counterparties, docByte, revision){
    return async function(dispatch){
        let pin = await getPIN(contract_id);
        let thekey = await getTheKey(contract_id, pin)
        let encrypt = aes_encrypt(new Buffer(docByte), thekey)


        let original = sha256(docByte)
        let signTx = await Web3.signed_newOrSignContract(original,counterparties)

        console.log(JSON.stringify(signTx))

        return (await api_confirm_contract( contract_id, original, JSON.stringify(signTx), revision, encrypt)).payload
    }
}

export function reject_contract(contract_id, msg, revision){
    return async function(dispatch){
        let pin = await getPIN(contract_id);
        let the_key = await getTheKey(contract_id, pin);
        msg = aes_encrypt(msg, the_key)

        return (await api_reject_contract(contract_id, msg, revision)).payload
    }
}

export function new_folder(name){
    return async function(dispatch){
        let resp = await api_new_folder(name)
        console.log(resp)
        return resp.payload
    }
}

export function remove_folder(folder_ids){
    return async function(dispatch){
        return (await api_remove_folder(folder_ids)).payload
    }
}

export function move_to_folder(folder_id,contract_ids){
    return async function(dispatch){
        return (await api_move_to_folder(folder_id,contract_ids)).payload
    }
}

export function clear_epin(contract_id){
    return async function(){
        return (await api_clear_epin(contract_id)).payload;
    };
}

export function gen_pin(digit=6) {
    return async function() {
        return genPIN(digit);
    };
}

export function eth_transaction(){
    return async function(){
    }
}

export function convert_doc(file){
    return async function(){
        return await api_convert_doc(file)
    }
}

export function decrypt_contract_hexstring(contract_id, hexstring){
    return async function(dispatch){
        let pin = await getPIN(contract_id);
        let thekey = await getTheKey(contract_id, pin);
        let decrypted = aes_decrypt(hexstring, thekey, true);
        return decrypted;
    }
}*/

