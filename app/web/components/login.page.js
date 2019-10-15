import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../history'
import queryString from "query-string"
import translate from "../../common/translate"
import {
    getNewBrowserKey,
} from "../../common/crypto_test"
import {
    login_account,
    login_2fa_otp_auth,
    fetch_user_info
} from "../../common/actions"

import Footer from "./footer.comp"

let mapStateToProps = (state)=>{
	return {
        user_info: state.user.info
	}
}

let mapDispatchToProps = {
    login_account,
    login_2fa_otp_auth,
    fetch_user_info
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
            go_to_login:false,
            redirectUrl:"",
        };
	}

	componentDidMount(){
        (async()=>{
            await window.showIndicator()
            let user = await this.props.fetch_user_info()
            if(user == -2) {
                window.logout()
            } else if(user == -3) {
                window.logout()
            } else if(!!user) {
                return history.replace("/e-contract/home")
            }
            let redirectUrl = queryString.parse(this.props.location.search).redirect || ""
            this.setState({redirectUrl})
            await window.hideIndicator()
        })()
    }

    componentWillReceiveProps(props){
        if(!!props.user_info){
        }
    }
    
    onClickLogin = async ()=>{
        await window.showIndicator()
        
        if (!this.state.email || !this.state.password) {
            alert(translate("please_check_email_password"));
        } else {
            let resp = await this.props.login_account(this.state.email || "", this.state.password || "", window.CONST.SERVICE_TYPE.E_CONTRACT);
            if(resp.code == -11) {
                let account_text
                switch(resp.account_type) {
                    case window.CONST.ACCOUNT_TYPE.PERSONAL:
                        account_text = translate("personal_account");
                        break;
                    case window.CONST.ACCOUNT_TYPE.CORP_MASTER:
                    case window.CONST.ACCOUNT_TYPE.CORP_SUB:
                        account_text = translate("corp_account");
                        break;
                    case window.CONST.ACCOUNT_TYPE.EXPERT:
                        account_text = translate("expert_account");
                        break;
                }
                
                alert(translate("dont_use_this_account_service", [account_text]))
                return history.replace("/")
            } else if(resp.code == -3){
                alert(translate("please_check_email_password"))
            } else if(resp.code == -4){
                alert(translate("please_check_email_password"));
            } else if(resp.code == 2) {
                window.openModal("AddCommonModal", {
                    icon:"fas fa-users",
                    title:translate("input_otp_title"),
                    subTitle:translate("input_otp_desc"),
                    placeholder:translate("input_otp_placeholder"),
                    cancelable:false,
                    confirmText:translate("login"),
                    onConfirm: async (token) => {
                        let resp = await this.props.login_2fa_otp_auth(this.state.email || "", this.state.password || "", token.trim());
                        if(resp.code == 1 && resp.eems) {
                            await this.props.fetch_user_info()
                            if(this.state.redirectUrl != "")
                                return history.replace(this.state.redirectUrl);
                            return history.replace("/e-contract/home");
                        } else if(resp.code == -5) {
                            alert(translate("input_wrong_otp_token"))
                        } else {
                            alert(translate("invalidate_request"))
                        }
                    }
                })
            } else if(resp.code == 1 && resp.eems){
                //localStorage.setItem("browser_key_virgin", 0);
                await this.props.fetch_user_info()
                if(this.state.redirectUrl != "")
                    return history.replace(this.state.redirectUrl);
                return history.replace("/e-contract/home");
            } else{
                alert("login error")
            }
        }

        await window.hideIndicator()
    }

    onClickClearBrowserKey = async ()=>{
        await window.showIndicator();
        //if (window._confirm(translate("re_login_desc_2"))) { 
            localStorage.removeItem("browser_key");
            this.setState({go_to_login:false})
            //localStorage.removeItem("browser_key_virgin");
            //alert(translate("browser_auth_is_unlock"));
            //this.setState({is_clear_browser_key: true});
        //}
        await window.hideIndicator();
    }

    onClickRecoverAccount = async () => {
        await window.showIndicator();
        //if (window._confirm(translate("re_login_desc_3"))) {
            localStorage.removeItem("browser_key");
            this.setState({go_to_login:false})
            //localStorage.removeItem("browser_key_virgin");
            //this.setState({is_clear_browser_key: true});
            history.push("/recover");
        //}
        await window.hideIndicator();
    }

    openVerifiedBrowserModal = () => {
        window.openModal("CommonModal", {
            icon:"fas fa-browser",
            title:translate("verified_browser"),
            subTitle:translate("re_login_desc_4"),
            desc:translate("re_login_desc_5"),
        })
    }

    openNotVerifiedBrowserModal = () => {
        window.openModal("BrowserNotVerified", {})
    }

    keyPress = async (e) => {
        if(e.keyCode == 13){
            await this.onClickLogin()
        }
    }

   render_new() {
		return (<div className="login-common-page first-login-page">
            <div className="left-logo">
                <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
            </div>
            <div className="container">
                <div className="top">
                    <div className="left">
                        <div className="content1 font5 font-bold">{translate("start_e_contract")}</div>
                        {/*<div className="content2 font0"><i className="fas fa-lock-alt"></i> &nbsp; {translate("connect_browser_title_1")} <u onClick={this.openNotVerifiedBrowserModal}>{translate("connect_browser_title_2")}</u> {translate("connect_browser_title_3")}</div>*/}
                    </div>
                    <div className="right">
                        <div className="content3 font2">
                            {translate("no_verify_desc")}
                        </div>
                    </div>
                </div>
                
                <div className="buttons">
                    <button className="new-already-button" onClick={()=>history.push({pathname:"/register", state:{type:0}})}>
                        <div className="icon"><i className="fas fa-user"></i></div>
                        <div className="nohover">
                            {translate("new_individual_register")}
                            <div className="small">{translate("individual_use")}</div>
                        </div>
                        <div className="yeshover">
                            <div className="big">{translate("new_individual_register")}</div>
                            <div className="small">{translate("individual_use")}</div>
                        </div>
                    </button>
                    {/*<button className="new-already-button" onClick={()=>history.push({pathname:"/register", state:{type:1}})}>
                        <div className="icon"><i className="fas fa-user-tie"></i></div>
                        <div className="nohover">
                            {translate("new_corp_register")}
                            <div className="small">{translate("team_manage_use")}</div>
                        </div>
                        <div className="yeshover">
                            <div className="big">{translate("new_corp_register")}</div>
                            <div className="small">{translate("team_manage_use")}</div>
                        </div>
                    </button>*/}
                    {/*<button className="new-already-button" onClick={()=>history.push({pathname:"/register", state:{type:3}})}>
                        <div className="icon"><i className="fas fa-tools"></i></div>
                        <div className="nohover">
                            {translate("new_expert_register")}
                            <div className="small">{translate("expert_use")}</div>
                        </div>
                        <div className="yeshover">
                            <div className="big">{translate("new_expert_register")}</div>
                            <div className="small">{translate("expert_use")}</div>
                        </div>
                    </button>*/}
                    <button className="new-already-button" onClick={()=>this.setState({go_to_login:true})/*history.push("/recover")*/}>
                        <div className="icon"><i className="fas fa-user-check"></i></div>
                        <div className="nohover">
                            {translate("original_account_login")}
                            <div className="small">&nbsp;</div>
                        </div>
                        <div className="yeshover">
                            <div className="big">{translate("original_account_login")}</div>
                            <div className="small">&nbsp;</div>
                        </div>
                    </button>
                </div>
            </div>
		</div>);
   }

   render_login() {
        // desc2 onClick={this.openVerifiedBrowserModal}
		return (<div className="login-common-page login-page">
            <div className="left-logo">
                <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
            </div>
            <div className="container">
                <div className="title">{translate("start_e_contract")}</div>
                <div className="desc1">{/*<i className="fas fa-lock-open-alt"></i> &nbsp; translate("this_browser_was_verificated")*/}</div>
                <div className="desc2">{/*translate("what_is_verified_browser")*/}</div>

                <div className="textbox"><input className="common-textbox" id="email" type="email" placeholder={translate("please_input_email")} value={this.state.email || ""} onChange={e=>this.setState({email:e.target.value})}/></div>
                <div className="textbox"><input className="common-textbox" id="password" type="password" placeholder={translate("please_input_password")} value={this.state.password || ""} onKeyDown={this.keyPress} onChange={e=>this.setState({password:e.target.value})}/></div>

                <div className="login-btn" onClick={this.onClickLogin}>{translate("login")}</div>
                <br/>
                <div className="register-btn" onClick={this.onClickClearBrowserKey}>{translate("new_register")}</div>

                <div className="other">
                    <div className="recover-account" onClick={this.onClickRecoverAccount}>
                        {translate("you_lost_account")}<br/>
                    </div>
                </div>
            </div>
		</div>);
   }


	render() {
        if(this.props.user_info !== false) {
            return <div />
        }
        /*console.log("this.state.go_to_login", this.state.go_to_login)
        console.log("localStorage.getItem(browser_key)", localStorage.getItem("browser_key"))
        console.log( (!this.state.go_to_login || !localStorage.getItem("browser_key")) )
*/
        return (<div className="maintain">
            {
                (!localStorage.getItem("browser_key") && !this.state.go_to_login /*localStorage.getItem("browser_key_virgin") == true*/) ? 
                    this.render_new() : this.render_login()  
            }
            <Footer />
        </div>)
	}
}
