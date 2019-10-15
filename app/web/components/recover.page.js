import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../history';
import translate from "../../common/translate"
import Web3 from "../../common/Web3"

import Footer from "./footer.comp"

import {
    makeAuth,
    makeMnemonic,
    mnemonicToSeed,
    getBrowserKey,
    SeedToMasterKeyPublic,
    BrowserKeyBIP32,
    validateMnemonic,
    aes_decrypt,
    aes_encrypt,
} from "../../common/crypto_test"

import {
    recover_account,
    check_join_publickey,
    get_emk,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
	}
}

let mapDispatchToProps = {
    recover_account,
    check_join_publickey,
    get_emk,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
            step:0,
            sort_test:[],
            password:"",
            password2:"",
            email:"",
        };
	}

	componentDidMount(){
        localStorage.removeItem("browser_key")
        //localStorage.removeItem("browser_key_virgin")
    }

    goBack = ()=>{
        if(this.state.step == 0){
            history.goBack()
        }else{
            this.setState({
                step: this.state.step -1
            })
        }
    }

    next_term = ()=>{
        this.setState({
            step: this.state.step+1
        })
    }
    
    prev_term = () => {
        this.setState({
            step: this.state.step - 1
        })
    }

    onClickInputMnemonic = async() => {
        if (!this.state.mnemonic) {
            return alert(translate("please_input_master_keyword"));
        }
        let mnemonic = this.state.mnemonic.trim();
        
        if (!validateMnemonic(mnemonic)) {
            return alert(translate("not_validate_master_keyword"));
        }
        let seed = mnemonicToSeed(mnemonic);
        let masterKeyPublic = SeedToMasterKeyPublic(seed);

        await window.showIndicator();
        let resp = await this.props.check_join_publickey(masterKeyPublic.toString('hex'));
        if(resp){
            this.setState({
                step: this.state.step+1,
                mnemonic: mnemonic,
            });
        }else{
            alert(translate("no_account_new_register"));
        }
        await window.hideIndicator();
        return;
    };

    onClickRecoverPassword = async () => {
        if (!this.state.email || this.state.email == "") {
            return alert(translate("please_input_recover_email"));
        }

        if (!this.state.recover_password || this.state.recover_password == "") {
            return alert(translate("please_input_recover_password_example"));
        }

        await window.showIndicator();

        let resp = await this.props.get_emk(this.state.email);
        console.log(resp)
        if(resp.code == -5) {
            await window.hideIndicator();
            return alert(translate("no_register_account_with_email"));
        }

        let mk;
        try {
            mk = aes_decrypt(Buffer.from(resp.payload.emk, 'hex'), Buffer.from(this.state.recover_password, 'hex'))
        } catch(err) {
            await window.hideIndicator();
            return alert(translate("no_match_recover_password"))
        }

        if (!validateMnemonic(mk)) {
            return alert(translate("not_validate_master_keyword"));
        }

        let seed = mnemonicToSeed(mk);
        let masterKeyPublic = SeedToMasterKeyPublic(seed);

        resp = await this.props.check_join_publickey(masterKeyPublic.toString('hex'));
        if(resp){
            this.setState({
                step: this.state.step+1,
                mnemonic: mk,
            });
        } else {
            alert(translate("no_account_new_register"));
        }

        await window.hideIndicator();
    }

    onClickRecoverMyAccount = async()=>{
        if(!this.state.email || this.state.email == ""){
            return alert(translate("please_input_email"))
        }
        if(this.state.password.length < 8){
            return alert(translate("password_will_be_more_than_8"))
        }
        if(this.state.password != this.state.password2){
            return alert(translate("password_not_symmetry"))
        }

        try {
            let mnemonic = this.state.mnemonic.trim();
            getBrowserKey(this.state.email, this.state.password, true); // Reset browserkey
            let auth = makeAuth(this.state.email, this.state.password);
            let encryptedMasterSeed = makeMnemonic(auth, mnemonic);

            let seed = mnemonicToSeed(mnemonic);
            let masterKeyPublic = SeedToMasterKeyPublic(seed).toString('hex');
            let browserKeyPublic = BrowserKeyBIP32().publicKey.toString('hex');

            await window.showIndicator()
            let resp = await this.props.recover_account(browserKeyPublic, masterKeyPublic, auth.toString('hex'), encryptedMasterSeed, this.state.email);
            await window.hideIndicator()

            if(resp.code == 1){
                localStorage.setItem("browser_key_virgin", 0);
                history.push("/");
                return alert(translate("now_you_login_available"))
            } else if(resp.code == -3) {
                return alert(translate("no_account_info"))
            } else if(resp.code == -4) {
                return alert(translate("fail_login_info_create"))
            } else if(resp.code == -5) {
                return alert(translate("no_masterkeyword_email_info"))
            } else {
                return alert(translate("unknown_error_occured"))
            }
        } catch(err) {
            console.log(err)
            alert("error")
        }
    }

    openWhyMasterkeywordReInputModal = () => {
        window.openModal("CommonModal", {
            icon:"fas fa-money-check",
            title:translate("input_master_keyword"),
            subTitle:translate("input_master_keyword_desc_1"),
            desc:translate("input_master_keyword_desc_2")
        })
    }

    keyPress = async(type, e) => {
        e.stopPropagation()
        if(e.keyCode == 13){
            switch(type) {
                case 0:
                this.onClickRecoverPassword()
                break;
                case 1:
                this.onClickRecoverMyAccount()
                break;
            }
        }
    }

    render_masterkey(){
        return (<div className="content">
            <div className="master-keyword-container">
                <div className="sub-title-container">
                    <div className="title">{translate("master_keyword")}</div>
                    <div className="what-is-masterkeyword" onClick={this.openWhyMasterkeywordReInputModal}>{translate("why_master_keyword_re")}</div>
                </div>

                <textarea className="masterkeyword-input-slot"
                    placeholder={`${translate("please_input_master_keyword_example")} poem outdoor burn gadget bubble head liar rubber fire honey ghost grape`}
                    value={this.state.mnemonic || ""}
                    onKeyDown={this.keyPress.bind(this, 0)}
                    onChange={e=>this.setState({mnemonic:e.target.value.replace(/\r\n|\r|\n|<br>/g, " ")})}></textarea>

                <div className="reference">
                    {translate("word_12_master_keyword_input_msg")}
                </div>
            </div>

            <div className="bottom-container">
                <div className="confirm-button" onClick={this.onClickInputMnemonic}>
                    {translate("next")}
                </div>
            </div>
        </div>)
    }

    render_recover_password(){
        return (<div className="content">
            <div className="master-keyword-container">
                {/*<div className="sub-title-container">
                    <div className="title">{translate("recover_password")}</div>
                    <div className="what-is-masterkeyword" onClick={this.openWhyMasterkeywordReInputModal}>{translate("why_master_keyword_re")}</div>
                </div>*/}

                <div className="text-place">
                    <div className="name">{translate("recover_email")}</div>
                    <div className="textbox">
                        <input className="common-textbox" type="email"
                            value={this.state.email || ""}
                            onChange={e=>this.setState({email:e.target.value})}
                            placeholder={translate("please_input_recover_email")}/>
                    </div>
                </div>

                <div className="text-place">
                    <div className="name">{translate("recover_password")}</div>
                    <div className="textbox">
                        <input className="common-textbox" type="text"
                            value={this.state.recover_password || ""}
                            onKeyDown={this.keyPress.bind(this, 0)}
                            onChange={e=>this.setState({recover_password:e.target.value})}
                            placeholder={translate("please_input_recover_password_example")}/>
                    </div>
                </div>

                <div className="reference">
                    {translate("correct_recover_password_input_msg")}
                </div>
            </div>

            <div className="bottom-container">
                <div className="confirm-button" onClick={this.onClickRecoverPassword}>
                    {translate("next")}
                </div>
            </div>
        </div>)
    }
    
    render_account(){
        return (<div className="content">
            <div className="text-place">
                <div className="name">{translate("register_email")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.email || ""}
                        onChange={e=>this.setState({email:e.target.value})}
                        disabled={true}
                        placeholder={translate("please_input_register_account_email")}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name">{translate("new_password")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="password"
                        value={this.state.password || ""}
                        onChange={e=>this.setState({password:e.target.value})}
                        placeholder={translate("at_lesat_8_detail")}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name">{translate("re_password")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="password"
                        value={this.state.password2 || ""}
                        onChange={e=>this.setState({password2:e.target.value})}
                        onKeyDown={this.keyPress.bind(this, 1)}
                        placeholder={translate("please_reinput_password")}/>
                </div>
            </div>

            <div className="bottom-container">
                <div className="back-button" onClick={this.prev_term}>{translate("go_back")}</div>
                <div className="confirm-button" onClick={this.onClickRecoverMyAccount}>
                    {translate("original_account_login")}
                </div>
            </div>
        </div>)
    }

    render_content(){
        if(this.state.step == 0){
            return this.render_recover_password();
        }else if(this.state.step == 1){
            return this.render_account();
        }
    }

    render_title(){
        let title = "", desc = ""

        if(this.state.step == 0){
            title = translate("master_keyword_input_new")
            desc = translate("master_keyword_input_desc")
        }else if(this.state.step == 1){
            title = translate("set_password")
            desc = translate("set_password_desc")
        }

        return <div className="top">
            <div className="title">{title}</div>
            <div className="sub">{desc}</div>
        </div>
    }

	render() {
		return (<div className="maintain">
            <div className="register-common-page register-page">
                <div className="left-logo">
                    <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
                </div>
                <div className="desc-container">
                    <div className="info">
                        {this.render_title()}
                        <div className="step-indicator">
                            <div className={`circle ${this.state.step == 0 ? "enable-circle": ""}`}></div>
                            <div className="line"></div>
                            <div className={`circle ${this.state.step == 1 ? "enable-circle": ""}`}></div>
                        </div>
                        <div className="step-text">
                            <div className={`item ${this.state.step == 0 ? "enable": ""}`}>{translate("input_recover_password")}</div>
                            <div className={`item ${this.state.step == 1 ? "enable": ""}`}>{translate("set_password")}</div>
                        </div>
                    </div>
                    <div className="desc">
                        {this.render_content()}
                    </div>
                </div>
            </div>

            <Footer />
        </div>);
	}
}
