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
import SecurityPage from "./security.page"
import Footer from "./footer.comp"
import Web3 from "../../common/Web3"

import translate from "../../common/translate"
import {
    fetch_user_info,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        user_info: state.user.info
	}
}

let mapDispatchToProps = {
    fetch_user_info
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={};
	}

	componentDidMount(){
        if(!this.props.user_info){
            (async()=>{
                await window.showIndicator()
                await this.props.fetch_user_info()
                await window.hideIndicator()
            })()
        }

        this.update_balance(this.props)
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
        }else{
            this.update_balance(props)
        }
    }

    async update_balance(props){
        let user = props.user_info;
        if(user){
            let fct = await Web3.fct_balance( user.eth_address );
            let eth = await Web3.eth_balance( user.eth_address );

            this.setState({
                fct_balance : fct,
                eth_balance : eth
            })
        }
    }

    move(pageName) {
        history.push(`/${pageName}`)
    }

    getTitle(props) {
        props = !!props ? props : this.props
        let menu = props.match.path || "/profile"

        if(menu == "/e-contract/price-status") {
            return { id:"/e-contract/price-status", title : translate("price")}
        }
        else if(menu == "/e-contract/group-manage") {
            return { id:"/e-contract/group-manage", title : translate("group_manage")}
        }
        else if(menu == "/e-contract/security") {
            return { id:"/e-contract/security", title : translate("security")}
        }
        return { id:"/e-contract/profile", title : translate("my_info")}
    }

	render() {
        if(!this.props.user_info)
            return <div />

		return (<div className="maintain">
            <div className="header-page">
                <div className="header">
                    <div className="left-logo">
                        <img src="/static/logo_blue.png" onClick={()=>history.push("/e-contract/home")}/>
                    </div>
                    { !!this.props.user_info ? <Information /> : null }
                </div>
                <div className="information-page">
                    <div className="left-list">
                        <div className="title">{translate("setting")}</div>
                        <div className={"item" + (this.getTitle().id == "/e-contract/profile" ? " selected" : "")} onClick={this.move.bind(this, "e-contract/profile")}><i className=" icon far fa-info-circle"></i>{translate("my_info")}</div>
                        <div className={"item" + (this.getTitle().id == "/e-contract/price-status" ? " selected" : "")} onClick={this.move.bind(this, "e-contract/price-status")}><i className="icon far fa-file-invoice-dollar"></i>{translate("price")}</div>
                        <div className={"item" + (this.getTitle().id == "/e-contract/security" ? " selected" : "")} onClick={this.move.bind(this, "e-contract/security")}><i className="icon far fa-shield-check"></i>{translate("security")}</div>
                        {this.props.user_info.account_type == 1 ? <div className={"item" + (this.getTitle().id == "/e-contract/group-manage" ? " selected" : "")} onClick={this.move.bind(this, "e-contract/group-manage")}><i className="icon far fa-users"></i>{translate("group_manage")}</div> : null}
                    </div>
                    <Route path="/e-contract/profile" render={() => <ProfilePage {...this.props}/>} />
                    <Route path="/e-contract/price-status" render={() => <PriceStatusPage {...this.props}/>} />
                    <Route path="/e-contract/group-manage" render={() => <GroupManagePage {...this.props}/>} />
                    <Route path="/e-contract/security" render={() => <SecurityPage {...this.props}/>} />
                </div>
            </div>
            <Footer />
        </div>)
	}
}
