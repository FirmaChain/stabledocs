import React from "react"
import ReactDOM from "react-dom"
import ReactDOMServer from 'react-dom/server';
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

import moment from 'moment'

import {
    add_template,
    update_template,
    folder_list_template,
    fetch_user_info,
    add_folder_template,
    get_template,
    get_contract,
    get_group_info,
    update_contract_model,
    update_contract_sign,
    update_contract_sign_info,
    move_contract_can_edit_account_id,
    get_chats,
    send_chat,
    check_ticket_count,
    select_subject,
    createContractHtml,

} from "../../common/actions"
import CheckBox2 from "./checkbox2"

let mapStateToProps = (state)=>{
	return {
        user_info:state.user.info,
        template_folders:state.template.folders
	}
}

let mapDispatchToProps = {
    add_template,
    update_template,
    folder_list_template,
    fetch_user_info,
    add_folder_template,
    get_template,
    get_contract,
    get_group_info,
    update_contract_model,
    update_contract_sign,
    update_contract_sign_info,
    move_contract_can_edit_account_id,
    get_chats,
    send_chat,
    check_ticket_count,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
        super();

        /*$.FroalaEditor.DefineIcon('sign', {NAME: 'stamp'});
        $.FroalaEditor.RegisterCommand('sign', {
            title: 'sign',
            focus: true,
            undo: true,
            refreshAfterCallback: true,
            options:{
                v1: '갑',
                v2: '을',
            },
            callback: (cmd, val) => {
                console.log(cmd, val);
                let sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    let range = sel.getRangeAt(0);
                    range.deleteContents();
                    let sign_object = document.createElement("div");
                    sign_object.className = 't-sign';

                    let text = document.createTextNode("갑의 서명 영역");
                    sign_object.appendChild(text);

                    console.log(sign_object)
                    range.insertNode( sign_object );
                }
                console.log(sel);
         
            },
            refresh: ($btn) => {
                //console.log ('do refresh');
            },
            refreshOnShow: ($btn, $dropdown) => {
                //console.log ('do refresh when show');
            }
        })*/
        $.FroalaEditor.DefineIcon('check', {NAME: 'check-square'});
        $.FroalaEditor.RegisterCommand('check', {
            title: 'CheckBox',
            focus: true,
            undo: true,
            refreshAfterCallback: true,
            callback: () => {
                let id = 
                this.editor.html.insert(ReactDOMServer.renderToStaticMarkup(<div>
                    <input className="fr-checkbox" type="checkbox"/>
                </div>));
                this.editor.undo.saveStep();
            }
        });

        this.blockFlag = false;
        this.disconnect = false;
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
                }catch(err) {
                    continue
                }
            }
        })
        //reconect

        this.config = {
            ...window.CONST.FROALA,

            events : {
                'froalaEditor.initialized' : (e, editor) => {
                    this.editor = editor;
                    if( !!this.state.contract && !this.isCanEdit(window.CONST.DUMMY_CORP_ID, this.props.user_info.account_id) ) {
                        this.editor.edit.off()
                    } else {
                        this.editor.edit.on()
                    }

                    if(!!this.editor && !!this.state.contract && this.state.contract.status == 2) {
                        this.editor.edit.off()
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
                'froalaEditor.focus' : async (e, editor) => {
                    console.log("focus", e)
                    //this.range = this.saveSelection();
                },
                'froalaEditor.touchstart' : async (e, editor, touchstartEvent) => {
                    setTimeout(v=>{this.range = this.saveSelection()}, 500);
                },
                'froalaEditor.touchend' : async (e, editor, touchendEvent) => {
                    setTimeout(v=>{this.range = this.saveSelection()}, 500);
                    this.jqueryInputEvent();
                },
                'froalaEditor.mousedown' : async (e, editor, mousedownEvent) => {
                    setTimeout(v=>{this.range = this.saveSelection()}, 500);
                },
                'froalaEditor.mouseup' : async (e, editor, mouseupEvent) => {
                    setTimeout(v=>{this.range = this.saveSelection()}, 500);
                    this.jqueryInputEvent();
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
        }
    }

    componentDidMount() {
        setTimeout(async()=>{
            await window.showIndicator(translate("loding_contract_detail_data"))
            await this.props.fetch_user_info()
            await this.onRefresh()
            this.subscribeChannel()
            await this.onChatLoadMore()
            await window.hideIndicator()
        })

        history.block( (targetLocation) => {
            if(this.blockFlag)
                return true
            if(this.state.contract && this.state.contract.html == this.state.model)
                return true
            if(!this.state.contract)
                return true
            
            let out_flag = window._confirm(translate("are_u_stop_contract_modify_work_and_now_page_out"))
            if(out_flag)
                history.block( () => true )
            return out_flag
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
        let contract_id = this.props.match.params.contract_id || window.CONST.PERSONAL_CORP_ID
        let groups = [];
        let _state = {}
        if(this.props.user_info.account_type != 0) {
            groups = await this.props.get_group_info(0)
            _state.groups = groups
        }

        let contract = await this.props.get_contract(contract_id, this.props.user_info, groups)

        if(!contract) {
            alert(translate("contract_is_encrypt_so_dont_enter"))
            return history.goBack()
        }
        
        if(contract.payload && contract.payload.contract) {
            let sign_info = {}
            let me = select_subject(contract.payload.infos, groups, this.props.user_info.account_id, -1).my_info
            if(me) {
                sign_info = me.sign_info || {};
                this.onToggleUser(me.entity_id, me.corp_id, true)
            }

            _state = {
                ..._state,
                ...contract.payload,
                sign_info,
            }

            let model = contract.payload.contract.html != null ? contract.payload.contract.html : "";
            if(!this.state.model) {
                _state.model = model;
            }
            else if(!!this.state.model && !!contract.payload.contract.html && contract.payload.contract.html != this.state.model && this.props.user_info.account_id != contract.payload.contract.can_edit_account_id) {
                _state.model = model;
            }
            

            await this.setState(_state)

            if(me && me.sign_info == null && me.privilege == 1)
                await this.onClickRegiserSignInfo(true);

            if( !!this.editor && !!contract.payload && !!contract.payload.contract && contract.payload.contract.can_edit_corp_id != window.CONST.DUMMY_CORP_ID || this.props.user_info.account_id != contract.payload.contract.can_edit_account_id ) {
                this.editor.edit.off()
            } else {
                !!this.editor && this.editor.edit.on()
            }

            if( !!this.editor && !!contract.payload && !!contract.payload.contract && contract.payload.contract.status == 2) {
                this.editor.edit.off()
            }
        } else {
            alert(translate("not_exist_contract"))
            history.goBack()
        }
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
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
        return false
    }

    onClickContractSave = async () => {
        let model = this.state.model;
        if(!!this.state.contract && !!this.state.contract.html && this.state.contract.html == this.state.model)
            return false;
        //encrypt model

        let r = await this.props.update_contract_model(this.state.contract.contract_id, model, this.state.contract.the_key)
        if(r.code == 1) {
            this.setState({
                contract_modify_status:translate("last_modify_contract_save") + " " + moment().format("YYYY-MM-DD HH:mm:ss")
            })
        } else if(r.code == -9) {
            alert(translate("you_dont_update_already_complete_contract"))
        }
        return true;
    }

    onClickMoveEditPrivilege = async () => {

        if((this.state.contract.html || "") != this.state.model) {
            if(window._confirm(translate("you_have_modify_content_save_and_pass_modify_verification"))) {
                let result = await this.onClickContractSave();
            }
            else
                return;
        }

        window.openModal("MoveCanEditAccount",{
            user_infos: this.state.infos,
            my_account_id: this.props.user_info.account_id,
            my_corp_id: window.CONST.DUMMY_CORP_ID,
            onConfirm : async (user)=>{
                let can_edit_corp_id = 0
                if(user.corp_id == -1)
                    can_edit_corp_id = -1;

                await window.showIndicator()
                console.log("user", user)
                console.log("this.state.infos", this.state.infos)
                let result = await this.props.move_contract_can_edit_account_id(this.state.contract.contract_id, can_edit_corp_id, user.entity_id, user.user_info.email)
                //await this.onRefresh()
                await window.hideIndicator()
            }
        })
    }

    onToggleRegisterSignForm = async (force_close = false) => {
        if(force_close)
            this.state.sign_mode = true;

        if(!!this.editor && !!this.editor.toolbar)
            this.state.sign_mode ? this.editor.toolbar.show() : this.editor.toolbar.hide()

        let wrapper = document.getElementsByClassName("fr-wrapper")[0]
        this.state.sign_mode ? 
            wrapper.setAttribute('style', `max-height: 100%; overflow: auto; height: 100%;`) :
            wrapper.setAttribute('style', `max-height: 100%; overflow: auto; height: 100%; max-height: calc(100% - 34px) !important`);

        if( !!this.state.contract && this.isCanEdit(window.CONST.DUMMY_CORP_ID, this.props.user_info.account_id) ) {
            this.state.sign_mode ? this.editor.edit.on() : this.editor.edit.off()
        }

        this.setState({
            sign_mode: !this.state.sign_mode
        })
    }

    onClickRegiserSignInfo = async (force_close = false) => {
        if((this.state.contract.html || "") != this.state.model)
            if(window._confirm(translate("Are_U_have_modify_content_save_and_register_sign_info")))
                await this.onClickContractSave()
            else
                return;

        let sign_info = Object.assign(this.state.sign_info, {}) || {}
        
        let sign_info_list
        if(this.props.user_info.account_type == 0) {
            sign_info_list = this.state.contract.necessary_info.individual
        } else {
            sign_info_list = this.state.contract.necessary_info.corporation
        }

        let default_arr = this.create_default_sign_info()

        let _ = {...sign_info}
        sign_info_list.map( async (e, k) => {
            for(let v of default_arr) {
                let textArr = translate(v.label, [], true)
                for(let vv of textArr) {
                    if( (_["#"+vv] == null || _["#"+vv] == "") && e == vv && v.value != "") {
                        _["#"+vv] = v.value
                    }
                }
            }
        })
        sign_info = Object.assign(_, {}) || {}

        for(let v of sign_info_list) {
            if(!sign_info["#"+v] || sign_info["#"+v].trim() == "") {
                return alert(translate("input_all_sign_info"))
            } else {
                sign_info["#"+v] = sign_info["#"+v].trim()
            }
        }

        await window.showIndicator()
        let r = await this.props.update_contract_sign_info(this.state.contract.contract_id, sign_info, this.state.contract.the_key)
        if(r.code == -9) alert(translate("you_dont_update_complete_contract_sign_info"));
        if(force_close) await this.onRefresh();
        //await this.onRefresh()
        this.onToggleRegisterSignForm(force_close)
        await window.hideIndicator()
    }

    onModelChange = async (model) => {

        for(let v of this.state.infos) {
            let regex = new RegExp(`<\\s*span\\s*class="t-sign corp_${v.corp_id} entity_${v.entity_id}"[^>]*>(.*?)<\\s*\/\\s*span>`, "gi")
            let all_signs = model.match(regex)
            if(all_signs) {
                for(let sign of all_signs) {
                    let result = regex.exec(sign);
                    let all_name = translate("sign_user", [v.user_info.username], true)

                    if(result && result.length > 1) {
                        let remove_flag = true;
                        for(let w of all_name) {
                            if(result[1] == w) {
                                remove_flag = false;
                            }
                        }

                        if(remove_flag) {
                            model = model.replace(new RegExp(`${result[0]}`, "gi"), "")
                        }
                    }
                }
            }
        }
        setTimeout(e=>{this.range = this.saveSelection()}, 500);

        this.setState({
            model,
            contract_modify_status:translate("contract_modify")
        })
    }

    onClickRegisterSign = async () => {
        if( (this.state.contract.html || "") != this.state.model) {
            return alert(translate("if_modify_content_not_sign"))
        }

        if( this.state.contract.html == null || this.state.contract.html == "") {
            return alert(translate("if_no_model_you_dont_sign"))
        }

        /*let exist_ticket = (await this.props.check_ticket_count()).payload
        if(!exist_ticket)
            return alert(translate("no_ticket_please_charge"))*/

        let me = select_subject(this.state.infos, [], this.props.user_info.account_id, window.CONST.PERSONAL_CORP_ID).my_info;
        if(me == null)
            return;

        /*let sign_info_list
        if(this.props.user_info.account_type == 0) {
            sign_info_list = this.state.contract.necessary_info.individual
        } else {
            sign_info_list = this.state.contract.necessary_info.corporation
        }

        let sign_info = me.sign_info || {}

        for(let v of sign_info_list) {
            if(!sign_info["#"+v] || sign_info["#"+v] == "") {
                return alert(translate("input_all_sign_info"))
            }
        }*/

        let signature_data = await new Promise(resolve=>window.openModal("DrawSign",{
            onFinish : async (signature)=>{
                if(this.props.user_info.account_id == this.state.contract.payer_account_id) {
                    let exist_ticket = (await this.props.check_ticket_count()).payload
                    if(!exist_ticket) {
                        alert(translate("no_ticket_please_charge"))
                        resolve(false)
                    }
                }
                resolve(signature)
                return true;
            }
        }) );

        if(!signature_data) return;

        if( this.props.user_info.account_id == this.state.contract.payer_account_id && 
            (await window.confirm(translate("ticket_use_notify"), translate("ticket_use_notify_desc"))) == false )
            return;

        let contract_body = createContractHtml(this.state.contract, this.state.infos).exclude_sign_body

        await window.showIndicator()
        let email_list = this.state.infos.filter(e=>window.email_regex.test(e.user_info.email)).map(e=>e.user_info.email)
        let r = await this.props.update_contract_sign(this.state.contract.contract_id, signature_data, this.state.contract.the_key, email_list, sha256(contract_body))
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
        }
        alert(translate("complete_sign_register"))
        this.blockFlag = true
        history.replace(`/e-contract/contract-info/${this.props.match.params.contract_id}`)
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

        let chats = await this.props.get_chats(this.state.contract.contract_id, this.state.page_chat, 30, this.state.last_chat_id)
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

    onClickSendChat = async (text)=>{
        if(this.disconnect) {
            alert(translate("broken_chat_connection_plaese_refresh"))
            return false
        }
        
        if(text.length == 0) {
            alert(translate("input_message"));
            return false
        }

        let corp_id = this.props.user_info.corp_id || window.CONST.PERSONAL_CORP_ID
        let meOrGroup = select_subject(this.state.infos, this.state.groups, this.props.user_info.account_id, corp_id)

        let msg = {
            text
        }

        if(!meOrGroup.isAccount) {
            msg.username = this.props.user_info.username;
            msg.account_id = this.props.user_info.account_id;
        }
        meOrGroup = meOrGroup.my_info

        let result = await this.props.send_chat(this.state.contract.contract_id, meOrGroup.entity_id, meOrGroup.corp_id, JSON.stringify(msg))
        if(result.code == 1) {
            /*let all_chats = [...this.state.chat_list, result.payload]
            all_chats = all_chats.sort( (a, b) => a.chat_id - b.chat_id )
            await this.setState({chat_list:all_chats})*/
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

    saveSelection = () => {
        let sel;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && !!sel.rangeCount) {
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

        //let temp = this.saveSelection()
        /*if(temp != null) this.range = temp;*/
        this.editor.events.focus(true);
        this.restoreSelection(this.range)

        this.editor.html.insert(`<span class="t-sign corp_${user.corp_id} entity_${user.entity_id}">${translate("sign_user", [user.user_info.username])}</span> `)

        this.editor.undo.saveStep();
    }

    render_info() {
        switch(this.state.selected_menu) {
            case 0:
                return this.render_sign()
            case 1:
                return this.render_chat()
        }
    }

    text_status(v) {
        switch(v.privilege) {
            case 1:
                return v.signature ? translate("sign_all") : translate("status_1")
            case 2:
                return translate("viewer")
        }
    }

    create_default_sign_info() {
        return [
            {label:"individual_name", value:this.props.user_info.username || ""},
            {label:"individual_email", value:this.props.user_info.email || ""},
            {label:"individual_address", value:this.props.user_info.useraddress || ""},
            {label:"individual_phone", value:this.props.user_info.userphone || ""},
            {label:"corporation_name", value:this.props.user_info.company_name || ""},
            {label:"corporation_duns", value:this.props.user_info.duns_number || ""},
            {label:"corporation_address", value:this.props.user_info.company_address || ""},
            {label:"corporation_ceo_name", value:this.props.user_info.company_ceo || ""},
        ]
    }

    render_sign_form() {
        let sign_info_list
        if(this.props.user_info.account_type == 0) {
            sign_info_list = this.state.contract.necessary_info.individual
        } else {
            sign_info_list = this.state.contract.necessary_info.corporation
        }

        let default_arr = this.create_default_sign_info()

        return <div className="bottom sign-form">
            {sign_info_list.map( (e, k) => {
                let text
                for(let v of default_arr) {
                    let textArr = translate(v.label, [], true)
                    for(let vv of textArr) {
                        if(e == vv && v.value != "") {
                            let _ = {...this.state.sign_info}
                            _["#"+vv] = v.value
                            text = v.value
                        }
                    }
                }
                return <div className="desc" key={e}>
                    <div className="title">{e}</div>
                    <div className="text-box">
                        <input className="common-textbox"
                            type="text"
                            /*disabled={!!text}*/
                            value={this.state.sign_info["#"+e]}
                            onChange={(ee) => {
                                let _ = {...this.state.sign_info}
                                _["#"+e] = ee.target.value
                                this.setState({sign_info:_})
                            }} />
                    </div>
                </div>
            })}
            <div className="button-save-sign-info" onClick={this.onClickRegiserSignInfo.bind(this, false)}>{translate("sign_info_save")}</div>
        </div>
    }

    render_sign() {
        let contract = this.state.contract;
        let user_infos = this.state.infos;

        let corp_id = this.props.user_info.corp_id || window.CONST.PERSONAL_CORP_ID
        let meOrGroup = select_subject(user_infos, this.state.groups, this.props.user_info.account_id, corp_id).my_info

        return <div className="bottom signs">
            <div className="title">{translate("count_curr_total_person", [user_infos.filter(e=>e.is_exclude == 0).length])}</div>
            <div className="user-container me">
                <div className="user" onClick={this.onToggleUser.bind(this, meOrGroup.entity_id, meOrGroup.corp_id, false)}>
                    <i className="icon fas fa-user-edit"></i>
                    <div className="user-info">
                        <div className="name">{meOrGroup.user_info.username ? meOrGroup.user_info.username : meOrGroup.user_info.title}<span>{this.text_status(meOrGroup)}</span></div>
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
            {user_infos.filter(e=>e.is_exclude == 0).map( (e, k) => {
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
                            } else if(user_type == -1) {
                                for(let v of contract.necessary_info.individual) {
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
        return <div className="bottom chat">
            <Chatting 
                contract={this.state.contract}
                infos={this.state.infos}
                user_info={this.props.user_info}
                groups={this.state.groups}
                chat_list={this.state.chat_list}
                onSend={this.onClickSendChat}
                onLoadMore={this.onChatLoadMore}
                isSendable={this.state.contract.status != 2}
                chatType={"contract"}
                initialize={(scrollBottom) => {
                    this.setState({scrollBottom})
                }}
            />
        </div>
    }

    render_sign_info = () => {
        if(!this.state.infos && !this.state.contract)
            return

        return <div className="sign-info">
            {this.state.infos.map( (e, k) => {
                if(e.privilege != 1)
                    return
                
                return <div className="item" key={k}>
                    <div className="title">{translate("signer_counter", [k+1])}</div>
                    {(()=>{
                        let user_type = e.user_info.user_type || 0

                        let divs = []
                        if(user_type == 0) {
                            for(let v of this.state.contract.necessary_info.individual) {
                                divs.push(<div className="info" key={v}>
                                    <span className="first">{v}</span>&nbsp;:&nbsp;
                                    <span className="desc">{e.sign_info ? e.sign_info["#"+v] || translate("unregistered") : translate("unregistered")}</span>
                                </div>)
                            }
                        } else {
                            for(let v of this.state.contract.necessary_info.corporation) {
                                divs.push(<div className="info" key={v}>
                                    <span className="first">{v}</span>&nbsp;:&nbsp;
                                    <span className="last">{e.sign_info ? e.sign_info["#"+v] || translate("unregistered") : translate("unregistered")}</span>
                                </div>)
                            }
                        }
                        return divs
                    })()}
                    {/*e.sign_info ? Object.entries(e.sign_info).map( (ee, kk) => {
                        let title = ee[0].substring(1, ee[0].length)
                        return <div className="info" key={kk}><span className="first">{title}</span> : <span className="last">{ee[1]}</span></div>
                    }) : <div className="info">{translate("not_yet_register_sign_info")}</div>*/}
                    {e.sign_info ? <div className="signature">
                        {translate("sign")}
                        {e.signature ? <img src={e.signature} /> : null }
                    </div> : null}
                </div>
            })}
        </div>
    }

	render() {
        if(!this.props.user_info || !this.state.contract)
            return <div></div>

        let can_edit_name
        for(let v of this.state.infos) {
            if(this.state.contract.can_edit_corp_id == v.corp_id && this.state.contract.can_edit_account_id == v.entity_id) {
                can_edit_name = v.user_info.username
            }
        }
        let corp_id = this.props.user_info.corp_id || window.CONST.PERSONAL_CORP_ID;
        let meOrGroup = select_subject(this.state.infos, this.state.groups, this.props.user_info.account_id, corp_id).my_info;

        let model = this.state.model;
        if(this.state.contract.status == 2) {
            for(let v of this.state.infos) {
                let regex = new RegExp(`<\\s*span\\s*class="t-sign corp_${v.corp_id} entity_${v.entity_id}"[^>]*>(.*?)<\\s*\/\\s*span>`, "gi")

                if(v.signature)
                    model = model.replace(regex, `<img src="${v.signature}" style="margin-left: 20px;height: 100px;"/>`)
            }
        }

        this.jqueryInputEvent();

        return (<div className="upsert-page upsert-contract-page">
            <div className="header-page">
                <div className="header">
                    <div className="left-icon">
                        <i className="fal fa-times" onClick={()=>history.goBack()}></i>
                    </div>
                    <div className="title">{this.state.contract.name}</div>
                    { !!this.props.user_info ? <Information /> : null }
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
                            model={model}
                            onModelChange={this.onModelChange} />
                        { this.state.contract.status < 2 ? <div className="can-edit-text">
                            <div>{translate("now_edit_privilege_who", [can_edit_name])}</div>
                        </div> : null }
                        { this.state.contract.status < 2 && this.isCanEdit(window.CONST.DUMMY_CORP_ID, this.props.user_info.account_id) ? <div className="floating">
                            <div>
                                <div className="circle" unselectable="on" onClick={()=>this.setState({toolbar_open:!this.state.toolbar_open})}>
                                    <i className={`far fa-plus ${this.state.toolbar_open ? "spin-start-anim" : "spin-end-anim"}`}></i>
                                </div>
                            </div>
                        </div>: null}

                        { this.state.contract.status < 2 && this.isCanEdit(window.CONST.DUMMY_CORP_ID, this.props.user_info.account_id) ? <div className={`tool-bar ${this.state.toolbar_open ? "fade-start-anim" : "fade-end-anim"}`}>
                            <div>
                                <div className="sign-title">{translate("sign_place_add_title")}</div>
                                {this.state.infos.filter( e=>e.privilege == 1 ).map( (e, k) => {
                                    return <div className="but" key={k} unselectable="on" onClick={this.onAddEditorSign.bind(this, e)}>
                                        {translate("sign_user", [e.user_info.username])}
                                    </div>
                                })}
                            </div>
                        </div> : null}
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
                        <div className="top">
                            <div className="menu">
                                <i className="far fa-signature"></i>
                                <div className="text">{translate("sign_info_register")}</div>
                            </div>
                        </div>
                        {this.render_sign_form()}
                    </div>}
                </div>
            </div>
            <div className="bottom-container">
                <div className="left">
                    <div className="but" onClick={this.onClickPreview}>
                        <i className="fal fa-eye"></i>
                        {translate("contract_preview")}
                    </div>
                    { ( this.state.contract.status < 2 && this.isCanEdit(window.CONST.DUMMY_CORP_ID, this.props.user_info.account_id)) ? [
                        <div className="but" onClick={this.onClickMoveEditPrivilege} key={"edit_privilege"}>
                            <i className="far fa-arrow-to-right"></i>
                            {translate("move_edit_privilege")}
                        </div>, <div className="but" onClick={this.onClickContractSave} key={"contract_save"}>
                            <i className="far fa-save"></i>
                            {translate("modify_content_save")}
                        </div>]
                    : null}
                </div>
                {(()=>{
                    if(meOrGroup.privilege == 2 || this.state.contract.status == 2) {
                        return <div className="sign" onClick={(e)=>history.goBack()}>
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
		</div>);
	}
}
