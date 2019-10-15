import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link, Prompt } from 'react-router-dom'
import history from '../history';
import pdfjsLib from "pdfjs-dist"
import translate from "../../common/translate"
import Information from "./information.comp"
import Footer from "./footer.comp"
import Chatting from "./chatting.comp"
import moment from "moment"
import UAParser from "ua-parser-js"
import Pager from "./pager"
import queryString from "query-string"
import ReactDOMServer from 'react-dom/server';

import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'
import {
    decryptPIN,
    generateRandomKey,
} from "../../common/crypto_test"

import {
    fetch_user_info,
    get_contract,
    get_group_info,
    get_chats,
    update_epin_account,
    get_contract_logs,
    modify_contract_user_info,
    add_counterparties,
    update_epin_group,
    remove_counterparty,
    select_userinfo_with_email,
    add_contract_user,
    remove_contract_self,
    getGroupKey,
    select_subject,
    createContractHtml,
} from "../../common/actions"
import CheckBox2 from "./checkbox2"

let mapStateToProps = (state)=>{
	return {
        user_info:state.user.info
	}
}

let mapDispatchToProps = {
    fetch_user_info,
    get_contract,
    get_group_info,
    get_chats,
    update_epin_account,
    get_contract_logs,
    modify_contract_user_info,
    add_counterparties,
    update_epin_group,
    remove_counterparty,
    select_userinfo_with_email,
    add_contract_user,
    remove_contract_self,
}

