import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link, Prompt } from 'react-router-dom'
import history from '../history';
import pdfjsLib from "pdfjs-dist"
import translate from "../../common/translate"
import Information from "./information.comp"
import Footer from "./footer.comp"
import queryString from "query-string"

import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'
import CheckBox2 from "./checkbox2"

import {
    generateRandomKey,
} from "../../common/crypto_test"

import {
    fetch_user_info,
    list_template,
    select_userinfo_with_email,
    new_contract,
    get_group_info,
    update_epin_account,
    update_epin_group,
    get_template,
    get_approval,
    get_contract,
    genPIN,
} from "../../common/actions"

let mapDispatchToProps = {
    fetch_user_info,
    list_template,
    select_userinfo_with_email,
    new_contract,
    get_group_info,
    update_epin_account,
    update_epin_group,
    get_template,
    get_approval,
    get_contract,
}

let mapStateToProps = (state)=>{
    return {
        user_info:state.user.info
    }
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
        super();
        this.blockFlag = false
        this.is_register = false
        this.roles = [
            {value:0, label: translate("creator")},
            {value:1, label: translate("signer")},
            {value:2, label: translate("viewer")}
        ]

		this.state={
            target_list:[], // type 0 : 개인, type 1 : 기업 담당자, type 2 : 기업 그룹
            target_me:true,
            target_other:true,
            is_use_pin:false,
            contract_name:"",
            contract_message:"",
            individual:[{
                deletable:false,
                title:translate("individual_name"),
                force:true
            },{
                deletable:false,
                title:translate("individual_email"),
                force:true
            },{
                deletable:false,
                title:translate("individual_address"),
                force:true
            },{
                deletable:false,
                title:translate("individual_phone"),
                checked:false
            },{
                deletable:false,
                title:translate("individual_social_number"),
                checked:false
            }],
            corporation:[{
                deletable:false,
                title:translate("corporation_name"),
                force:true
            },{
                deletable:false,
                title:translate("corporation_duns"),
                force:true
            },{
                deletable:false,
                title:translate("corporation_address"),
                force:true
            },{
                deletable:false,
                title:translate("corporation_ceo_name"),
                force:true
            },{
                deletable:false,
                title:translate("corporation_manager_name"),
                checked:false
            },{
                deletable:false,
                title:translate("corporation_manager_email"),
                checked:false
            },{
                deletable:false,
                title:translate("corporation_manager_phone"),
                checked:false
            }]
        };
	}

	componentDidMount(){
        (async()=>{
            let user = await this.props.fetch_user_info()

            console.log("user", user)

            if(!user) {
                return history.push("/e-contract/login")
            }

            /*if(!!this.props.location.state && !!this.props.location.state.contract_id) {
                await this.edit_initialize(user);
            } else {*/
                await this.initialize(user);
            //}
        })()


        history.block( (targetLocation) => {
            if(this.blockFlag)
                return true
            let out_flag = window._confirm(translate("you_really_leave_this_page_contract"))
            if(out_flag)
                history.block( () => true )
            return out_flag
        })
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
        }
    }

    edit_initialize = async (user) => {
        let contract_id = this.props.location.state.contract_id;
        let resp, groups;
        if(this.props.user_info.account_type != 0) {
            groups = await this.props.get_group_info(0)
            resp = await this.props.get_contract(contract_id, this.props.user_info, groups)
        } else {
            resp = await this.props.get_contract(contract_id, this.props.user_info)
        }
        delete resp.payload.logs
        let contract = resp.payload.contract
        let infos = resp.payload.infos

        let target_list = infos.map( (e) => {
            let user_type = e.account_type == 0 ? 0 : 1
            if(e.account_type == null)
                user_type = 2;

            let role = [e.privilege]
            if(contract.account_id == e.entity_id && e.corp_id == 0)
                role.unshift(0);

            let user

            if(e.corp_id == 0) {
                user = {
                    user_type:user_type,
                    account_id: e.entity_id,
                    username:e.user_info.username,
                    email:e.user_info.email,
                    public_key:Buffer.from(e.publickey_contract).toString("hex"),
                    role:role,
                }
            } else if(e.corp_id > 0) {
                user = {
                    user_type:user_type,
                    corp_id:e.corp_id,
                    group_id:e.entity_id,
                    title:e.user_info.title,
                    public_key:Buffer.from(e.user_info.public_key).toString("hex"),
                    role:role,
                }
            }

            if(e.user_info.company_name)
                user.company_name = e.user_info.company_name

            return user
        })

        let _ = {
            data:{...resp.payload},
            contract_name:contract.name,
            contract_message:contract.message,
            can_edit_account_id:contract.can_edit_account_id,
            payer_account_id:contract.payer_account_id,
            edit_mode:true,
            target_list:target_list,
        }

        if(contract.is_pin_used == 1) {
            _.is_use_pin = true;
            _.pin_number = contract.pin; 
        }

        let individual = [...this.state.individual]
        for(let v of contract.necessary_info.individual) {
            if( !this.state.individual.map(e=>e.title).includes(v) ) {
                individual.push({
                    deletable:true,
                    title:v.title,
                    checked:true
                })
            }
        }
        let corporation = [...this.state.corporation]
        for(let v of contract.necessary_info.corporation) {
            if( !this.state.corporation.map(e=>e.title).includes(v) ) {
                corporation.push({
                    deletable:true,
                    title:v.title,
                    checked:true
                })
            }
        }

        _.individual = individual;
        _.corporation = corporation;

        await this.setState(_)
    }

    initialize = async (user) => {
        let params = queryString.parse(this.props.location.search)

        if(user.account_type == 0) {
            this.setState({
                can_edit_account_id:this.props.user_info.account_id,
                payer_account_id:this.props.user_info.account_id,
                target_list:[{
                    user_type:0,
                    account_id: user.account_id,
                    username:user.username,
                    email:user.email,
                    public_key:user.publickey_contract,
                    role:[0, 1],
                }]
            })
        } else if(user.account_type == 1 || user.account_type == 2) {
            this.setState({
                can_edit_account_id:this.props.user_info.account_id,
                payer_account_id:this.props.user_info.account_id,
                target_list:[{
                    user_type:1,
                    account_id: user.account_id,
                    username:user.username,
                    email:user.email,
                    public_key:user.publickey_contract,
                    company_name:user.company_name,
                    role:[0, 1],
                }]
            })
        } else {

        }

        if( params.template_id && !isNaN(params.template_id) ) {
            let template = await this.props.get_template(params.template_id, this.props.user_info.corp_key || null)
            this.setState({
                template
            })
        }

        if( params.approval_id && !isNaN(params.approval_id) ) {
            let approval = await this.props.get_approval(params.approval_id, this.props.user_info.corp_key || null)
            if(approval.payload.approval.status != window.CONST.APPROVAL_STATUS.COMPLETED) {
                alert(translate("no_completed_approval_use_contract"))
                this.blockFlag = true
                return history.goBack();
            }
            this.setState({
                approval:approval.payload.approval
            })
        }
    }

    getRole(value) {
        for(let v of this.roles) {
            if(v.value == value)
                return v
        }
        return null;
    }

    getRoleText(roles) {
        let str = ""

        for(let v of roles) {
            if(v == 0) {
                str += translate("creator") + "\n"
            } else if(v == 1) {
                str += translate("signer") + "\n"
            } else if(v == 2) {
                str += translate("viewer") + "\n"
            }
        }
        return str.trim().replace(/\n/g, ", ");
    }

    onClickBack = ()=>{
        history.goBack();
    }

    onClickAdd = async ()=>{
        if(!this.state.add_email)
            return alert(translate("please_input_email"))
        if(!this.state.add_role)
            return alert(translate("please_select_role"))

        if( !window.email_regex.test(this.state.add_email) )
            return alert(translate("incorrect_email_expression"))

        let resp = await this.props.select_userinfo_with_email(this.state.add_email)

        if(resp){

            for(let v of this.state.target_list) {
                if( !!v.account_id && v.account_id == resp.account_id ) {
                    return alert(translate("already_add_user"))
                }
            }
            let info = {
                user_type:resp.account_type != 0 ? 1 : 0,
                username:resp.username,
                email:resp.email,
                account_id:resp.account_id,
                role:[this.state.add_role],
                public_key:resp.publickey_contract,
            }

            this.setState({
                target_list:[...this.state.target_list, info],
                add_email:""
            })
        }else{

            window.openModal("NoSignUserAdd", {
                email:this.state.add_email,
                email_enable: false,
                onConfirm: async (data)=>{

                    for(let v of this.state.target_list) {
                        if( !!v.email && v.email == data.email ) {
                            return alert(translate("already_add_user"))
                        }
                    }

                    let info = {
                        user_type:-1,
                        username:data.name,
                        email:data.email,
                        cell_phone_number:data.cell_phone_number,
                        role:[this.state.add_role],
                        contract_open_key:generateRandomKey(16),
                    }

                    this.setState({
                        target_list:[...this.state.target_list, info],
                        add_email:""
                    })
                }
            })
        }
    }

    onToggleSignInfo = (name, k)=>{
        this.state[name][k].checked = !this.state[name][k].checked;
        this.setState({
            [name]:[...this.state[name]]
        })
    }

    /*onClickAddCorporation = ()=>{
        if(!this.state.add_corporation_info){
            return alert(translate("please_input_name_of_this"))
        }

        this.setState({
            corporation:[...this.state.corporation,{
                title:this.state.add_corporation_info,
                checked:true,
                deletable:true
            }],
            add_corporation_info:""
        })
    }

    onClickAddIndivisual = () => {
        if(!this.state.add_individual_info){
            return alert(translate("please_input_name_of_this"))
        }

        this.setState({
            individual:[...this.state.individual,{
                title:this.state.add_individual_info,
                checked:true,
                deletable:true
            }],
            add_individual_info:""
        });
    }*/

    onClickRegister = async () => {
        if(this.is_register)
            return
        
        this.is_register = true

        if(this.state.can_edit_account_id == null) {
            this.is_register = false
            return alert(translate("please_set_edit_privilege"))
        }

        if(this.state.payer_account_id == null) {
            this.is_register = false
            return alert(translate("please_set_payer"))
        }

        if(this.state.is_use_pin) {
            if(this.state.pin_number == "" || this.state.pin_number.length != 6) {
                this.is_register = false
                return alert(translate("please_input_pin"))
            } else if(this.state.pin_number == "000000") {
                this.is_register = false
                return alert(translate("you_dont_set_pin_000000"))
            }
        }

        if(!this.state.contract_name || this.state.contract_name.trim() == "") {
            this.is_register = false
            return alert(translate("please_input_contract_name"))
        }

        this.blockFlag = true;

        let contract_name = this.state.contract_name.trim();
        let contract_message = this.state.contract_message ? this.state.contract_message.trim() : null;

        if(contract_name.length > 80) {
            this.blockFlag = false;
            this.is_register = false;
            return alert(translate("contract_name_must_be_80_letters"));
        }

        let counterparties = this.state.target_list.map(e=> {
            let role;
            for(let v of e.role) {
                if(v != 0) {
                    role = v;
                    break;
                }
            }
            return {
                ...e,
                role,
            };
        });

        let includeGroup = false;
        for( let v of counterparties ) {
            if( v.user_type == 2 ) {
                includeGroup = true;
                break;
            }
        }

        if(this.props.user_info.account_type != 0 && includeGroup == false) {
            this.blockFlag = false;
            this.is_register = false
            return alert(translate("if_corporation_account_at_least_one_group"));
        }


        let individual_info = this.state.individual.filter(e=>e.force||e.checked).map(e=>e.title);
        let corporation_info = this.state.corporation.filter(e=>e.force||e.checked).map(e=>e.title);

        let necessary_info = {individual: individual_info, corporation: corporation_info};
        let is_pin_used = this.state.is_use_pin;
        let pin = is_pin_used ? this.state.pin_number : "000000";

        if(!!this.state.edit_mode) {
            console.log("asdasdasds")

        } else {
            let pre_model = null;
            if(this.state.template) {
                pre_model = Buffer.from(this.state.template.html).toString()
            }
            else if(this.state.approval) {
                pre_model = Buffer.from(this.state.approval.html).toString()   
            }

            await window.showIndicator();

            let resp =  await this.props.new_contract(contract_name, this.props.user_info.email, contract_message, counterparties, pin, necessary_info, this.state.can_edit_account_id, this.state.payer_account_id, !!is_pin_used ? 1 : 0, pre_model);
            console.log(resp)
            if(resp.code == 1) {
                let contract_id = resp.payload.contract_id
                if (is_pin_used) {
                    await this.props.update_epin_account(contract_id, pin);
                    if( includeGroup ) {
                        for( let v of counterparties ) {
                            if( v.user_type == 2 && v.corp_id == this.props.user_info.corp_id ) {
                                await this.props.update_epin_group(v.corp_id, v.group_id, contract_id, this.props.user_info, pin)
                            }
                        }
                    }
                }
                history.replace(`/e-contract/edit-contract/${contract_id}`)
            } else {
                alert(translate("fail_register_contract"))
            }
            await window.hideIndicator();
        }
        
        this.is_register = false

    }

    onViewTemplate = () => {
        if(!this.state.template)
            return;

        window.openModal("PreviewContract",{
            title: this.state.template.subject,
            model: Buffer.from(this.state.template.html).toString(),
        })
    }

    onViewApproval = () => {
        if(!this.state.approval)
            return;

        window.openModal("PreviewContract",{
            title: this.state.approval.name,
            model: Buffer.from(this.state.approval.html).toString(),
        })
    }

    onClickRemoveCounterparty = (k, e)=>{
        let _list = [...this.state.target_list]
        _list.splice(k,1)
        if(e.account_id == this.state.can_edit_account_id)
            this.setState({can_edit_account_id:this.props.user_info.account_id})
        this.setState({
            target_list:_list
        })
    }

    onClickRemoveSignInfo = (name, k)=>{
        this.state[name].splice(k,1);
        this.setState({
            [name]:[...this.state[name]]
        })
    }

    onAddGroup = async () => {
        let data = await this.props.get_group_info(0)
        data = data.map((e) => {
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
            onConfirm:(group)=>{
                for(let v of this.state.target_list) {
                    if( !!v.corp_id && !!v.group_id && v.corp_id == group.corp_id && v.group_id == group.group_id && v.is_exclude == 0) {
                        return alert(translate("already_add_group"))
                    }
                }

                this.setState({
                    target_list:[...this.state.target_list, group]
                })
            }
        })
    }

    openServiceNoRegisterModal = () => {
        window.openModal("CommonModal", {
            icon:"fal fa-user-slash",
            title:translate("service_unregister_user"),
            subTitle:translate("u_need_register_for_legal_validity"),
            desc:translate("unregister_user_add_contract_popup_desc"),
            onClose:()=>{
            }
        })
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
                //this.onClickAddIndivisual()
                break;
                case 1:
                //this.onClickAddCorporation()
                break;
            }
        }
    }

	render() {
        if(!this.props.user_info)
            return <div></div>

        let _roles = this.roles.filter( (e, k) => k != 0 )

        return (<div className="upsert-contract-group-page header-page">
            <div className="header">
                <div className="left-logo">
                    <img src="/static/logo_blue.png" onClick={()=>history.push("/e-contract/home")}/>
                </div>
                { !!this.props.user_info ? <Information /> : null }
            </div>
            <div className="head">
                <span className="back" onClick={()=> history.goBack()}>
                    <i className="fal fa-chevron-left"></i> <span>{translate("go_back")}</span>
                </span>
                <div className="text">{!!this.state.edit_mode ? translate("modify_contract_info") : translate("register_contract_info")}</div>
            </div>
            <div className="content">
                <div className="row">
                    <div className="left-desc">
                        <div className="desc-head">{translate("input_contract_name")}</div>
                        <div className="desc-content">{translate("please_input_this_contract_name")}</div>
                    </div>
                    <div className="right-form">
                        <div className="column">
                            <div className="form-head"></div>
                            <div className="form-input">
                                <input className="common-textbox" type="text"
                                    value={this.state.contract_name || ""}
                                    placeholder={translate("please_input_this_contract_name")}
                                    onChange={e=>this.setState({contract_name:e.target.value})}/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="left-desc">
                        <div className="desc-head">{translate("input_contract_message")}</div>
                        <div className="desc-content">{translate("please_input_this_contract_message")}</div>
                    </div>
                    <div className="right-form">
                        <div className="column">
                            <div className="form-head"></div>
                            <div className="form-input">
                                <textarea className="common-textbox common-textarea"
                                    rows="4"
                                    value={this.state.contract_message || ""}
                                    placeholder={translate("please_input_this_contract_message")}
                                    onChange={e=>this.setState({contract_message:e.target.value})}></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {this.state.template ? <div className="row">
                    <div className="left-desc">
                        <div className="desc-head">{translate("selected_template")}</div>
                        <div className="desc-content">{translate("use_template_this_contract")}</div>
                    </div>
                    <div className="right-form">
                        <div className="column">
                            <div className="form-head"></div>
                            <div className="form-input">
                                <input className="common-textbox" type="text"
                                    value={this.state.template.subject || ""}
                                    disabled />
                            </div>
                        </div>
                        <div className="column">
                            <div className="form-head"></div>
                            <div className="form-input">
                                <div className="btn-add-user btn-add-user-active" onClick={this.onViewTemplate}>{translate("preview_template")}</div>
                            </div>
                        </div>
                    </div>
                </div> : null}


                {this.state.approval ? <div className="row">
                    <div className="left-desc">
                        <div className="desc-head">{translate("selected_approval")}</div>
                        <div className="desc-content">{translate("use_approval_this_contract")}</div>
                    </div>
                    <div className="right-form">
                        <div className="column">
                            <div className="form-head"></div>
                            <div className="form-input">
                                <input className="common-textbox" type="text"
                                    value={this.state.approval.name || ""}
                                    disabled />
                            </div>
                        </div>
                        <div className="column">
                            <div className="form-head"></div>
                            <div className="form-input">
                                <div className="btn-add-user btn-add-user-active" onClick={this.onViewApproval}>{translate("preview_approval")}</div>
                            </div>
                        </div>
                    </div>
                </div> : null}

                <div className="row">
                    <div className="left-desc">
                        <div className="desc-head">{translate("sign_object")}</div>
                        <div className="desc-content">{translate("select_sign_object_desc")}</div>
                    </div>
                    <div className="right-form">
                        <div className="column">
                            <div className="form-head"></div>
                            <div className="form-input">
                                <CheckBox2 on={this.state.target_me}
                                    size={18}
                                    disabled
                                    onClick={()=>this.setState({target_me:!this.state.target_me})}
                                    text={translate("me_name", [this.props.user_info.username])}/> &nbsp;&nbsp;&nbsp;&nbsp;
                                <CheckBox2 on={this.state.target_other}
                                    size={18}
                                    onClick={()=>this.setState({target_other:!this.state.target_other})}
                                    text={translate("another_signer")}/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="left-desc">
                        <div className="desc-head">{translate("security_setting")}</div>
                        <div className="desc-content">{translate("security_setting_desc")}</div>
                    </div>
                    <div className="right-form">
                        <div className="column">
                            <div className="form-head">{translate("security_setting_title")}</div>
                            <div className="form-input">
                                <CheckBox2 on={this.state.is_use_pin}
                                    size={18}
                                    onClick={()=>{
                                        this.setState({
                                            is_use_pin:!this.state.is_use_pin,
                                            pin_number:genPIN()
                                        })
                                    }}
                                    disabled={!!this.state.edit_mode}
                                    text={translate("pin_security_use")}/>
                            </div>
                        </div>
                        {this.state.is_use_pin ? <div className="column column-flex-2">
                            <div className="form-head">{translate("pin_set")}</div>
                            <div className="form-input">
                                <input className="common-textbox" id="pin" type="text"
                                    placeholder={translate("input_want_pin")}
                                    value={this.state.pin_number || ""}
                                    onChange={e=>{
                                        if(!isNaN(e.target.value) && e.target.value.length < 7)
                                            this.setState({pin_number:e.target.value})
                                    }}/>
                            </div>
                        </div> : null}
                    </div>
                </div>

                <div className="row" style={{display:this.state.target_other ? "flex" : "none"}}>
                    <div className="left-desc">
                        <div className="desc-head">{translate("user_add")}</div>
                        <div className="desc-content" dangerouslySetInnerHTML={{__html:translate("user_add_desc")}}></div>
                        {/*<div className="desc-link" onClick={this.openServiceNoRegisterModal}>{translate("unregister_user_enable_sign_?")}</div>*/}
                    </div>
                    <div className="right-form">
                        <div className="column column-flex-2">
                            <div className="form-head">{translate("user_email")}</div>
                            <div className="form-input">
                                <input className="common-textbox" id="email" type="email"
                                    placeholder={translate("please_input_email")}
                                    value={this.state.add_email || ""}
                                    onChange={e=>this.setState({add_email:e.target.value})}/>
                            </div>
                        </div>
                        <div className="column">
                            <div className="form-head">{translate("user_role")}</div>
                            <div className="form-input">
                                <Dropdown className="common-select"
                                    controlClassName="control"
                                    menuClassName="item"
                                    options={_roles}
                                    onChange={e=>{this.setState({add_role:e.value, add_role_label:e.label})}}
                                    value={this.state.add_role_label} placeholder={translate("user_role")} />
                                <div className={"btn-add-user" + ( (this.state.add_email || "").length==0? "" : " btn-add-user-active" )} onClick={this.onClickAdd}>{translate("add")}</div>
                            </div>
                        </div>
                    </div>
                </div>
                { (this.props.user_info.account_type != 0 && this.state.target_other) ?
                    <div className="row">
                        <div className="left-desc">
                        </div>
                        <div className="right-form small-right-form">
                            <div className="group-add-button" onClick={this.onAddGroup}>{translate("group_add")}</div>
                        </div>
                    </div> : null
                }

                <div className="row">
                    <div className="left-desc">
                    </div>
                    <div className="right-form">
                        <div className="column">
                            <div className="form-head">{translate("user_list")}</div>
                            <div className="form-list">
                                {this.state.target_list.map((e, k)=>{
                                    let removable = k != 0
                                    if(!!this.state.edit_mode && e.role.includes(1))
                                        removable = false
                                    return <div className="item padding-item" key={k}>
                                        <div className="icon">
                                        {
                                            (()=>{ switch(e.user_type) {
                                                case -1:
                                                    return <i className="fas fa-user-tag"></i>
                                                case 0:
                                                    return <i className="fas fa-user"></i>
                                                case 1:
                                                    return <i className="fas fa-user-tie"></i>
                                                case 2:
                                                    return <i className="fas fa-users"></i>
                                                break;
                                            } })()
                                        }
                                        </div>
                                        {
                                            (()=>{ switch(e.user_type) {
                                                case -1:
                                                    return <div className="desc">
                                                        <div className="username">{e.username}</div>
                                                        <div className="email">{e.email}</div>
                                                        <div className="cell-phone-number">{e.cell_phone_number}</div>
                                                        <div className="contract-open-key">
                                                            <span onClick={this.copyContractOpenKey.bind(this, e.contract_open_key)}>
                                                                <span className="front">{translate("unlock_contract_open_key")}</span> {`: ${e.contract_open_key}`} <span className="copy">{translate("copy")}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                case 0:
                                                    return <div className="desc">
                                                        <div className="username">{e.username}</div>
                                                        <div className="email">{e.email}</div>
                                                    </div>
                                                case 1:
                                                    return <div className="desc">
                                                        <div className="username">{e.username}<span>{e.company_name}</span></div>
                                                        <div className="email">{e.email}</div>
                                                    </div>
                                                case 2:
                                                    return <div className="desc">
                                                        <div className="username">#{e.title}<span>{e.company_name}</span></div>
                                                        <div className="email">&nbsp;</div>
                                                    </div>
                                            } })()
                                        }
                                        <div className="privilege">{this.getRoleText(e.role)}</div>
                                        <div className="can-edit">
                                            {e.user_type == -1 ? <div className="no-regist-user">{translate("not_regist_user")}</div> : null}
                                            {e.user_type != -1 ? <div className="box">
                                                <CheckBox2 size={18} disabled={e.role.includes(2) || e.user_type == -1}
                                                    on={this.state.can_edit_account_id == e.account_id}
                                                    onClick={ v => {
                                                        this.setState({can_edit_account_id:e.account_id})
                                                    }} />
                                                <div className="name">{translate("modify_privilege")}</div>
                                            </div> : null}
                                            {e.user_type != -1 ? <div className="box">
                                                <CheckBox2 size={18} disabled={e.role.includes(2) || e.user_type == -1}
                                                    on={this.state.payer_account_id == e.account_id}
                                                    onClick={ v => {
                                                        this.setState({payer_account_id:e.account_id})
                                                    }} />
                                                <div className="name">{translate("price_charge")}</div>
                                            </div> : null}
                                        </div>
                                        <div className="action">
                                            {removable ?
                                                <div className="delete" onClick={this.onClickRemoveCounterparty.bind(this, k, e)}>{translate("remove")}</div> : null
                                            }
                                        </div>
                                    </div>
                                })}
                            </div>
                            <div className="explain">{translate("privilege_desc")}</div>
                        </div>
                    </div>
                </div>

                {/*<div className="row">
                    <div className="left-desc">
                        <div className="desc-head">{translate("sign_info")}</div>
                        <div className="desc-content">{translate("sign_info_desc")}</div>
                    </div>
                    <div className="right-form align-normal">
                        <div className="checkbox-list">
                            <div className="form-head">{translate("individual_sign_info")}</div>
                            <div className="form-check-list">
                                {this.state.individual.map((e,k)=>{
                                    return <div className="item" key={k}>
                                        <CheckBox2 size={18} disabled={e.force} on={e.force || e.checked} onClick={this.onToggleSignInfo.bind(this,"individual",k)}/>
                                        <div className="name">{e.title}</div>
                                        {e.deletable ? <div className="delete" onClick={this.onClickRemoveSignInfo.bind(this,"individual", k)}><i className="fal fa-times"></i></div> : null}
                                    </div>
                                })}
                                <div className="bottom">
                                    <input className="text-box common-textbox"
                                        placeholder={translate("input_object")}
                                        type="text"
                                        value={this.state.add_individual_info || ""}
                                        onChange={e=>this.setState({add_individual_info:e.target.value})}
                                        onKeyDown={this.keyPress.bind(this, 0)}/>
                                    <div className="add-btn" onClick={this.onClickAddIndivisual}>
                                        <div>{translate("sign_info_add")}</div>
                                        <i className="fal fa-plus"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="checkbox-list">
                            <div className="form-head">{translate("corporation_sign_info")}</div>
                            <div className="form-check-list">
                                {this.state.corporation.map((e,k)=>{
                                    return <div className="item" key={k}>
                                        <CheckBox2 size={18} disabled={e.force} on={e.force || e.checked} onClick={this.onToggleSignInfo.bind(this,"corporation",k)}/>
                                        <div className="name">{e.title}</div>
                                        {e.deletable ? <div className="delete" onClick={this.onClickRemoveSignInfo.bind(this,"corporation", k)}><i className="fal fa-times"></i></div> : null}
                                    </div>
                                })}
                                <div className="bottom">
                                    <input className="text-box common-textbox"
                                        placeholder={translate("input_object")}
                                        type="text"
                                        value={this.state.add_corporation_info || ""}
                                        onChange={e=>this.setState({add_corporation_info:e.target.value})}
                                        onKeyDown={this.keyPress.bind(this, 1)}/>
                                    <div className="add-btn" onClick={this.onClickAddCorporation}>
                                        <div>{translate("sign_info_add")}</div>
                                        <i className="fal fa-plus"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>*/}

                <div className="bottom-container">
                    <div className="regist-contract" onClick={this.onClickRegister}>{!!this.state.edit_mode ? translate("modify_space") : translate("register_space")}</div>
                </div>
            </div>
            <Footer />
		</div>);
	}
}
