import React from "react"
import ReactDOM from "react-dom"
 
import { connect } from 'react-redux';
import { Link, Prompt } from 'react-router-dom'
import history from '../history';
import translate from "../../common/translate"

import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'

import {
    select_subject,

} from "../../common/actions"
import CheckBox2 from "./checkbox2"

let mapStateToProps = (state)=>{
	return {
	}
}

let mapDispatchToProps = {
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            chat_text:""
        }
        this.block_scroll = false
        this.block_chat = false
        console.log(this.props)
    }
    componentDidMount() {
        this.refs.bottom.scrollIntoView(/*{ behavior: "smooth" }*/);
        this.refs.list_of_chat.addEventListener('scroll', async (e) => {
            if(e.target.scrollTop < 50 && this.props.onLoadMore && !this.block_scroll) {
                let prevScrollHeight = e.target.scrollHeight
                this.block_scroll = true
                let resp = await this.props.onLoadMore()
                if(!resp)
                    return
                let diffScrollHeight = e.target.scrollHeight - prevScrollHeight
                e.target.scrollTop = diffScrollHeight
                this.block_scroll = false
            }
        })
        this.props.initialize && this.props.initialize(()=>!!this.refs && !!this.refs.bottom && this.refs.bottom.scrollIntoView())
    }

    componentWillReceiveProps(nextProps){
    }

    onClickSendChat = async() => {

        if(this.state.chat_text.length == 0 || this.block_chat)
            return

        this.block_chat = true

        let success_send_chat = await this.props.onSend(this.state.chat_text)

        if(success_send_chat) {
            await this.setState({chat_text:""})
            this.refs.bottom.scrollIntoView(/*{ behavior: "smooth" }*/);
        }

        this.block_chat = false
    }

    onKeyDownChat = async (e)=>{
        if(e.key == "Enter"){
            this.onClickSendChat()
        }
    }

    render_chat_contract_slot(e) {

        switch(e.type) {
            case 0: {
                let user = this.props.infos.find(v=>v.corp_id == e.corp_id && v.entity_id == e.entity_id)
                if(!user) return

                let corp_id = this.props.user_info.corp_id || window.CONST.PERSONAL_CORP_ID
                let meOrGroup = select_subject(this.props.infos, this.props.groups, this.props.user_info.account_id, corp_id).my_info

                let isMine = meOrGroup == user

                let text
                let data
                try {
                    data = JSON.parse(e.msg)
                    text = data.text
                } catch(err) {
                    text = e.msg
                }

                let user_name = user.user_info.username ? user.user_info.username : (user.user_info.title + " " + data.username)
                if(user.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])

                return <div key={e.chat_id} className={isMine ? "chat-slot right" : "chat-slot left"}>
                    { !isMine ? <img className="profile" src={`https://identicon-api.herokuapp.com/${user.corp_id+"_"+user.entity_id}/70?format=png`}/> : null }
                    <div className="msg">
                        <div className="name">{user_name}</div>
                        <div className="msg-text">{text}</div>
                    </div>
                </div>
            }
            case 1: {
                // 계약서 관련 정보(서명자) 바뀌었을때
                return <div key={e.chat_id} className="notice">
                    {e.msg}
                </div>
            }
            case 2: {
                // 계약서 내용 바꼈을때
                let data = JSON.parse(e.msg)
                let entity = this.props.infos.find(e=>e.entity_id == data.entity_id && e.corp_id == data.corp_id)
                if(!entity) return;
                let user_name = entity.user_info.username
                if(entity.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])
                let text = translate("who_is_modify_contract", [user_name])
                return <div key={e.chat_id} className="notice">
                    {text}
                </div>
            }
            case 3: {
                // 서명 했을때
                let data = JSON.parse(e.msg)
                let entity = this.props.infos.find(e=>e.entity_id == data.entity_id && e.corp_id == data.corp_id)
                if(!entity) return;
                let user_name = entity.user_info.username
                if(entity.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])
                let text = translate("who_is_sign", [user_name])
                return <div key={e.chat_id} className="notice">
                    {text}
                </div>
            }
            case 4: {
                // 서명 정보 바꿨을때
                let data = JSON.parse(e.msg)
                let entity = this.props.infos.find(e=>e.entity_id == data.entity_id && e.corp_id == data.corp_id)
                if(!entity) return;
                let user_name = entity.user_info.username
                if(entity.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])
                let text = translate("who_is_sign_info", [user_name])
                return <div key={e.chat_id} className="notice">
                    {text}
                </div>
            }
            case 5: {
                // 수정 권한 옮겼을 때
                let data = JSON.parse(e.msg)
                let entity = this.props.infos.find(e=>e.entity_id == data.account_id && e.corp_id == 0)
                if(!entity) return;
                let user_name = entity.user_info.username
                if(entity.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])

                let move_entity = this.props.infos.find(e=>e.entity_id == data.move_account_id && e.corp_id == 0)
                if(!move_entity) return;
                let move_user_name = move_entity.user_info.username
                if(move_entity.is_exclude == 1)
                    move_user_name = translate("byebye_template", [move_user_name])

                let text = translate("who_is_move_edit_privilege", [user_name, move_user_name])
                return <div key={e.chat_id} className="notice">
                    {text}
                </div>
            }
            default:
                return <div key={e.chat_id} className="notice">
                    {e.msg}
                </div>
        }
    }

    render_chat_approval_slot(e) {
        switch(e.type) {
            case 0: {
                let user = this.props.order_list.find(v=>v.account_id == e.entity_id)
                if(!user) return;

                let me = this.props.order_list.find(v=>v.account_id == this.props.user_info.account_id);

                let isMine = me == user

                let text
                let data
                try {
                    data = JSON.parse(e.msg)
                    text = data.text
                } catch(err) {
                    text = e.msg
                }

                let user_name = user.public_info.username + " " + user.public_info.job
                if(user.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])

                return <div key={e.chat_id} className={isMine ? "chat-slot right" : "chat-slot left"}>
                    { !isMine ? <img className="profile" src={`https://identicon-api.herokuapp.com/${user.entity_id}/70?format=png`}/> : null }
                    <div className="msg">
                        <div className="name">{user_name}</div>
                        <div className="msg-text">{text}</div>
                    </div>
                </div>
            }
            case 1: {
                let data = JSON.parse(e.msg)
                let entity = this.props.order_list.find(v=>v.account_id == data.entity_id)
                if(!entity) return;
                let user_name = entity.public_info.username
                if(entity.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])
                let text = translate("who_is_start_approval", [user_name])
                return <div key={e.chat_id} className="notice">
                    {text}
                </div>
            }
            case 2: {
                let data = JSON.parse(e.msg)
                let entity = this.props.order_list.find(v=>v.account_id == data.entity_id)
                if(!entity) return;
                let user_name = entity.public_info.username
                if(entity.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])
                let text = translate("who_is_modify_approval", [user_name])
                return <div key={e.chat_id} className="notice">
                    {text}
                </div>
            }
            case 3: {
                let data = JSON.parse(e.msg)
                let entity = this.props.order_list.find(v=>v.account_id == data.entity_id)
                if(!entity) return;
                let user_name = entity.public_info.username
                if(entity.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])
                let text = translate("who_is_confirm_approval", [user_name])
                return <div key={e.chat_id} className="notice">
                    {text}
                </div>
            }
            case 4: {
                let data = JSON.parse(e.msg)
                let entity = this.props.order_list.find(v=>v.account_id == data.entity_id)
                if(!entity) return;
                let user_name = entity.public_info.username
                if(entity.is_exclude == 1)
                    user_name = translate("byebye_template", [user_name])
                let text = translate("who_is_reject_approval", [user_name, data.reject_reason])
                return <div key={e.chat_id} className="notice" dangerouslySetInnerHTML={{__html:text}}>
                </div>
            }
        }
    }

    render_chat_slot(e){
        if(!this.props.user_info)
            return;

        if(this.props.chatType == "approval") {
            return this.render_chat_approval_slot(e)
        } else {
            return this.render_chat_contract_slot(e)
        }
    }


    render() {
        return <div className="chat-component">
            <div className="chat-text-container" ref="list_of_chat">
                <div className="bar" ref="top" />
                {this.props.chat_list.map(e=>{
                    return this.render_chat_slot(e)
                })}
                <div className="bar" ref="bottom" />
            </div>
            {this.props.isSendable ?
                <div className="input-container">
                    <input className="text-box" placeholder={translate("please_input_message")} value={this.state.chat_text || ""}
                        onKeyPress={this.onKeyDownChat}
                        onChange={e=>this.setState({chat_text:e.target.value})} />
                    <div className="send-btn" onClick={this.onClickSendChat}>
                        <i className="fas fa-comment"></i>
                    </div>
                </div> : null
            }
        </div>
    }
}



