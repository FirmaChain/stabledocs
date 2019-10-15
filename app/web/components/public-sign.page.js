import React from "react"
import ReactDOM from "react-dom"
import config from "../../../config"

import 'froala-editor/js/froala_editor.pkgd.min.js';
import 'froala-editor/js/languages/ko.js';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

import FroalaEditor from 'react-froala-wysiwyg';
import socketIOClient from 'socket.io-client'
 
import { connect } from 'react-redux';
import { Link, Prompt } from 'react-router-dom'
import history from '../history';
import pdfjsLib from "pdfjs-dist"
import { sha256 } from "js-sha256"
import translate from "../../common/translate"
import Information from "./information.comp"
import Footer from "./footer.comp"
import Chatting from "./chatting.comp"

import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'
import CheckBox2 from "./checkbox2"

import moment from 'moment'

import {
    get_contract_public_link,
    get_chats_public,
    update_contract_sign_public,
    request_phone_verification_code,
    move_contract_can_edit_account_id_public,
    update_contract_model_public,
    select_subject,
    createContractHtml,

} from "../../common/actions"

import {
    aes_encrypt,
    aes_decrypt,
} from "../../common/crypto_test"

let mapStateToProps = (state)=>{
    return {
    }
}

let mapDispatchToProps = {
    get_contract_public_link,
    get_chats_public,
    update_contract_sign_public,
    request_phone_verification_code,
    move_contract_can_edit_account_id_public,
    update_contract_model_public,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
    constructor(){
        super();

        this.blockFlag = false;
        
        //reconect

        this.config = {
            ...window.CONST.FROALA,

            events : {
                'froalaEditor.initialized' : (e, editor) => {
                    this.editor = editor;
                    if( !!this.state.contract && !this.isCanEdit(-1, this.state.entity_id) ) {
                        this.editor.edit.off()
                    } else {
                        this.editor.edit.on()
                    }

                    if(!!this.editor && !!this.state.contract && this.state.contract.status == 2) {
                        this.editor.edit.off()
                    }

                    if(window.isMobile()) {
                        this.editor.toolbar.hide()
                        $('.fr-wrapper').style("height", "100%", "important")
                    }
                },
                'froalaEditor.image.inserted' : async (e, editor, $img, response) => {
                    $img[0].src = window.getImageBase64Uri($img[0])
                    return false;
                },
                'froalaEditor.blur' : async (e, editor) => {
                    console.log("blur", e)
                    //this.range = this.saveSelection();
                },
                'froalaEditor.touchstart' : async (e, editor, touchstartEvent) => {
                    setTimeout(e=>{this.range = this.saveSelection()}, 500);
                },
                'froalaEditor.mousedown' : async (e, editor, mouseDownEvent) => {
                    setTimeout(e=>{this.range = this.saveSelection()}, 500);
                },
            }
        }

        this.end_chat = false

        this.state = {
            model:"",
            select_folder_id:null,
            selected_menu:0,
            contract_modify_status:"",
            sign_mode:false,
            sign_info:{},
            open_users:[],

            page_chat:0,
            last_chat_id:0,
            chat_list:[],

            toolbar_open:false,
            step:0,
        }
    }

    componentDidMount() {
        setTimeout(async()=>{
            await window.showIndicator(translate("loding_contract_detail_data"))
            let resp = await this.props.get_contract_public_link(this.props.match.params.code)
            
            if(resp.code == 1) {
                this.setState({
                    ...resp.payload
                })

                window.openModal("UnlockContractPublic", {
                    contract:resp.payload.contract,
                    infos:resp.payload.infos,
                    onConfirm:this.unlock_contract
                })
            }
            else if(resp.code == -6) {
                alert(translate("invalidate_link"))
                return history.goBack();
            }
            await window.hideIndicator()
        })

        this.updateId = setInterval(this.jqueryInputEvent, 500);

    }

    componentWillUnmount() {
        if(this.socket)
            this.socket.disconnect()

        if(this.updateId)
            clearInterval(this.updateId);
    }


    subscribeChannel() {
        if(!this.state.contract)
            return

        this.socket.emit('subscribe_channel', this.state.contract.contract_id)
        this.socket.on("receive_chat_"+this.state.contract.contract_id, this.onReceiveChat)
        this.socket.on("refresh_contract_"+this.state.contract.contract_id, this.onRefresh)
    }
    

    jqueryInputEvent() {
        $("input[type=checkbox]").each(function(){
            if($(this)[0].checked){
                $(this).attr("checked",true)
            }else{
                $(this).removeAttr("checked")
            }
        })
    }

    onRefresh = async () => {
        let resp = await this.props.get_contract_public_link(this.props.match.params.code)
            
        if(resp.code == 1) {
            await new Promise( resolve => this.setState({
                ...resp.payload
            }, ()=>resolve(true)) )
            await this.unlock_contract(this.state.contract_open_key || "", false)

            if( !!this.editor && !!resp.payload.contract && resp.payload.contract.can_edit_corp_id != -1 || this.state.entity_id != resp.payload.contract.can_edit_account_id ) {
                this.editor.edit.off()
            } else {
                !!this.editor && this.editor.edit.on()
            }

            if(!!this.editor && !!resp.payload.contract && resp.payload.contract.status == 2) {
                this.editor.edit.off()
            }
        }
        else if(resp.code == -6) {
            alert(translate("invalidate_link"))
            return history.goBack();
        }
    }

    unlock_contract = async (contract_open_key, move_step = true) => {
        let the_key;
        try {
            the_key = aes_decrypt(Buffer.from(this.state.ek, 'hex'), Buffer.from(contract_open_key))
        } catch(err) {
            console.log(err)
            alert(translate("fail_input_contract_open_key"))
            return false
        }
        the_key = Buffer.from(the_key, 'hex');

        try {
            let a = JSON.parse(aes_decrypt(Buffer.from(this.state.infos[0].user_info, 'hex').toString('hex'), the_key))
            console.log(a)
        } catch( err ) {
            console.log(err)
            alert(translate("fail_input_contract_open_key"))
            return false
        }
        let _ = {...this.state}

        _.infos = _.infos.map( (e) => {
            let user_info = JSON.parse(aes_decrypt(Buffer.from(e.user_info, 'hex').toString('hex'), the_key))
            return {
                ...e,
                user_info,
                sign_info : e.sign_info ? JSON.parse(aes_decrypt(Buffer.from(e.sign_info, 'hex').toString('hex'), the_key)) : e.sign_info,
                signature : e.signature ? aes_decrypt(Buffer.from(e.signature, 'hex').toString('hex'), the_key) : e.signature,
            }
        })
        _.contract.html = _.contract.html ? aes_decrypt(Buffer.from(_.contract.html, 'hex').toString('hex'), the_key) : _.contract.html
        _.contract.message = _.contract.message ? aes_decrypt(Buffer.from(_.contract.message, 'hex').toString('hex'), the_key) : _.contract.message
        _.contract.necessary_info = JSON.parse(_.contract.necessary_info)
        _.contract.the_key = the_key;

        let model = _.contract.html != null ? _.contract.html : "";
        if(!this.state.model) {
            _.model = model;
        }
        if(!!this.state.model && !!_.contract.html && _.contract.html != this.state.model && this.state.entity_id != _.contract.can_edit_account_id) {
            _.model = model;
        }

        _.contract_open_key = contract_open_key;
        if(move_step) {
            _.step = 1;
            this.disconnect = false
            this.socket = socketIOClient(config.HOST)
            this.socket.on('disconnect', async () => {
                //console.log("disconnect socket")
                this.disconnect = true
                for(let i in [0,0,0,0,0]) {
                    await new Promise(r=>setTimeout(r, 2000))
                    try{
                        let result = this.socket.open();
                        this.socket.removeAllListeners()
                        this.subscribeChannel()
                        this.disconnect = false
                    } catch(err) {
                        continue
                    }
                }
            })
        }
        await this.setState(_)

        if(move_step) {
            await this.onRefresh();
            await this.onChatLoadMore()
            this.subscribeChannel()
        }

        return true;
    }


    isOpenUser = (entity_id, corp_id) => {
        for(let v of this.state.open_users) {
            if(v.l == entity_id+"_"+corp_id) {
                return true;
            }
        }
        return false 
    }

    textPrivilege(privilege) {
        switch(privilege) {
            case 1:
                return translate("signer")
                break;
            case 2:
                return translate("viewer")
                break;
        }
    } 

    onChatLoadMore = async () => {
        if(this.end_chat)
            return false

        let me = select_subject(this.state.infos, [], this.state.entity_id, -1).my_info

        let chats = await this.props.get_chats_public(
            this.state.contract.contract_id, this.state.entity_id,
            this.props.match.params.code, me.user_info.cell_phone_number,
            this.state.page_chat, 30, this.state.last_chat_id)
        if(chats.code == 1) {
            if(chats.payload.length == 0) {
                this.end_chat = true
                return false
            }
            let all_chats = [...chats.payload, ...this.state.chat_list]
            all_chats = all_chats.sort( (a, b) => a.chat_id - b.chat_id )
            

            let _ = {
                chat_list:all_chats,
                page_chat:this.state.page_chat + 1,
            }
            if(this.state.last_chat_id == 0 && all_chats.length > 0) _.last_chat_id = all_chats[all_chats.length - 1].chat_id
            await this.setState(_);
            return true
        }
        return false
    }

    onReceiveChat = async (chat) => {
        let all_chats = [...this.state.chat_list, chat]
        all_chats = all_chats.sort( (a, b) => a.chat_id - b.chat_id )
        await this.setState({chat_list:all_chats})
        this.state.scrollBottom && this.state.scrollBottom()
    }


    text_status(v) {
        switch(v.privilege) {
            case 1:
                return v.signature ? translate("sign_all") : translate("status_1")
            case 2:
                return translate("viewer")
        }
    }

    onClickPreview = () => {
        let savePdfOption = {
            margin:0,
            filename:'계약서.pdf',
            image:{ type: 'jpeg', quality: 0.98 },
            jsPDF:{ unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:{ mode: ['avoid-all'] }
        }
        //html2pdf().set(savePdfOption).from(document.getElementsByClassName('fr-view')[0]).save()
        //window.html2Doc(document.getElementsByClassName('fr-view')[0], `[계약서] ${this.state.contract.name}`)

        if(!this.state.model || this.state.model == "") {
            return alert(translate("please_write_content"))
        }

        window.openModal("PreviewContract",{
            contract:this.state.contract,
            infos: this.state.infos,
            model: this.state.model,
        })

        /*history.push({pathname:"/preview-contract", state:{
            contract:this.state.contract,
            infos:this.state.infos,
        }})*/
    }

    isCanEdit = (corp_id, account_id) => {
        if(this.state.contract.can_edit_corp_id == corp_id && account_id == this.state.contract.can_edit_account_id) {
            return true;
        }
        return false;
    }


    saveSelection = () => {
        let sel;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                return sel.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    }


    restoreSelection = (range) => {
        if (range) {
            let sel;
            if (window.getSelection) {
                sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && range.select) {
                range.select();
            }
        }
    }


    onAddEditorSign = async (user, e) => {
        /*e.stopPropagation();
        e.preventDefault();*/

        let selRange = this.saveSelection()
        this.restoreSelection(selRange)
        this.editor.events.focus(true);

        this.editor.html.insert(`<span class="t-sign corp_${user.corp_id} entity_${user.entity_id}">${translate("sign_user", [user.user_info.username])}</span> `)

        this.editor.undo.saveStep();
    }


    onClickContractSave = async () => {
        let model = this.state.model

        if(!!this.state.contract && !!this.state.contract.html && this.state.contract.html == this.state.model)
            return;

        let me = select_subject(this.state.infos, [], this.state.entity_id, -1).my_info
        if(me == null)
            return;

        let r = await this.props.update_contract_model_public(this.state.contract.contract_id, 
            this.state.entity_id, this.props.match.params.code, me.user_info.cell_phone_number, 
            model, this.state.contract.the_key);

        if(r.code == 1) {
            this.setState({
                contract_modify_status:translate("last_modify_contract_save") + " " + moment().format("YYYY-MM-DD HH:mm:ss")
            })
        } else if(r.code == -9) {
            alert(translate("you_dont_update_already_complete_contract"))
        }
    }

    onClickMoveEditPrivilege = async () => {

        if((this.state.contract.html || "") != this.state.model)
            if(window._confirm(translate("you_have_modify_content_save_and_pass_modify_verification")))
                await this.onClickContractSave();
            else
                return;

        window.openModal("MoveCanEditAccount",{
            user_infos: this.state.infos,
            my_account_id: this.state.entity_id,
            my_corp_id: -1,
            onConfirm : async (user)=>{

                let can_edit_corp_id = 0
                if(user.corp_id == -1)
                    can_edit_corp_id = -1;

                let me = select_subject(this.state.infos, [], this.state.entity_id, -1).my_info
                if(me == null)
                    return;

                await window.showIndicator()
                let result = await this.props.move_contract_can_edit_account_id_public(
                    this.state.contract.contract_id, this.state.entity_id, 
                    this.props.match.params.code, me.user_info.cell_phone_number, can_edit_corp_id, user.entity_id, user.sub)
                //await this.onRefresh()
                await window.hideIndicator()
            }
        })
    }

    onToggleUser = (entity_id, corp_id, force_open) => {
        let _ = [...this.state.open_users]
        
        let checkFlag = false
        for(let i in _) {
            let v = _[i]
            if(v.l == entity_id+"_"+corp_id) {
                checkFlag = true;
                if(!force_open) _.splice(i, 1)
            }
        }

        if(!checkFlag)
            _.push({l:entity_id+"_"+corp_id})

        this.setState({
            open_users:_
        })
    }


    onClickRegisterSign = async () => {
        if( (this.state.contract.html || "") != this.state.model)
            return alert(translate("if_modify_content_not_sign"))

        if( this.state.contract.html == null || this.state.contract.html == "") {
            return alert(translate("if_no_model_you_dont_sign"))
        }

        /*let exist_ticket = (await this.props.check_ticket_count()).payload
        if(!exist_ticket)
            return alert(translate("no_ticket_please_charge"))*/

        let me = select_subject(this.state.infos, [], this.state.entity_id, -1).my_info
        if(me == null)
            return;

        let signature_data = await new Promise(resolve=>window.openModal("DrawSign",{
            onFinish : async (signature)=>{
                /*if(this.props.user_info.account_id == this.state.contract.payer_account_id) {
                    let exist_ticket = (await this.props.check_ticket_count()).payload
                    if(!exist_ticket) {
                        alert(translate("no_ticket_please_charge"))
                        resolve(false)
                    }
                }*/
                resolve(signature)
                return true;
            }
        }));

        if(!signature_data) return;

        /*if( this.props.user_info.account_id == this.state.contract.payer_account_id && 
            (await window.confirm(translate("ticket_use_notify"), translate("ticket_use_notify_desc"))) == false )
            return;*/

        if(!me.user_info.cell_phone_number) return;

        let phone_resp = await this.props.request_phone_verification_code(me.user_info.cell_phone_number)
        if(phone_resp.code != 1) {
            return alert(translate("send_code_error_occured"))
        }

        let certificate_number = await new Promise(resolve => {
            window.openModal("AddCommonModal", {
                icon:"far fa-sms",
                title:translate("confirm_sign_sms_verify_title"),
                subTitle:translate("confirm_sign_sms_verify_desc"),
                placeholder:translate("confirm_sign_sms_verify_placeholder"),
                confirmText:translate("confirm"),
                cancelable:true,
                onConfirm: async (certificate_number) => {
                    resolve(certificate_number)
                    return true;
                },
                onCancel: async () => {
                    resolve(false)
                },
            })
        });

        if(!certificate_number) return;

        let contract_body = createContractHtml(this.state.contract, this.state.infos).exclude_sign_body

        await window.showIndicator()
        let email_list = this.state.infos.filter(e=>window.email_regex.test(e.sub)).map(e=>e.sub)
        let r = await this.props.update_contract_sign_public(
            this.state.contract.contract_id, this.state.entity_id, 
            signature_data, this.state.contract.the_key, email_list, 
            sha256(contract_body), me.user_info.cell_phone_number, certificate_number, true);
        await window.hideIndicator()
        if(r.code == -9) {
            return alert(translate("you_dont_update_complete_contract_sign"));
        } /*else if(r.code == -11) {
            return alert(tranlate("no_ticket_no_sign_please_charge"))
        } else if(r.code == -12) {
            let no_ticket_users = r.no_ticket_users.map(e => this.state.infos.find(ee=>e.entity_id == ee.entity_id && e.corp_id == ee.corp_id))
            return alert(translate("i_have_ticket_but_other_no_ticket", [no_ticket_users.map(e=>e.user_info.username).join(", ")]))
        } */else if(r.code == -19) {
            return alert(translate("payer_do_not_have_ticket"));
        } else if(r.code == -17) {
            return alert(translate("fail_sign_sms"))
        }
        alert(translate("complete_sign_register"))
        this.blockFlag = true
        await this.setState({step:2})
    }

    render_info() {
        switch(this.state.selected_menu) {
            case 0:
                return this.render_sign()
            case 1:
                return this.render_chat()
        }
    }

    render_sign() {
        let contract = this.state.contract;
        let user_infos = this.state.infos;

        let corp_id = -1
        let meOrGroup = select_subject(user_infos, [], this.state.entity_id, corp_id).my_info

        let username = "";
        if(!!meOrGroup.user_info.username) {
            if(meOrGroup.user_info.user_type == -1)
                username = `(${translate("not_regist_user")}) `
            username += meOrGroup.user_info.username
        }
        else
            username = meOrGroup.user_info.title;

        return <div className="bottom signs">
            <div className="title">{translate("count_curr_total_person", [user_infos.filter(e=>e.is_exclude == 0).length])}</div>
            <div className="user-container me">
                <div className="user" onClick={this.onToggleUser.bind(this, meOrGroup.entity_id, meOrGroup.corp_id, false)}>
                    <i className="icon fas fa-user-edit"></i>
                    <div className="user-info">
                        <div className="name">{username}<span>{this.text_status(meOrGroup)}</span></div>
                        <div className="email">{meOrGroup.user_info.email ? meOrGroup.user_info.email : meOrGroup.user_info.company_name}</div>
                    </div>
                    {this.isOpenUser(meOrGroup.entity_id, meOrGroup.corp_id) ? <i className="arrow fas fa-caret-up"></i> : <i className="arrow fas fa-caret-down"></i>}
                </div>
                {this.isOpenUser(meOrGroup.entity_id, meOrGroup.corp_id) ? <div className="user-detail">
                    <div className="text-place">
                        <div className="title">{translate("role")}</div>
                        <div className="desc">{this.textPrivilege(meOrGroup.privilege)}</div>
                    </div>
                    {(()=> {
                        let user_type = meOrGroup.user_info.user_type || 0

                        if( meOrGroup.privilege != 1 ) return;

                        let divs = []
                        if(user_type == -1) {
                            divs.push(<div className="text-place" key={"cellphone_number"+meOrGroup.entity_id}>
                                <div className="title">{translate("cellphone_number")}</div>
                                <div className="desc">{meOrGroup.user_info.cell_phone_number}</div>
                            </div>)
                            divs.push(<div className="text-place" key={"email"+meOrGroup.entity_id}>
                                <div className="title">{translate("email")}</div>
                                <div className="desc">{meOrGroup.user_info.email}</div>
                            </div>)
                        } else if(user_type == 0) {
                            for(let v of contract.necessary_info.individual) {
                                divs.push(<div className="text-place" key={v}>
                                    <div className="title">{v}</div>
                                    <div className="desc">{meOrGroup.sign_info ? meOrGroup.sign_info["#"+v] || translate("unregistered") : translate("unregistered")}</div>
                                </div>)
                            }
                        } else {
                            for(let v of contract.necessary_info.corporation) {
                                divs.push(<div className="text-place" key={v}>
                                    <div className="title">{v}</div>
                                    <div className="desc">{meOrGroup.sign_info ? meOrGroup.sign_info["#"+v] || translate("unregistered") : translate("unregistered")}</div>
                                </div>)
                            }
                        }
                        return divs
                    })()}
                    { meOrGroup.privilege == 1 ? <div className="text-place">
                        <div className="title">{translate("sign")}</div>
                        <div className="desc">
                            {meOrGroup.signature ? <img src={meOrGroup.signature}/> : translate("before_sign")}
                        </div>
                    </div> : null }

                    { /*(meOrGroup.privilege == 1 && this.state.contract.status != 2) ? <div className="modify-button" onClick={this.onToggleRegisterSignForm.bind(this, false)}> {translate("sign_info_modify")} </div> : null*/ }
                </div> : null}
            </div>
            {user_infos.map( (e, k) => {
                let info = e
                if(e.user_info.user_type == 0 || e.user_info.user_type == 1) {
                    info.name = e.user_info.username;
                    info.sub = e.user_info.email;
                } else if(e.user_info.user_type == -1) {
                    info.name = `(${translate("not_regist_user")}) ${e.user_info.username}`
                    info.sub = e.user_info.email
                } else {
                    info.name = e.user_info.title
                    info.sub = e.user_info.company_name
                }

                if(e == meOrGroup)
                    return null

                /*if(info.user_info.user_type == 2) 
                    return null*/

                return <div className="user-container" key={e.entity_id+"_"+e.corp_id}>
                    <div className="user" onClick={this.onToggleUser.bind(this, e.entity_id, e.corp_id, false)}>
                        <div className="user-info">
                            <div className="name">{info.name}<span>{this.text_status(e)}</span></div>
                            <div className="email">{info.sub}</div>
                        </div>
                        {this.isOpenUser(e.entity_id, e.corp_id) ? <i className="arrow fas fa-caret-up"></i> : <i className="arrow fas fa-caret-down"></i>}
                    </div>
                    {this.isOpenUser(e.entity_id, e.corp_id) ? <div className="user-detail">
                        <div className="text-place">
                            <div className="title">{translate("role")}</div>
                            <div className="desc">{this.textPrivilege(e.privilege)}</div>
                        </div>
                        {(()=> {
                            let user_type = e.user_info.user_type || 0

                            if(e.privilege != 1)
                                return

                            let divs = []
                            if(user_type == -1) {
                                divs.push(<div className="text-place" key={"cellphone_number"+e.entity_id}>
                                    <div className="title">{translate("cellphone_number")}</div>
                                    <div className="desc">{e.user_info.cell_phone_number}</div>
                                </div>)
                                divs.push(<div className="text-place" key={"email"+e.entity_id}>
                                    <div className="title">{translate("email")}</div>
                                    <div className="desc">{e.user_info.email}</div>
                                </div>)
                            } else if(user_type == 0) {
                                for(let v of contract.necessary_info.individual) {
                                    divs.push(<div className="text-place" key={v}>
                                        <div className="title">{v}</div>
                                        <div className="desc">{e.sign_info ? e.sign_info["#"+v] || translate("unregistered") : translate("unregistered")}</div>
                                    </div>)
                                }
                            } else if(user_type == 1){
                                for(let v of contract.necessary_info.corporation) {
                                    divs.push(<div className="text-place" key={v}>
                                        <div className="title">{v}</div>
                                        <div className="desc">{e.sign_info ? e.sign_info["#"+v] || translate("unregistered") : translate("unregistered")}</div>
                                    </div>)
                                }
                            }
                            return divs
                        })()}
                        { e.privilege == 1 ? <div className="text-place">
                            <div className="title">{translate("sign")}</div>
                            <div className="desc">
                                {e.signature != null ? <img src={e.signature}/> : translate("before_sign")}
                            </div>
                        </div> : null }
                    </div> : null}
                </div>
            })}
        </div>
    }

    render_chat() {
        let user_info = {account_id:this.state.entity_id, corp_id:-1}
        return <div className="bottom chat">
            <Chatting 
                contract={this.state.contract}
                infos={this.state.infos}
                user_info={user_info}
                groups={this.state.groups}
                chat_list={this.state.chat_list}
                onSend={null}
                onLoadMore={this.onChatLoadMore}
                isSendable={this.state.contract.status != 2}
                chatType={"contract"}
                isSendable={false}
                initialize={(scrollBottom) => {
                    this.setState({scrollBottom})
                }}
            />
        </div>
    }

    render_main() {
        if(!this.state.contract)
            return <div></div>

        let can_edit_name
        for(let v of this.state.infos) {
            if(this.state.contract.can_edit_corp_id == v.corp_id && this.state.contract.can_edit_account_id == v.entity_id) {
                can_edit_name = v.user_info.username
            }
        }
        let corp_id = -1
        let meOrGroup = select_subject(this.state.infos, [], this.state.entity_id, corp_id).my_info

        return <div className="public-sign-page upsert-page">
            <div className="header-page">
                <div className="header">
                    <div className="left-icon">
                        &nbsp;
                    </div>
                    <div className="title">{this.state.contract.name}</div>
                </div>
                <div className="container">
                    <div className="editor">
                        <div className="title">
                            <span> <i className="fas fa-keyboard"></i> &nbsp;{translate("web_editor_mode")} </span>
                            <span className="modify-status">{this.state.contract_modify_status}</span>
                        </div>
                        <FroalaEditor
                            tag='textarea'
                            config={this.config}
                            model={this.state.model}
                            onModelChange={(model) => this.setState({model, contract_modify_status:translate("contract_modify")})} />
                        { this.state.contract.status < 2 ? <div className="can-edit-text">
                            <div>{translate("now_edit_privilege_who", [can_edit_name])}</div>
                        </div> : null }
                        { this.state.contract.status < 2 && this.state.contract.can_edit_account_id == this.state.entity_id ? <div className="floating">
                            <div>
                                <div className="circle" unselectable="on" onClick={()=>this.setState({toolbar_open:!this.state.toolbar_open})}>
                                    <i className={`far fa-plus ${this.state.toolbar_open ? "spin-start-anim" : "spin-end-anim"}`}></i>
                                </div>
                            </div>
                        </div>: null }

                        { this.state.contract.status < 2 && this.state.contract.can_edit_account_id == this.state.entity_id ? <div className={`tool-bar ${this.state.toolbar_open ? "fade-start-anim" : "fade-end-anim"}`}>
                            <div>
                                <div className="sign-title">{translate("sign_place_add_title")}</div>
                                {this.state.infos.filter( e=>e.privilege == 1 ).map( (e, k) => {
                                    return <div className="but" key={k} unselectable="on" onClick={this.onAddEditorSign.bind(this, e)}>
                                        {translate("sign_user", [e.user_info.username])}
                                    </div>
                                })}
                            </div>
                        </div> : null }
                    </div>
                    {!this.state.sign_mode ? <div className="info">
                        <div className="top">
                            <div className={"menu" + (this.state.selected_menu == 0 ? " enable-menu" : "")} onClick={e=>this.setState({selected_menu:0})}>
                                <i className="far fa-signature"></i>
                                <div className="text">{translate("sign_info")}</div>
                            </div>
                            <div className={"menu" + (this.state.selected_menu == 1 ? " enable-menu" : "")} onClick={e=>this.setState({selected_menu:1})}>
                                <i className="far fa-comments"></i>
                                <div className="text">{translate("conversation")}</div>
                            </div>
                        </div>
                        {this.render_info()}
                    </div> : <div className="info">
                        {/*<div className="top">
                            <div className="menu">
                                <i className="far fa-signature"></i>
                                <div className="text">{translate("sign_info_register")}</div>
                            </div>
                        </div>
                        {this.render_sign_form()}*/}
                    </div>}
                </div>
            </div>
            <div className="bottom-container">
                <div className="left">
                    <div className="but" onClick={this.onClickPreview}>
                        <i className="fal fa-eye"></i>
                        {translate("contract_preview")}
                    </div>
                    { ( this.state.contract.status < 2 && this.isCanEdit(-1, this.state.entity_id)) ? [
                        <div className="but" onClick={this.onClickMoveEditPrivilege} key={"edit_privilege"}>
                            <i className="far fa-arrow-to-right"></i>
                            {translate("move_edit_privilege")}
                        </div>, <div className="but" onClick={this.onClickContractSave} key={"contract_save"}>
                            <i className="far fa-save"></i>
                            {translate("modify_content_save")}
                        </div>]
                    : null }
                </div>
                {(()=>{
                    if(meOrGroup.privilege == 2 || this.state.contract.status == 2) {
                        return <div className="sign" onClick={(e)=>window.close()}>
                            {translate("go_back")}
                        </div>
                    }

                    return this.state.sign_mode ? <div className="sign" onClick={this.onToggleRegisterSignForm.bind(this, false)}>
                        {translate("edit_mode")}
                    </div> : <div className="sign" onClick={this.onClickRegisterSign}>
                        {meOrGroup.signature ? translate("resign") : translate("go_sign")}
                    </div>
                })()}
            </div>
        </div>
    }

    render_main_mobile() {
        if(!this.state.contract)
            return <div></div>

        let can_edit_name
        for(let v of this.state.infos) {
            if(this.state.contract.can_edit_corp_id == v.corp_id && this.state.contract.can_edit_account_id == v.entity_id) {
                can_edit_name = v.user_info.username
            }
        }
        let corp_id = -1
        let meOrGroup = select_subject(this.state.infos, [], this.state.entity_id, corp_id).my_info

        let creator;
        for(let v of this.state.infos) {
            if(v.corp_id == 0 && v.entity_id == this.state.contract.account_id)
                creator = v;
        }

        let creator_name = creator ? creator.user_info.username : translate("unknown")
        if(creator && creator.is_exclude == 1) {
            creator_name = translate("byebye_template", [creator.user_info.username])
        }

        return <div className="public-sign-page upsert-page">
            <div className="header-page">
                <div className="mobile-header">
                    <div className="multi-title">
                        <div className="title">{this.state.contract.name}</div>
                        <div className="sub-title">{`${translate("creator")} : ${creator_name} (${creator.user_info.email})`}</div>
                    </div>
                </div>
                <div className="container">
                    <div className="editor">
                        <FroalaEditor
                            tag='textarea'
                            config={this.config}
                            model={this.state.model}
                            onModelChange={(model) => this.setState({model, contract_modify_status:translate("contract_modify")})} />
                        { this.state.contract.status < 2 ? <div className="can-edit-text">
                            <div>{translate("now_edit_privilege_who", [can_edit_name])}</div>
                        </div> : null }
                        { this.state.contract.status < 2 && this.state.contract.can_edit_account_id == this.state.entity_id ? <div className="floating">
                            <div>
                                <div className="circle" unselectable="on" onClick={()=>this.setState({toolbar_open:!this.state.toolbar_open})}>
                                    <i className={`far fa-plus ${this.state.toolbar_open ? "spin-start-anim" : "spin-end-anim"}`}></i>
                                </div>
                            </div>
                        </div>: null }

                        { this.state.contract.status < 2 && this.state.contract.can_edit_account_id == this.state.entity_id ? <div className={`tool-bar ${this.state.toolbar_open ? "fade-start-anim" : "fade-end-anim"}`}>
                            <div>
                                <div className="sign-title">{translate("sign_place_add_title")}</div>
                                {this.state.infos.filter( e=>e.privilege == 1 ).map( (e, k) => {
                                    return <div className="but" key={k} unselectable="on" onClick={this.onAddEditorSign.bind(this, e)}>
                                        {translate("sign_user", [e.user_info.username])}
                                    </div>
                                })}
                            </div>
                        </div> : null }
                    </div>
                    {/*!this.state.sign_mode ? <div className="info">
                        <div className="top">
                            <div className={"menu" + (this.state.selected_menu == 0 ? " enable-menu" : "")} onClick={e=>this.setState({selected_menu:0})}>
                                <i className="far fa-signature"></i>
                                <div className="text">{translate("sign_info")}</div>
                            </div>
                            <div className={"menu" + (this.state.selected_menu == 1 ? " enable-menu" : "")} onClick={e=>this.setState({selected_menu:1})}>
                                <i className="far fa-comments"></i>
                                <div className="text">{translate("conversation")}</div>
                            </div>
                        </div>
                        {this.render_info()}
                    </div>*/}
                </div>
            </div>
            <div className="bottom-container">
                {(()=>{
                    if(meOrGroup.privilege == 2 || this.state.contract.status == 2) {
                        return <div className="mobile-sign" onClick={(e)=>window.close()}>
                            {translate("go_back")}
                        </div>
                    }

                    return this.state.sign_mode ? <div className="mobile-sign" onClick={this.onToggleRegisterSignForm.bind(this, false)}>
                        {translate("edit_mode")}
                    </div> : <div className="mobile-sign" onClick={this.onClickRegisterSign}>
                        {meOrGroup.signature ? translate("resign") : translate("go_sign")}
                    </div>
                })()}
            </div>
        </div>
    }

    render_complete() {
        return <div className="public-sign-page-step-2">
            <div className="header-page">
                <div className="header">
                    <div className="left-logo">
                        <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
                    </div>
                    <div className="title">{translate("sign_all")}</div>
                </div>

                <div className="container">
                    <i className="icon fal fa-check-circle"></i>
                    <div className="title">{translate("sign_all")}</div>
                    <div className="desc">{translate("no_register_sign_step_2_desc", [this.state.contract.name])}</div>
                </div>
            </div>
            <Footer />
        </div>
    }

    render_complete_mobile() {
        return this.render_complete();
    }

    render() {
        if(this.state.step == 0) {
            return <div></div>
        } else if(this.state.step == 1) {
            if(window.isMobile())
                return this.render_main_mobile();
            else
                return this.render_main();
        } else if(this.state.step == 2) {
            if(window.isMobile())
                return this.render_complete_mobile();
            else
                return this.render_complete();
        }
    }
}