const LIST_DISPLAY_COUNT = 6

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
        super();
        this.blockFlag = false
        this.end_chat = false

		this.state={
            select_tab:0,
            edit_mode: false,

            page_chat:0,
            last_chat_id:0,
            chat_list:[],

            cur_log_page:0,
        };
	}

	componentDidMount(){
        (async()=>{
            await this.onRefresh()
        })()
    }

    onRefresh = async (nextProps) => {
        nextProps = !!nextProps ? nextProps : this.props

        await window.showIndicator(translate("loading_contract"))
        await this.props.fetch_user_info();

        let contract_id = this.props.match.params.contract_id || -1
        let resp, groups = []
        let params = queryString.parse(nextProps.location.search)

        if(this.props.user_info.account_type != 0) {
            groups = await this.props.get_group_info(0)
            resp = await this.props.get_contract(contract_id, this.props.user_info, groups)
        } else {
            resp = await this.props.get_contract(contract_id, this.props.user_info)
        }
        await window.hideIndicator()

        if( this.props.location.state && this.props.location.state.select_tab ) {
            this.setState({
                select_tab:this.props.location.state.select_tab
            })
        }

        if(!resp) {
            alert(translate("contract_is_encrypt_so_dont_enter"))
            return history.replace("/e-contract/home")
        }

        if(resp.code == -3 || !resp.payload) {
            return history.push({pathname:"/e-contract/login", search:`?redirect=/e-contract/contract-info/${contract_id}`})
        }

        if(resp.payload.contract) {

            if(resp.payload.contract.is_pin_used == 1 && resp.payload.contract.pin && resp.payload.contract.pin != "000000") 
                await this.props.update_epin_account(contract_id, resp.payload.contract.pin);

            delete resp.payload.logs

            //if(resp.payload.contract.status != 2) {
                let contract = resp.payload.contract
                let infos = resp.payload.infos

                let corp_id = this.props.user_info.corp_id || window.CONST.DUMMY_CORP_ID
                let me = select_subject(infos, groups, this.props.user_info.account_id, corp_id, contract.is_pin_used).my_info
                
                if(me) {
                    let contract_user_info = {
                        ...me.user_info,
                        username:this.props.user_info.username,
                        email:this.props.user_info.email,
                    };
                    if(this.props.user_info.account_type != 0) {
                        contract_user_info.company_name = this.props.user_info.company_name;
                    }

                    let update_flag = false
                    if(Object.keys(contract_user_info).length != Object.keys(me.user_info).length) update_flag = true;
                    else if(!update_flag) {
                        for(let v of Object.entries(contract_user_info)) {
                            for(let w of Object.entries(me.user_info)) {
                                if(v[0] == w[0] && v[1] != w[1]) {
                                    update_flag = true;
                                    break;
                                }
                            }
                            if(update_flag) break;
                        }
                    }
                    if(update_flag) {
                        let r = await this.props.modify_contract_user_info(contract.contract_id, this.props.user_info.account_id, 0, contract_user_info, contract.the_key)
                    }
                }
            //}
            this.setState({
                ...resp.payload,
                cur_log_page:Number(params.log_page) || 0,
                groups,
            })
            console.log("payload", resp.payload)
        } else {
            alert(translate("not_exist_contract"))
            return history.goBack()
        }

        await this.onChatLoadMore()

        let logs = (await this.props.get_contract_logs(contract_id, Number(params.log_page) || 0, LIST_DISPLAY_COUNT)).payload;
        this.setState({
            logs
        })
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.user_info === false){
            history.replace("/e-contract/login")
        }

        let prev_log_page = queryString.parse(nextProps.location.search).log_page || 0
        let log_page = queryString.parse(this.props.location.search).log_page || 0 

        if(prev_log_page != log_page){
            (async()=>{
                await this.onRefresh(nextProps)
            })()
        }
    }

    onClickBack = ()=>{
        history.goBack();
    }

    onChatLoadMore = async () => {
        if(this.end_chat || !this.state.contract.contract_id)
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

    getRoleText = (entity_id, corp_id, privilege) => {
        let text = []

        switch(privilege) {
            case 1:
                text.push(translate("signer"))
                break;
            case 2:
                text.push(translate("viewer"))
                break;
        }

        return text.join(", ")
    }

    status_text = ( status)=>{
        let contract = this.state.contract
        let infos = this.state.infos

        let corp_id = this.props.user_info.corp_id || window.CONST.DUMMY_CORP_ID
        let me = select_subject(infos, this.state.groups, this.props.user_info.account_id, corp_id, contract.is_pin_used).my_info
        if(status == 0) {
            return translate("status_0")
        } else if(status == 1) {

            let sign_user = infos.map( (v, k) => {
                return {
                    corp_id : v.corp_id,
                    entity_id : v.entity_id,
                    signature : v.signature,
                }
            }).find(v => {
                return v.corp_id == 0 && v.entity_id == this.props.user_info.account_id
            })
            if(sign_user && sign_user.sign == "true") {
                return translate("status_1_0")
            }
            return translate("status_1_1")
        } else if(status == 2) {
            return translate("status_2")
        } 
    }


    copyContractOpenKey = (contract_open_key, e) => {
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = `${contract_open_key}`;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }

    keyPress = async (type, e) => {
        if(e.keyCode == 13){
            switch(type) {
                case 0:
                break;
                case 1:
                break;
            }
        }
    }

    onClickLogPage = async (page)=>{
        if(this.state.cur_log_page == page - 1)
            return;

        let params = queryString.parse(this.props.location.search)
        params.log_page = page - 1


        let logs = (await this.props.get_contract_logs(this.state.contract.contract_id, Number(page - 1) || 0, LIST_DISPLAY_COUNT)).payload;
        this.setState({
            logs,
            cur_log_page:page-1
        })

        //history.push({pathname:this.props.match.url, search:`?${queryString.stringify(params)}`})
    }

    onClickDownload = async () => {
        let data = createContractHtml(this.state.contract, this.state.infos).html
        let filename = `[${this.status_text(this.state.contract.status)}] ${this.state.contract.name}.html`;

        let file = new Blob([data], {type: 'text/html'});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else {
            let a = document.createElement("a")
            let url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0); 
        }
    }

    addMember = async () => {
        window.openModal("AddContractUserModal", {
            icon:"fas fa-users",
            title:translate("user_add"),
            placeholder:translate("please_input_email"),
            onConfirm: async (email, add_role) => {
                if(!email) {
                    alert(translate("please_input_email"))
                    return false;
                }

                if( !window.email_regex.test(email) ) {
                    alert(translate("incorrect_email_expression"))
                    return false;
                }

                let resp = await this.props.select_userinfo_with_email(email);
                let info;
                if(resp){
                    for(let v of this.state.infos) {
                        if( v.is_exclude == 0 && v.corp_id == window.CONST.DUMMY_CORP_ID && v.entity_id == resp.account_id ) {
                            return alert(translate("already_add_user"));
                        }
                    }

                    info = {
                        user_type:resp.account_type != 0 ? 1 : 0,
                        username:resp.username,
                        email:resp.email,
                        account_id:resp.account_id,
                        role:[add_role],
                        public_key:resp.publickey_contract,
                    }

                    let groups = await this.props.get_group_info(0)
                    let contract = this.state.contract;
                    let add_resp = await this.props.add_contract_user(contract.contract_id, info, groups, this.props.user_info, this.state.infos, contract.is_pin_used, contract.pin)
                    if(add_resp.code == 1) {
                        alert(translate("add_user_success"))
                        await this.onRefresh()
                        return true;
                    } else {
                        alert(translate("fail_user_success", [add_resp.code]))
                        return true;
                    }
                } else {
                    window.openModal("NoSignUserAdd", {
                        email:email,
                        email_enable: false,
                        onConfirm: async (data)=>{

                            for(let v of this.state.infos) {
                                if( !!v.email && v.is_exclude == 0 && v.email == data.email ) {
                                    return alert(translate("already_add_user"))
                                }
                            }

                            info = {
                                user_type:-1,
                                username:data.name,
                                email:data.email,
                                cell_phone_number:data.cell_phone_number,
                                role:[add_role],
                                contract_open_key:generateRandomKey(16),
                            }
                            let groups = await this.props.get_group_info(0)
                            let contract = this.state.contract;
                            let res = await this.props.add_contract_user(contract.contract_id, info, groups, this.props.user_info, this.state.infos, contract.is_pin_used, contract.pin)
                            if(res.code == 1) {
                                await this.onRefresh()
                                return alert(translate("add_user_success"))
                            } else {
                                return alert(translate("fail_user_success", [resp.code]))
                            }
                        }
                    })
                }
                return true;

            }
        })
    }

    addGroup = async () => {
        let groups = await this.props.get_group_info(0)
        let data = groups.map((e) => {
            return {
                user_type:2,
                corp_id: e.corp_id,
                group_id : e.group_id,
                title : e.title,
                public_key : Buffer.from(e.group_public_key).toString("hex"),
                company_name:this.props.user_info.company_name,
                role:[2],
            }
        })
        window.openModal("OneAddModal", {
            icon:"fal fa-users",
            title:translate("contract_add_group"),
            subTitle:translate("group_select"),
            desc:translate("select_group_member_contract_view_user_add"),
            data,
            onConfirm: async (group)=>{
                for(let v of this.state.infos) {
                    if( v.corp_id == group.corp_id && v.entity_id == group.group_id && v.is_exclude == 0) {
                        return alert(translate("already_add_group"))
                    }
                }
                await window.showIndicator();
                let contract = this.state.contract;
                let result = await this.props.add_counterparties(contract.contract_id, [group], groups, this.props.user_info, this.state.infos, contract.is_pin_used, contract.pin)
                if(contract.is_pin_used == 1) {
                    await this.props.update_epin_group(group.corp_id, group.group_id, contract.contract_id, this.props.user_info, contract.pin)
                }
                await this.onRefresh()
                await window.hideIndicator();
            }
        })
    }

    onRemoveContractSelf = async () => {
        if(!window._confirm(translate("really_get_off_this_contract_?")))
            return;

        let resp = await this.props.remove_contract_self(this.state.contract.contract_id);
        if(resp.code == 1) {
            alert(translate("success_remove_contract_self"));
            history.goBack();
        } else {
            alert(translate("fail_remove_contract_self", [resp.code]));
        }
    }

    onRemoveCounterparty = async (corp_id, entity_id) => {
        if(corp_id > 0) {
            let is_corp = this.props.user_info.account_type == 1 || this.props.user_info.account_type == 2
            if(is_corp && this.state.infos.filter(e=>e.is_exclude == 0 && e.corp_id != 0 && e.corp_id == this.props.user_info.corp_id).length == 1) {
                return alert(translate("at_least_one_group_in_contract"))
            }
        }
        if(!window._confirm(translate("real_remove_this_user_?"))) {
            return;
        }

        await window.showIndicator();
        let result = await this.props.remove_counterparty(this.state.contract.contract_id, corp_id, entity_id)
        if(result.code == 1) {
            await this.onRefresh()
            alert(translate("success_remove_counterparty"))
        } else if(result.code == -10) {
            alert(translate("at_least_one_group_in_contract"))
        } else {
            alert(translate("fail_remove_counterparty"))
        }
        await window.hideIndicator();
    }

    render_information_deck() {
        switch(this.state.select_tab) {
            case 0:
                return this.render_users()
            case 1:
                return this.render_information()
            case 2:
                return this.render_logs()
        }
    }

    render_users() {
        let is_corp = this.props.user_info.account_type == 1 || this.props.user_info.account_type == 2
        return <div className="deck users">
            {this.state.infos.map((e, k)=>{
                if(e.is_exclude == 1)
                    return;

                let removeable = false;
                if(is_corp && e.corp_id == this.props.user_info.corp_id) {
                    removeable = true;
                }
                else if(e.corp_id == -1) {
                    removeable = true;
                }

                return <div className="item" key={e.entity_id+"_"+e.corp_id}>
                    <div className="icon">
                    {
                        (()=>{ switch(e.user_info.user_type) {
                            case -1:
                                return <i className="fas fa-user-tag"></i>
                            case 0:
                                return <i className="fas fa-user"></i>
                            case 1:
                                return <i className="fas fa-user-tie"></i>
                            case 2:
                                return <i className="fas fa-users"></i>
                        } })()
                    }
                    </div>
                    {
                        (()=>{ switch(e.user_info.user_type) {
                            case -1:
                                return <div className="desc">
                                    <div className="username">({translate("not_regist_user")}) {e.user_info.username}</div>
                                    <div className="email">{e.user_info.email} {e.user_info.contract_open_key}</div>
                                    <div className="cell-phone-number">{e.user_info.cell_phone_number}</div>
                                    <div className="contract-open-key">
                                        <span onClick={this.copyContractOpenKey.bind(this, e.user_info.contract_open_key)}>
                                            <span className="front">{translate("unlock_contract_open_key")}</span> {`: ${e.user_info.contract_open_key}`} <span className="copy">{translate("copy")}</span>
                                        </span>
                                    </div>
                                </div>
                            case 0:
                                return <div className="desc">
                                    <div className="username">{e.user_info.username}</div>
                                    <div className="email">{e.user_info.email}</div>
                                </div>
                            case 1:
                                return <div className="desc">
                                    <div className="username">{e.user_info.username}<span>{e.user_info.company_name}</span></div>
                                    <div className="email">{e.user_info.email}</div>
                                </div>
                            case 2:
                                return <div className="desc">
                                    <div className="username">#{e.user_info.title}<span>{e.user_info.company_name}</span></div>
                                    <div className="email">&nbsp;</div>
                                </div>
                        } })()
                    }
                    <div className="privilege">{this.getRoleText(e.entity_id, e.corp_id, e.privilege)}</div>
                    <div className="is-sign">{e.privilege != 1 ? "" : (e.signature ? translate("sign_all") : translate("status_1"))}</div>
                    {this.state.edit_mode ? <div className="action">
                        {removeable ? <div className="transparent-but" onClick={this.onRemoveCounterparty.bind(this, e.corp_id, e.entity_id)}>{translate("remove")}</div> : null}
                    </div> : null}
                </div>
            })}
            {this.state.contract.status != 2 ? <div className="action">
                {this.state.edit_mode ? <div className="transparent-but" onClick={this.addMember}><i className="fal fa-plus"></i> {translate("user_add")}</div>:null}
                {this.state.edit_mode && is_corp ? <div className="transparent-but" onClick={this.addGroup}><i className="fal fa-plus"></i> {translate("group_add_2")}</div> : null}
                <div className={this.state.edit_mode ? "blue-but":"transparent-but"} onClick={(e)=>{this.setState({edit_mode:!this.state.edit_mode})}}>{this.state.edit_mode ? translate("complete") : translate("edit_mode")}</div>
            </div> : null}
        </div>
    }

    render_information() {
        let contract = this.state.contract
        let review = this.state.review || {}

        let meOrGroup, creator, payer;
        let users = [];
        let isAccount = false
        for(let v of this.state.infos) {
            if(v.corp_id == 0 && v.entity_id == this.props.user_info.account_id) {
                meOrGroup = v
                isAccount = true
            }

            if(v.corp_id == 0 && v.entity_id == contract.account_id)
                creator = v

            if(v.corp_id == 0 && v.entity_id == contract.payer_account_id)
                payer = v

            if(v.privilege == 1) {
                let user_name = v.user_info.username ? v.user_info.username : v.user_info.title
                if(v && v.is_exclude == 1) {
                    user_name = translate("byebye_template", [v.user_info.username])
                }
                users.push(user_name)
            }
        }

        if(!meOrGroup && this.props.user_info.account_type != 0) {
            for(let v of this.state.infos) {
                if(v.corp_id == this.props.user_info.corp_id && !!this.state.groups.find(e=>e.group_id == v.entity_id) ) {
                    meOrGroup = v
                }
            }
        }
        users = users.join(", ")

        let creator_name = creator ? creator.user_info.username : translate("unknown")
        if(creator && creator.is_exclude == 1) {
            creator_name = translate("byebye_template", [creator.user_info.username])
        }

        return <div className="deck informations">
            <div className="item">
                <div className="title">{translate("contract_name")}</div>
                <div className="desc">{contract.name}</div>
            </div>
            <div className="item">
                <div className="title">{translate("contract_status")}</div>
                <div className="desc">{this.status_text(contract.status)}</div>
            </div>
            <div className="item">
                <div className="title">{translate("contract_hash_id")}</div>
                <div className="desc">{review.document_hash || translate("not_completed")}</div>
            </div>
            <div className="item">
                <div className="title">{translate("contract_regist_date")}</div>
                <div className="desc">{moment(contract.addedAt).format("YYYY-MM-DD HH:mm:ss")}</div>
            </div>
            <div className="item">
                <div className="title">{translate("PIN_number")}</div>
                <div className="desc">{contract.is_pin_used == 0 ? translate("not_exist_PIN") : contract.pin}</div>
            </div>
            <div className="item">
                <div className="title">IPFS ID</div>
                <div className="desc">{contract.ipfs || translate("not_completed")}</div>
            </div>
            <div className="item">
                <div className="title">{translate("contract_complete_date")}</div>
                <div className="desc">{contract.completedAt ? moment(contract.completedAt).format("YYYY-MM-DD HH:mm:ss") : translate("not_completed")}</div>
            </div>
            <div className="item">
                <div className="title">{translate("contract_creator")}</div>
                <div className="desc">{creator_name}</div>
            </div>
            <div className="item">
                <div className="title">{translate("transaction_ID")}</div>
                <div className="desc">{review.transaction_id || translate("not_completed")}</div>
            </div>
            <div className="item">
                <div className="title">{translate("standard_time")}</div>
                <div className="desc">{translate("user_computer_standard")}</div>
            </div>
            <div className="item">
                <div className="title">{translate("receive_contract_user")}</div>
                <div className="desc">{users}</div>
            </div>
            <div className="item">
                <div className="title">{translate("payer")}</div>
                <div className="desc">{payer.user_info.username}</div>
            </div>
        </div>
    }

    render_logs() {
        let logs = this.state.logs.list || []
        let total_cnt = this.state.logs.total_cnt || 0
        logs = logs.map(e=>{
            let msg

            let user = this.state.infos.find(c=>{
                if(c.corp_id == 0) return c.entity_id == e.account_id
                else return c.entity_id == e.group_id && c.corp_id == e.corp_id
            })
            if(!user) return


            let name = user.user_info.username ? user.user_info.username : user.user_info.title
            let email = user.user_info.email ? user.user_info.email : user.user_info.company_name

            if(user.is_exclude)
                name = translate("byebye_template", [name])

            switch(e.code) {
                case window.CONST.CONTRACT_LOG.CREATE:
                    msg = translate("log_create_msg", [name])
                    break;
                case window.CONST.CONTRACT_LOG.READ:
                    msg = translate("log_open_msg", [name])
                    break;
                case window.CONST.CONTRACT_LOG.MODIFY:
                    msg = translate("log_modify_msg", [name])
                    break;
                case window.CONST.CONTRACT_LOG.CHANGE_SIGN_INFO:
                    msg = translate("log_modify_sign_info_msg", [name])
                    break;
                case window.CONST.CONTRACT_LOG.CHANGE_SIGN:
                    msg = translate("log_sign_msg", [name])
                    break;
                case window.CONST.CONTRACT_LOG.GIVE_MODIFY: {
                    let next_account_id = JSON.parse(e.data).to_account_id
                    let next = this.state.infos.find(c=>c.corp_id == 0 && c.entity_id == next_account_id)

                    let next_name = next ? next.user_info.username : translate("unknown")
                    if(next && next.is_exclude == 1)
                        next_name = translate("byebye_template", [next_name])

                    msg = translate("log_move_privilege_msg", [name, next_name])
                    break;
                }
            }
            let user_agent = UAParser(e.ua)

            return {
                ...e,
                text:msg,
                name,
                email,
                ua:user_agent.os.name + " " + user_agent.browser.name
            }
        })

        return <div className="deck logs">
            <div className="head">
                <div className="list-head-item list-name">{translate("history")}</div>
                <div className="list-head-item list-user">{translate("user")}</div>
                <div className="list-head-item list-date">{translate("date")}</div>
            </div>
            {logs.map((e, k) => {
                if(!e) return
                return <div key={e.log_id} className="item">
                    <div className="list-body-item list-name">
                        {e.text}
                    </div>
                    <div className="list-body-item list-user">
                        {e.name}
                        <div className="sub">{e.email}</div>
                    </div>
                    <div className="list-body-item list-date">
                        {moment(e.logdate).format("YYYY-MM-DD HH:mm:ss")}
                        <div className="sub">{e.ua}/{e.ip}</div>
                    </div>
                </div>
            })}
            {logs.length == 0 ? <div className="empty-log">{translate("no_history")}</div> : null}
            <Pager max={Math.ceil(total_cnt/LIST_DISPLAY_COUNT)} cur={this.state.cur_log_page + 1 ||1} onClick={this.onClickLogPage} />
        </div>
    }

	render() {
        if(!this.props.user_info || !this.state.contract)
            return <div></div>

        let contract = this.state.contract
        let infos = this.state.infos

        let corp_id = this.props.user_info.corp_id || window.CONST.DUMMY_CORP_ID
        let me = select_subject(infos, this.state.groups, this.props.user_info.account_id, corp_id, contract.is_pin_used).my_info

        return <div className="contract-info-page">
            <div className="header-page">
                <div className="header">
                    <div className="left-icon">
                        <i className="fal fa-times" onClick={this.onClickBack}></i>
                    </div>
                    <div className="title">{translate("contract_detail_info")}</div>
                    { !!this.props.user_info ? <Information /> : null }
                </div>
                <div className="container">
                    <div className="content">
                        <div className="wrapper">
                            <div className="top">
                                <div className="title">{this.state.contract.name}</div>
                            </div>
                            <div className="date">
                                {translate("last_updated_date")} : {moment(this.state.contract.updatedAt).format("YYYY-MM-DD HH:mm:ss")}<br/>
                                {translate("contract_regist_date")} : {moment(this.state.contract.addedAt).format("YYYY-MM-DD HH:mm:ss")}
                            </div>
                            <div className="buttons">
                                <div className="flex1">&nbsp;</div>
                                {/*<div className="blue-button" onClick={(e)=>history.push({pathname:"/e-contract/add-contract", state:{contract_id:this.state.contract.contract_id}})}>{translate("modify_information")}</div>*/}
                                <div className="blue-button" onClick={(e)=>history.push(`/e-contract/edit-contract/${this.state.contract.contract_id}`)}>{this.state.contract.status != 2 ? translate("edit"):translate("view_contract")}</div>
                                <div className="blue-button" onClick={this.onClickDownload}>{translate("download")}</div>
                                { (this.state.contract.status != 2 && me.privilege == 1 && me.corp_id == window.CONST.DUMMY_CORP_ID) ? <div className="red-button" onClick={this.onRemoveContractSelf}>{translate("get_off_this_contract")}</div> : null}
                                {/*<div className="transparent-button">설정</div>*/}
                            </div>
                            <div className="indicator">
                                <div className="corner-line enable-line"></div>
                                <div className="circle enable-circle"></div>
                                <div className="line enable-line"></div>
                                <div className="circle enable-circle"></div>
                                <div className={"line " + (this.state.contract.status > 0 ? "enable-line" : "")}></div>
                                <div className={"circle " + (this.state.contract.status > 0 ? "enable-circle" : "")}></div>
                                <div className={"line " + (this.state.contract.status > 1 ? "enable-line" : "")}></div>
                                <div className={"circle " + (this.state.contract.status > 1 ? "enable-circle" : "")}></div>
                                <div className="corner-line"></div>
                            </div>
                            <div className="step-text">
                                <div className="corner-space"></div>
                                <div className="item enable-item">{translate("contract_info_register")}</div>
                                <div className="space"></div>
                                <div className="item enable-item">{translate("status_0")}</div>
                                <div className="space"></div>
                                <div className={"item" + (this.state.contract.status > 0 ? " enable-item" : "")}>{translate("sign_waiting")}</div>
                                <div className="space"></div>
                                <div className={"item" + (this.state.contract.status > 1 ? " enable-item" : "")}>{translate("status_2")}</div>
                                <div className="corner-space"></div>
                            </div>

                            <div className="information-deck">
                                <div className="tab-container">
                                    <div className={"tab " + (this.state.select_tab == 0 ? "selected" : "")} onClick={e=>this.setState({select_tab:0})}>{translate("user")}</div>
                                    <div className={"tab " + (this.state.select_tab == 1 ? "selected" : "")} onClick={e=>this.setState({select_tab:1})}>{translate("detail_info")}</div>
                                    <div className={"tab " + (this.state.select_tab == 2 ? "selected" : "")} onClick={e=>this.setState({select_tab:2})}>{translate("history")}</div>
                                </div>
                                {this.render_information_deck()}
                            </div>

                            <div className="invitation-message">
                                <div className="title">{translate("invitation_message")}</div>
                                <div className="message">
                                    {this.state.contract.message || translate("no_invitation_message")}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="chat">
                        {this.state.chat_list.length > 0 ? <Chatting 
                            contract={this.state.contract}
                            infos={this.state.infos}
                            user_info={this.props.user_info}
                            groups={this.state.groups}
                            chat_list={this.state.chat_list}
                            onSend={this.onClickSendChat}
                            onLoadMore={this.onChatLoadMore}
                            isSendable={false}
                            chatType={"contract"}
                            initialize={(scrollBottom) => {
                                this.setState({scrollBottom})
                            }}
                        /> : null }
                    </div>
                </div>
            </div>
            <Footer />
		</div>
	}
}
