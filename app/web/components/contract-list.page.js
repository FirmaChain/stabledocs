import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Information from "./information.comp"
import Pager from "./pager"
import CheckBox from "./checkbox"
import TransactionBackgroundWork from "./transaction_background_work"
import CheckBox2 from "./checkbox2"
import history from '../history'
import Route from "./custom_route"
import moment from "moment"
import queryString from "query-string"
import translate from "../../common/translate"

import {
    decryptPIN,
    aes_encrypt,
} from "../../common/crypto_test"

import {
    get_contracts,
    get_contract,
    get_group_info,
    update_group_public_key,
    create_group,
    add_counterparties,
    update_epin_group,
    update_epin_account,
    update_contract_user_info,
    folder_list_contract,
    add_folder_contract,
    add_folder_in_contract,
    remove_folder_contract,
    change_folder_contract,
    remove_contract_self,
    get_lock_count,
    is_correct_pin,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        folders:state.contract.folders,
        user_info: state.user.info,
        contracts:state.contract.contracts,
        groups: state.group.groups,
	}
}

let mapDispatchToProps = {
    get_contracts,
    get_contract,
    get_group_info,
    update_group_public_key,
    create_group,
    add_counterparties,
    update_epin_group,
    update_epin_account,
    update_contract_user_info,
    folder_list_contract,
    add_folder_contract,
    add_folder_in_contract,
    remove_folder_contract,
    change_folder_contract,
    remove_contract_self,
    get_lock_count,
    is_correct_pin,
}

