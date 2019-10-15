import {
    api_invite_information,
    api_get_my_groups_info,
    api_get_group_info,
    api_get_group_members,
    api_create_group,
    api_remove_group,
    api_hide_group,
    api_remove_group_member,
    api_remove_group_member_all,
    api_consume_invitation,
    api_add_member_group,
    api_remove_invite_group,
    api_change_group_title,
    api_new_corp,
    api_get_corp_member_info,
    api_get_corp_member_info_all,
    api_all_invite_list,
    api_update_group_public_key,
    api_exist_group_member,
    api_add_member_group_exist,
    api_exist_in_progress_contract,
    api_remove_corp_member,
    api_get_corp_member_count,
    api_get_group_member_all,
    api_get_corp_member_count_no_auth,
} from "../../../gen_api"

import {
    aes_decrypt_async,
    aes_encrypt_async,
    aes_decrypt,
    hmac_sha256,
    get256bitDerivedPublicKey,
    bip32_from_512bit,
    decrypt_corp_info,
} from "../../common/crypto_test"

import Web3 from "../Web3"
import md5 from 'md5'

export const GROUP_HOME_OPEN_GROUP = "GROUP_HOME_OPEN_GROUP"
export const GROUP_HOME_CLOSE_GROUP = "GROUP_HOME_CLOSE_GROUP"
export const GET_MY_GROUPS_INFO = "GET_MY_GROUPS_INFO"
export const GET_GROUP_INFO = "GET_GROUP_INFO"
export const GET_GROUP_MEMBERS = "GET_GROUP_MEMBERS"

export const CREATE_GROUP = "CREATE_GROUP"
export const REMOVE_GROUP = "REMOVE_GROUP"
export const ADD_MEMBER_GROUP = "ADD_MEMBER_GROUP"
export const REMOVE_MEMBER_GROUP = "REMOVE_MEMBER_GROUP"
export const REMOVE_INVITE_GROUP = "REMOVE_INVITE_GROUP"

export function openGroup(group_id){
	return async function (dispatch){
		dispatch({ type:GROUP_HOME_OPEN_GROUP, payload:group_id })
	}
}

export function closeGroup(group_id){
	return async function (dispatch){
		dispatch({ type:GROUP_HOME_CLOSE_GROUP, payload:group_id })
	}
}

export function get_group_info(group_id, hidden=0, detail) {
    return async function(dispatch) {
        let infos = await api_get_group_info(group_id, hidden, detail);
        if (group_id == 0) {
            dispatch({ type:GET_MY_GROUPS_INFO, payload:infos.payload});
        }
        return infos.payload;
    }
}

export function hide_group(group_id) {
    return async function(dispatch) {
        let infos = await api_hide_group(group_id);
        return infos.payload
    }
}

export function remove_group_member(group_id, account_id) {
    return async function() {
        let resp = await api_remove_group_member(group_id, account_id);
        return resp.payload
    }
}

export function remove_group_member_all(group_id) {
    return async function() {
        let resp = await api_remove_group_member_all(group_id);
        return resp.payload
    }
}

export function consume_invitation(invite_code, data) {
    return async function() {
        let resp = await api_consume_invitation(invite_code, data);
        return resp.payload
    }
}

/*
export function get_my_groups_info() {
    return async function(dispatch) {
        let infos = await api_get_my_groups_info();
        if(infos.code == 1 && infos.payload)
            dispatch({ type:GET_MY_GROUPS_INFO, payload:infos.payload})
        return infos.payload
    }
}

export function get_group_info(group_id) {
    return async function(dispatch) {
        let info = await api_get_group_info(group_id);
        console.log(info)
        return info.payload
    }
}
*/

export function get_group_members(group_id) {
    return async function(dispatch) {
        let infos = await api_get_group_members(group_id);
        return infos.payload
    }
}

export function create_group(group_name) {
    return async function() {
        let resp = await api_create_group(group_name);
        return resp.payload
    }
}

export function update_group_public_key(group_id, corp_master_key) {
    return async function() {
        let group_key = get256bitDerivedPublicKey(Buffer.from(corp_master_key, 'hex'), "m/0'/"+group_id+"'").toString('hex');
        let group_key2 = hmac_sha256("FirmaChain Group Key", group_key);
        let group_master_key = Buffer.concat([Buffer.from(group_key, "hex"), group_key2]);
        let group_public_key_for_contract = bip32_from_512bit(group_master_key).derivePath("m/2'/0'").publicKey;
        let resp = await api_update_group_public_key(group_id, group_public_key_for_contract.toString('hex'))
        return resp
    }
}

export function remove_group(group_id) {
    return async function() {
        let resp = await api_remove_group(group_id);
        return resp.payload
    }
}

