import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import CheckBox2 from "./checkbox2"
import translate from "../../common/translate"
import Pager from "./pager"
import history from '../history';
import {
    remove_template,
    list_template,
    folder_list_template,
    add_folder_template,
    remove_folder_template,
    change_folder_template,
    fetch_user_info,
} from "../../common/actions"
import moment from "moment"

let mapStateToProps = (state)=>{
	return {
        folders:state.template.folders,
        templates:state.template.templates,
        user_info:state.user.info,
	}
}

let mapDispatchToProps = {
    remove_template,
    list_template,
    folder_list_template,
    add_folder_template,
    remove_folder_template,
    change_folder_template,
    fetch_user_info,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
            cur_page:1,
            showOptions: null,
            templates_checks:[]
        }
	}

	componentDidMount(){
        (async()=>{
            await window.showIndicator()
            await this.props.folder_list_template()
            await this.onRefresh()
            await window.hideIndicator()
        })()
    }

    onRefresh = async (nextProps) => {
        nextProps = !!nextProps ? nextProps : this.props
        await this.props.list_template(this.getTitle(nextProps).id, this.state.cur_page - 1, this.props.user_info.corp_key || null)
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.user_info === false) {
            history.replace("/e-contract/login")
        }

        let prevMenu = nextProps.match.params.menu || "all"
        let menu = this.props.match.params.menu || "all"
        if(prevMenu != menu){
            this.onRefresh(nextProps)
        }
    }

    onClickDelete = async()=>{
        let selected = Object.keys(this.state.templates_checks).filter(e=>this.state.templates_checks[e].template_id)
        if(selected.length == 0)
            return alert(translate("plase_choice_delete_template"))

        if(await window.confirm(translate("template_delete"), translate("template_delete_desc_1", [selected.length]) )){
            await window.showIndicator()
            await this.props.remove_template(selected)
            await this.onRefresh()
            await window.hideIndicator()
            
            alert(translate("template_delete_desc_2"))
        }
    }

    onClickPage = async(page)=>{
        if(this.state.cur_page == page)
            return;

        await this.onRefresh()
        this.setState({
            cur_page:page,
            templates_checks:[]
        })
    }
    onClickAddTemplate = () => {
        history.push("/e-contract/new-template")
    }

    onClickTemplate = (e)=>{
        history.push(`/e-contract/template-edit/${e.template_id}`)
    }

    onAddFolder = () => {
        window.openModal("AddCommonModal", {
            icon:"fas fa-folder",
            title:translate("add_template_folder"),
            subTitle:translate("new_folder_name"),
            placeholder:translate("please_input_folder_name"),
            onConfirm: async (folder_name) => {
                if(!folder_name || folder_name.trim() == "") {
                    return alert(translate("please_input_folder_name"))
                }
                let resp = await this.props.add_folder_template(folder_name.trim())

                if(resp) {
                    await this.props.folder_list_template()
                }
            }
        })
    }

    move = (folder_id) => {
        history.push(`/e-contract/template/${folder_id}`)
    }

    isOpenOption(template_id) {
        return this.state.showOption == template_id;
    }

    onClickOption(template_id, e) {
        e.stopPropagation()

        if(this.state.showOption == template_id) {
            return this.setState({
                showOption:null
            })
        }

        this.setState({
            showOption:template_id
        })
    }

    useTemplate = async (template_id, type, e) => {
        e.stopPropagation()
        if(type == 0)
            history.push({pathname:"/e-contract/add-contract", search:"?template_id="+template_id})
        else if(type == 1)
            history.push({pathname:"/e-contract/add-approval", search:"?template_id="+template_id})
    }

    async onRemoveTemplate(template_id, subject, e) {
        e.stopPropagation()

        if(await window.confirm(translate("template_delete"), translate("are_u_delete_template", [subject]) )) {
            await window.showIndicator()
            await this.props.remove_template([template_id])
            await this.onRefresh()
            await window.hideIndicator()
            alert(translate("are_u_delete_template_desc", [subject]))
        }
    }

    getTitle(props) {
        props = !!props ? props : this.props

        let menu = props.match.params.menu || "all"
        let folders = props.folders ? props.folders : []

        for(let v of folders) {
            if(menu == v.folder_id+"") {
                return { id:v.folder_id, title:v.subject}
            }
        }
        if(menu == "unclassified") {
            return { id:"unclassified", title : translate("not_classfication_template")}
        }
        return { id:"all", title : translate("all_template")}
    } 

    onRemoveFolder = async (folder_id, folder_name) => {
        if(await window.confirm(translate("template_folder_delete"), translate("template_folder_delete_desc", [folder_name]) )){
            await this.props.remove_folder_template([folder_id])
            history.push("/e-contract/template")
        }
    }

    onChangeFolderName = async () => {

        window.openModal("AddCommonModal", {
            icon:"fas fa-folder",
            title:translate("change_template_folder_name"),
            subTitle:translate("new_folder_name"),
            placeholder: translate("change_template_folder_name_desc", [this.getTitle().title]),
            onConfirm: async (folder_name) => {
                if(!folder_name || folder_name.trim() == "") {
                    return alert(translate("please_input_folder_name"))
                }
                let resp = await this.props.change_folder_template(this.getTitle().id, folder_name.trim())

                if(resp) {
                    await this.props.folder_list_template()
                }
            }
        })
    }

    checkTemplate(template_id) {
        let l = [...this.state.templates_checks], isCheckAll = false

        let push_flag = true
        for(let i in l) {
            if(l[i] == template_id) {
                l.splice(i, 1)
                push_flag = false
                break;
            }
        }

        if(push_flag)
            l.push(template_id)

        this.setState({
            templates_checks:l
        })
    }

    checkAll = () => {
        let templates = this.props.templates ? this.props.templates : { list:[] }
        let check_list = templates.list.map( (e) => e.template_id )

        if(this.isCheckAll())
            check_list = []

        this.setState({
            templates_checks:check_list
        })
    }

    isCheckAll = () => {
        let templates = this.props.templates ? this.props.templates : { list:[] }
        return this.state.templates_checks.length == templates.list.length 
    }

    render_template_slot(e, k) {
        return <div className="item" key={e.template_id} onClick={()=>history.push(`/e-contract/edit-template/${e.template_id}`)}>
            <div className="list-body-item list-chkbox">
                <CheckBox2 size={18}
                    on={this.state.templates_checks.includes(e.template_id) || false}
                    onClick={this.checkTemplate.bind(this, e.template_id)}/>
            </div>
            <div className="list-body-item list-name">
                {e.subject}
            </div>
            <div className="list-body-item list-date">{moment(e.addedAt).format("YYYY-MM-DD HH:mm:ss")}</div>
            <div className="list-body-item list-action">
                <div className="button-container">
                    <div className="action-button action-blue-but" onClick={this.useTemplate.bind(this, e.template_id, 0)}>{translate("use")}</div>
                    <div className="arrow-button arrow-blue-but" onClick={this.onClickOption.bind(this, e.template_id)} >
                        <i className="fas fa-caret-down"></i>
                    <div className="arrow-dropdown" style={{display:!!this.isOpenOption(e.template_id) ? "initial" : "none"}}>
                            <div className="container">
                                <div className="move" onClick={this.useTemplate.bind(this, e.template_id, 1)}>{translate("approval_generate")}</div>
                                <div className="move" onClick={this.onRemoveTemplate.bind(this, e.template_id, e.subject)}>{translate("remove")}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }

	render() {
        let folders = this.props.folders ? this.props.folders : []

        let templates = this.props.templates ? this.props.templates : { list:[] }
        let total_cnt = templates.total_cnt
        let page_num = templates.page_num

		return (<div className="template-page">
            <div className="contract-group-menu">
                <div className="left-top-button" onClick={this.onClickAddTemplate}>{translate("generate")}</div>
                <div className="menu-list">
                    <div className="list">
                        <div className="title">
                            <div className="text">{translate("template")}</div>
                            <i className="angle far fa-plus" onClick={this.onAddFolder}></i>
                        </div>
                        <div className={"item" + (this.getTitle().id == "all" ? " selected" : "")} onClick={this.move.bind(this, "")}>
                            <i className="icon fal fa-clock"></i>
                            <div className="text">{translate("all_template")}</div>
                        </div>
                        <div className={"item" + (this.getTitle().id == "unclassified" ? " selected" : "")} onClick={this.move.bind(this, "unclassified")}>
                            <i className="icon fas fa-thumbtack"></i>
                            <div className="text">{translate("not_classfication_template")}</div>
                        </div>
                        {folders.map((e,k)=>{
                            let subject = e.subject
                            let folder_id = e.folder_id
                            return <div  key={folder_id} className={"item" + (this.getTitle().id == folder_id ? " selected" : "")} onClick={this.move.bind(this, folder_id)}>
                                <i className="fas icon fa-folder"></i>
                                <div className="text">{subject}</div>
                                <i className="angle fal fa-trash" onClick={this.onRemoveFolder.bind(this, folder_id, subject)}></i>
                            </div>
                        })}
                    </div>
                </div>
            </div>
            <div className="contract-list">
                <div className="title">
                    { this.getTitle().title } &nbsp;
                    { !isNaN(this.getTitle().id) ? <i className="fas fa-cog" onClick={this.onChangeFolderName}></i> : null }
                </div>
                <div className="list" style={{marginTop:"20px"}}>
                    <div className="head">
                        <div className="list-head-item list-chkbox">
                            <CheckBox2 size={18}
                                on={this.isCheckAll()}
                                onClick={this.checkAll}/>
                        </div>
                        <div className="list-head-item list-name">{translate("template_name")}</div>
                        <div className="list-head-item list-date">{translate("create_date")}</div>
                        <div className="list-head-item list-action"></div>
                    </div>
                    {templates.list.map((e,k)=>{
                        return this.render_template_slot(e,k)
                    })}
                    {templates.list.length == 0 ? <div className="empty-contract">{translate("not_template")}</div> : null}
                </div>
                
                <Pager max={Math.ceil(total_cnt/page_num)} cur={this.state.cur_page||1} onClick={this.onClickPage} />
            </div>
        </div>);
	}
}
