// ### WARNING ###
// THIS FILE IS AUTO GENERATED!!
// DO NOT MODIFIY THIS FILE DIRECTLY!!
// ### WARNING ###

import {post, get} from './Network.js';

export async function api_new_approval(name,order_list,html){
    let __data = new FormData();

    if(name != null) __data.append('name', name);
	if(order_list != null) __data.append('order_list', order_list);
	if(html != null) __data.append('html', html)

    return await post("/new_approval", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_list_approval(type,page,display_count,search_text){
    let __data = new FormData();

    if(type != null) __data.append('type', type);
	if(page != null) __data.append('page', page);
	if(display_count != null) __data.append('display_count', display_count);
	if(search_text != null) __data.append('search_text', search_text)

    return await post("/list_approval", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_approval_chats(approval_id,page,display_count,last_chat_id){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id);
	if(page != null) __data.append('page', page);
	if(display_count != null) __data.append('display_count', display_count);
	if(last_chat_id != null) __data.append('last_chat_id', last_chat_id)

    return await post("/get_approval_chats", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_send_approval_chat(approval_id,entity_id,corp_id,message){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id);
	if(entity_id != null) __data.append('entity_id', entity_id);
	if(corp_id != null) __data.append('corp_id', corp_id);
	if(message != null) __data.append('message', message)

    return await post("/send_approval_chat", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_approval_model(approval_id,model){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id);
	if(model != null) __data.append('model', model)

    return await post("/update_approval_model", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_approval_name(approval_id,name){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id);
	if(name != null) __data.append('name', name)

    return await post("/update_approval_name", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_approval(approval_id){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id)

    return await post("/get_approval", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_add_approval_user(approval_id,add_account_id){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id);
	if(add_account_id != null) __data.append('add_account_id', add_account_id)

    return await post("/add_approval_user", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_start_approval(approval_id){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id)

    return await post("/start_approval", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_confirm_approval(approval_id){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id)

    return await post("/confirm_approval", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_reject_approval(approval_id,reject_reason){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id);
	if(reject_reason != null) __data.append('reject_reason', reject_reason)

    return await post("/reject_approval", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_approval_user(approval_id,remove_account_id){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id);
	if(remove_account_id != null) __data.append('remove_account_id', remove_account_id)

    return await post("/remove_approval_user", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_change_order_approval(approval_id,order_list){
    let __data = new FormData();

    if(approval_id != null) __data.append('approval_id', approval_id);
	if(order_list != null) __data.append('order_list', order_list)

    return await post("/change_order_approval", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_convert_doc(file){
    let __data = new FormData();

    if(file != null) __data.append('file', file)

    return await post("/convert_doc", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_new_contract(subject,creator_email,counterparties,necessary_info_string,can_edit_account_id,payer_account_id,is_pin_used,model,message,decrypted_message){
    let __data = new FormData();

    if(subject != null) __data.append('subject', subject);
	if(creator_email != null) __data.append('creator_email', creator_email);
	if(counterparties != null) __data.append('counterparties', counterparties);
	if(necessary_info_string != null) __data.append('necessary_info_string', necessary_info_string);
	if(can_edit_account_id != null) __data.append('can_edit_account_id', can_edit_account_id);
	if(payer_account_id != null) __data.append('payer_account_id', payer_account_id);
	if(is_pin_used != null) __data.append('is_pin_used', is_pin_used);
	if(model != null) __data.append('model', model);
	if(message != null) __data.append('message', message);
	if(decrypted_message != null) __data.append('decrypted_message', decrypted_message)

    return await post("/new_contract", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_add_counterparties(contract_id,counterparties){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(counterparties != null) __data.append('counterparties', counterparties)

    return await post("/add_counterparties", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_add_contract_user(contract_id,counterparty){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(counterparty != null) __data.append('counterparty', counterparty)

    return await post("/add_contract_user", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_contract_self(contract_id){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id)

    return await post("/remove_contract_self", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_counterparty(contract_id,corp_id,entity_id){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(corp_id != null) __data.append('corp_id', corp_id);
	if(entity_id != null) __data.append('entity_id', entity_id)

    return await post("/remove_counterparty", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_contract_public_link(link){
    let __data = new FormData();

    if(link != null) __data.append('link', link)

    return await post("/get_contract_public_link", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_modify_contract_user_info(contract_id,entity_id,corp_id,user_info){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(entity_id != null) __data.append('entity_id', entity_id);
	if(corp_id != null) __data.append('corp_id', corp_id);
	if(user_info != null) __data.append('user_info', user_info)

    return await post("/modify_contract_user_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_contracts(type,status,page,display_count,sub_status,group_id,search_text){
    let __data = new FormData();

    if(type != null) __data.append('type', type);
	if(status != null) __data.append('status', status);
	if(page != null) __data.append('page', page);
	if(display_count != null) __data.append('display_count', display_count);
	if(sub_status != null) __data.append('sub_status', sub_status);
	if(group_id != null) __data.append('group_id', group_id);
	if(search_text != null) __data.append('search_text', search_text)

    return await post("/get_contracts", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_contract(contract_id){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id)

    return await post("/get_contract", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_contract_logs(contract_id,page,display_count){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(page != null) __data.append('page', page);
	if(display_count != null) __data.append('display_count', display_count)

    return await post("/get_contract_logs", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_epin_account(contract_id,epin){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(epin != null) __data.append('epin', epin)

    return await post("/update_epin_account", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_epin_group(corp_id,group_id,contract_id,epin){
    let __data = new FormData();

    if(corp_id != null) __data.append('corp_id', corp_id);
	if(group_id != null) __data.append('group_id', group_id);
	if(contract_id != null) __data.append('contract_id', contract_id);
	if(epin != null) __data.append('epin', epin)

    return await post("/update_epin_group", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_contract_model(contract_id,model){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(model != null) __data.append('model', model)

    return await post("/update_contract_model", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_contract_model_public(contract_id,entity_id,link,cell_phone_number,model){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(entity_id != null) __data.append('entity_id', entity_id);
	if(link != null) __data.append('link', link);
	if(cell_phone_number != null) __data.append('cell_phone_number', cell_phone_number);
	if(model != null) __data.append('model', model)

    return await post("/update_contract_model_public", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_contract_user_info(contract_id,entity_id,corp_id,user_info){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(entity_id != null) __data.append('entity_id', entity_id);
	if(corp_id != null) __data.append('corp_id', corp_id);
	if(user_info != null) __data.append('user_info', user_info)

    return await post("/update_contract_user_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_contract_sign(contract_id,signature,email_list,sign_text){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(signature != null) __data.append('signature', signature);
	if(email_list != null) __data.append('email_list', email_list);
	if(sign_text != null) __data.append('sign_text', sign_text)

    return await post("/update_contract_sign", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_contract_sign_public(contract_id,entity_id,signature,email_list,sign_text,cell_phone_number,certificate_number){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(entity_id != null) __data.append('entity_id', entity_id);
	if(signature != null) __data.append('signature', signature);
	if(email_list != null) __data.append('email_list', email_list);
	if(sign_text != null) __data.append('sign_text', sign_text);
	if(cell_phone_number != null) __data.append('cell_phone_number', cell_phone_number);
	if(certificate_number != null) __data.append('certificate_number', certificate_number)

    return await post("/update_contract_sign_public", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_contract_sign_info(contract_id,sign_info){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(sign_info != null) __data.append('sign_info', sign_info)

    return await post("/update_contract_sign_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_move_contract_can_edit_account_id(contract_id,can_edit_corp_id,move_account_id,move_email){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(can_edit_corp_id != null) __data.append('can_edit_corp_id', can_edit_corp_id);
	if(move_account_id != null) __data.append('move_account_id', move_account_id);
	if(move_email != null) __data.append('move_email', move_email)

    return await post("/move_contract_can_edit_account_id", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_move_contract_can_edit_account_id_public(contract_id,entity_id,link,cell_phone_number,can_edit_corp_id,move_account_id,move_email){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(entity_id != null) __data.append('entity_id', entity_id);
	if(link != null) __data.append('link', link);
	if(cell_phone_number != null) __data.append('cell_phone_number', cell_phone_number);
	if(can_edit_corp_id != null) __data.append('can_edit_corp_id', can_edit_corp_id);
	if(move_account_id != null) __data.append('move_account_id', move_account_id);
	if(move_email != null) __data.append('move_email', move_email)

    return await post("/move_contract_can_edit_account_id_public", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_chats(contract_id,page,display_count,last_chat_id){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(page != null) __data.append('page', page);
	if(display_count != null) __data.append('display_count', display_count);
	if(last_chat_id != null) __data.append('last_chat_id', last_chat_id)

    return await post("/get_chats", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_chats_public(contract_id,entity_id,link,cell_phone_number,page,display_count,last_chat_id){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(entity_id != null) __data.append('entity_id', entity_id);
	if(link != null) __data.append('link', link);
	if(cell_phone_number != null) __data.append('cell_phone_number', cell_phone_number);
	if(page != null) __data.append('page', page);
	if(display_count != null) __data.append('display_count', display_count);
	if(last_chat_id != null) __data.append('last_chat_id', last_chat_id)

    return await post("/get_chats_public", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_send_chat(contract_id,entity_id,corp_id,message){
    let __data = new FormData();

    if(contract_id != null) __data.append('contract_id', contract_id);
	if(entity_id != null) __data.append('entity_id', entity_id);
	if(corp_id != null) __data.append('corp_id', corp_id);
	if(message != null) __data.append('message', message)

    return await post("/send_chat", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_folder_list_contract(group_id){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id)

    return await post("/folder_list_contract", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_add_folder_contract(name,group_id){
    let __data = new FormData();

    if(name != null) __data.append('name', name);
	if(group_id != null) __data.append('group_id', group_id)

    return await post("/add_folder_contract", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_folder_contract(folder_ids,group_id){
    let __data = new FormData();

    if(folder_ids != null) __data.append('folder_ids', folder_ids);
	if(group_id != null) __data.append('group_id', group_id)

    return await post("/remove_folder_contract", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_change_folder_contract(folder_id,name,group_id){
    let __data = new FormData();

    if(folder_id != null) __data.append('folder_id', folder_id);
	if(name != null) __data.append('name', name);
	if(group_id != null) __data.append('group_id', group_id)

    return await post("/change_folder_contract", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_add_folder_in_contract(folder_id,contract_ids,group_id){
    let __data = new FormData();

    if(folder_id != null) __data.append('folder_id', folder_id);
	if(contract_ids != null) __data.append('contract_ids', contract_ids);
	if(group_id != null) __data.append('group_id', group_id)

    return await post("/add_folder_in_contract", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_lock_count(group_id){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id)

    return await post("/get_lock_count", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_invite_information(registration_code){
    let __data = new FormData();

    if(registration_code != null) __data.append('registration_code', registration_code)

    return await post("/invite_information", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_delete_invite_group_member(registration_code){
    let __data = new FormData();

    if(registration_code != null) __data.append('registration_code', registration_code)

    return await post("/delete_invite_group_member", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_create_group(title){
    let __data = new FormData();

    if(title != null) __data.append('title', title)

    return await post("/create_group", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_group_public_key(group_id,group_public_key){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id);
	if(group_public_key != null) __data.append('group_public_key', group_public_key)

    return await post("/update_group_public_key", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_group_info(group_id,hidden,detail){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id);
	if(hidden != null) __data.append('hidden', hidden);
	if(detail != null) __data.append('detail', detail)

    return await post("/get_group_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_hide_group(group_id){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id)

    return await post("/hide_group", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_group_members(group_id){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id)

    return await post("/get_group_members", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_group_member_all(){
    let __data = new FormData();

    

    return await post("/get_group_member_all", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_group_member(group_id,account_id){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id);
	if(account_id != null) __data.append('account_id', account_id)

    return await post("/remove_group_member", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_group_member_all(group_id){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id)

    return await post("/remove_group_member_all", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_consume_invitation(invite_code,data){
    let __data = new FormData();

    if(invite_code != null) __data.append('invite_code', invite_code);
	if(data != null) __data.append('data', data)

    return await post("/consume_invitation", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_change_group_title(group_id,change_title){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id);
	if(change_title != null) __data.append('change_title', change_title)

    return await post("/change_group_title", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_add_member_group(group_id,email,passphrase2,data,data_for_inviter){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id);
	if(email != null) __data.append('email', email);
	if(passphrase2 != null) __data.append('passphrase2', passphrase2);
	if(data != null) __data.append('data', data);
	if(data_for_inviter != null) __data.append('data_for_inviter', data_for_inviter)

    return await post("/add_member_group", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_add_member_group_exist(account_id,group_id,email,passphrase2,data){
    let __data = new FormData();

    if(account_id != null) __data.append('account_id', account_id);
	if(group_id != null) __data.append('group_id', group_id);
	if(email != null) __data.append('email', email);
	if(passphrase2 != null) __data.append('passphrase2', passphrase2);
	if(data != null) __data.append('data', data)

    return await post("/add_member_group_exist", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_invite_group(group_id,invite_id){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id);
	if(invite_id != null) __data.append('invite_id', invite_id)

    return await post("/remove_invite_group", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_corp_info(encrypted_corp_info){
    let __data = new FormData();

    if(encrypted_corp_info != null) __data.append('encrypted_corp_info', encrypted_corp_info)

    return await post("/update_corp_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_corp_member_info(target_account_id){
    let __data = new FormData();

    if(target_account_id != null) __data.append('target_account_id', target_account_id)

    return await post("/get_corp_member_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_corp_member_info_all(show_all){
    let __data = new FormData();

    if(show_all != null) __data.append('show_all', show_all)

    return await post("/get_corp_member_info_all", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_corp_member_count(){
    let __data = new FormData();

    

    return await post("/get_corp_member_count", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_corp_member_count_no_auth(corp_id,account_id){
    let __data = new FormData();

    if(corp_id != null) __data.append('corp_id', corp_id);
	if(account_id != null) __data.append('account_id', account_id)

    return await post("/get_corp_member_count_no_auth", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_exist_group_member(group_id,email){
    let __data = new FormData();

    if(group_id != null) __data.append('group_id', group_id);
	if(email != null) __data.append('email', email)

    return await post("/exist_group_member", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_all_invite_list(){
    let __data = new FormData();

    

    return await post("/all_invite_list", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_exist_in_progress_contract(account_id){
    let __data = new FormData();

    if(account_id != null) __data.append('account_id', account_id)

    return await post("/exist_in_progress_contract", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_corp_member(account_id){
    let __data = new FormData();

    if(account_id != null) __data.append('account_id', account_id)

    return await post("/remove_corp_member", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_legal_register(email,password,phone_number,verification_number){
    let __data = new FormData();

    if(email != null) __data.append('email', email);
	if(password != null) __data.append('password', password);
	if(phone_number != null) __data.append('phone_number', phone_number);
	if(verification_number != null) __data.append('verification_number', verification_number)

    return await post("/legal_register", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_legal_login(email,password){
    let __data = new FormData();

    if(email != null) __data.append('email', email);
	if(password != null) __data.append('password', password)

    return await post("/legal_login", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_legal_get_my_info(){
    let __data = new FormData();

    

    return await post("/legal_get_my_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_subscribe_plan(){
    let __data = new FormData();

    

    return await post("/get_subscribe_plan", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_current_subscription(){
    let __data = new FormData();

    

    return await post("/get_current_subscription", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_next_subscription_payment(){
    let __data = new FormData();

    

    return await post("/get_next_subscription_payment", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_current_subscription_payment(){
    let __data = new FormData();

    

    return await post("/get_current_subscription_payment", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_current_onetime_ticket(){
    let __data = new FormData();

    

    return await post("/get_current_onetime_ticket", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_maximum_member_count(){
    let __data = new FormData();

    

    return await post("/get_maximum_member_count", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_current_total_ticket(){
    let __data = new FormData();

    

    return await post("/get_current_total_ticket", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_current_onetime_ticket_within(days){
    let __data = new FormData();

    if(days != null) __data.append('days', days)

    return await post("/get_current_onetime_ticket_within", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_payment_log(page,display_count){
    let __data = new FormData();

    if(page != null) __data.append('page', page);
	if(display_count != null) __data.append('display_count', display_count)

    return await post("/get_payment_log", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_ticket_log(page,display_count){
    let __data = new FormData();

    if(page != null) __data.append('page', page);
	if(display_count != null) __data.append('display_count', display_count)

    return await post("/get_ticket_log", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_input_payment_info(data,preview_data){
    let __data = new FormData();

    if(data != null) __data.append('data', data);
	if(preview_data != null) __data.append('preview_data', preview_data)

    return await post("/input_payment_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_payment_info(){
    let __data = new FormData();

    

    return await post("/get_payment_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_make_monthly_commitment(plan_id){
    let __data = new FormData();

    if(plan_id != null) __data.append('plan_id', plan_id)

    return await post("/make_monthly_commitment", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_reserve_monthly_commitment(plan_id){
    let __data = new FormData();

    if(plan_id != null) __data.append('plan_id', plan_id)

    return await post("/reserve_monthly_commitment", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_terminate_monthly_commitment(){
    let __data = new FormData();

    

    return await post("/terminate_monthly_commitment", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_buy_onetime_ticket(plan_id,count){
    let __data = new FormData();

    if(plan_id != null) __data.append('plan_id', plan_id);
	if(count != null) __data.append('count', count)

    return await post("/buy_onetime_ticket", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_increase_account(account_count){
    let __data = new FormData();

    if(account_count != null) __data.append('account_count', account_count)

    return await post("/increase_account", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_scheduled_subscription(){
    let __data = new FormData();

    

    return await post("/get_scheduled_subscription", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_check_ticket_count(){
    let __data = new FormData();

    

    return await post("/check_ticket_count", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_add_template(subject,folder_id,html){
    let __data = new FormData();

    if(subject != null) __data.append('subject', subject);
	if(folder_id != null) __data.append('folder_id', folder_id);
	if(html != null) __data.append('html', html)

    return await post("/add_template", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_template(template_id,folder_id,subject,html){
    let __data = new FormData();

    if(template_id != null) __data.append('template_id', template_id);
	if(folder_id != null) __data.append('folder_id', folder_id);
	if(subject != null) __data.append('subject', subject);
	if(html != null) __data.append('html', html)

    return await post("/update_template", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_template(template_ids){
    let __data = new FormData();

    if(template_ids != null) __data.append('template_ids', template_ids)

    return await post("/remove_template", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_template(template_id){
    let __data = new FormData();

    if(template_id != null) __data.append('template_id', template_id)

    return await post("/get_template", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_list_template(folder_id,page){
    let __data = new FormData();

    if(folder_id != null) __data.append('folder_id', folder_id);
	if(page != null) __data.append('page', page)

    return await post("/list_template", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_folder_list_template(){
    let __data = new FormData();

    

    return await post("/folder_list_template", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_add_folder_template(name){
    let __data = new FormData();

    if(name != null) __data.append('name', name)

    return await post("/add_folder_template", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_remove_folder_template(folder_ids){
    let __data = new FormData();

    if(folder_ids != null) __data.append('folder_ids', folder_ids)

    return await post("/remove_folder_template", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_change_folder_template(folder_id,name){
    let __data = new FormData();

    if(folder_id != null) __data.append('folder_id', folder_id);
	if(name != null) __data.append('name', name)

    return await post("/change_folder_template", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_encrypted_user_info(){
    let __data = new FormData();

    

    return await post("/encrypted_user_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_issue_2fa_otp(){
    let __data = new FormData();

    

    return await post("/issue_2fa_otp", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_daniel_count(){
    let __data = new FormData();

    

    return await post("/get_daniel_count", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_daniel_list(){
    let __data = new FormData();

    

    return await post("/get_daniel_list", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_terminate_2fa_otp(){
    let __data = new FormData();

    

    return await post("/terminate_2fa_otp", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_register_2fa_otp(token){
    let __data = new FormData();

    if(token != null) __data.append('token', token)

    return await post("/register_2fa_otp", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_request_email_verification(email){
    let __data = new FormData();

    if(email != null) __data.append('email', email)

    return await post("/request_email_verification", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_check_email_verification_code(email,code){
    let __data = new FormData();

    if(email != null) __data.append('email', email);
	if(code != null) __data.append('code', code)

    return await post("/check_email_verification_code", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_request_phone_verification_code(phone,countryCode){
    let __data = new FormData();

    if(phone != null) __data.append('phone', phone);
	if(countryCode != null) __data.append('countryCode', countryCode)

    return await post("/request_phone_verification_code", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_check_phone_verification_code(phone,code,countryCode){
    let __data = new FormData();

    if(phone != null) __data.append('phone', phone);
	if(code != null) __data.append('code', code);
	if(countryCode != null) __data.append('countryCode', countryCode)

    return await post("/check_phone_verification_code", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_register_account(publicbk,publicms,publicmsc,info,auth,eems,email,name,eth,account_type,emk,public_info,corp_info,open_info,invitation_code){
    let __data = new FormData();

    if(publicbk != null) __data.append('publicbk', publicbk);
	if(publicms != null) __data.append('publicms', publicms);
	if(publicmsc != null) __data.append('publicmsc', publicmsc);
	if(info != null) __data.append('info', info);
	if(auth != null) __data.append('auth', auth);
	if(eems != null) __data.append('eems', eems);
	if(email != null) __data.append('email', email);
	if(name != null) __data.append('name', name);
	if(eth != null) __data.append('eth', eth);
	if(account_type != null) __data.append('account_type', account_type);
	if(emk != null) __data.append('emk', emk);
	if(public_info != null) __data.append('public_info', public_info);
	if(corp_info != null) __data.append('corp_info', corp_info);
	if(open_info != null) __data.append('open_info', open_info);
	if(invitation_code != null) __data.append('invitation_code', invitation_code)

    return await post("/register_account", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_recover_account(publicbk,publicms,auth,eems,email){
    let __data = new FormData();

    if(publicbk != null) __data.append('publicbk', publicbk);
	if(publicms != null) __data.append('publicms', publicms);
	if(auth != null) __data.append('auth', auth);
	if(eems != null) __data.append('eems', eems);
	if(email != null) __data.append('email', email)

    return await post("/recover_account", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_check_join_browser(publicbk){
    let __data = new FormData();

    if(publicbk != null) __data.append('publicbk', publicbk)

    return await post("/check_join_browser", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_check_join_publickey(publicms){
    let __data = new FormData();

    if(publicms != null) __data.append('publicms', publicms)

    return await post("/check_join_publickey", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_get_emk(email){
    let __data = new FormData();

    if(email != null) __data.append('email', email)

    return await post("/get_emk", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_login_account(publicbk,nonce,sign,service_type){
    let __data = new FormData();

    if(publicbk != null) __data.append('publicbk', publicbk);
	if(nonce != null) __data.append('nonce', nonce);
	if(sign != null) __data.append('sign', sign);
	if(service_type != null) __data.append('service_type', service_type)

    return await post("/login_account", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_login_2fa_otp_auth(publicbk,nonce,sign,otp_token){
    let __data = new FormData();

    if(publicbk != null) __data.append('publicbk', publicbk);
	if(nonce != null) __data.append('nonce', nonce);
	if(sign != null) __data.append('sign', sign);
	if(otp_token != null) __data.append('otp_token', otp_token)

    return await post("/login_2fa_otp_auth", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_find_user_with_code_email(email){
    let __data = new FormData();

    if(email != null) __data.append('email', email)

    return await post("/find_user_with_code_email", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_select_userinfo_with_email(email){
    let __data = new FormData();

    if(email != null) __data.append('email', email)

    return await post("/select_userinfo_with_email", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_re_issue_recover_password(emk,encrypted_info){
    let __data = new FormData();

    if(emk != null) __data.append('emk', emk);
	if(encrypted_info != null) __data.append('encrypted_info', encrypted_info)

    return await post("/re_issue_recover_password", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_user_info(encrypted_info){
    let __data = new FormData();

    if(encrypted_info != null) __data.append('encrypted_info', encrypted_info)

    return await post("/update_user_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_user_public_info(encrypted_info){
    let __data = new FormData();

    if(encrypted_info != null) __data.append('encrypted_info', encrypted_info)

    return await post("/update_user_public_info", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}
export async function api_update_username(username){
    let __data = new FormData();

    if(username != null) __data.append('username', username)

    return await post("/update_username", __data,{
        legal_session:window.getCookie("legal_session"),
        session:window.getCookie("session")
    });
}