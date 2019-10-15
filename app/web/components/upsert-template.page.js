import React from "react"
import ReactDOM from "react-dom"

import 'froala-editor/js/froala_editor.pkgd.min.js';
import 'froala-editor/js/languages/ko.js';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

import FroalaEditor from 'react-froala-wysiwyg';
 
import { connect } from 'react-redux';
import { Link, Prompt } from 'react-router-dom'
import history from '../history';
import pdfjsLib from "pdfjs-dist"
import translate from "../../common/translate"
import Information from "./information.comp"
import Footer from "./footer.comp"

import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'

import {
    add_template,
    update_template,
    folder_list_template,
    fetch_user_info,
    add_folder_template,
    get_template,
} from "../../common/actions"
import CheckBox2 from "./checkbox2"

let mapStateToProps = (state)=>{
    let folders = [...state.template.folders]
    folders.unshift({folder_id:-1, subject:translate("not_insert_folder")})
	return {
        user_info:state.user.info,
        template_folders:folders
	}
}

let mapDispatchToProps = {
    add_template,
    update_template,
    folder_list_template,
    fetch_user_info,
    add_folder_template,
    get_template,
}

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

        this.config = {
            ...window.CONST.FROALA,
        }

        this.state = {
            model:"",
            title:"",
            editMode:false,
            select_folder_id:null,
        }
    }

    componentDidMount() {
        (async()=>{
            await window.showIndicator()
            await this.props.fetch_user_info()
            let folders = await this.props.folder_list_template()
            folders = folders ? folders : []

            let templateId = this.props.match.params.template_id

            if(!!templateId) {
                let templateData = await this.props.get_template(templateId, this.props.user_info.corp_key || null)
                let select_folder_label = null;
                for(let v of folders) {
                    if(v.folder_id == templateData.folder_id) {
                        select_folder_label = v.subject
                        break;
                    }
                }
                this.setState({
                    editMode: true,
                    template_id : templateId,
                    model:Buffer.from(templateData.html).toString(),
                    title:templateData.subject,
                    select_folder_id:templateData.folder_id,
                    select_folder_label:select_folder_label,
                })
            } else {
                this.setState({
                    select_folder_id:-1,
                    select_folder_label:translate("not_insert_folder"),
                })
            }
            await window.hideIndicator()
        })()

        history.block( (targetLocation) => {
            if(this.blockFlag)
                return true
            let out_flag = window._confirm(translate("are_u_stop_template_work_and_page_exit"))
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

    onAddFolder = () => {
        window.openModal("AddCommonModal", {
            icon:"fas fa-folder",
            title:translate("add_template_folder"),
            subTitle:translate("new_folder_name"),
            placeholder:translate("please_input_folder_name"),
            onConfirm: async (folder_name) => {
                if(!folder_name || folder_name == "") {
                    return alert(translate("please_input_folder_name"))
                }
                let resp = await this.props.add_folder_template(folder_name)

                if(resp) {
                    await this.props.folder_list_template()
                }
            }
        })
    }

    onClickPreview = () => {
        let savePdfOption = {
            margin:0,
            filename:'계약서.pdf',
            image:{ type: 'jpeg', quality: 0.98 },
            jsPDF:{ unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak:{ mode: ['avoid-all'] }
        }
        //html2pdf().set(savePdfOption).from(document.getElementsByClassName('fr-view')[0]).save()

        //window.html2Doc(document.getElementsByClassName('fr-view')[0], `[템플릿] ${this.state.title}`)
        
        if(!this.state.model || this.state.model == "") {
            return alert(translate("please_write_content"))
        }

        window.openModal("PreviewContract",{
            title: this.state.title || "",
            model: this.state.model,
        })
    }

    onClickSubmit = async () => {
        if(this.state.title == "")
            return alert(translate("please_input_template_title"))
        else if(this.state.select_folder_id == null)
            return alert(translate("please_save_template_folder"))

        if(this.state.editMode) {
            if(await window.confirm(translate("template_modify"), translate("are_u_modify_this_template"))){
                this.blockFlag = true
                await window.showIndicator()
                await this.props.update_template(this.state.template_id, this.state.select_folder_id, this.state.title, this.state.model, this.props.user_info.corp_key || null)
                await window.hideIndicator()
                history.goBack()
            }
        } else {
            if(await window.confirm(translate("register_template"), translate("are_u_register_this_template"))){
                this.blockFlag = true
                await window.showIndicator()
                await this.props.add_template(this.state.title, this.state.select_folder_id, this.state.model, this.props.user_info.corp_key || null)
                await window.hideIndicator()
                history.goBack()
            }
        }
    }

	render() {
        let folders = this.props.template_folders ? this.props.template_folders : []
        return (<div className="upsert-page upsert-template-page">
            <div className="header-page">
                <div className="header">
                    <div className="left-icon">
                        <i className="fal fa-times" onClick={()=>history.goBack()}></i>
                    </div>
                    <div className="title">{this.state.editMode ? translate("template_modify") : translate("template_generation")}</div>
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
                            model={this.state.model}
                            onModelChange={(model) => this.setState({model})} />
                    </div>
                    <div className="info">
                        <div className="title">
                            <i className="far fa-file-contract"></i>
                            <div className="text">{translate("input_info")}</div>
                        </div>
                        <div className="desc">
                            <div className="title">{translate("template_name")}</div>
                            <div className="text-box">
                                <input className="common-textbox"
                                    type="text"
                                    value={this.state.title}
                                    onChange={(e) => this.setState({title:e.target.value})} />
                            </div>
                        </div>
                        <div className="desc">
                            <div className="title">{translate("set_folder")}</div>
                            <div className="text-box">
                                <Dropdown className="common-select"
                                    controlClassName="control"
                                    menuClassName="item"
                                    options={folders.map((e,k) => {return {value:e.folder_id, label:e.subject}})}
                                    onChange={e=>{this.setState({select_folder_id:e.value, select_folder_label: e.label})}}
                                    value={this.state.select_folder_label} placeholder={translate("please_choice_save_folder")} />
                            </div>
                        </div>
                        <div className="desc">
                            <div className="title">{translate("folder_generation")}</div>
                            <div className="text-box">
                                <div className="blue-but" onClick={this.onAddFolder}>{translate("go_new_folder")}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bottom-container">
                <div className="preview" onClick={this.onClickPreview}>
                    <i className="fal fa-eye"></i>
                    {translate("go_preview")}
                </div>
                <div className="submit" onClick={this.onClickSubmit}>
                    {this.state.editMode ? translate("go_apply"):translate("go_register")}
                </div>
            </div>
		</div>);
	}
}
