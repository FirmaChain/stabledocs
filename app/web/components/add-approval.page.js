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
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'

import {
    fetch_user_info,
    new_approval,
    select_userinfo_with_email,
    get_group_member_all,
    get_template,
    get_approval,
} from "../../common/actions"
import CheckBox2 from "./checkbox2"

let mapStateToProps = (state)=>{
	return {
        user_info:state.user.info
	}
}

let mapDispatchToProps = {
    fetch_user_info,
    new_approval,
    select_userinfo_with_email,
    get_group_member_all,
    get_template,
    get_approval,
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
        this.blockFlag = false
		this.state={
            order_list:[], // type 0 : 개인, type 1 : 기업 담당자, type 2 : 기업 그룹
            approval_name:"",
            add_name_focus:false,
        }
	}

	componentDidMount(){
        (async()=>{
            let user = await this.props.fetch_user_info()
            if(!user) {
                return history.push("/e-contract/login")
            }

            if(user.account_type == 0) {
                history.goBack()
                return alert(translate("personal_dont_use_approval"));
            }
            await this.onRefresh()
        })()


        history.block( (targetLocation) => {
            if(this.blockFlag)
                return true
            let out_flag = window._confirm(translate("you_really_leave_this_page_approval"))
            if(out_flag)
                history.block( () => true )
            return out_flag
        })
    }

    onRefresh = async (nextProps) => {
        nextProps = !!nextProps ? nextProps : this.props

        await window.showIndicator();

        let all_group_member = await this.props.get_group_member_all(this.props.user_info.corp_key)

        let params = queryString.parse(nextProps.location.search)

        await this.setState({
            can_approval_account_id:this.props.user_info.account_id,
            member_list: all_group_member.payload,
            order_list:[{
                account_id: this.props.user_info.account_id,
                username:this.props.user_info.username,
                email:this.props.user_info.email,
                department:this.props.user_info.department,
                job:this.props.user_info.job,
            }]
        })

        if( params.template_id && !isNaN(params.template_id) ) {
            let template = await this.props.get_template(params.template_id, this.props.user_info.corp_key || null)
            this.setState({
                template
            })
        }
        await window.hideIndicator();
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
        }
    }

    onClickBack = () => {
        history.goBack();
    }

    onClickAdd = async () => {
        if(!this.state.add_account_id)
            return alert(translate("please_select_approval_user"))
        if(!this.state.add_role)
            return alert(translate("please_select_role"))

        let approval_user = this.state.member_list.find(e=>e.account_id == this.state.add_account_id)

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
                job:approval_user.public_info.job,
            }

        	let all_group_member = await this.props.get_group_member_all(this.props.user_info.corp_key)

            this.setState({
                order_list:[...this.state.order_list, info],
                add_name:null,
                add_account_id: null,
                member_list:all_group_member.payload,
            })
        } else {
            return alert(translate("please_select_approval_user"));
        }
    }

    onClickRegister = async ()=>{
        if(this.is_register)
            return

        if(this.state.order_list.length == 1)
            return alert(translate("please_add_approval_user"))
        
        this.is_register = true

        if(!this.state.approval_name || this.state.approval_name.trim() == "") {
            this.is_register = false
            return alert(translate("please_input_approval_name"))
        }

        this.blockFlag = true;

        let approval_name = this.state.approval_name.trim();

        if(approval_name.length > 80) {
            this.is_register = false;
            this.blockFlag = false;
            return alert(translate("approval_name_must_be_80_letters"))
        }

        let order_list = this.state.order_list.map(e=>e.account_id);

        let template_model = null
        if(this.state.template) {
            template_model = Buffer.from(this.state.template.html).toString()
        }

        await window.showIndicator()

        let resp =  await this.props.new_approval(approval_name, order_list, this.props.user_info.corp_key, template_model);

        await window.hideIndicator()

        if(resp.code == 1) {
            let approval_id = resp.payload.approval_id
            history.replace(`/e-contract/edit-approval/${approval_id}`)
        } else {
            alert(translate("fail_register_approval"))
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

    onClickRemoveCounterparty = (k, item, e) => {
    	e.stopPropagation();

        let _list = [...this.state.order_list]
        _list.splice(k,1)
        this.setState({
            order_list:_list
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

    render_add_approval_input_dropdown() {
        if(this.state.add_account_id != null || this.state.add_name == null || !this.state.add_name_focus || !this.state.member_list)
            return;

        let search_text = this.state.add_name.trim()

        if(search_text < 2)
            return;

        let _ = this.state.member_list.filter(e=>{
            return e.public_info.username.includes(search_text)
        })

        if(_.length == 0)
            return;

        return <div className="input-dropdown">
	        <div className="info-container">
	        {_.map( (e, k) => {
	            return <div className="user" key={e.account_id} onClick={()=>{
	            		this.setState({add_account_id:e.account_id, add_name:e.public_info.username})
	            	}}>
		            <i className="icon fas fa-user-tie"></i>
		            <div className="name">{e.public_info.username}</div>
		            <div className="email">{e.public_info.email}</div>
	            </div>
	        })}
	        </div>
        </div>
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

        this.setState({
            order_list
        });
    }

    render_approval_list() {
    	let order_list = this.state.order_list ? this.state.order_list : []
    	if(order_list.length == 0)
    		return;

    	return <DragDropContext onDragEnd={this.onDragEnd}>
	    	<Droppable droppableId="droppable">
	    	{(provided, snapshot) => (
	    		<div ref={provided.innerRef}
	    			style={getListStyle(snapshot.isDraggingOver)}
	    			{...provided.droppableProps}>
		    		{order_list.map((e, k) => {
		    			if(k == 0)
		    				return
		    			return <Draggable key={e.account_id} draggableId={e.account_id} index={k}>
			    			{(provided, snapshot) => (
			    				<div className="item item-bottom-no-border"
			    					ref={provided.innerRef}
			    					style={getItemStyle(provided.draggableStyle, snapshot.isDragging)}
								    {...provided.draggableProps}
								    {...provided.dragHandleProps}>
									<div className="vertical-line">
										<div className="line"></div>
										<div className="circle"></div>
										<div className={`line ${k == order_list.length - 1 ? "line-transparent":""}`}></div>
									</div>
		                            <div className="icon">
		                                <i className="fas fa-user-tie"></i>
		                            </div>
		                            <div className="desc">
		                                <div className="username">{e.username}<span>{e.department} {e.job}</span></div>
		                                <div className="email">{e.email}</div>
		                            </div>
		                            <div className="privilege">{k == order_list.length - 1 ? translate("final_approval_user"):translate("approval_user")}</div>
		                            <div className="action">
		                                {e.account_id == this.props.user_info.account_id ?
		                                    null:
		                                    <div className="delete" onClick={this.onClickRemoveCounterparty.bind(this, k, e)}>{translate("remove")}</div>
		                                }
		                            </div>
			    				</div>
		    				)}
		    			</Draggable>
	    			})}
	    		</div>
	    		)}
	    	</Droppable>
    	</DragDropContext>
    }



	render() {
        if(!this.props.user_info)
            return <div></div>

        let _roles = [
            {value:1, label: translate("approval_user")},
        ]

    	let order_list = this.state.order_list ? this.state.order_list : []
    	let me
    	if(order_list.length > 0)
    		me = order_list[0];

        return (<div className="upsert-contract-group-page header-page">
            <div className="header">
                <div className="left-logo">
                    <img src="/static/logo_blue.png" onClick={()=>history.push("/home")}/>
                </div>
                { !!this.props.user_info ? <Information /> : null }
            </div>
            <div className="head">
                <span className="back" onClick={()=> history.goBack()}>
                    <i className="fal fa-chevron-left"></i> <span>{translate("go_back")}</span>
                </span>
                <div className="text">{translate("register_approval_info")}</div>
            </div>
            <div className="content">
                <div className="row">
                    <div className="left-desc">
                        <div className="desc-head">{translate("please_input_approval_name")}</div>
                        <div className="desc-content">{translate("please_input_this_approval_name")}</div>
                    </div>
                    <div className="right-form">
                        <div className="column">
                            <div className="form-head"></div>
                            <div className="form-input">
                                <input className="common-textbox" type="text"
                                    value={this.state.approval_name || ""}
                                    placeholder={translate("please_input_this_approval_name")}
                                    onChange={e=>this.setState({approval_name:e.target.value})}/>
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

                <div className="row">
                    <div className="left-desc">
                        <div className="desc-head">{translate("approval_user_add")}</div>
                        <div className="desc-content">
                            {translate("approval_user_add_desc")}<br/>
                            <br/>
                            {translate("approval_user_add_desc_drag")}
                        </div>
                    </div>
                    <div className="right-form">
                        <div className="column column-flex-2">
                            <div className="form-head">{translate("approval_user_name")}</div>
                            <div className="form-input">
                                <input className="common-textbox" type="text"
                                    placeholder={translate("please_input_approval_user_name")}
                                    value={this.state.add_name || ""}
                                    onFocus={e=>this.setState({add_name_focus:true})}
                                    onBlur={e=>setTimeout(()=>this.setState({add_name_focus:false}), 500)}
                                    onChange={e=>{
                                        this.setState({
                                            add_name:e.target.value,
                                            add_account_id:null,
                                        })
                                    }}/>
                                {this.render_add_approval_input_dropdown()}
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
                                <div className={"btn-add-user" + ( (this.state.add_name || "").length==0? "" : " btn-add-user-active" )} onClick={this.onClickAdd}>{translate("add")}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="left-desc">
                    </div>
                    <div className="right-form">
                        <div className="column">
                            <div className="form-head">{translate("approval_line")}</div>
                            <div className="form-list">
								{me ? <div className="item item-bottom-no-border">
									<div className="vertical-line">
										<div className="line line-transparent"></div>
										<div className="circle"></div>
										<div className="line"></div>
									</div>
					                <div className="icon">
					                    <i className="fas fa-user-tie"></i>
					                </div>
					                <div className="desc">
					                    <div className="username">{me.username}<span>{me.department} {me.job}</span></div>
					                    <div className="email">{me.email}</div>
					                </div>
					                <div className="privilege">{translate("drafter")}</div>
					                <div className="action">
				                	</div>
								</div> : null}
                                {this.render_approval_list()}
                            </div>
                            <div className="explain"></div>
                        </div>
                    </div>
                </div>

                <div className="bottom-container">
                    <div className="regist-contract" onClick={this.onClickRegister}>{translate("register_space")}</div>
                </div>
            </div>
            <Footer />
		</div>);
	}
}
