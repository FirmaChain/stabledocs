import React from "react"
import ReactDOM from "react-dom"
import { Link } from "react-router-dom";
import { connect } from 'react-redux';
import history from "../history"
import translate from "../../common/translate"
import {
    send_chat,
    fetch_chat
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        user:state.user.info,
        // chat:state.contract.chat
	}
}

let mapDispatchToProps = {
    send_chat,
    fetch_chat
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
    constructor(){
        super()
        this.state = {
            chat_text:"",
            list:[]
        }
        this.sendLock = false
    }

    componentDidMount(){
        (async ()=>{
            let list = await this.props.fetch_chat(this.props.contract_id);
            await this.addList(list)

            this.refs.bottom.scrollIntoView({ behavior: "smooth" });
            this.props.mapFetchChat(async() => {
                let list = await this.props.fetch_chat(this.props.contract_id);
                await this.addList(list)
                this.refs.bottom.scrollIntoView({ behavior: "smooth" });
            });
        })()
    }

    componentWillUnmount(){
    }

    addList(newlist){
        return new Promise(r=>{
            let list = [...this.state.list,...newlist]

            let s = {}
            let _ = []
            for(let o of list){
                if(s[o.id] == null){
                    s[o.id] = true
                    _.push(o)
                }
            }

            _.sort((a,b)=>a.id-b.id)
            
            this.setState({
                list:_
            },r)
        })
    }
    
    onClickFold = ()=>{
        this.setState({
            fold:!this.state.fold
        })
    }

    async send(){
        if(this.sendLock)
            return

        this.sendLock = true
        let chatText = this.state.chat_text
        this.setState({
            chat_text:""
        }, async () => {
            await this.props.send_chat(this.props.contract_id, chatText)

            let list = await this.props.fetch_chat(this.props.contract_id);
            await this.addList(list)

            this.refs.bottom.scrollIntoView({ behavior: "smooth" });
            this.sendLock = false
        })
    }

    onKeyDownChat = async(e)=>{
        if(e.key == "Enter"){
            if(this.state.chat_text.length == 0)
                return ;
            await this.send()
        }
    }

    onClickSendChat = async(e)=>{
        if(this.state.chat_text.length == 0)
            return alert("메세지를 입력해주세요.");

        await this.send()
    }

    onClickNext = async()=>{
        if(await confirm("다음으로","변경된 내용이 있다면 먼저 저장해주세요. 다음으로 넘어가시겠습니까?")){
            this.props.unblockFunction()
            history.push(`/e-contract/contract-confirm/${this.props.contract_id}/${this.props.revision}`)
        }
    }

    onClickDetail = ()=>{
        this.props.unblockFunction()
        history.push(`/e-contract/contract-confirm/${this.props.contract_id}/${this.props.revision}`)
    }

    userInfo(account_id){
        for(let c of this.props.counterparties){
            if(c.account_id == account_id)
                return c
        }

        if(this.props.author.account_id == account_id){
            return this.props.author
        }
    }

    render_type_string(user, type){
        if(type == 1){
            return <div>[<b>{user.name}</b>]님께서 계약서를 갱신하여 모든 서명자의 서명이 취소되었습니다. 검토 후 다시 승인해주세요.</div>
        }else if(type == 2){
            return <div>[<b>{user.name}</b>]님께서 계약서를 승인했습니다.</div>
        }else if(type == 3){
            return <div>[<b>{user.name}</b>]님께서 계약서를 거절하였습니다.</div>
        }
    }

    render_chat_slot(e){
        let user = this.userInfo(e.account_id);
        if(typeof e.msg == "object"){
            return <div key={e.id} className="notice">
                {this.render_type_string(user, e.msg.type)}
            </div>
        }else{
            let isMine = this.props.user.account_id == e.account_id
            return <div key={e.id} className={isMine? "chat-slot right" : "chat-slot left"}>
                <img className="profile" src={`https://identicon-api.herokuapp.com/${user.code}/70?format=png`}/>
                <div>
                    <div className="name">{user.name}</div>
                    <div className="msg-text">{e.msg}</div>
                </div>
            </div>
        }
    }

    render(){
        let allower = this.props.counterparties.filter(e=>e.confirm==1);
        return (<div className="chatting-comp">
            <div className="header" onClick={this.onClickFold}>
                <div className="icon">
                    <i className="fas fa-comment-alt"></i>
                </div>
                <div className="title">
                    <div className="subject">{this.props.contract_name}</div>
                    <div className="counterparties">{this.props.author.name}{this.props.counterparties.map(e=>`, ${e.name}`).join("")}</div>
                </div>
                {/* <div style={{flex:1}}/> */}
                <div> <i className={this.state.fold?`fas fa-chevron-up` : `fas fa-chevron-down`} />  </div>
            </div>
            <div className="content">
                <div style={this.state.fold ? {} : {height:0}}>
                    <div className="chat-text-container">
                        <div style={{ float:"left", clear: "both" }} ref="top" />
                        {this.state.list.map(e=>{
                            return this.render_chat_slot(e)
                        })}
                        <div style={{ float:"left", clear: "both" }} ref="bottom" />
                    </div>
                    <div className="confirm-container">
                        <div className="confirm-text">컨펌한 서명자</div>
                        <div className="confirm-counterparties">
                            {this.props.author.confirm == 1 ? this.props.author.name + (allower.length == 0 ? "" :", ") : null}
                            {allower.map(e=>e.name).join(", ")}
                        </div>
                    </div>
                    {this.props.contract_status == 2 ?
                        <div className="input-container">
                            <div className="next-btn" style={{flex:1, textAlign:"center"}} onClick={this.onClickDetail}>
                                <i className="fas fa-check"></i>
                                계약 상세보기
                            </div>
                        </div> : 
                        <div className="input-container">
                            <div className="input">
                                <input placeholder="메세지를 입력해주세요." value={this.state.chat_text || ""} onKeyPress={this.onKeyDownChat} onChange={e=>this.setState({chat_text:e.target.value})} />
                                <button onClick={this.onClickSendChat}>
                                    <i className="fas fa-comment"></i>
                                </button>
                            </div>
                            <div className="next-btn" onClick={this.onClickNext}>
                                <i className="fas fa-check"></i>
                                컨펌하기
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>)
    }
}
