import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import CheckBox2 from "./checkbox2"
import translate from "../../common/translate"
import Pager from "./pager"
import history from '../history';
import moment from "moment"
import queryString from "query-string"


import {
    new_approval,
    list_approval,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        user_info:state.user.info,
        approvals:state.approval.approvals,
	}
}

let mapDispatchToProps = {
    new_approval,
    list_approval,
}

const LIST_DISPLAY_COUNT = 6

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
            cur_page:0,
            showOptions: null,
            approval_checks:[]
        }
	}

	componentDidMount(){
        (async()=>{
            await window.showIndicator()
            await this.onRefresh()
            await window.hideIndicator()
        })()
    }

    onRefresh = async (nextProps) => {
        nextProps = !!nextProps ? nextProps : this.props

        let params = queryString.parse(nextProps.location.search)

        await this.setState({
            approval_checks : [],
            showGroupMenu: false,
            showOptions: null,
            cur_page:Number(params.page) || 0,
            search_text: params.search_text || "",
        })
        await this.props.list_approval(this.getTitle(nextProps).type, Number(params.page) || 0, params.search_text || null, LIST_DISPLAY_COUNT, this.props.user_info.corp_key || null)
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.user_info === false) {
            history.replace("/e-contract/login")
        }

        let prevMenu = nextProps.match.params.menu || "all"
        let menu = this.props.match.params.menu || "all"

        let prev_page = queryString.parse(nextProps.location.search).page || 0
        let page = queryString.parse(this.props.location.search).page || 0 

        let prev_search_text = queryString.parse(this.props.location.search).search_text || ""
        let search_text = queryString.parse(nextProps.location.search).search_text || ""


        if(prevMenu != menu || prev_page != page || prev_search_text != search_text) {
            this.onRefresh(nextProps)
        }
    }

    onClickAddApproval = () => {
        history.push("/e-contract/add-approval")
    }

    move = (folder_id) => {
        history.push(`/e-contract/approval/${folder_id}`)
    }

    isOpenOption(approval_id) {
        return this.state.showOption == approval_id;
    }

    onClickOption(approval_id, e) {
        e.stopPropagation()

        if(this.state.showOption == approval_id) {
            return this.setState({
                showOption:null
            })
        }

        this.setState({
            showOption:approval_id
        })
    }

    getTitle(props) {
        props = !!props ? props : this.props

        let menu = props.match.params.menu || "all"
        let folders = props.folders ? props.folders : []

        if( menu == "draft") {
            return { type:1, id:"draft", title : translate("draft")}
        }
        else if( menu == "ing_approval") {
            return { type:2, id:"ing_approval", title : translate("ing_approval")}
        }
        else if( menu == "completed_approval") {
            return { type:3, id:"completed_approval", title : translate("completed_approval")}
        }
        else if( menu == "my_confirm") {
            return { type:4, id:"my_confirm", title : translate("my_confirm")}
        }
        else if( menu == "rejected") {
            return { type:5, id:"rejected", title : translate("rejected")}
        }
        else {
            return { type:0, id:"all", title : translate("all_approval")}
        }
    } 

    checkApproval(approval_id) {
        let l = [...this.state.approval_checks], isCheckAll = false

        let push_flag = true
        for(let i in l) {
            if(l[i] == approval_id) {
                l.splice(i, 1)
                push_flag = false
                break;
            }
        }

        if(push_flag)
            l.push(approval_id)

        this.setState({
            approval_checks:l
        })
    }

    onClickSearch = async () => {
        if(!!this.state.search_text && this.state.search_text != "" && this.state.search_text.length < 2) {
            return alert(translate("please_input_search_query_more_2"))
        }

        if(!this.state.search_text || (!!this.state.search_text && this.state.search_text == "") ) {
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

    onClickPage = async (page)=>{
        if(this.state.cur_page == page - 1)
            return;

        let params = queryString.parse(this.props.location.search)
        params.page = page - 1

        history.push({pathname:this.props.match.url, search:`?${queryString.stringify(params)}`})
    }

    checkAll = () => {
        let approvals = this.props.approvals ? this.props.approvals : { list:[] }
        let check_list = approvals.list.map( (e) => e.approval_id )

        if(this.isCheckAll())
            check_list = []

        this.setState({
            approval_checks:check_list
        })
    }

    isCheckAll = () => {
        let approvals = this.props.approvals ? this.props.approvals : { list:[] }
        return this.state.approval_checks.length == approvals.list.length 
    }

    useApproval = (approval_id, e) => {
        e.stopPropagation();
        history.push({pathname:"/e-contract/add-contract", search:"?approval_id="+approval_id})
    }

    render_approval_slot(e, k) {
        let status_text
        switch(e.status) {
            case window.CONST.APPROVAL_STATUS.DRAFT:
                status_text = translate("draft")
                break;
            case window.CONST.APPROVAL_STATUS.ING_APPROVAL:
                status_text = translate("ing_approval")
                break;
            case window.CONST.APPROVAL_STATUS.COMPLETED:
                status_text = translate("completed_approval")
                break;
            case window.CONST.APPROVAL_STATUS.REJECTED:
                status_text = translate("rejected")
                break;
        }
        return <div className="item" key={e.approval_id} onClick={()=>history.push(`/e-contract/edit-approval/${e.approval_id}`)}>
            <div className="list-body-item list-chkbox">
                <CheckBox2 size={18}
                    on={this.state.approval_checks.includes(e.approval_id) || false}
                    onClick={this.checkApproval.bind(this, e.approval_id)}/>
            </div>
            <div className="list-body-item list-name">
                {e.name}
            </div>
            <div className="list-body-item list-status">{status_text}</div>
            <div className="list-body-item list-date">{moment(e.addedAt).format("YYYY-MM-DD HH:mm:ss")}</div>
            <div className="list-body-item list-action">
                <div className="button-container">
                    {e.status == window.CONST.APPROVAL_STATUS.COMPLETED ? 
                        <div className="action-button action-blue-but" onClick={this.useApproval.bind(this, e.approval_id)}>{translate("use")}</div> : 
                        <div className="action-button action-transparent-but" onClick={()=>history.push(`/e-contract/edit-approval/${e.approval_id}`)}>{translate("view")}</div>
                    }
                    <div className={`arrow-button ${e.status == window.CONST.APPROVAL_STATUS.COMPLETED ? "arrow-blue-but":"arrow-transparent-but"}`} onClick={this.onClickOption.bind(this, e.approval_id)} >
                        <i className="fas fa-caret-down"></i>
                        <div className="arrow-dropdown" style={{display:!!this.isOpenOption(e.approval_id) ? "initial" : "none"}}>
                            <div className="container">
                                <div className="move">{translate("remove")}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }

	render() {
        let approvals = this.props.approvals ? this.props.approvals : { list:[] }
        let total_cnt = approvals.total_cnt
        let page_num = approvals.page_num

		return (<div className="approval-page">
            <div className="contract-group-menu">
                <div className="left-top-button" onClick={this.onClickAddApproval}>{translate("approval_generate")}</div>
                <div className="menu-list">
                    <div className="list">
                        <div className="title">
                            <div className="text">{translate("approval")}</div>
                        </div>
                        <div className={"item" + (this.getTitle().id == "all" ? " selected" : "")} onClick={this.move.bind(this, "")}>
                            <i className="icon fal fa-clock"></i>
                            <div className="text">{translate("all_approval")}</div>
                        </div>
                        <div className={"item" + (this.getTitle().id == "draft" ? " selected" : "")} onClick={this.move.bind(this, "draft")}>
                            <i className="icon fal fa-keyboard"></i>
                            <div className="text">{translate("draft")}</div>
                        </div>
                        <div className={"item" + (this.getTitle().id == "ing_approval" ? " selected" : "")} onClick={this.move.bind(this, "ing_approval")}>
                            <i className="icon far fa-file-import"></i>
                            <div className="text">{translate("ing_approval")}</div>
                        </div>
                        <div className={"item" + (this.getTitle().id == "completed_approval" ? " selected" : "")} onClick={this.move.bind(this, "completed_approval")}>
                            <i className="icon fal fa-check-circle"></i>
                            <div className="text">{translate("completed_approval")}</div>
                        </div>
                        <div className={"item" + (this.getTitle().id == "my_confirm" ? " selected" : "")} onClick={this.move.bind(this, "my_confirm")}>
                            <i className="icon fal fa-check-square"></i>
                            <div className="text">{translate("my_confirm")}</div>
                        </div>
                        <div className={"item" + (this.getTitle().id == "rejected" ? " selected" : "")} onClick={this.move.bind(this, "rejected")}>
                            <i className="icon fal fa-vote-nay"></i>
                            <div className="text">{translate("rejected")}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="contract-list">
                <div className="title">
                    { this.getTitle().title }
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
                        <div className="list-head-item list-name">{translate("approval_name")}</div>
                        <div className="list-head-item list-status">{translate("status")}</div>
                        <div className="list-head-item list-date">{translate("create_date")}</div>
                        <div className="list-head-item list-action"></div>
                    </div>
                    {approvals.list.map((e,k)=>{
                        return this.render_approval_slot(e,k)
                    })}
                    {approvals.list.length == 0 ? <div className="empty-contract">{translate("not_approval")}</div> : null}
                </div>
                
                <Pager max={Math.ceil(total_cnt/page_num)} cur={this.state.cur_page||1} onClick={this.onClickPage} />
            </div>
        </div>);
	}
}
