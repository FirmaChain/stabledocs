import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../history';
import translate from "../../common/translate"
import queryString from "query-string"
import countryCode from "../countryCode.json"
import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'
import {
    request_email_verification_code,
    check_email_verification_code,
    request_phone_verification_code,
    check_phone_verification_code,
    register_new_account,
    fetch_user_info,
    invite_information,
    update_user_info,
    new_corp,
    consume_invitation,
    update_user_public_info,
    create_group,
    update_group_public_key,
    get_corp_member_count_no_auth,
} from "../../common/actions"
import Web3 from "../../common/Web3"

import Footer from "./footer.comp"

import {
    makeAuth,
    makeMnemonic,
    showMnemonic,
    mnemonicToSeed,
    SeedToMasterKeyPublic,
    SeedToMasterKeyPublicContract,
    SeedToEthKey,
    BrowserKeyBIP32,
    makeSignData,
    generateCorpKey,
    get256bitDerivedPublicKey,
    aes_encrypt,
    aes_decrypt,
    ecdsa_verify,
    new_account,
} from "../../common/crypto_test"

let mapStateToProps = (state)=>{
	return {
        user_info:state.user.info
	}
}

let mapDispatchToProps = {
    request_email_verification_code,
    check_email_verification_code,
    request_phone_verification_code,
    check_phone_verification_code,
    register_new_account,
    fetch_user_info,
    invite_information,
    update_user_info,
    new_corp,
    consume_invitation,
    update_user_public_info,
    create_group,
    update_group_public_key,
    get_corp_member_count_no_auth,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
        this.isGoingFinish = false
		this.state={
            step:0,
            step1:0,
            sort_test:[],
            email_verification: false,
            language: global.LANG,
            useraddress:"",
            countryCode:"82",
            countryCode_label:"Korea, Republic of (+82)",

        };

        {
            this.info1 = translate("terms");
            this.info2 = translate("condition");

            this.info1 = this.info1.replace(/\n/gi, "<br/>")
            this.info2 = this.info2.replace(/\n/gi, "<br/>")
        }
	}

	componentDidMount(){
        /*let account = new_account("pbes0707@gmail.com", "asdasdasd");
        console.log(account)
        this.setState({
            step:3,
            account:account,
            //mnemonic:account.rawMnemonic,
            recover_password:account.recoverPassword
        })*/


        if(!this.props.user_info){
            (async()=>{
                await window.showIndicator()
                await this.props.fetch_user_info()
                await window.hideIndicator()
            })()
        } else {
            return history.replace("/home")
        }

        (async()=>{
            if(localStorage.getItem("browser_key") /*|| localStorage.getItem("browser_key_virgin") == 0*/) {
                /*let res = await window.confirm(translate("yes_this_device_verify_account_are_you_unverify_go_register_?"))
                if( !res ) {
                    return history.push("/login")
                }*/
            }
            localStorage.removeItem("browser_key")
            //localStorage.removeItem("browser_key_virgin")
        })()

        if(this.getAccountType() == window.CONST.ACCOUNT_TYPE.CORP_SUB) {
            let params = queryString.parse(this.props.location.search)

            let registration_code = params.registration_code || "";
            let email_address = params.email_address || "";
            (async() => {
                let registration_info = await this.props.invite_information(email_address, registration_code);
                if(registration_info == null) {
                    alert(translate("not_validate_invite_code"))
                    return history.goBack()
                }

                let corp_count_resp = await this.props.get_corp_member_count_no_auth(registration_info.corp_id, registration_info.owner_id)
                let corp_member_count = corp_count_resp.corp_member_count
                let corp_member_count_max = corp_count_resp.corp_member_count_max

                if(corp_member_count_max <= corp_member_count) {
                    alert(translate("max_corp_member_count"))
                    return history.replace("/login")
                }

                this.setState({
                    registration_code: registration_code,
                    email: email_address,
                    company_name: registration_info.company_name,
                    duns_number: registration_info.duns_number,
                    company_ceo: registration_info.company_ceo,
                    company_tel: registration_info.company_tel,
                    company_address: registration_info.company_address,
                    corp_key: registration_info.corp_key,
                    corp_id: registration_info.corp_id,
                    owner_id: registration_info.owner_id,
                    group_key: registration_info.group_key,
                    group_id: registration_info.group_id,
                    email_verification: false,
                });
            })();
        } else if(this.getAccountType() == window.CONST.ACCOUNT_TYPE.EXPERT) {
            this.setState({
                profile_pic:"/static/empty_user.jpg",
                profile_pic_file:null,
                advisory_list:[{
                    field:null,
                    certificate_pic_name:"",
                    certificate_pic_file:null,
                    career_text:"",
                    career:[]
                }]
            })
        }
    }

    componentWillReceiveProps(props) {
        if(props.user_info) {
            history.replace("/")
        }
    }

    getAccountType() {
        let q = queryString.parse(this.props.location.search)
        if(!!q.registration_code && !!q.email_address) {
            return 2
        }

        if(!!this.props.location.state && !!this.props.location.state.type)
            return this.props.location.state.type

        return 0
    }

    goBack = ()=>{
        if(this.state.step == 0){
            history.goBack()
        }else{
            this.setState({
                step: this.state.step - 1
            })
        }
    }

    next_term = ()=>{
        let _ = {
            step: this.state.step + 1
        }
        if(this.state.step == 3) {
            _.shuffled_mnemonic = this.state.mnemonic.split(" ").map( (e, k) => { return {idx:k, word:e} } ).shuffle()
        }
        this.setState(_)
    }

    prev_term = () => {
        this.setState({
            step: this.state.step - 1
        })
    }

    onClickRequestEmail =  async ()=>{
        if(!this.state.email)
            return alert(translate("please_input_email"))

        await window.showIndicator();
        let resp = await this.props.request_email_verification_code(this.state.email)
        if(!resp.code)
            alert(translate("send_verification_code_error_occured"))

        if(resp.code == 1){
            alert(translate("email_was_sent"))
            this.setState({
                step1:1,
                email_verification:false
            })
        }else if(resp.code == -1){
            alert(translate("already_register_email"))
        }else if(resp.code == -3){
            alert(translate("not_validate_email"))
        }else{
            alert(translate("send_verification_code_error_occured"))
        }
        await window.hideIndicator();
    }

    onClickVerificateEmail = async ()=>{
        if(this.state.step1 != 1) {
            return alert(translate("first_you_need_send_email"))
        }

        if(this.state.verification_code == null || this.state.verification_code.length !=4){
            return alert(translate("code_is_4"))
        }

        await window.showIndicator();
        let resp = await this.props.check_email_verification_code(this.state.email, this.state.verification_code)
        if(resp.code == 1 && resp.payload == true){
            this.setState({
                email_verification:true
            })
            alert(translate("complete_verification"))
        }else{
            alert(translate("wrong_code"))
        }
        await window.hideIndicator();
    }

    onClickRequestPhone = async ()=>{
        if(this.state.userphone == null || this.state.userphone == "")
            return alert(translate("please_input_correct_phone"))

        if(this.state.countryCode == "82" && this.state.userphone.slice(0, 1) != "0" )
            await this.setState({userphone:"0"+this.state.userphone})

        if(this.state.countryCode == null || this.state.countryCode == "")
            return alert('please select country code')
            
        await window.showIndicator();
        let resp = await this.props.request_phone_verification_code(this.state.userphone, this.state.countryCode)
        if(resp.code == 1 && resp.payload == true){
            alert(translate("code_was_sent"))
            this.setState({
                phone_verification_code_sent:true,
                verificated_phone:false
            })
        }else{
            alert(translate("send_code_error_occured"))
        }
        await window.hideIndicator();
    }

    onClickVerificatePhone = async ()=>{
        if(this.state.phone_verification_code == null || this.state.phone_verification_code.length !=4){
            return alert(translate("code_is_4"))
        }
        await window.showIndicator();
        let resp = await this.props.check_phone_verification_code(this.state.userphone, this.state.phone_verification_code, this.state.countryCode)
        if(resp.code == 1 && resp.payload == true){
            alert(translate("success_verification"))
            this.setState({
                verificated_phone:true
            })
        } else if(resp.code == -6) {
            alert(translate("wrong_code"))
        } else if(resp.code == -7) {
            alert(translate("fail_3_times"))
        } else if(resp.code == -5) {
            alert(translate("no_request_phone_check"))
        }
        await window.hideIndicator();
    }

    onChangePhoneForm = async (name, e) => {
        let text = e.target.value;
        text = text.replace(/[^0-9]/g,"")
        //text = window.phoneFomatter(text)
        
        this.setState({
            [name]:text
        })
    }

    clickCopy = async (text) => {
        let t = document.createElement("textarea");
        document.body.appendChild(t);
        t.value = text;
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
        alert(translate("success_copy"));
    }

    onClickNextBtnAccountInfo = async ()=>{
        if(!this.state.email){
            return alert(translate("please_input_email"))
        }
        else if(!this.state.password || this.state.password.length < 8){
            return alert(translate("password_will_be_more_than_8"))
        }
        else if(this.state.password !== this.state.password2){
            return alert(translate("password_not_symmetry"))
        }
        else if(!this.state.email_verification) {
            return alert(translate("go_email_verification"))
        }

        this.setState({
            step: this.state.step+1
        })
    }

    onClickFindAddress = async (type)=>{
        await window.showIndicator()
        daum.postcode.load(() => {
            new daum.Postcode({
                oncomplete: async (data) => {
                    let address = data;

                    if(!!address && !!address.roadAddress) {
                        if(type == 0) {
                            this.setState({
                                useraddress: address.roadAddress + " "
                            })
                        } else if(type == 1) {
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

    onClickNextBtnUserInfo = async ()=>{
        if(!this.state.username)
            return alert(translate("please_input_name"))
        if(!this.state.verificated_phone)
            return alert(translate("please_verify_phone"))
        /*if(!this.state.useraddress)
            return alert(translate("please_input_address"))*/

        let account = new_account(this.state.email, this.state.password);
        this.setState({
            step:this.state.step + 1,
            account:account,
            //mnemonic:account.rawMnemonic,
            recover_password:account.recoverPassword
        })
    }

    onClickNextBtnCompanyInfo = async ()=>{
        if(!this.state.company_name)
            return alert(translate("please_input_corp_name"))
        if(!this.state.duns_number)
            return alert(translate("please_input_duns"))
        if(!this.state.company_ceo)
            return alert(translate("please_input_ceo_name"))
        if(!this.state.company_tel)
            return alert(translate("please_input_corp_tel"))
        if(!this.state.company_address)
            return alert(translate("please_input_corp_address"))

        if(!this.state.username)
            return alert(translate("please_input_name"))
        if(!this.state.job)
            return alert(translate("please_input_job"))
        if(!this.state.verificated_phone)
            return alert(translate("please_verify_phone"))

        let account = new_account(this.state.email, this.state.password);
        this.setState({
            step:this.state.step + 1,
            account:account,
            //mnemonic:account.rawMnemonic,
            recover_password:account.recoverPassword
        })
    }

    onClickNextBtnExpertInfo = async ()=>{
        if(!this.state.username)
            return alert(translate("please_input_name"));
        if(!this.state.verificated_phone)
            return alert(translate("please_verify_phone"));
        if(!this.state.useraddress)
            return alert(translate("please_input_address"));
        if(!this.state.introduce_article)
            return alert(translate("please_input_introduce_me"));

        if(this.state.advisory_list.length < 1)
            return alert(translate("please_input_advisory_more_than_1"));

        for(let v of this.state.advisory_list) {
            if(v.field == null) {
                return alert(translate("please_input_advisory_field"))
            }
            if(v.certificate_pic_file == null) {
                return alert(translate("please_input_advisory_certificate_file", [v.field]))
            }
            if(v.career.length < 1) {
                return alert(translate("please_add_career_more_than_1"))
            }
        }

        let account = new_account(this.state.email, this.state.password);
        this.setState({
            step:this.state.step + 1,
            account:account,
            //mnemonic:account.rawMnemonic,
            recover_password:account.recoverPassword
        })
    }

    /*onClickSaveMnemonic = ()=>{
        let anchor = document.createElement('a');
        anchor.target = "_blank";
        anchor.href = "/static/recovery_phrase_document.pdf";
        anchor.click();
    }*/

    onClickSortTest = (item)=>{
        let sort_test = [...this.state.sort_test]
        let sort_item = sort_test.find( e => item.word == e.word && item.idx == e.idx )
        if( sort_item ){
            for(let i in sort_test) {
                if(sort_item.idx == sort_test[i].idx) {
                    sort_test.splice(i, 1)
                    break;
                }
            }
        } else {
            sort_test.push(item)
        }

        this.setState({
            sort_test:sort_test
        })
    }

    onClickUploadProfilePic = async (e) => {
        let file = e.target.files[0];
        if(!file) return;
        await window.showIndicator();
        let sizeMb = file.size / 1024 / 1024;
        if(sizeMb > 2) {
            await window.hideIndicator();
            return alert(translate("do_not_upload_more_than_2mb_size"))
        }

        var reader = new FileReader();
        reader.onload = (read) => {
            this.setState({profile_pic:read.target.result})
        }
        reader.readAsDataURL(file);
        console.log(file)
        await this.setState({profile_pic_file:file})
        await window.hideIndicator();
    }

    onClickUploadCertificatePic = async (k, e) => {
        let file = e.target.files[0];
        if(!file) return;
        await window.showIndicator();
        let sizeMb = file.size / 1024 / 1024;
        if(sizeMb > 2) {
            await window.hideIndicator();
            return alert(translate("do_not_upload_more_than_2mb_size"))
        }
        let n = [...this.state.advisory_list]
        n[k].certificate_pic_name = file.name;
        n[k].certificate_pic_file = file;
        await this.setState({advisory_list:n})
        await window.hideIndicator();
    }

    onClickAddAdvisory = async (e) => {
        this.setState({advisory_list:[...this.state.advisory_list, {
            field:null,
            certificate_pic_name:"",
            certificate_pic_file:null,
            career_text:"",
            career:[]
        }]})
    }

    onClickAddCareer = async (k, e) => {
        let n = [...this.state.advisory_list];

        if(!n[k].career_text || n[k].career_text == "") {
            return alert(translate("please_input_career_text"))
        }
        if(!n[k].career_start_year || n[k].career_start_year == "") {
            return alert(translate("please_input_career_start_year"))
        }

        n[k].career.push({
            text:n[k].career_text,
            start_year:n[k].career_start_year,
            end_year:n[k].career_end_year,
        })
        n[k].career_text = ""
        n[k].career_start_year = ""
        n[k].career_end_year = ""
        this.setState({advisory_list:n})
    }

    onClickRemoveCareer = async (k, career_index, e) => {
        let n = [...this.state.advisory_list]
        n[k].career.splice(career_index, 1)
        this.setState({advisory_list:n})
    }

    onClickRemoveAdvisory = async (index, e) => {
        let n = [...this.state.advisory_list]
        n.splice(index, 1)
        this.setState({advisory_list: n})
    }

    onClickFinishRegister = async ()=>{
        if(this.isGoingFinish)
            return

        this.isGoingFinish = true

        // master keyword progress
        /*if(this.state.sort_test.map(e=>e.word).join(" ") != this.state.mnemonic){
            this.setState({
                shuffled_mnemonic:this.state.mnemonic.split(" ").map( (e, k) => { return {idx:k, word:e} } ).shuffle(),
                sort_test:[],
            })
            this.isGoingFinish = false
            return alert(translate("please_check_master_keyword_order"))
        }*/
        let account_type = this.getAccountType()
        let info, corp_info, public_info, open_info

        let department = this.state.department || ""

        if(account_type == window.CONST.ACCOUNT_TYPE.PERSONAL) { // 개인 계정
            info = {
                email: this.state.email.trim(),
                username: this.state.username.trim(),
                userphone: this.state.userphone,
                useraddress: this.state.useraddress.trim(),
                recover_password: this.state.account.recoverPassword,
                countrycode:this.state.countryCode.trim(),
            }
        } else if(account_type == window.CONST.ACCOUNT_TYPE.CORP_MASTER) { // 기업 관리자 계정
            info = {
                recover_password: this.state.account.recoverPassword,
            }
            public_info = {
                email: this.state.email.trim(),
                username: this.state.username.trim(),
                department: department.trim(),
                job: this.state.job.trim(),
                userphone: this.state.userphone,
                countrycode:this.state.countryCode.trim(),
            }
            corp_info = {
                company_name: this.state.company_name.trim(),
                duns_number: this.state.duns_number.trim(),
                company_ceo: this.state.company_ceo.trim(),
                company_tel: this.state.company_tel.trim(),
                company_address: this.state.company_address.trim(),
            }
        } else if(account_type == window.CONST.ACCOUNT_TYPE.CORP_SUB) { // 기업 직원 계정
            info = {
                corp_id: this.state.corp_id,
                corp_key: this.state.corp_key,
                group_keys: { [this.state.group_id] : this.state.group_key },
                recover_password: this.state.account.recoverPassword,
            }
            public_info = {
                email: this.state.email.trim(),
                username: this.state.username.trim(),
                job: this.state.job.trim(),
                department: department.trim(),
                userphone: this.state.userphone.trim(),
                countrycode:this.state.countryCode.trim(),
            }
        } else if(account_type == window.CONST.ACCOUNT_TYPE.EXPERT) { // 전문가 계정
            info = {
                recover_password: this.state.account.recoverPassword,
            }
            open_info = {
                user_info: {
                    email: this.state.email.trim(),
                    username: this.state.username.trim(),
                    userphone: this.state.userphone,
                    countrycode:this.state.countryCode.trim(),
                    useraddress: this.state.useraddress.trim(),
                    introduce_article: this.state.introduce_article.trim(),
                },
                advisory_list: this.state.advisory_list.map(e=>{return {
                    field:e.field,
                    certificate_pic_name:e.certificate_pic_name,
                    career:e.career
                }})
            }
            return;
        }

        let keyPair = SeedToEthKey(this.state.account.seed, "0'/0/0");
        let privateKey = "0x"+keyPair.privateKey.toString('hex');

        let wallet = Web3.walletWithPK(privateKey)
        let encryptedInfo = aes_encrypt(JSON.stringify(info), this.state.account.masterKeyPublic);


        let emk = aes_encrypt(this.state.account.rawMnemonic, Buffer.from(this.state.account.recoverPassword, 'hex'))
        let mk;
        try {
            mk = aes_decrypt(Buffer.from(emk, 'hex'), Buffer.from(this.state.account.recoverPassword, 'hex'))
        } catch(err) {
            console.log(err)
        }

        if(mk != this.state.account.rawMnemonic) {
            return alert("something is very wrong. check rawMnemonic");
        }
        
        await window.showIndicator()
        let resp
        if(account_type == window.CONST.ACCOUNT_TYPE.PERSONAL) {
            try{
                resp = await this.props.register_new_account(this.state.account, 
                    encryptedInfo, this.state.email, 
                    this.state.username, wallet.address, 
                    account_type, emk)
            } catch(err) {
                this.isGoingFinish = false
                console.log("network error")
                await window.hideIndicator()
                return;
            }
        } else if (account_type == window.CONST.ACCOUNT_TYPE.CORP_MASTER) {
            let corpMasterKey = generateCorpKey();
            // inject into master's info
            let corpKey = get256bitDerivedPublicKey(corpMasterKey, "m/0'/0'");
            let encryptedCorpInfo = aes_encrypt(JSON.stringify(corp_info), corpKey);
            /*let corpResp = await this.props.new_corp(encryptedCorpInfo);
            if (!corpResp) {
                return alert(translate("fail_create_corp_info"));
            }*/
            //info['corp_id'] = corpResp.corp_id;
            info['corp_master_key'] = corpMasterKey.toString("hex");
            info['corp_key'] = corpKey.toString('hex');
            let encryptedInfo = aes_encrypt(JSON.stringify(info), this.state.account.masterKeyPublic);
            /*let updateResp = await this.props.update_user_info(encryptedInfo);
            if (!updateResp) {
                return alert(translate("fail_save_corp_key"));
            }*/

            let encryptedPublicInfo = aes_encrypt(JSON.stringify(public_info), Buffer.from(info['corp_key'], 'hex'));
            /*updateResp = await this.props.update_user_public_info(encryptedPublicInfo);
            if (!updateResp) {
                return alert(translate("fail_save_public_info"));
            }*/

            try {
                resp = await this.props.register_new_account(this.state.account, 
                    encryptedInfo, this.state.email, 
                    this.state.username, wallet.address, 
                    account_type, emk, encryptedPublicInfo, encryptedCorpInfo)
            } catch(err) {
                this.isGoingFinish = false
                console.log("network error")
                await window.hideIndicator()
                return;
            }

            if(resp.code == 1) {
                let gresp = await this.props.create_group(translate("basic_group"));
                await this.props.update_group_public_key(gresp.group_id, info['corp_master_key']);
            }

        } else if (account_type == window.CONST.ACCOUNT_TYPE.CORP_SUB) {

            let corp_count_resp = await this.props.get_corp_member_count_no_auth(this.state.corp_id, this.state.owner_id)
            let corp_member_count = corp_count_resp.corp_member_count
            let corp_member_count_max = corp_count_resp.corp_member_count_max

            if(corp_member_count_max <= corp_member_count)
                return alert(translate("max_corp_member_count"));

            let encryptedPublicInfo = aes_encrypt(JSON.stringify(public_info), Buffer.from(info['corp_key'], 'hex'));
            /*let consumeResp = await this.props.consume_invitation(this.state.registration_code, encryptedPublicInfo);
            if (!consumeResp) {
                return alert(translate("fail_to_use_invite_code"));
            }*/

            try {
                resp = await this.props.register_new_account(this.state.account, 
                    encryptedInfo, this.state.email, 
                    this.state.username, wallet.address, 
                    account_type, emk, encryptedPublicInfo, null, null, this.state.registration_code)
            } catch(err) {
                this.isGoingFinish = false
                console.log("network error")
                await window.hideIndicator()
                return;
            }
        } else if (account_type == window.CONST.ACCOUNT_TYPE.EXPERT) {
            try{
                resp = await this.props.register_new_account(this.state.account, 
                    encryptedInfo, this.state.email, 
                    this.state.username, wallet.address, 
                    account_type, emk, null, null, JSON.stringify(open_info))
            } catch(err) {
                this.isGoingFinish = false
                console.log("network error")
                await window.hideIndicator()
                return;
            }
        }
        await window.hideIndicator()

        if(resp.code == 1){
            window.logout();
            //localStorage.setItem("browser_key_virgin", 0);
            history.push("/");
            return alert(translate("success_register"))
        } else if(resp.code == -30) {
            this.isGoingFinish = false
            return alert(translate("fail_create_account"))
        } else if(resp.code == -21) {
            this.isGoingFinish = false
            return alert(translate("fail_create_corp_info"))
        } else if(resp.code == -22) {
            this.isGoingFinish = false
            return alert(translate("fail_create_account"))
        } else if(resp.code == -3) {
            this.isGoingFinish = false
            return alert(translate("already_login_this_browser"))
        } else if(resp.code == -4) {
            this.isGoingFinish = false
            return alert(translate("dont_create_session"))
        } else if(resp.code == -5) {
            this.isGoingFinish = false
            return alert(translate("fail_create_account"))
        } else {
            this.isGoingFinish = false
            return alert(translate("unknown_error_occured"))
        }

    }

    openWhatIsMasterkeywordModal = () => {
        window.openModal("CommonModal", {
            icon:"fas fa-money-check",
            title:translate("what_is_master_keyword"),
            subTitle:translate("what_is_master_keyword_desc_1"),
            desc:translate("what_is_master_keyword_desc_2")
        })
    }

    keyPress = async (type, e) => {
        if(e.keyCode == 13){
            switch(type) {
                case 0:
                this.onClickVerificateEmail()
                break;
                case 1:
                this.onClickNextBtnAccountInfo()
                break;
            }
        }
    }
    
    render_term(){
        return (<div className="content">
            <div className="service-title"> {translate("service_term")} </div>
            <div className="terms-condition" dangerouslySetInnerHTML={{__html:this.info1}}></div>
            
            <div className="service-title"> {translate("privacy_statement")} </div>
            <div className="terms-condition" dangerouslySetInnerHTML={{__html:this.info2}}></div>

            <div className="bottom-container">
                <div className="confirm-button" onClick={this.next_term}>
                    {translate("all_agree")}
                </div>
            </div>
        </div>)
    }

    render_email(){
        let type = this.getAccountType()

        return (<div className="content">
            <div className="text-place">
                <div className="name">{translate("email")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="email"
                        value={this.state.email || ""} 
                        onChange={e=>this.setState({email:e.target.value})}
                        disabled={this.state.email_verification}
                        placeholder={translate("please_input_email_correct")}/>
                </div>
                { this.state.email_verification ?
                    <div className="gray-but">{translate("complete_send")}</div> : 
                    <div className="blue-but" onClick={this.onClickRequestEmail}>{translate("send")}</div>
                }
            </div>

            <div className="text-place">
                <div className="name">{translate("email_certification")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.verification_code || ""}
                        onKeyDown={this.keyPress.bind(this, 0)}
                        onChange={e=>this.setState({verification_code:e.target.value})}
                        disabled={this.state.email_verification}
                        placeholder={translate("please_input_certification_number")}/>
                </div>
                {this.state.email_verification ? null : 
                    <div className={this.state.step1 == 1 ? "blue-but" : "gray-but"} onClick={this.onClickVerificateEmail}>
                        {translate("confirm")}
                    </div>
                }
            </div>

            <div className="text-place">
                <div className="name">{translate("password")}</div>
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
                <div className="confirm-button" onClick={this.onClickNextBtnAccountInfo}>
                    {translate("confirm")}
                </div>
            </div>
        </div>)
    }

    render_personal(){
        let _countryCode = countryCode.map(e=>{return {...e, label:e.name, value:e.code} })
        return (<div className="content">
            <div className="text-place">
                <div className="name">{translate("name")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.username || ""}
                        onChange={e=>this.setState({username:e.target.value})}
                        placeholder={translate("please_input_name_correct")}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name">{translate("individual_phone")}</div>
                <div className="textbox-left">
                    <Dropdown className="common-select"
                        controlClassName="control"
                        menuClassName="item"
                        options={_countryCode}
                        placeholder={translate("country_code")}
                        onChange={e=>{
                            let ee = _countryCode.find(k=>e.label == k.name && e.value == k.code)
                            this.setState({countryCode:ee.dial_code.replace(/(\s*)/g,"").replace(/\+/g,""), countryCode_label:ee.name+" (" + ee.dial_code + ")"})
                        }}
                        value={this.state.countryCode_label} />
                    <input className="common-textbox textbox-half" type="text"
                        value={this.state.userphone || ""} 
                        onChange={this.onChangePhoneForm.bind(this,"userphone")}
                        disabled={this.state.verificated_phone}
                        placeholder={translate("please_input_correct_phone")}/>
                </div>
                { this.state.verificated_phone ? null :
                    <div className="blue-but" onClick={this.onClickRequestPhone}>
                        {translate("send")}
                    </div>
                }
            </div>

            <div className="text-place">
                <div className="name">{translate("certification_number")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.phone_verification_code || ""} 
                        onChange={e=>this.setState({phone_verification_code:e.target.value})} 
                        disabled={this.state.verificated_phone}
                        placeholder={translate("please_input_certification_number")}/>
                </div>
                { this.state.verificated_phone ? null : 
                    <div className={ this.state.phone_verification_code_sent ? "blue-but":"gray-but"} onClick={this.onClickVerificatePhone}>
                        {translate("confirm")}
                    </div>
                }
            </div>

            {/*<div className="text-place">
                <div className="name">{translate("individual_address")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.useraddress || ""} 
                        onChange={e=>this.setState({useraddress:e.target.value})}
                        placeholder={translate("please_input_address_correct")}/>
                </div>
                <div className="blue-but" onClick={this.onClickFindAddress.bind(this, 0)}>
                    {translate("search")}
                </div>
            </div>*/}

            <div className="bottom-container">
                <div className="back-button" onClick={this.prev_term}>{translate("go_back")}</div>
                <div className="confirm-button" onClick={this.onClickNextBtnUserInfo}>
                    {translate("confirm")}
                </div>
            </div>
        </div>)
    }

    render_company() {
        let _countryCode = countryCode.map(e=>{return {...e, label:e.name, value:e.code} })
        return (<div className="content">
            <div className="text-place">
                <div className="name">{translate("corp_info")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.company_name || ""}
                        onChange={e=>this.setState({company_name:e.target.value})}
                        placeholder={translate("please_input_corp_name")}
                        disabled={this.getAccountType() == window.CONST.ACCOUNT_TYPE.CORP_SUB}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name"></div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.duns_number || ""}
                        onChange={e=>this.setState({duns_number:e.target.value})}
                        placeholder={translate("please_input_duns")}
                        disabled={this.getAccountType() == window.CONST.ACCOUNT_TYPE.CORP_SUB}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name">{translate("corporation_ceo_name")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.company_ceo || ""}
                        onChange={e=>this.setState({company_ceo:e.target.value})}
                        placeholder={translate("please_input_ceo_name")}
                        disabled={this.getAccountType() == window.CONST.ACCOUNT_TYPE.CORP_SUB}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name">{translate("corporation_tel")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.company_tel || ""}
                        onChange={this.onChangePhoneForm.bind(this,"company_tel")}
                        placeholder={translate("please_input_corp_tel")}
                        disabled={this.getAccountType() == window.CONST.ACCOUNT_TYPE.CORP_SUB}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name">{translate("corporation_address")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.company_address || ""} 
                        onChange={e=>this.setState({company_address:e.target.value})}
                        placeholder={translate("please_input_address_correct")}
                        disabled={this.getAccountType() == 2}/>
                </div>
                { this.getAccountType() == window.CONST.ACCOUNT_TYPE.CORP_SUB ? null : <div className="blue-but" onClick={this.onClickFindAddress.bind(this, 1)}>
                    {translate("search")}
                </div>}
            </div>

            <div className="split-line"></div>

            <div className="text-place">
                <div className="name">{translate("manager_info")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.username || ""}
                        onChange={e=>this.setState({username:e.target.value})}
                        placeholder={translate("please_input_manager_name")}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name"></div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.department || ""}
                        onChange={e=>this.setState({department:e.target.value})}
                        placeholder={translate("please_input_manager_department")}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name"></div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.job || ""}
                        onChange={e=>this.setState({job:e.target.value})}
                        placeholder={translate("please_input_manager_job")}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name">{translate("individual_phone")}</div>
                <div className="textbox-left">
                    <Dropdown className="common-select"
                        controlClassName="control"
                        menuClassName="item"
                        options={_countryCode}
                        placeholder={translate("country_code")}
                        onChange={e=>{
                            let ee = _countryCode.find(k=>e.label == k.name && e.value == k.code)
                            this.setState({countryCode:ee.dial_code.replace(/(\s*)/g,"").replace(/\+/g,""), countryCode_label:ee.name+" (" + ee.dial_code + ")"})
                        }}
                        value={this.state.countryCode_label} />
                    <input className="common-textbox" type="text"
                        value={this.state.userphone || ""} 
                        onChange={this.onChangePhoneForm.bind(this,"userphone")}
                        disabled={this.state.verificated_phone}
                        placeholder={translate("please_input_correct_phone")}/>
                </div>
                { this.state.verificated_phone ? null :
                    <div className="blue-but" onClick={this.onClickRequestPhone}>
                        {translate("send")}
                    </div>
                }
            </div>

            <div className="text-place">
                <div className="name">{translate("certification_number")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.phone_verification_code || ""} 
                        onChange={e=>this.setState({phone_verification_code:e.target.value})} 
                        disabled={this.state.verificated_phone}
                        placeholder={translate("please_input_certification_number")}/>
                </div>
                { this.state.verificated_phone ? null : 
                    <div className={ this.state.phone_verification_code_sent ? "blue-but":"gray-but"} onClick={this.onClickVerificatePhone}>
                        {translate("confirm")}
                    </div>
                }
            </div>

            <div className="bottom-container">
                <div className="back-button" onClick={this.prev_term}>{translate("go_back")}</div>
                <div className="confirm-button" onClick={this.onClickNextBtnCompanyInfo}>
                    {translate("confirm")}
                </div>
            </div>
        </div>)
    }

    render_expert() {
        let _countryCode = countryCode.map(e=>{return {...e, label:e.name, value:e.code} })
        let list = [
            {value:"0", label: translate("expert_0")},
            {value:"1", label: translate("expert_1")},
            {value:"2", label: translate("expert_2")},
            {value:"3", label: translate("expert_3")},
            {value:"4", label: translate("expert_4")},
            {value:"5", label: translate("expert_5")},
            {value:"6", label: translate("expert_6")},
        ]
        return (<div className="content">
            <div className="text-place">
                <div className="name">{translate("name")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.username || ""}
                        onChange={e=>this.setState({username:e.target.value})}
                        placeholder={translate("please_input_name")}/>
                </div>
            </div>

            <div className="text-place">
                <div className="name">{translate("individual_phone")}</div>
                <div className="textbox-left">
                    <Dropdown className="common-select"
                        controlClassName="control"
                        menuClassName="item"
                        options={_countryCode}
                        placeholder={translate("country_code")}
                        onChange={e=>{
                            let ee = _countryCode.find(k=>e.label == k.name && e.value == k.code)
                            this.setState({countryCode:ee.dial_code.replace(/(\s*)/g,"").replace(/\+/g,""), countryCode_label:ee.name+" (" + ee.dial_code + ")"})
                        }}
                        value={this.state.countryCode_label} />
                    <input className="common-textbox" type="text"
                        value={this.state.userphone || ""} 
                        onChange={this.onChangePhoneForm.bind(this,"userphone")}
                        disabled={this.state.verificated_phone}
                        placeholder={translate("please_input_certification_number")}/>
                </div>
                { this.state.verificated_phone ? null :
                    <div className="blue-but" onClick={this.onClickRequestPhone}>
                        {translate("send")}
                    </div>
                }
            </div>

            <div className="text-place">
                <div className="name">{translate("certification_number")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.phone_verification_code || ""} 
                        onChange={e=>this.setState({phone_verification_code:e.target.value})} 
                        disabled={this.state.verificated_phone}
                        placeholder={translate("please_input_certification_number")}/>
                </div>
                { this.state.verificated_phone ? null : 
                    <div className={ this.state.phone_verification_code_sent ? "blue-but":"gray-but"} onClick={this.onClickVerificatePhone}>
                        {translate("confirm")}
                    </div>
                }
            </div>

            <div className="text-place">
                <div className="name">{translate("address")}</div>
                <div className="textbox">
                    <input className="common-textbox" type="text"
                        value={this.state.useraddress || ""} 
                        onChange={e=>this.setState({useraddress:e.target.value})}
                        placeholder={translate("please_input_address_correct")}/>
                </div>
                <div className="blue-but" onClick={this.onClickFindAddress.bind(this, 1)}>
                    {translate("search")}
                </div>
            </div>

            <div className="split-line"></div>
            <div className="add-title">{translate("expert_info")}</div>

            <div className="profile-pic">
                <div className="title">{translate("profile_pic")}</div>
                <div className="upload-image">
                    <img className="img" src={this.state.profile_pic}/>
                    <div className="blue-but" onClick={()=>this.refs["profile-file"].click()}>{translate("choose_pic")}</div>
                    <input ref="profile-file" className="hidden-file" type="file" accept="image/x-png,image/jpeg" onChange={this.onClickUploadProfilePic} />
                </div>
            </div>
            <div className="text-place textarea-place">
                <div className="name">{translate("introduce_me")}</div>
                <div className="textbox">
                    <textarea className="common-textbox" type="text"
                        value={this.state.introduce_article || ""} 
                        onChange={e=>this.setState({introduce_article:e.target.value})}
                        placeholder={translate("please_input_introduce_me")}
                        disabled={this.getAccountType() == 2}></textarea>
                </div>
            </div>

            <div className="split-line"></div>

            <div className="add-title">
                {translate("advisory_field")}
                <div className="flex1"></div>
                <div className="blue-but" onClick={this.onClickAddAdvisory}>{translate("advisory_add")}</div>
            </div>

            <div className="add-list">
                {this.state.advisory_list ? this.state.advisory_list.map((e, k) => {
                    return <div className="item" key={k}>
                        <div className="row">
                            <div className="box">
                                <div className="title">{translate("field")}</div>
                                <div className="desc">
                                    <Dropdown className="common-select"
                                        controlClassName="control"
                                        menuClassName="item"
                                        placeholder={translate("advisory_field_select")}
                                        options={list}
                                        onChange={e=>{
                                            let n = [...this.state.advisory_list]
                                            n[k].field = e.value;
                                            n[k].field_label = e.label;
                                            this.setState({advisory_list:n})
                                        }}
                                        value={this.state.advisory_list[k].field_label} />
                                </div>
                                <div className="button">
                                    {this.state.advisory_list.length > 1 ? <div className="gray-but" onClick={this.onClickRemoveAdvisory.bind(this, k)}>{translate("delete")}</div> : null}
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="box">
                                <div className="title">{translate("certificate_pic")}</div>
                                <div className="desc">
                                    <input className="common-textbox" 
                                        type="text"
                                        placeholder={translate("no_certificate")}
                                        value={this.state.advisory_list[k].certificate_pic_name} disabled />
                                    <input ref={`ceriticate_${k}`} className="hidden-file" type="file" accept="image/x-png,image/jpeg" onChange={this.onClickUploadCertificatePic.bind(this, k)}/>
                                </div>
                                <div className="button">
                                    <div className="blue-but" onClick={()=>this.refs[`ceriticate_${k}`].click()}>{translate("upload")}</div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="box">
                                <div className="title">{translate("career")}</div>
                                <div className="desc">
                                    <input className="common-textbox half" type="number"
                                        value={this.state.advisory_list[k].career_start_year || ""}
                                        onChange={e=>{
                                            let n = [...this.state.advisory_list]
                                            n[k].career_start_year = e.target.value;
                                            this.setState({advisory_list:n})
                                        }}
                                        placeholder={translate("begin_year")}/>
                                    <input className="common-textbox half" type="number"
                                        value={this.state.advisory_list[k].career_end_year || ""}
                                        onChange={e=>{
                                            let n = [...this.state.advisory_list]
                                            n[k].career_end_year = e.target.value;
                                            this.setState({advisory_list:n})
                                        }}
                                        placeholder={translate("end_year")}/>
                                </div>
                                <br/>
                                <div className="button">
                                </div>
                            </div>
                            <div className="box">
                                <div className="title"></div>
                                <div className="desc">
                                    {translate("if_now_keep_going_you_dont_input")}<br/>
                                    {translate("please_input_past_career_first")}
                                </div>
                            </div>
                            <div className="box">
                                <div className="title"></div>
                                <div className="desc">
                                    <input className="common-textbox" type="text"
                                        value={this.state.advisory_list[k].career_text || ""}
                                        onChange={e=>{
                                            let n = [...this.state.advisory_list]
                                            n[k].career_text = e.target.value;
                                            this.setState({advisory_list:n})
                                        }}
                                        placeholder={translate("history_example")}/>
                                </div>
                                <div className="button">
                                    <div className="blue-but" onClick={this.onClickAddCareer.bind(this, k)}>{translate("career_add")}</div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            {this.state.advisory_list[k].career.map((e, career_index) => {
                                return <div className="career-item" key={career_index}>
                                    <div className="text">{e.start_year} ~ {e.end_year || translate("now")} | {e.text}</div>
                                    <div className="delete-but" onClick={this.onClickRemoveCareer.bind(this, k, career_index)}><i className="far fa-times"></i></div>
                                </div>
                            })}
                        </div>
                    </div>
                }) : null}
            </div>

            <div className="bottom-container">
                <div className="back-button" onClick={this.prev_term}>{translate("go_back")}</div>
                <div className="confirm-button" onClick={this.onClickNextBtnExpertInfo}>
                    {translate("confirm")}
                </div>
            </div>
        </div>)
    }

    render_masterkey(){
        return (<div className="content">
            <div className="master-keyword-container">
                <div className="sub-title-container">
                    <div className="title">{translate("recover_password")}</div>
                    {/*<div className="what-is-masterkeyword" onClick={this.openWhatIsMasterkeywordModal}>{translate("what_is_recover_password")}</div>*/}
                </div>
                {/*<div className="list">
                    {this.state.mnemonic.split(" ").map((e,k)=>{
                        return <div key={e+k} className="item">{k+1}. {e}</div>
                    })}
                </div>*/}
                <div className="recover-password">
                    {translate("recover_password")} : <b onClick={this.clickCopy.bind(this, this.state.recover_password)}>{this.state.recover_password}</b>
                </div>

                <div className="reference">
                    {translate("recover_password_must_be_save_desc_1")}<br/>
                    <br/>
                    {translate("recover_password_must_be_save_desc_2")}<br/>
                </div>
            </div>

            <div className="bottom-container">
                {/*<div className="transparent-button" onClick={this.onClickSaveMnemonic}>
                    {translate("download_saveform")}
                </div>*/}
                <div className="confirm-button" onClick={this.onClickFinishRegister /*next_term*/}>
                    {translate("confirm")}
                </div>
            </div>
        </div>)
    }

    render_empty_slot() {
        let count = 12 - this.state.sort_test.length
        let div = []
        for(let i = 0 ; i < count ; i++) {
            div.push(<div className="empty-item">&nbsp;</div>)
        }
        return div
    }

    render_confirm_masterkey(){
        let shuffled_mnemonic = this.state.shuffled_mnemonic
        return (<div className="content">
            <div className="master-keyword-container">
                <div className="sub-title-container">
                    <div className="title">{translate("confirm_master_keyword")}</div>
                </div>
                <div className="selection-list">
                    {this.state.sort_test.map((e,k)=>{
                        return <div className="item" key={e.idx}>{e.word}</div>
                    })}
                    {this.render_empty_slot()}
                </div>
                <div className="split-line"></div>
                <div className="list">
                    {shuffled_mnemonic.map((e, k)=>{
                        return <div key={e.idx} 
                                    className={`item cursored ${this.state.sort_test.find( v => v.word == e.word && v.idx == e.idx) ? "selected" : ""}`}
                                    onClick={this.onClickSortTest.bind(this,e)}
                                >
                            {e.word}
                        </div>
                    })}
                </div>
            </div>
            <div className="bottom-container">
                <div className="back-button" onClick={this.prev_term}>{translate("go_back")}</div>
                <div className="confirm-button" onClick={this.onClickFinishRegister}>{translate("complete_join")}</div>
            </div>
        </div>)
    }

    render_content(){
        if(this.state.step == 0){
            return this.render_term();
        }else if(this.state.step == 1){
            return this.render_email();
        }else if(this.state.step == 2){
            let type = this.getAccountType()
            if(type == window.CONST.ACCOUNT_TYPE.PERSONAL)
                return this.render_personal();
            else if(type == window.CONST.ACCOUNT_TYPE.CORP_MASTER || type == window.CONST.ACCOUNT_TYPE.CORP_SUB)
                return this.render_company();
            else if(type == window.CONST.ACCOUNT_TYPE.EXPERT)
                return this.render_expert();
        }else if(this.state.step == 3){
            return this.render_masterkey();
        }else if(this.state.step == 4){
            return this.render_confirm_masterkey();
        }
    }

    render_title() {
        let type = this.getAccountType()
        let title = "", desc = ""
        if(this.state.step == 0){
            if(type == window.CONST.ACCOUNT_TYPE.PERSONAL) {
                title = translate("individual_join_term_agree")
                desc = translate("individual_join_term_agree_desc")
            }
            else if(type == window.CONST.ACCOUNT_TYPE.CORP_MASTER) {
                title = translate("corporation_join_term_agree")
                desc = translate("corporation_join_term_agree_desc")
            }
            else if(type == window.CONST.ACCOUNT_TYPE.CORP_SUB) {
                title = translate("coporation_staff_account_join_term_agree")
                desc = translate("coporation_staff_account_join_term_agree_desc")
            }
            else if(type == window.CONST.ACCOUNT_TYPE.EXPERT) {
                title = translate("expert_join_term_agree")
                desc = translate("expert_join_term_agree_desc")
            }
        } else if(this.state.step == 1){
            title = translate("input_account_info")
            if(type == window.CONST.ACCOUNT_TYPE.PERSONAL)
                desc = translate("input_account_info_desc_1")
            else if(type == window.CONST.ACCOUNT_TYPE.CORP_MASTER)
                desc = translate("input_account_info_desc_2")
            else if(type == window.CONST.ACCOUNT_TYPE.CORP_SUB)
                desc = translate("input_account_info_desc_3")
            else if(type == window.CONST.ACCOUNT_TYPE.EXPERT)
                desc = translate("input_account_info_desc_4")
        } else if(this.state.step == 2){
            if(type == window.CONST.ACCOUNT_TYPE.PERSONAL) {
                title = translate("input_user_info")
                desc = translate("input_user_info_desc")
            } else if(type == window.CONST.ACCOUNT_TYPE.CORP_MASTER || type == window.CONST.ACCOUNT_TYPE.CORP_SUB) {
                title = translate("input_corporation_info")
                desc = translate("input_corporation_info_desc")
            } else if(type == window.CONST.ACCOUNT_TYPE.EXPERT) {
                title = translate("input_expert_detail_info")
                desc = translate("input_expert_info_desc")
            }
        } else if(this.state.step == 3){
            title = translate("save_recover_password")
            desc = translate("save_recover_password_desc_1")
            /*title = translate("save_master_keyword")
            desc = translate("save_master_keyword_desc_1")*/
        } /*else if(this.state.step == 4){
            title = translate("save_master_keyword")
            desc = translate("save_master_keyword_desc_2")
        }*/

        return <div className="top">
            <div className="title">{title}</div>
            <div className="sub">{desc}</div>
        </div>
    }

	render() {

        let type = this.getAccountType()
        let step2_text = ""
        if(type == window.CONST.ACCOUNT_TYPE.PERSONAL)
            step2_text = translate("input_user_info")
        else if(type == window.CONST.ACCOUNT_TYPE.CORP_MASTER)
            step2_text = translate("input_corporation_info")
        else if(type == window.CONST.ACCOUNT_TYPE.CORP_SUB)
            step2_text = translate("input_manager_info")
        else if(type == window.CONST.ACCOUNT_TYPE.EXPERT)
            step2_text = translate("input_expert_info")

		return (<div className="maintain" key={this.state.language}>
            <div className="register-common-page register-page">
                <div className="left-logo">
                    <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
                    <div className="flex-1"></div>
                    <div className="language-dropdown">
                        <div className="language">{this.state.language}</div>
                        <div className="languages-dropdown">
                            <div onClick={()=>{window.setCookie("LANGUAGE", "KR"); window.location.reload(true)}}>Korean</div>
                            <div onClick={()=>{window.setCookie("LANGUAGE", "EN"); window.location.reload(true)}}>English</div>
                            <div onClick={()=>{window.setCookie("LANGUAGE", "CN"); window.location.reload(true)}}>Chinese</div>
                        </div>
                    </div>
                </div>
                <div className="desc-container">
                    <div className="info">
                        {this.render_title()}
                        <div className="step-indicator">
                            <div className={`circle ${this.state.step == 0 ? "enable-circle": ""}`}></div>
                            <div className="line"></div>
                            <div className={`circle ${this.state.step == 1 ? "enable-circle": ""}`}></div>
                            <div className="line"></div>
                            <div className={`circle ${this.state.step == 2 ? "enable-circle": ""}`}></div>
                            <div className="line"></div>
                            <div className={`circle ${this.state.step == 3 || this.state.step == 4 ? "enable-circle": ""}`}></div>
                        </div>
                        <div className="step-text">
                            <div className={`item ${this.state.step == 0 ? "enable": ""}`}>{translate("terms_agree")}</div>
                            <div className={`item ${this.state.step == 1 ? "enable": ""}`}>{translate("input_account_info")}</div>
                            <div className={`item ${this.state.step == 2 ? "enable": ""}`}>{step2_text}</div>
                            <div className={`item ${this.state.step == 3 || this.state.step == 4 ? "enable": ""}`}>{translate("recover_password_issue")}</div>
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