const LIST_DISPLAY_COUNT = 6

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {

	constructor(props) {
        super(props);
        this.state = {
            contracts_checks : [],
            showGroupMenu: false,
            showOptions: null,
            cur_page:0,
            lock_count:0,
        };
	}

	componentDidMount() {
        setTimeout(async () => {
            await this.onRefresh();
        })
	}

    onRefresh = async (nextProps) => {
        nextProps = !!nextProps ? nextProps : this.props

        let account_type = this.props.user_info.account_type
        let group_id = nextProps.match.params.group_id || null
        let params = queryString.parse(nextProps.location.search)

        if(account_type != 0) {
            let groups = await this.props.get_group_info(0)

            if(groups.length == 0) {
                if(account_type == 1) {
                    window.openModal("AddCommonModal", {
                        icon:"fas fa-users",
                        title:translate("add_first_group"),
                        subTitle:translate("add_first_group_desc_1"),
                        placeholder:translate("please_input_group_name"),
                        cancelable:false,
                        onConfirm: async (group_name) => {
                            let resp = await this.props.create_group(group_name);
                            await this.props.update_group_public_key(resp.group_id, this.props.user_info.corp_master_key);
                            
                            if(resp) {
                                await this.props.get_group_info(0)
                                await this.props.fetch_user_info()
                                alert(translate("success_group_add"))
                            }
                        }
                    })
                } else if(account_type == 2) {
                    window.logout()
                    alert(translate("no_group_what_you_have"))
                    history.replace("/e-contract/login")
                }
            } else if(!group_id) {
                if(groups) {
                    history.replace(`/e-contract/home/${groups[0].group_id}/all_recently`)
                }
            }
            await this.setState({groups})
        }
        let resp = await this.props.folder_list_contract(group_id)

        let lock_count = await this.props.get_lock_count(group_id)

        await this.setState({
            contracts_checks : [],
            showGroupMenu: false,
            showOptions: null,
            cur_page:Number(params.page) || 0,
            lock_count:lock_count.payload.count,
            search_text: params.search_text || "",
        })

        await this.loadContracts(Number(params.page) || 0, params.search_text || null, nextProps)
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.user_info === false) {
            history.replace("/e-contract/login")
        }

        let prevMenu = nextProps.match.params.menu || "all_recently"
        let menu = this.props.match.params.menu || "all_recently"

        let prev_group_id = nextProps.match.params.group_id || null
        let group_id = this.props.match.params.group_id || null


        let prev_page = queryString.parse(nextProps.location.search).page || 0
        let page = queryString.parse(this.props.location.search).page || 0 

        let prev_search_text = queryString.parse(this.props.location.search).search_text || ""
        let search_text = queryString.parse(nextProps.location.search).search_text || ""

        if(prevMenu != menu || prev_group_id != group_id 
            || prev_page != page || prev_search_text != search_text){
            (async()=>{
                await this.onRefresh(nextProps)
            })()
        }
    }

    loadContracts = async (page, search_text, props) => {
        props = !!props ? props : this.props

        let menu = props.match.params.menu || "all_recently"
        let group_id = props.match.params.group_id || -1

        let is_folder = false
        if(props.match.path.includes("/folder/")) is_folder = true

        let groups = []

        if(group_id != -1)
            groups = await this.props.get_group_info(0)

        await window.showIndicator()
        let result;
        if(menu == "all_recently") {
            result = await this.props.get_contracts(0, -1, page, LIST_DISPLAY_COUNT, -1, -1, this.props.user_info, groups, search_text)
        }
        else if(menu == "all_ing") {
            result = await this.props.get_contracts(0, 5, page, LIST_DISPLAY_COUNT, -1, -1, this.props.user_info, groups, search_text)
        }
        else if(menu == "all_completed") {
            result = await this.props.get_contracts(0, 2, page, LIST_DISPLAY_COUNT, -1, -1, this.props.user_info, groups, search_text)
        }
        else if(menu == "recently") {
            result = await this.props.get_contracts(0, -1, page, LIST_DISPLAY_COUNT, -1, group_id, this.props.user_info, groups, search_text)
        }
        else if(menu == "lock") {
            result = await this.props.get_contracts(3, -1, page, LIST_DISPLAY_COUNT, -1, group_id, this.props.user_info, groups, search_text)
        }
        else if(menu == "requested") {
            result = await this.props.get_contracts(2, -1, page, LIST_DISPLAY_COUNT, -1, group_id, this.props.user_info, groups, search_text)
        }
        else if(menu == "created") {
            result = await this.props.get_contracts(1, -1, page, LIST_DISPLAY_COUNT, -1, group_id, this.props.user_info, groups, search_text)
        }
        else if(menu == "typing") {
            result = await this.props.get_contracts(0, 0, page, LIST_DISPLAY_COUNT, -1, group_id, this.props.user_info, groups, search_text)
        }
        else if(menu == "beforeMySign") {
            result = await this.props.get_contracts(0, 1, page, LIST_DISPLAY_COUNT, 0, group_id, this.props.user_info, groups, search_text)
        }
        /*else if(menu == "beforeOtherSign") {
            result = await this.props.get_contracts(0, 1, page, LIST_DISPLAY_COUNT, 1, group_id, this.props.user_info, groups, search_text)
        }*/
        else if(menu == "completed") {
            result = await this.props.get_contracts(0, 2, page, LIST_DISPLAY_COUNT, -1, group_id, this.props.user_info, groups, search_text)
        }
        else if(menu == "view-group") {
            result = await this.props.get_contracts(0, 3, page, LIST_DISPLAY_COUNT, 0, group_id, this.props.user_info, groups, search_text)
        }
        else if(menu == "my-view") {
            result = await this.props.get_contracts(0, 3, page, LIST_DISPLAY_COUNT, 1, group_id, this.props.user_info, groups, search_text)
        }

        if(is_folder) {
            let folder_id = menu
            result = await this.props.get_contracts(4, folder_id, page, LIST_DISPLAY_COUNT, -1, group_id, this.props.user_info, groups, search_text)
        }

        await window.hideIndicator()

        return result
    }

	onClickAddContract = () => {
        window.openModal("StartContract",{
            is_approval:this.props.user_info.account_type != 0,
            onClick:async(type)=>{
                if(type == 1) {
                    history.push("/e-contract/add-contract")
                } else if(type == 2) {
                    history.push("/e-contract/template")
                } else if(type == 3) {
                    history.push("/e-contract/approval")
                }
            }
        })
	}

	getTitle(props) {
        props = !!props ? props : this.props

        let menu = props.match.params.menu || "all_recently"
		let group_id = props.match.params.group_id || null

        let is_folder = false
        if(props.match.path.includes("/folder/")) is_folder = true

        let result = {}

		if(menu == "lock") {
			result = { id:"lock", title : this.props.user_info.account_type != 0 ? translate("unclassified_contract"):translate("locked")}
        }
        else if(menu == "requested") {
            result = { id:"requested", title : translate("requested")}
        }
        else if(menu == "recently") {
            result = { id:"recently", title : translate("recently_use")}
        }
        else if(menu == "all_ing") {
            result = { id:"all_ing", title : translate("all_ing")}
        }
        else if(menu == "all_completed") {
            result = { id:"all_completed", title : translate("all_completed")}
        }
		else if(menu == "created") {
			result = { id:"created", title : translate("created")}
        }
		else if(menu == "typing") {
			result = { id:"typing", title : translate("status_0")}
		}
		else if(menu == "beforeMySign") {
			result = { id:"beforeMySign", title : translate("status_1")}
		}
		/*else if(menu == "beforeOtherSign") {
			result = { id:"beforeOtherSign", title : "상대방 서명 전"}
		}*/
		else if(menu == "completed") {
			result = { id:"completed", title : translate("status_2")}
		}
        else if(menu == "view-group") {
            result = { id:"view-group", title : translate("group_view_only")}
        }
		else if(menu == "my-view") {
			result = { id:"my-view", title : translate("individual_document_list")}
		}
		else
            result = { id:"all_recently", title : translate("all_recently")}

        if(is_folder) {
            if(menu == 0) {
                result = { id : "folder", folder_id: 0, title : translate("unclassified_contract_detail")}
            } else {
                let folder = this.props.folders.find(e=>e.folder_id == menu)
                if(folder) result = { id : "folder", folder_id: folder.folder_id, title : folder.subject}
            }
        }

        if(!!group_id) {
            let groups = this.props.groups ? this.props.groups : []
            for(let v of groups) {
                if(v.group_id == group_id) {
                    result.groupName = v.title
                }
            }
        }

        return result
	}

    onClickPage = async (page)=>{
    	if(this.state.cur_page == page - 1)
    		return;

        let params = queryString.parse(this.props.location.search)
        params.page = page - 1

        history.push({pathname:this.props.match.url, search:`?${queryString.stringify(params)}`})
    }

    move(pageName) {
        let group_id = this.props.match.params.group_id || null

        if(!!group_id)
            return history.push(`/e-contract/home/${group_id}/${pageName}`)

        return history.push(`/e-contract/home/${pageName}`)
    }

    moveGroup(group_id) {
        history.push(`/e-contract/home/${group_id}/${this.getTitle().id}`)
    }

    onClickOption(contract_id, e) {
        e.stopPropagation();
        if(this.state.showOption == contract_id) {
            return this.setState({
                showOption:null
            })
        }

        this.setState({
            showOption:contract_id
        })
    }

    onClickSign(contract_id, e) {
        e.stopPropagation();
        history.push(`/e-contract/edit-contract/${contract_id}`)
    }

    onClickSearch = async () => {
        if(!!this.state.search_text && this.state.search_text != "" && this.state.search_text.length < 2) {
            return alert(translate("please_input_search_query_more_2"))
        }

        if(!!this.state.search_text && this.state.search_text == "") {
            return history.push(this.props.match.url)
        }

        let params = queryString.parse(this.props.location.search)
        delete params.page
        params.search_text = this.state.search_text

        history.push({pathname:this.props.match.url, search:`?${queryString.stringify(params)}`})
    }

    onKeyPress = async (type, e) => {
        if(e.keyCode == 13){
            switch(type) {
                case "search":
                    await this.onClickSearch()
                    break;
            }
        }
    }

    onAddFolder = () => {
        window.openModal("AddCommonModal", {
            icon:"fas fa-folder",
            title:translate("add_folder"),
            subTitle:translate("new_folder_name"),
            placeholder:translate("please_input_folder_name"),
            onConfirm: async (folder_name) => {
                if(!folder_name || folder_name.trim() == "") {
                    return alert(translate("please_input_folder_name"))
                }
                let resp = await this.props.add_folder_contract(folder_name.trim(), this.props.match.params.group_id || null)

                if(resp) {
                    await this.props.folder_list_contract(this.props.match.params.group_id || null)
                }
            }
        })
    }

    onRemoveFolder = async (folder_id, folder_name) => {
        if( await window.confirm(translate("folder_delete"), translate("really_delete_this_?", [folder_name]) ) ){
            await this.props.remove_folder_contract([folder_id], this.props.match.params.group_id || null)
            await this.props.folder_list_contract(this.props.match.params.group_id || null)
        }
    }

    onMoveContract = async (contract_ids) => {
        let folders = this.props.folders

        if(folders.length == 0){
            return alert(translate("no_created_folder"))
        }

        await window.openModal("MoveToFolder",{
            contract_ids,
            folders,
            onClickMove:async(folder_id)=>{
                await window.showIndicator(translate("move_folder_contract"));
                await this.props.add_folder_in_contract(folder_id, contract_ids, this.props.match.params.group_id || null)
                await this.onRefresh()
                await window.hideIndicator();
                return true;
            }
        })
    }

    onRemoveContract = async (contract_ids, name) => {
        if(!window._confirm(translate("really_get_off_this_name_of_contract_?", [name]))) return;

        await window.showIndicator();
        let resp = await this.props.remove_contract_self(contract_ids[0]);
        if(resp.code == 1) {
            alert(translate("success_remove_contract_self"))
        } else {
            alert(translate("fail_remove_contract_self", [resp.code]))
        }
        await window.hideIndicator();
    }

    onClickGroupMenu = () => {
        this.setState({
            showGroupMenu: !this.state.showGroupMenu
        }) 
    }

    isOpenOption(contract_id) {
        return this.state.showOption == contract_id;
    }

    isOpenGroupMenu() {
        return this.state.showGroupMenu
    }

    checkBoard(contract_id) {
        let l = [...this.state.contracts_checks], isCheckAll = false

        let push_flag = true
        for(let i in l) {
            if(l[i] == contract_id) {
                l.splice(i, 1)
                push_flag = false
                break;
            }
        }

        if(push_flag)
            l.push(contract_id)

        this.setState({
            contracts_checks:l
        })
    }

    checkAll = () => {
        let contracts = this.props.contracts ? this.props.contracts : { list:[] }
        let check_list = contracts.list.map( (e) => e.contract_id )

        if(this.isCheckAll())
            check_list = []

        this.setState({
            contracts_checks:check_list
        })
    }

    isCheckAll = () => {
        let contracts = this.props.contracts ? this.props.contracts : { list:[] }
        return this.state.contracts_checks.length == contracts.list.length 
    }

    onChangeFolderName = async () => {

        window.openModal("AddCommonModal", {
            icon:"fas fa-folder",
            title:translate("change_contract_folder_name"),
            subTitle:translate("new_folder_name"),
            placeholder: translate("change_contract_folder_name_desc", [this.getTitle().title]),
            onConfirm: async (folder_name) => {
                if(!folder_name || folder_name.trim() == "") {
                    return alert(translate("please_input_folder_name"))
                }
                let resp = await this.props.change_folder_contract(this.getTitle().folder_id, folder_name.trim(), this.props.match.params.group_id || null)

                if(resp) {
                    await this.props.folder_list_contract(this.props.match.params.group_id || null)
                }
            }
        })
    }

    openContract = async (contract, type, select_tab = 0, e) => {
        e.stopPropagation()
        select_tab = select_tab ? select_tab : 0
        let move_info = {
            pathname:type==0 ? `/e-contract/contract-info/${contract.contract_id}` : `/e-contract/edit-contract/${contract.contract_id}`,
            state:{ select_tab }
        }
        if(this.props.user_info.account_type == 0 ) {
            if(contract.is_pin_used == 1 && contract.is_pin_null == 1) {
                let result = await new Promise(r=>window.openModal("TypingPin",{
                    onFinish:(pin)=>{
                        r(pin)
                    },
                }))
                if(!result) return;

                // pin 제대로 된지 확인
                let infos = [{
                    entity_id:contract.entity_id,
                    corp_id:contract.corp_id,
                    epin:contract.epin,
                    eckai:contract.eckai,
                }]
                let correct_pin = await this.props.is_correct_pin(contract, result, infos, this.props.user_info)
                if( correct_pin ) {
                    await this.props.update_epin_account(contract.contract_id, result);
                } else {
                    return alert(translate("u_input_wrong_pin_number"))
                }

                history.push(move_info)
            } else if(contract.is_pin_used == 0 || (contract.is_pin_used == 1 && contract.is_pin_null == 0)) {
                history.push(move_info)
            } 
        } else {
            let corps_id = contract.corps_id.split(",")
            let entities_id = contract.entities_id.split(",")

            let list = corps_id.map( (e, k) => {
                return {
                    corp_id:Number(e),
                    entity_id: Number(entities_id[k])
                }
            })

            let isGroup = false
            for(let v of list) {
                if(v.corp_id == this.props.user_info.corp_id) {
                    isGroup = v.entity_id
                    break
                }
            }

            let correct_pin, pin
            if(contract.is_pin_used == 1 && contract.is_pin_null == 1) {
                pin = await new Promise(r=>window.openModal("TypingPin",{
                    onFinish:(pin)=>{
                        r(pin)
                    },
                }))
                if(!pin) return

                let infos = [{
                    entity_id:contract.entity_id,
                    corp_id:contract.corp_id,
                    epin:contract.epin,
                    eckai:contract.eckai,
                }]
                correct_pin = await this.props.is_correct_pin(contract, pin, infos, this.props.user_info, this.state.groups)
                if( !correct_pin ) {
                    return alert(translate("u_input_wrong_pin_number"))
                    /*let user_info = {
                        user_type:1,
                        account_id: user.account_id,
                        username:user.username,
                        email:user.email,
                        public_key:user.publickey_contract,
                        company_name:user.company_name,
                    }
                    await this.props.update_contract_user_info(contract.contract_id, this.props.user_info.account_id, this.props.user_info.corp_id, user_info, this.props.user_info, true, correct_pin)*/
                }


                if(isGroup && contract.is_pin_used == 1) {
                    await this.props.update_epin_group(this.props.user_info.corp_id, isGroup, contract.contract_id, this.props.user_info, pin)
                    await this.props.update_epin_account(contract.contract_id, pin);
                } else if(contract.privilege == 2) {
                    await this.props.update_epin_account(contract.contract_id, pin);
                }
            }

            if(!isGroup && contract.privilege != 2) {
                let groups = await this.props.get_group_info(0)
                let data = groups.map((e) => {
                    return {
                        user_type:2,
                        corp_id: e.corp_id,
                        group_id : e.group_id,
                        title : e.title,
                        public_key : Buffer.from(e.group_public_key).toString("hex"),
                        company_name:this.props.user_info.company_name,
                        role:2,
                    }
                })
                let result = await new Promise(r=>window.openModal("OneAddModal", {
                    icon:"fal fa-users",
                    title:translate("add_contract_in_group"),
                    subTitle:translate("group_select"),
                    desc:translate("add_contract_in_group_desc_1"),
                    data,
                    onConfirm:async (group)=>{
                        // add_contract_info group
                        //let detail_contract = await this.props.get_contract(contract.contract_id, this.props.user_info, groups)
                        let result = await this.props.add_counterparties(contract.contract_id, [group], groups, this.props.user_info, [contract], contract.is_pin_used, pin)
                        
                        if(contract.is_pin_used == 1) {
                            await this.props.update_epin_account(contract.contract_id, pin);
                            await this.props.update_epin_group(group.corp_id, group.group_id, contract.contract_id, this.props.user_info, pin)
                        }
                        r(group)
                    },
                    onCancel: async () => {
                        r(false)
                    }
                }))
                if(!result) {
                    return alert(translate("add_contract_in_group_desc_2"))
                }
            }
            history.push(move_info)
        }
    }

    onClickOpenContract = async (contract, type = 0, e) => {
        await this.openContract(contract, type, 0, e)
    }

    render_contract_slot(e,k){
        let status_text = (status)=>{
            if(status == 0) {
                return translate("status_0")
            } else if(status == 1) {
                let sign_user = e.is_signature.split(",").map( (v, k) => {
                    return {
                        corp_id : e.corps_id.split(",")[k],
                        entity_id : e.entities_id.split(",")[k],
                        signature : v,
                    }
                }).find(v => {
                    return v.corp_id == 0 && v.entity_id == this.props.user_info.account_id
                })
                if(sign_user && sign_user.signature == "true") {
                    return translate("status_1_0")
                }
                return translate("status_1_1")
            } else if(status == 2) {
                return translate("status_2")
            } 
        }

        let usernames = ""
        if(typeof(e.user_infos) == "object") {
            usernames = e.user_infos.map(ee => ee.username).filter( ee => {return !!ee})
            usernames = usernames.join(", ")
        }

        let button_text = e.status == 2 ? translate("view") : translate("sign")

        // TODO view privilege

        return <div key={e.contract_id} className="item" onClick={this.onClickOpenContract.bind(this, e, 0)}>
            <div className="list-body-item list-chkbox">
                <CheckBox2 size={18}
                    on={this.state.contracts_checks.includes(e.contract_id) || false}
                    onClick={this.checkBoard.bind(this, e.contract_id)}/>
            </div>
            <div className="list-body-item list-name">
                {e.name}
                <div className="sub">{usernames}</div>
            </div>
            <div className="list-body-item list-status">
                {status_text(e.status)}
                <div className="sub">{/*새로운 메시지가 도착했습니다.*/}</div>
            </div>
            <div className="list-body-item list-date">{moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss")}</div>
            <div className="list-body-item list-action">
                <div className="button-container">
                    <div className={"action-button " + (e.status == 2 ? "action-transparent-but" : "action-blue-but")} onClick={this.onClickOpenContract.bind(this, e, 1)}>
                        {button_text}
                    </div>
                    <div className={"arrow-button " + (e.status == 2 ? "arrow-transparent-but" : "arrow-blue-but")} onClick={this.onClickOption.bind(this, e.contract_id)} >
                        <i className="fas fa-caret-down"></i>
                        <div className="arrow-dropdown" style={{display:!!this.isOpenOption(e.contract_id) ? "initial" : "none"}}>
                            <div className="container">
                                <div className="detail" onClick={this.openContract.bind(this, e, 0, 1)}>{translate("detail_info")}</div>
                                <div className="move" onClick={this.onMoveContract.bind(this, [e.contract_id])}>{translate("move_folder")}</div>
                                <div className="delete" onClick={this.onRemoveContract.bind(this, [e.contract_id], e.name)}>{translate("delete")}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }

	render() {

        let folders = this.props.folders ? this.props.folders : []
        let contracts = this.props.contracts ? this.props.contracts : { list:[] }
        let groups = this.props.groups ? this.props.groups : []

        let account_type = this.props.user_info.account_type
        let total_cnt = contracts.total_cnt

		return (<div className="contract-page">
			<div className="contract-group-menu">
				<div className="left-top-button" onClick={this.onClickAddContract}>{translate("create_contract")}</div>
				<div className="menu-list">
                    <div className="list">
                        <div className="title">{translate("contract")}</div>
                        <div className={"item" + (this.getTitle().id == "lock" ? " selected" : "")} onClick={this.move.bind(this, "lock")}>
                            <i className="icon fas fa-lock-alt"></i> 
                            <div className="text">{this.props.user_info.account_type != 0 ? translate("unclassified_contract"):translate("locked")}</div>
                            {this.state.lock_count > 0 ? <div className="count">{this.state.lock_count}</div> : null}
                        </div>
                        <div className={"item" + (this.getTitle().id == "all_recently" ? " selected" : "")} onClick={this.move.bind(this, "all_recently")}><i className="icon fal fa-clock"></i> <div className="text">{translate("all_recently")}</div></div>
                        <div className={"item" + (this.getTitle().id == "all_ing" ? " selected" : "")} onClick={this.move.bind(this, "all_ing")}><i className="icon fal fa-keyboard"></i> <div className="text">{translate("all_ing")}</div></div>
                        <div className={"item" + (this.getTitle().id == "all_completed" ? " selected" : "")} onClick={this.move.bind(this, "all_completed")}><i className="icon fas fa-handshake-alt"></i> <div className="text">{translate("all_completed")}</div></div>
                        { /*account_type != 0 ? <div className={"item" + (this.getTitle().id == "my-view" ? " selected" : "")} onClick={this.move.bind(this, "my-view")}>
                            <i className="icon far fa-eye"></i>
                            <div className="text">{translate("individual_document_list")}</div>
                        </div> : null*/ }
                    </div>
                    { account_type != 0 ? (<div className="list">
                        <div className="title">{translate("group_select")}</div>
                        <div className="item group-item" onClick={this.onClickGroupMenu}>
                            <div className="text">{this.getTitle().groupName}</div>
                            <i className={"angle far " + (!!this.isOpenGroupMenu() ? "fa-angle-down" : "fa-angle-up")}></i>
                        </div>
                        {groups.map( (e, k) => {
                            return <div className="item" key={e.group_id} onClick={this.moveGroup.bind(this, e.group_id)} style={{display:!!this.isOpenGroupMenu() ? "flex" : "none"}}>
                                <i className="icon fas fa-user-tie"></i>
                                <div className="text">{e.title}</div>
                            </div>
                        })}
                    </div>) : null
                    }
					{/*<div className="list">
						<div className="title">{translate("contract")}</div>
						<div className={"item" + (this.getTitle().id == "recently" ? " selected" : "")} onClick={this.move.bind(this, "recently")}><i className="icon fal fa-clock"></i> <div className="text">{translate("recently_use")}</div></div>
						<div className={"item" + (this.getTitle().id == "requested" ? " selected" : "")} onClick={this.move.bind(this, "requested")}><i className="icon fas fa-share-square"></i> <div className="text">{translate("requested")}</div></div>
					</div>*/}
					<div className="list">
						<div className="title">{translate("classify_view")}</div>
						<div className={"item" + (this.getTitle().id == "typing" ? " selected" : "")} onClick={this.move.bind(this, "typing")}><i className="icon fal fa-keyboard"></i> <div className="text">{translate("status_0")}</div></div>
						<div className={"item" + (this.getTitle().id == "beforeMySign" ? " selected" : "")} onClick={this.move.bind(this, "beforeMySign")}><i className="icon far fa-file-import"></i> <div className="text">{translate("status_1")}</div></div>
						{/*<div className={"item" + (this.getTitle().id == "beforeOtherSign" ? " selected" : "")} onClick={this.move.bind(this, "beforeOtherSign")}><i className="icon far fa-file-export"></i> <div className="text">상대방 서명 전</div></div>*/}
						<div className={"item" + (this.getTitle().id == "completed" ? " selected" : "")} onClick={this.move.bind(this, "completed")}><i className="icon fal fa-check-circle"></i> <div className="text">{translate("status_2")}</div></div>
                        <div className={"item" + (this.getTitle().id == "created" ? " selected" : "")} onClick={this.move.bind(this, "created")}><i className="icon fas fa-handshake-alt"></i> <div className="text">{translate("created")}</div></div>
                        {account_type != 0 ? <div className={"item" + (this.getTitle().id == "view-group" ? " selected" : "")} onClick={this.move.bind(this, "view-group")}><i className="icon fas fa-eye"></i> <div className="text">{translate("group_view_only")}</div></div> : null}
                        {account_type == 0 ? <div className={"item" + (this.getTitle().id == "my-view" ? " selected" : "")} onClick={this.move.bind(this, "my-view")}><i className="icon fas fa-eye"></i> <div className="text">{translate("viewer")}</div></div> : null}
					</div>
					<div className="list">
						<div className="title">
                            <div className="text">{translate("folder")}</div>
                            <i className="angle far fa-plus" onClick={this.onAddFolder}></i>
                        </div>
                        <div className={"item" + ( (this.getTitle().id == "folder" && this.getTitle().folder_id == 0) ? " selected" : "")} onClick={this.move.bind(this, `folder/0`)}>
                            <i className="fas icon fa-thumbtack" />
                            <div className="text">{translate("unclassified_contract_detail")}</div>
                        </div>
						{folders.map((e,k)=>{
                            let subject = e.subject
                            let folder_id = e.folder_id
                            return <div className={"item" + ( (this.getTitle().id == "folder" && this.getTitle().folder_id == folder_id) ? " selected" : "")} key={folder_id} onClick={this.move.bind(this, `folder/${folder_id}`)}>
                                <i className="icon fas fa-folder" />
                                <div className="text">{subject}</div>
                                <i className="angle fal fa-trash" onClick={this.onRemoveFolder.bind(this, folder_id, subject)}></i>
                            </div>
                        })}
					</div>
				</div>
			</div>
			<div className="contract-list">
                <div className="title">
                    {this.getTitle().title} &nbsp;
                    { (this.getTitle().id == "folder" && this.getTitle().folder_id != 0) ? <i className="fas fa-cog" onClick={this.onChangeFolderName}></i> : null }
                </div>
				<div className="search">
                    <input className="common-textbox" type="text"
                        placeholder={translate("please_input_search_query_more_2")}
                        onKeyDown={this.onKeyPress.bind(this, "search")}
                        value={this.state.search_text || ""}
                        onChange={e=>this.setState({search_text:e.target.value})}/>
                    <div className="blue-but" onClick={this.onClickSearch}>{translate("search")}</div>
                </div>
				<div className="list" style={{marginTop:"20px"}}>
                    <div className="head">
                        <div className="list-head-item list-chkbox">
                        	<CheckBox2 size={18}
                        		on={this.isCheckAll()}
                        		onClick={this.checkAll}/>
                        </div>
                        <div className="list-head-item list-name">{translate("contract_name")}</div>
                        <div className="list-head-item list-status">{translate("status")}</div>
                        <div className="list-head-item list-date">{translate("last_updated_date")}</div>
                        <div className="list-head-item list-action"></div>
                    </div>
                    {contracts.list.map((e,k)=>{
                        return this.render_contract_slot(e,k)
                    })}
                    {contracts.list.length == 0 ? <div className="empty-contract">{translate("no_contract")}</div> : null}
                </div>
                
                <Pager max={Math.ceil(total_cnt/LIST_DISPLAY_COUNT)} cur={this.state.cur_page + 1 ||1} onClick={this.onClickPage} />
			</div>
		</div>)
	}
}







