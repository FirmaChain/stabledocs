import React from "react"
import ReactDOM from "react-dom"
import config from "../../../config"

import 'froala-editor/js/froala_editor.pkgd.min.js';
import 'froala-editor/js/languages/ko.js';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

import FroalaEditor from 'react-froala-wysiwyg';
import socketIOClient from 'socket.io-client'
import { sha256 } from 'js-sha256'
 
import { connect } from 'react-redux';
import { Link, Prompt } from 'react-router-dom'
import history from '../history';
import pdfjsLib from "pdfjs-dist"
import translate from "../../common/translate"
import Information from "./information.comp"
import Footer from "./footer.comp"
import Chatting from "./chatting.comp"
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'

import moment from 'moment'

import {
    fetch_user_info,
    get_approval,
    get_approval_chats,
    send_approval_chat,
    update_approval_model,
    add_approval_user,
    get_group_member_all,
    change_order_approval,
    remove_approval_user,
    start_approval,
    confirm_approval,
    reject_approval,
    update_approval_name,
} from "../../common/actions"
import CheckBox2 from "./checkbox2"

let mapStateToProps = (state)=>{
	return {
        user_info:state.user.info,
        template_folders:state.template.folders
	}
}

let mapDispatchToProps = {
    fetch_user_info,
    get_approval,
    get_approval_chats,
    send_approval_chat,
    update_approval_model,
    add_approval_user,
    get_group_member_all,
    change_order_approval,
    remove_approval_user,
    start_approval,
    confirm_approval,
    reject_approval,
    update_approval_name,
}

