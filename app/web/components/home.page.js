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

import ContractListPage from "./contract-list.page"
import TemplatePage from "./template-list.page"
import GroupPage from "./group.page"
import ApprovalPage from "./approval.page"
import Footer from "./footer.comp"

import translate from "../../common/translate"
import {
    fetch_user_info,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        user_info:state.user.info
	}
}

let mapDispatchToProps = {
    fetch_user_info,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super()
		this.state={
        }
	}

    componentDidMount(){
        console.log(this.props.user_info)
        if(!this.props.user_info){
            (async()=>{
                await window.showIndicator()
                let user = await this.props.fetch_user_info()
                if(user == -2) {
                    window.logout()
                    alert(translate("already_withdraw_account"))
                    history.replace("/e-contract/login")
                } else if(user == -3) {
                    window.logout()
                    alert(translate("no_group_account"))
                    history.replace("/e-contract/login")
                } else if(user == false) {
                    history.replace("/e-contract/login")
                }
                await window.hideIndicator()
            })()
        }
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
        }
    }

    getStatus() {
        if(!!this.props.location && !!this.props.location.pathname)
            return this.props.location.pathname
        return "/home"
    }

	render() {
        if(!this.props.user_info || this.props.user_info == -2)
            return <div />

		return (<div className="maintain">
            <div className="header-page">
                <div className="header">
                    <div className="left-logo">
                        <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
                    </div>
                    <div className="menu">
                        <div className={(this.getStatus().includes("/e-contract/home") ? "selected-item" : "item")} onClick={() => history.push("/e-contract/home")}>
                            <div>{translate("contract")}</div>
                        </div>
                        { /*( !!this.props.user_info && (this.props.user_info.account_type != 0) ) ? 
                            <div className={(this.getStatus().includes("/e-contract/approval") ? "selected-item" : "item")} onClick={() => history.push("/e-contract/approval")}>
                                <div>{translate("approval")}</div>
                            </div>: ""*/ }
                        <div className={(this.getStatus().includes("/e-contract/template") ? "selected-item" : "item")} onClick={() => history.push("/e-contract/template")}>
                            <div>{translate("template")}</div>
                        </div>
                        { ( !!this.props.user_info && (this.props.user_info.account_type == 1) ) ? 
                            <div className={(this.getStatus().includes("/e-contract/group") ? "selected-item" : "item")} onClick={() => history.push("/e-contract/group")}>
                                <div>{translate("group")}</div>
                            </div>: ""}
                    </div>
                    { !!this.props.user_info ? <Information /> : null }
                </div>
                <Route exact path="/e-contract" render={() => <ContractListPage {...this.props}/>} />
                <Route path="/e-contract/home" render={() => <ContractListPage {...this.props}/>} />
                <Route path="/e-contract/template" render={() => <TemplatePage {...this.props}/>} />
                <Route path="/e-contract/approval" render={() => <ApprovalPage {...this.props}/>} />
                <Route path="/e-contract/group" render={() => <GroupPage {...this.props}/>} />
            </div>

            <Footer />
		</div>);
	}
}
