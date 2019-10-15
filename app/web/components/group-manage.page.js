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

import ProfilePage from "./profile.page"
import PriceStatusPage from "./price-status.page"
import GroupManagePage from "./group-manage.page"
import Footer from "./footer.comp"
import Web3 from "../../common/Web3"

import translate from "../../common/translate"
import {
    fetch_user_info,
    get_corp_member_info_all,
    get_group_info,
    remove_corp_member,
    exist_in_progress_contract,
    get_corp_member_count,
    get_maximum_member_count,
    get_current_subscription,
    increase_account,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        user_info: state.user.info,
        groups: state.group.groups,
        members: state.group.members,
	}
}

let mapDispatchToProps = {
    fetch_user_info,
    get_corp_member_info_all,
    get_group_info,
    remove_corp_member,
    exist_in_progress_contract,
    get_corp_member_count,
    get_maximum_member_count,
    get_current_subscription,
    increase_account,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={};
	}

	componentDidMount(){
        (async()=>{
            await this.onRefresh()
        })()
    }


    onRefresh = async (nextProps) => {
        nextProps = !!nextProps ? nextProps : this.props

        await this.props.get_group_info(0)
        await this.props.get_corp_member_info_all(this.props.user_info.corp_key, 0)
        let current_subscription = (await this.props.get_current_subscription()).payload;

        let corp_member_count = 0;
        let corp_member_count_max = 0;
        if (this.props.user_info.account_type != 0) {
            corp_member_count = (await this.props.get_corp_member_count()).payload.count;
            corp_member_count_max = (await this.props.get_maximum_member_count()).payload.count;
        }

        this.setState({
            corp_member_count,
            corp_member_count_max,
            current_subscription,
        })
    }

    onRemoveGroupMember = async (account_id, name) => {
    	let exist_contract = await this.props.exist_in_progress_contract(account_id)
    	if(exist_contract.code == 1 && exist_contract.payload.length > 0) {
    		window.openModal("ContractListModal", {
    			icon:"fas fa-user-slash",
    			title: translate("group_member_withdraw", [name]),
    			desc:translate("group_member_withdraw_desc_1"),
    			list:exist_contract.payload,
    			onConfirm: async () => {
                    await this.remove_member(account_id)
    			}
    		})
    	} else {
            let res = await window.confirm( translate("group_member_withdraw", [name]), translate("group_member_withdraw_desc_2", [name]) )
    		if( res ) {
                await this.remove_member(account_id)
            }
    	}
    }

    remove_member = async (account_id) => {
        let resp = await this.props.remove_corp_member(account_id)
        if(resp.code == 1) {
            await this.onRefresh()
            alert(translate("success_group_member_withdraw"))
        }
        else alert(translate("fail_group_member_withdraw"))
    }

    onChangeAccountNumber = async () => {
        if(!this.state.current_subscription) {
            return alert(translate("no_subscribe_dont_use_group_member"))
        }

        window.openModal("PurchaseGroupMemberChange", {
            member_count:this.state.corp_member_count,
            max_member_count:this.state.corp_member_count_max,
            onResponse: async (change_count) => {
                await window.showIndicator();
                let resp = await this.props.increase_account(change_count);
                if (resp.code == 1) {
                    alert(translate("group_member_change_count"))
                    await this.onRefresh();
                } else {
                    alert(translate("group_member_change_fail"))
                }
                await window.hideIndicator();
            }
        })
    }

	render() {
        if(!this.props.members)
            return <div />

		return (<div className="right-desc group-manage-page">
            <div className="title">{translate("group_manage")}</div>
            <div className="container">
            	<div className="row">
            		<div className="title">{translate("group_account")}</div>
            		<div className="desc">
            			{translate("count_curr_all_person", [this.state.corp_member_count || 0, this.state.corp_member_count_max || 0])}
            			<div className="blue-but" onClick={this.onChangeAccountNumber}>{translate("change")}</div>
            		</div>
            	</div>
            	<div className="row">
            		<div className="title">{translate("group_member_list")}</div>
            		<div className="desc">
            			<div className="form-list">
                        {this.props.members.map((e, k)=>{
                        	let group_id_list = e.group_ids ? e.group_ids.split(",") : []
                        	let user_groups = []
                        	
                        	group_id_list.map( (e, k) => {
                    			if(e == 0) {
                    				user_groups.push({title:translate("all_group")})
                    				return
                    			}
                        		this.props.groups.map( (ee, kk) => {
                        			if(e == ee.group_id)
                        				user_groups.push({...ee, title:"#"+ee.title})
                        		})
                        	})

                            return <div className="item" key={e.account_id}>
                                <div className="icon">
                                    <i className="fas fa-user-tie"></i>
                                </div>
                                <div className="desc">
                                        <div className="username">{e.data.username}<span>{e.data.job}</span></div>
                                        <div className="email">{e.data.email}</div>
                                </div>
                                <div className="group">
                                    {user_groups.map( (e, k) => e.title).join(", ")}
                                </div>
                                <div className="action">
                                    {this.props.user_info.account_id != e.account_id ? <div className="delete" onClick={this.onRemoveGroupMember.bind(this, e.account_id, e.data.username)}>{translate("withdraw")}</div> : null}
                                </div>
                            </div>
                        })}
                        {this.props.members.length == 0 ? <div className="empty">{translate("no_group_member")}</div> : null}
                        </div>
            		</div>
            	</div>
            </div>
        </div>)
	}
}