const reorder =  (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const getItemStyle = (draggableStyle, isDragging) => ({
  // some basic styles to make the items look a bit nicer(아이템을 보기 좋게 만드는 몇 가지 기본 스타일)
  userSelect: 'none',
  // padding: 16,
  // marginBottom: 8,

  // change background colour if dragging(드래깅시 배경색 변경)
  // background: isDragging ? 'lightgreen' : 'grey',

  // styles we need to apply on draggables(드래그에 필요한 스타일 적용)
  ...draggableStyle
});

const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? '#f4f4f4' : 'transparent',
});

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
        super();

        /*$.FroalaEditor.DefineIcon('getPDF', {NAME: 'file-pdf'});
        $.FroalaEditor.RegisterCommand('getPDF', {
            title: 'getPDF',
            focus: true,
            undo: true,
            refreshAfterCallback: true,
            callback: () => {
            }
        })*/
        this.blockFlag = false;
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

                    if( !!this.state.approval && this.state.approval.can_approval_account_id != this.props.user_info.account_id) {
                        this.editor.edit.off();
                    } else {
                        this.editor.edit.on()
                    }


                    if(!!this.editor && !!this.state.approval && this.state.approval.status == 2) {
                        this.editor.edit.off()
                    }
                },
                'froalaEditor.image.inserted' : async (e, editor, $img, response) => {
                    $img[0].src = window.getImageBase64Uri($img[0])
                    return false;
                },
            }
        }

        this.end_chat = false

        this.state = {
            model:"",
            select_folder_id:null,
            selected_menu:0,
            approval_modify_status:"",
            sign_mode:false,
            sign_info:{},
            open_users:[],

            page_chat:0,
            last_chat_id:0,
            chat_list:[],
        }
    }

    componentDidMount() {
        setTimeout(async()=>{
            await window.showIndicator(translate("loding_approval_detail_data"))
            await this.props.fetch_user_info()
            await this.onRefresh()
            this.subscribeChannel()
            await this.onChatLoadMore()
            await window.hideIndicator()
        })

        history.block( (targetLocation) => {
            if(this.blockFlag)
                return true
            if(this.state.approval && this.state.approval.html == this.state.model)
                return true
            if(!this.state.contract)
                return true
            
            let out_flag = window._confirm(translate("are_u_stop_approval_modify_work_and_now_page_out"))
            if(out_flag)
                history.block( () => true )
            return out_flag
        })
    }

    componentWillUnmount() {
        if(this.socket)
            this.socket.disconnect()
    }

    subscribeChannel() {
        if(!this.state.approval)
            return

        this.socket.emit('subscribe_channel', 'approval_'+this.state.approval.approval_id)
        this.socket.on("receive_chat_approval_"+this.state.approval.approval_id, this.onReceiveChat)
        this.socket.on("refresh_approval_"+this.state.approval.approval_id, this.onRefresh)
    }

    onRefresh = async (refresh_model = true) => {
        let approval_id = this.props.match.params.approval_id || 0
        let groups = [];
        let _state = {}

        let approval = await this.props.get_approval(approval_id, this.props.user_info.corp_key)

        if(approval.code != 1) {
            alert(translate("not_access_approval"))
            return history.goBack()
        }
        
        if(approval.payload.approval) {
            let model = approval.payload.approval.html != null ? approval.payload.approval.html : ""
            _state = {
                ..._state,
                ...approval.payload,
            }
            if(refresh_model)
                _state.model = model;

            await this.setState(_state)

            if( !!this.editor && !!approval.payload.approval && _state.approval.can_approval_account_id != this.props.user_info.account_id) {
                this.editor.edit.off();
            } else {
                this.editor.edit.on()
            }

            if(!!this.editor && !!approval.payload.approval && approval.payload.approval.status == 2) {
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

        console.log(this.state.approval)

        window.openModal("PreviewContract",{
            title: this.state.approval.name,
            model: this.state.model,
        })

        /*history.push({pathname:"/preview-contract", state:{
            contract:this.state.contract,
            infos:this.state.infos,
        }})*/
    }

    onClickApprovalSave = async () => {
        let model = this.state.model

        if(this.state.approval.html == model)
            return false;

        let result = await window.confirm(translate("modify_approval"), translate("modify_approval_desc"))
        if(!result) return false;

        let r = await this.props.update_approval_model(this.state.approval.approval_id, model, this.props.user_info.corp_key)
        if(r.code == 1) {
            this.setState({
                approval_modify_status:translate("last_modify_contract_save") + " " + moment().format("YYYY-MM-DD HH:mm:ss")
            })
            await this.onRefresh()
        } else if(r.code == -9) {
            alert(translate("you_dont_update_already_complete_approval"))
        }
        return true;
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

    onChatLoadMore = async () => {
        if(this.end_chat)
            return false

        let chats = await this.props.get_approval_chats(this.state.approval.approval_id, this.state.page_chat, 30, this.state.last_chat_id)
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

        let account_id = this.props.user_info.account_id
        let corp_id = this.props.user_info.corp_id || 0

        let msg = {
            text
        }

        let result = await this.props.send_approval_chat(this.state.approval.approval_id, account_id, corp_id, JSON.stringify(msg))
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

    onRemoveApprovalUser = async (account_id, name) => {
        if(this.state.order_list.length == 2)
            return alert(translate("more_than_2_approval_user"));

        let result = await window.confirm(translate("remove_approval_user_title"), translate("remove_approval_user_desc", [name]))

        if(result) {
            let result = await this.props.remove_approval_user(this.state.approval.approval_id, account_id)
            if(result.code == 1) {
                this.onRefresh(false)
                return alert(translate("remove_approval_user_success"))
            } else {
                return alert(translate("remove_approval_user_fail"))
            }
        }
    }

    onAddApprovalUser = async () => {
        await window.showIndicator();
        let all_group_member = await this.props.get_group_member_all(this.props.user_info.corp_key)
        await window.hideIndicator();
        window.openModal("AddCorpMemberName",{
            title: translate("approval_user_add"),
            desc: translate("approval_user_add_desc"),
            input_title: translate("approval_user_name"),
            member_list: all_group_member.payload,
            user_div: (e, k) => {
                return [
                    <i className="icon fas fa-user-tie" key={"icon"}></i>,
                    <div className="name" key={"name"}>{e.public_info.username}</div>,
                    <div className="email" key={"email"}>{e.public_info.email}</div>,
                ]
            },
            onConfirm: async (add_account_id) => {
                let approval_user = all_group_member.payload.find(e=>e.account_id == add_account_id)

                if(approval_user) {
                    for(let v of this.state.order_list) {
                        if( !!v.account_id && v.account_id == approval_user.account_id ) {
                            return alert(translate("already_add_user"))
                        }
                    }
                    let info = {
                        account_id:approval_user.account_id,
                        username:approval_user.public_info.username,
                        email:approval_user.public_info.email,
                        department:approval_user.public_info.department || "",
                        job:approval_user.public_info.job || "",
                    }

                    let result = await this.props.add_approval_user(this.state.approval.approval_id, add_account_id)
                    if(result.code == 1) {
                        await this.onRefresh(false)
                        return true;
                    } else {
                        alert(translate("fail_add_approval_user"))
                        return false;
                    }
                } else {
                    alert(translate("please_select_approval_user"));
                    return false;
                }
            }
        })
    }

    onClickChangeName = async () => {
        window.openModal("AddCommonModal", {
            icon:"fal fa-align-left",
            title:translate("change_approval_subject"),
            subTitle:translate("change_approval_name_sub"),
            placeholder:translate("please_input_approval_name"),
            confirmText:translate("change"),
            onConfirm: async (name) => {
                if(!name || name.trim() == "") {
                    return alert(translate("please_input_approval_name"))
                }
                let resp = await this.props.update_approval_name(this.state.approval.approval_id, name.trim())
                await this.onRefresh(false)
            }
        })
    }

    onStartApproval = async () => {
        let model = this.state.model
        if(this.state.approval.html != model) {
            //let result = await window.confirm(translate("modify_article"), translate("modify_article_you_keep_going"));
            /*if(result) */let result = await this.onClickApprovalSave();
            if(!result) return;
        }

        let r = await window.confirm(translate("are_you_start_approval"), translate("are_you_start_approval_desc"))
        if(!r) return;

        let result = await this.props.start_approval(this.state.approval.approval_id)
        if(result.code == 1) {
            alert(translate("start_approval_process"))
            await this.onRefresh()
        } else {
            alert(translate("fail_start_approval_process"))
        }
    }

    onConfirmApproval = async () => {
        let r = await window.confirm(translate("are_you_confirm_approval"), translate("are_you_confirm_approval_desc"))
        if(!r) return;

        let result = await this.props.confirm_approval(this.state.approval.approval_id);
        if(result.code == 1) {
            await this.onRefresh()
            alert(translate("success_confirm_approval"))
        } else {
            alert(translate("fail_confirm_approval"))
        }
    }

    onRejectApproval = async () => {

        window.openModal("TextareaModal", {
            icon:"fal fa-vote-nay",
            title:translate("reject_approval_title"),
            subTitle:translate("reject_approval_desc"),
            placeholder:translate("reject_approval_reason_placeholder"),
            confirmText:translate("reject_approval"),
            onConfirm: async (reject_reason) => {
                let result = await this.props.reject_approval(this.state.approval.approval_id, reject_reason);
                if(result.code == 1) {
                    await this.onRefresh()
                    alert(translate("success_reject_approval"))
                } else {
                    alert(translate("fail_reject_approval"))
                }
            }
        })
    }

    onDragEnd = async (result) => {
        if(!result.destination) {
            return;
        }

        const order_list = reorder(
            this.state.order_list,
            result.source.index,
            result.destination.index
        );

        let order_list_min = order_list.map( (e, k) => e.account_id)

        let r = await this.props.change_order_approval(this.state.approval.approval_id, order_list_min)

        await this.setState({
            order_list
        });

        if(r.payload) this.onRefresh(false)
    }

    render_info() {
        switch(this.state.selected_menu) {
            case 0:
                return this.render_approval_line()
            case 1:
                return this.render_chat()
        }
    }

    render_approval_line() {
        let drafter = this.state.order_list[0]
        let disable = this.state.approval.status != window.CONST.APPROVAL_STATUS.DRAFT && this.state.approval.status != window.CONST.APPROVAL_STATUS.REJECTED
        if(!disable)
            disable = this.state.approval.account_id != this.props.user_info.account_id
        let status_text
        switch(this.state.approval.status) {
            case 0:
                status_text = translate("draft")
                break;
            case 1:
                status_text = translate("ing_approval")
                break;
            case 2:
                status_text = translate("completed_approval")
                break;
            case 3:
                status_text = translate("rejected")
                break;
        }

        return <div className="bottom approval-line">
            <div className="title" dangerouslySetInnerHTML={{__html:translate("now_status_text", [status_text])}}></div>
            <div className="list">
                <div className="item" key={drafter.account_id}>
                    <div className="approval-line-shape">
                        <div className={`circle ${drafter.confirm == 1 ? "enable-shape" : ""}`}></div>
                        <div className={`line ${this.state.order_list[1].confirm == 1 ? "enable-shape" : ""}`}></div>
                    </div>
                    <div className="top">
                        <div className="left">
                            <div className="title">{translate("drafter")}</div>
                            <div className="status">{drafter.confirm == 1 ? translate("approve") : ""}</div>
                        </div>
                        <div className="right">
                            <div className="name">
                                {drafter.name} <span className="job">{drafter.public_info.job}</span>
                            </div>
                            <div className="desc">
                                # {drafter.public_info.department}
                            </div>
                        </div>
                    </div>
                    <div className="bottom">
                        {drafter.comment}
                    </div>
                </div>
                <DragDropContext onDragEnd={this.onDragEnd}>
                    <Droppable droppableId="droppable"
                        isDropDisabled={disable}>
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}
                            {...provided.droppableProps}>
                            {this.state.order_list.map((e, k) => {
                                if(k == 0)
                                    return

                                let role
                                let is_last = k == this.state.order_list.length - 1
                                if(k == 0)
                                    role = translate("drafter")
                                else if(is_last)
                                    role = translate("final_approval_user")
                                else
                                    role = translate("approval_user")

                                let status_text = e.confirm == 1 ? translate("approve") : ""
                                if(e.confirm == 0 && this.state.order_list[k - 1].confirm == 1) {
                                    status_text = translate("wait_approve")
                                } else if(e.confirm == 0 && e.status == 3 && !!e.comment) {
                                    status_text = translate("rejected")
                                }


                                return <Draggable key={e.account_id} draggableId={e.account_id} index={k}
                                    isDragDisabled={disable}>
                                    {(provided, snapshot) => (
                                        <div className="item" key={e.account_id}
                                            ref={provided.innerRef}
                                            style={getItemStyle(provided.draggableStyle, snapshot.isDragging)}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}>

                                            {disable ? null : <div className="remove-approval-user" onClick={this.onRemoveApprovalUser.bind(this, e.account_id, e.name)}>
                                                <i className="far fa-times"></i>
                                            </div>}

                                            <div className="approval-line-shape">
                                                <div className={`circle ${e.confirm == 1 ? "enable-shape" : ""}`}></div>
                                                {is_last ? null : <div className={`line ${e.confirm == 1 ? "enable-shape" : ""}`}></div>}
                                            </div>
                                            <div className="top">
                                                <div className="left">
                                                    <div className="title">{role}</div>
                                                    <div className="status">{status_text}</div>
                                                </div>
                                                <div className="right">
                                                    <div className="name">
                                                        {e.name} <span className="job">{e.public_info.job}</span>
                                                    </div>
                                                    <div className="desc">
                                                        # {e.public_info.department}
                                                    </div>
                                                </div>
                                            </div>
                                            {e.comment ? <div className="bottom">
                                                <div className="title">{translate("opinion")}</div>
                                                <div className="comment">{e.comment}</div>
                                            </div> : null}
                                        </div>
                                    )}
                                </Draggable>
                            })}
                        </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {disable ? null : <div className="add-approval-user" onClick={this.onAddApprovalUser}>
                    <i className="fal fa-plus"></i>
                    <div className="text">{translate("add_approval_user")}</div>
                </div>}
            </div>
        </div>
    }

    render_chat() {
        return <div className="bottom chat">
            <Chatting 
                approval={this.state.approval}
                order_list={this.state.order_list}
                user_info={this.props.user_info}
                chat_list={this.state.chat_list}
                onSend={this.onClickSendChat}
                onLoadMore={this.onChatLoadMore}
                isSendable={this.state.approval.status != 2}
                chatType={"approval"}
                initialize={(scrollBottom) => {
                    this.setState({scrollBottom})
                }}
            />
        </div>
    }

	render() {
        if(!this.props.user_info || !this.state.approval)
            return <div></div>

        let can_edit_name
        let now_edit_account_id
        for(let v of this.state.order_list) {
            if(v.confirm == 0) {
                can_edit_name = v.public_info.username
                now_edit_account_id = v.account_id
                break;
            }
        }
        let corp_id = this.props.user_info.corp_id || -1
        let meOrGroup = this.props.user_info

        return (<div className="upsert-page upsert-approval-page">
            <div className="header-page">
                <div className="header">
                    <div className="left-icon">
                        <i className="fal fa-times" onClick={()=>history.goBack()}></i>
                    </div>
                    <div className="title">{this.state.approval.name}</div>
                    { !!this.props.user_info ? <Information /> : null }
                </div>
                <div className="container">
                    <div className="editor">
                        <div className="title">
                            <span> <i className="fas fa-keyboard"></i> &nbsp;{translate("web_editor_mode")} </span>
                            <span className="modify-status">{this.state.approval_modify_status}</span>
                        </div>
                        <FroalaEditor
                            tag='textarea'
                            config={this.config}
                            model={this.state.model}
                            onModelChange={(model) => this.setState({model, approval_modify_status:translate("approval_modify")})} />
                        { this.state.approval.status == 1 ? <div className="can-edit-text">
                            <div>{translate("now_approval_privilege_who", [can_edit_name])}</div>
                        </div> : null }
                    </div>
                    <div className="info">
                        <div className="top">
                            <div className={"menu" + (this.state.selected_menu == 0 ? " enable-menu" : "")} onClick={e=>this.setState({selected_menu:0})}>
                                <i className="fal fa-sitemap"></i>
                                <div className="text">{translate("approval_line")}</div>
                            </div>
                            <div className={"menu" + (this.state.selected_menu == 1 ? " enable-menu" : "")} onClick={e=>this.setState({selected_menu:1})}>
                                <i className="far fa-comments"></i>
                                <div className="text">{translate("conversation")}</div>
                            </div>
                        </div>
                        {this.render_info()}
                    </div>
                </div>
            </div>
            <div className="bottom-container">
                <div className="left">
                    <div className="but" onClick={this.onClickPreview}>
                        <i className="fal fa-eye"></i>
                        {translate("approval_preview")}
                    </div>
                    { ( this.state.approval.status < 2 && this.state.approval.account_id == this.props.user_info.account_id) ?
                        <div className="but" onClick={this.onClickChangeName}>
                            <i className="fal fa-align-left"></i>
                            {translate("change_subject")}
                        </div> : null}
                    { ( this.state.approval.status < 2 && now_edit_account_id == this.props.user_info.account_id) ?
                        <div className="but" onClick={this.onClickApprovalSave}>
                            <i className="far fa-save"></i>
                            {translate("modify_content_save")}
                        </div> : null}
                </div>
                {(()=>{
                    //0 : 작성 중 1 : 결재 중 2 : 완료됨 3 : 반려됨
                    let my_account_id = this.props.user_info.account_id;
                    let can_approval_account_id = this.state.approval.can_approval_account_id;
                    let creator_id = this.state.approval.account_id;
                    let status = this.state.approval.status;

                    if(status == 2) {
                        return <div className="sign" onClick={(e)=>history.goBack()}>
                            {translate("go_back")}
                        </div>
                    } else if(status == 0 && my_account_id == can_approval_account_id){
                        return <div className="sign" onClick={this.onStartApproval}>
                            {translate("start_approval")}
                        </div>
                    } else if(status == 1 && my_account_id == can_approval_account_id && my_account_id != creator_id) {
                        return <div className="sign-container">
                            <div className="button" onClick={this.onConfirmApproval}>
                                {translate("confirm_approval")}
                            </div>
                            <div className="button red" onClick={this.onRejectApproval}>
                                {translate("reject_approval")}
                            </div>
                        </div>
                    } else if(status == 3 && my_account_id == creator_id) {
                        return <div className="sign" onClick={this.onStartApproval}>
                            {translate("re_start_approval")}
                        </div>
                    } else if(status == 3 && my_account_id != creator_id) {
                        return <div className="sign">
                            {translate("re_approval_confirming")}
                        </div>
                    } else {
                        return <div className="sign sign-disable">
                            {translate("ing_approval")}
                        </div>
                    }
                })()}
                
            </div>
		</div>);
	}
}