export function change_group_title(group_id, change_title) {
    return async function() {
        let resp = await api_change_group_title(group_id, change_title);
        return resp.payload
    }
}

export function add_member_group(group_id, email, corp_key, data_plain, data_for_inviter_plain) {
    return async function() {
        const possible = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
        let passphrase2_length = 32;
        let passphrase2 = "";
        for (let i = 0; i < passphrase2_length; i++)
            passphrase2 += possible.charAt(Math.floor(Math.random() * possible.length));
        let key = hmac_sha256("", Buffer.from(email+passphrase2));

        let data_plain_buffered = Buffer.from(JSON.stringify(data_plain));
        let data = Buffer.from((await aes_encrypt_async(data_plain_buffered, key)), 'binary').toString('hex');

        let data_for_inviter_plain_buffered = Buffer.from(JSON.stringify(data_for_inviter_plain));
        let data_for_inviter = Buffer.from( await aes_encrypt_async( data_for_inviter_plain_buffered, Buffer.from(corp_key, 'hex') ), 'binary').toString('hex');

        let resp = await api_add_member_group(group_id, email, passphrase2, data, data_for_inviter);
        return resp
    }
}

export function add_member_group_exist(account_id, group_id, email, data_plain) {
    return async function() {
        const possible = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
        let passphrase2_length = 32;
        let passphrase2 = "";
        for (let i = 0; i < passphrase2_length; i++)
            passphrase2 += possible.charAt(Math.floor(Math.random() * possible.length));
        let key = hmac_sha256("", Buffer.from(email+passphrase2));

        let data_plain_buffered = Buffer.from(JSON.stringify(data_plain));
        let data = Buffer.from((await aes_encrypt_async(data_plain_buffered, key)), 'binary').toString('hex');

        let resp = await api_add_member_group_exist(account_id, group_id, email, passphrase2, data)
        return resp
    }
}

export function remove_invite_group(group_id, invite_id) {
    return async function() {
        let resp = await api_remove_invite_group(group_id, invite_id);
        return resp.payload
    }
}

export function invite_information(email, registration_code) {
    return async function(){
        let info = (await api_invite_information(registration_code)).payload;
        if (!info) return null;
        let email_hashed = md5(email+info.passphrase1);
        try {
            let passphrase2 = (await aes_decrypt_async(Buffer.from(info.encrypted_passphrase2, 'hex'), Buffer.from(email_hashed) ));
            let key = hmac_sha256("", Buffer.from(email+passphrase2));
            let data = JSON.parse(await aes_decrypt_async(Buffer.from(info.encrypted_data, 'hex'), key ));
            return data;
        } catch(e) {
            return null;
        }
    }
}

export function new_corp(data) {
    return async function() {
        let resp = await api_new_corp(data);
        return resp.payload;
    }
}

export function get_corp_member_info(account_id, corp_key) {
    return async function() {
        let resp = await api_get_corp_member_info(account_id);
        let member = {...resp.payload}
        let data = await aes_decrypt_async(new Buffer(member.info), Buffer.from(corp_key, 'hex') )
        member.data = JSON.parse(data);
        return member;
    }
}

export function get_corp_member_info_all(corp_key, show_all = 1) {
    return async function(dispatch) {
        let resp = await api_get_corp_member_info_all(show_all);
        let list = [...resp.payload]
        for(let v of list) {
            let data = await aes_decrypt_async(new Buffer(v.info), Buffer.from(corp_key, 'hex') )
            v.data = JSON.parse(data);
        }
        dispatch({ type:GET_GROUP_MEMBERS, payload:list});
        return list;
    }
}

export function all_invite_list() {
    return async function() {
        let resp = await api_all_invite_list();
        return resp.payload
    }
}

export function exist_group_member(group_id, email) {
    return async function() {
        let resp = await api_exist_group_member(group_id, email)
        return resp
    }
}

export function exist_in_progress_contract(account_id) {
    return async function() {
        let resp = await api_exist_in_progress_contract(account_id)
        return resp
    }
}

export function remove_corp_member(account_id) {
    return async function() {
        let resp = await api_remove_corp_member(account_id)
        return resp
    }
}

export function get_corp_member_count() {
    return async function() {
        let resp = await api_get_corp_member_count()
        return resp
    }
}

export function get_group_member_all(corp_key) {
    return async function() {
        let resp = await api_get_group_member_all()

        for(let v of resp.payload) {
            v.public_info = decrypt_corp_info(Buffer.from(corp_key, 'hex'), new Buffer(v.public_info.data) )
        }

        return resp
    }
}

export function get_corp_member_count_no_auth(corp_id, account_id) {
    return async function() {
        let resp = await api_get_corp_member_count_no_auth(corp_id, account_id)
        return resp.payload
    }
}




