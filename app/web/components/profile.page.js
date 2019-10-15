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
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={};
	}

	componentDidMount(){
        setTimeout(async () => {
            await window.showIndicator();
            await this.props.fetch_user_info();
            await this.onRefresh();
            await window.hideIndicator();
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

    onSaveInformation = async () => {
		let account_type = this.props.user_info.account_type;
		let info, corp_info, public_info

        let info_data = this.createInformation(account_type)
        info = info_data.info;
        corp_info = info_data.corp_info;
        public_info = info_data.public_info;

        try {
            await this.props.update_username(this.state.username)

	    	let masterKeyPublic = SeedToMasterKeyPublic(getMasterSeed())
	        let encryptedInfo = aes_encrypt(JSON.stringify(info), masterKeyPublic);
	        await this.props.update_user_info(encryptedInfo)

	        if(account_type == 1) {
	        	let encryptedCorpInfo = aes_encrypt(JSON.stringify(corp_info), Buffer.from(this.props.user_info.corp_key,'hex'))
	        	await this.props.update_corp_info(encryptedCorpInfo)
	        }

            if(public_info) {
                let encryptedPublicInfo = aes_encrypt(JSON.stringify(public_info), Buffer.from(this.props.user_info.corp_key,'hex'))
                await this.props.update_user_public_info(encryptedPublicInfo)
            }

	        await this.props.fetch_user_info()

    	} catch( err ) {
    		console.log(err)
    		return alert(translate("error_modify_public_info_msg"))

    	}
    	return alert(translate("success_modify_public_info"))
    }

    textCopy = async (text) => {
        let t = document.createElement("textarea");
        document.body.appendChild(t);
        t.value = text;
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
    }

    onInfoChange = (propertyName, e) => {
    	this.setState({
    		[propertyName]:e.target.value
    	})
    }

    onClickFindAddress = async (type)=>{
        await window.showIndicator()
        daum.postcode.load(() => {
            new daum.Postcode({
                oncomplete: async (data) => {
                    let address = data;

                    if(!!address && !!address.roadAddress) {
                        if(type == "personal") {
                            this.setState({
                                useraddress: address.roadAddress + " "
                            })
                        } else if(type == "company") {
                            this.setState({
                                company_address: address.roadAddress + " "
                            })
                        }
                    }
                    await window.hideIndicator()
                },
                onclose: async (data) => {
                    await window.hideIndicator();
                }
            }).open();
        })
    }

    onChangeInfoPhoneForm = async (name, e) => {
        let text = e.target.value;
        text = text.replace(/[^0-9]/g,"")
        text = window.phoneFomatter(text)
        
        this.setState({
            [name]:text
        })
    }

	render() {
        if(!this.props.user_info)
            return <div />

        let account_type = this.props.user_info.account_type
        let languages = [{
            label:"Korean",
            value:"KR"
        }, {
            label:"English",
            value:"EN"
        }, {
            label:"Chinese",
            value:"CN"
        }]
        let select_language = global.LANG

		return (<div className="right-desc profile-page">
			<div className="info-container">
	            <div className="info">
	            	<div className="title">{translate("account_info")}</div>
	            	<div className="text-place">
	            		<div className="title">{translate("name")}</div>
	            		<div className="text-box"><input className="common-textbox" type="text" value={this.state.username} onChange={this.onInfoChange.bind(this, "username")}/></div>
	            	</div>
                    {account_type != 0 ? <div className="text-place">
                        <div className="title">{translate("department")}</div>
                        <div className="text-box"><input className="common-textbox" type="text" value={this.state.department} onChange={this.onInfoChange.bind(this, "department")}/></div>
                    </div> : null}
	            	{account_type != 0 ? <div className="text-place">
	            		<div className="title">{translate("job")}</div>
	            		<div className="text-box"><input className="common-textbox" type="text" value={this.state.job} onChange={this.onInfoChange.bind(this, "job")}/></div>
	            	</div> : null}
	            	<div className="text-place">
	            		<div className="title">{translate("email")}</div>
	            		<div className="text-box"><input className="common-textbox" type="text" value={this.state.email} onChange={this.onInfoChange.bind(this, "email")} disabled /></div>
	            	</div>
	            	<div className="text-place">
	            		<div className="title">{translate("individual_phone")}</div>
	            		<div className="text-box"><input className="common-textbox" type="text" value={this.state.userphone} onChange={this.onInfoChange.bind(this, "userphone")} disabled /></div>
	            	</div>
	            	{account_type == 0 ? <div className="text-place">
	            		<div className="title">{translate("address")}</div>
	            		<div className="text-box">
	            			<input className="common-textbox" type="text"
	            				value={this.state.useraddress}
	            				onChange={this.onInfoChange.bind(this, "useraddress")}/>
	            			<div className="blue-but" onClick={this.onClickFindAddress.bind(this, "personal")}>{translate("find")}</div>
	            		</div>
	            	</div> : null}
                    <div className="text-place">
                        <div className="title">{translate("select_language")}</div>
                        <div className="text-box">
                            <Dropdown className="common-select"
                                controlClassName="control"
                                menuClassName="item"
                                options={languages}
                                onChange={e=>{
                                    window.setCookie("LANGUAGE", e.value);
                                    window.location.reload(true);
                                }}
                                value={select_language} />
                        </div>
                    </div>
	            </div>
	            {account_type != 0 ? <div className="info">
	            	<div className="title">{translate("corp_info")}</div>
	            	<div className="text-place">
	            		<div className="title">{translate("corporation_name")}</div>
	            		<div className="text-box"><input className="common-textbox" type="text" disabled={account_type == 2} value={this.state.company_name} onChange={this.onInfoChange.bind(this, "company_name")}/></div>
	            	</div>
	            	<div className="text-place">
	            		<div className="title">{translate("duns_number")}</div>
	            		<div className="text-box"><input className="common-textbox" type="text" disabled={account_type == 2} value={this.state.duns_number} onChange={this.onInfoChange.bind(this, "duns_number")}/></div>
	            	</div>
                    <div className="text-place">
                        <div className="title">{translate("corporation_ceo_name")}</div>
                        <div className="text-box"><input className="common-textbox" type="text" disabled={account_type == 2} value={this.state.company_ceo} onChange={this.onInfoChange.bind(this, "company_ceo")}/></div>
                    </div>
                    <div className="text-place">
                        <div className="title">{translate("corporation_tel")}</div>
                        <div className="text-box"><input className="common-textbox" type="text" disabled={account_type == 2} value={this.state.company_tel} onChange={this.onChangeInfoPhoneForm.bind(this, "company_tel")}/></div>
                    </div>
	            	<div className="text-place">
	            		<div className="title">{translate("address")}</div>
	            		<div className="text-box">
	            			<input className="common-textbox" type="text"
	            				disabled={account_type == 2} value={this.state.company_address}
	            				onChange={this.onInfoChange.bind(this, "company_address")}/>
	            			{ account_type == 1 ? <div className="blue-but" onClick={this.onClickFindAddress.bind(this, "company")}>{translate("find")}</div> : null }
	            		</div>
	            	</div>
	            </div>:null}
            </div>
            <div className="button-container">
            	<div className="blue-but" onClick={this.onSaveInformation}>{translate("save")}</div>
            </div>
        </div>)
	}
}

