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

import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'

import translate from "../../common/translate"

import {
    SeedToMasterKeyPublic,
    getMasterSeed,
    aes_encrypt,
    aes_decrypt,
    entropyToMnemonic,
} from "../../common/crypto_test"

import {
    fetch_user_info,
    update_user_info,
    update_user_public_info,
    update_corp_info,
    update_username,
    re_issue_recover_password,
    issue_2fa_otp,
    terminate_2fa_otp,
    register_2fa_otp,
    create_encrypted_info,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        user_info: state.user.info
	}
}

let mapDispatchToProps = {
    fetch_user_info,
    update_user_info,
    update_user_public_info,
    update_corp_info,
    update_username,
    re_issue_recover_password,
    issue_2fa_otp,
    terminate_2fa_otp,
    register_2fa_otp,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
            issue_ing_2fa_otp:false,
        };
	}

	componentDidMount(){
        setTimeout(async () => {
            await this.props.fetch_user_info()
            await this.onRefresh();
        })
    }
    
    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
        }
    }

    onRefresh = async () => {
        if(this.props.user_info) {
            let info = this.props.user_info

            this.setState({
                ...info
            })
        }
    }

    createInformation(account_type) {
        return create_encrypted_info(account_type, this.props.user_info, this.state)
    }


    reIssueRecoverPassword = async () => {
        let account_type = this.props.user_info.account_type;
        let info_data = this.createInformation(account_type)
        let info = info_data.info;

        const possible = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
        let passphrase2_length = 12;
        let passphrase2 = "";
        for (let i = 0; i < passphrase2_length; i++)
            passphrase2 += possible.charAt(Math.floor(Math.random() * possible.length));

        let mnemonic = entropyToMnemonic(localStorage.getItem("entropy"))

        let emk = aes_encrypt(mnemonic, Buffer.from(passphrase2, 'hex'))
        let mk;
        try {
            mk = aes_decrypt(Buffer.from(emk, 'hex'), Buffer.from(passphrase2, 'hex'))
        } catch(err) {
            console.log(err)
        }

        if(mk != mnemonic) {
            return alert("something is very wrong. check rawMnemonic");
        }

        info.recover_password = passphrase2;

        try {

            let masterKeyPublic = SeedToMasterKeyPublic(getMasterSeed())
            let encryptedInfo = aes_encrypt(JSON.stringify(info), masterKeyPublic);
            let resp = await this.props.re_issue_recover_password(emk, encryptedInfo)

            await this.props.fetch_user_info()
            await this.onRefresh()
            await this.textCopy(this.state.recover_password)
        } catch( err ) {
            console.log(err)
            return alert(translate("error_re_issue_recover_password_msg"))
        }
        return alert(translate("success_re_issue_recover_password"))
    }

    onClickViewMasterkeyword = async () => {
        this.setState({
            show_mnemonic:!this.state.show_mnemonic
        })
    }

    onClickViewRecoverPassword = async () => {
        this.setState({
            show_recover_password:!this.state.show_recover_password
        })
    }

    textCopy = async (text) => {
        let t = document.createElement("textarea");
        document.body.appendChild(t);
        t.value = text;
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
    }

    onClickIssue2FAOtp = async () => {
        let resp = await this.props.issue_2fa_otp()
        this.setState({
            issue_ing_2fa_otp: true,
            secret: resp.payload.secret,
        })
    }

    onClickTerminate2FAOtp = async () => {
        if(!window._confirm(translate("really_otp_terminate_?")))
            return;

        let resp = await this.props.terminate_2fa_otp()
        if(resp.code == 1) {
            alert(translate("success_terminate_2fa_otp"))
        } else {
            alert(translate("fail_terminate_2fa_otp"))
        }
        await this.props.fetch_user_info();
        await this.onRefresh();
    }

    onClickRegister2FAOTP = async () => {
        if(this.state.otp_temp_token == "") {
            return alert(translate("please_input_otp_token"))
        }

        if(this.state.otp_temp_token.length != 6) {
            return alert(translate("otp_token_length_is_6"))
        }

        await window.showIndicator();

        let resp = await this.props.register_2fa_otp(this.state.otp_temp_token)

        if(resp.code == 1) {
            alert(translate("success_register_2fa_otp"));
            this.setState({
                issue_ing_2fa_otp:false,
                secret:null,
            })
            await this.props.fetch_user_info();
            await this.onRefresh();
        } else if(resp.code == -6) {
            alert(translate("no_temp_register_server"))
        } else if(resp.code == -7) {
            alert(translate("token_not_matched"))
        } else {
            alert("error otp register. please contact developer");
        }
        await window.hideIndicator();
    }

    onClickOTPApp = async (type) => {
        if(type == 0) {
            window.open("https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2", "_blank")
        } else {
            window.open("https://itunes.apple.com/kr/app/google-authenticator/id388497605?mt=8&ls=1", "_blank")
        }
    }

	render() {
        if(!this.props.user_info)
            return <div />

        let account_type = this.props.user_info.account_type

		return (<div className="right-desc security-page">
			<div className="info-container">
                <div className="info">
                    <div className="title">{translate("security")}</div>
                    <div className="text-place">
                        <div className="title">{translate("recover_password")}</div>
                        <div className="text-box">
                            <div className={"recover-password" + (this.state.show_recover_password ? "" : " hide")}>{this.state.recover_password}</div>
                            <div className={"transparent-but" + (this.state.show_recover_password ? "" : " hide")} onClick={this.reIssueRecoverPassword}>{translate("re_issue")}</div>
                            <div className="blue-but" onClick={this.onClickViewRecoverPassword}>{this.state.show_recover_password ? translate("close") : translate("view")}</div>
                        </div>
                    </div>
                    <div className="text-place">
                        <div className="title">{translate("master_keyword")}</div>
                        <div className="text-box">
                            <div className={"master-keyword" + (this.state.show_mnemonic ? "" : " hide")}>{entropyToMnemonic(localStorage.getItem("entropy"))}</div>
                            <div className="blue-but" onClick={this.onClickViewMasterkeyword}>{this.state.show_mnemonic ? translate("close") : translate("view")}</div>
                        </div>
                    </div>
                    <div className="text-place">
                        <div className="title">{translate("google_2fa_otp")}</div>
                        <div className="text-box">
                            {this.props.user_info.use_otp == 0 ? 
                                <div className="transparent-but long-but"><i className="far fa-shield"></i> {translate("no_use_otp")}</div> : 
                                <div className="transparent-but long-but"><i className="far fa-shield-alt"></i> {translate("already_use_otp")}</div>}
                            {this.props.user_info.use_otp == 0 ? 
                                <div className="blue-but" onClick={this.onClickIssue2FAOtp}>{translate("issue")}</div> : 
                                <div className="blue-but" onClick={this.onClickTerminate2FAOtp}>{translate("terminate_2fa_otp")}</div>}
                        </div>
                    </div>
                    {this.state.issue_ing_2fa_otp ? <div className="otp-place">
                        <div className="title">1. {translate("otp_app_download")}</div>
                        <div className="otp-app-download">
                            <div className="app" onClick={this.onClickOTPApp.bind(this, 0)}><i className="fab fa-android"></i> &nbsp;{translate("android")}</div>
                            <div className="app" onClick={this.onClickOTPApp.bind(this, 1)}><i className="fab fa-apple"></i> &nbsp;{translate("ios")}</div>
                        </div>

                        <div className="title">2. {translate("otp_secret_title")}</div>
                        <div className="qr-code">
                            <img src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=200x200&chld=M|0&cht=qr&chl=${this.state.secret.otpauth_url}`}/>
                            <div className="desc" dangerouslySetInnerHTML={{__html:translate("otp_qr_code_desc")}}></div>
                        </div>
                        <div className="secret-box">
                            {translate("otp_secret_key", [this.state.secret.base32])}<br/>
                            <br/>
                            <b>{translate("must_save_this_secret")}</b>
                        </div>
                        <div className="title">3. {translate("input_otp_token")}</div>
                        <div className="text-box">
                            <input className="common-textbox" 
                                type="text" 
                                value={this.state.otp_temp_token} 
                                placeholder={translate("please_input_otp_token")} 
                                onChange={e=>(this.setState({otp_temp_token:e.target.value.trim()}))}/>
                        </div>

                        <div className="confirm-container">
                            <div className="blue-but" onClick={this.onClickRegister2FAOTP}>{translate("register")}</div>
                        </div>
                    </div> : null}
                </div>
            </div>
        </div>)
	}
}

