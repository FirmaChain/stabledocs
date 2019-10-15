import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../../history'
import translate from "../../../common/translate"
import {
} from "../../../common/crypto_test"
import {
    get_my_info,
    login_account
} from "../../../common/legal_actions"

import Footer from "../footer.comp"
import CheckBox3 from "../checkbox3"

let mapStateToProps = (state)=>{
	return {
        user_info: state.legal_user.info
	}
}

let mapDispatchToProps = {
    get_my_info,
    login_account
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
            email:"",
            password:"",
            continue_login:true,
        };
	}

	componentDidMount(){
        (async()=>{
            await window.showIndicator()
            let resp = await this.props.get_my_info()
            await window.hideIndicator()
            if(resp.code == 1)
                return history.replace("/legal-advice/home")
        })()
    }

    componentWillReceiveProps(props){
        if(!!props.user_info){
            return history.replace("/legal-advice/home")
        }
    }

    onLogin = async () => {
        if(this.state.email == "")
            return alert("이메일을 입력해주세요.")

        if(this.state.password == "")
            return alert("비밀번호를 입력해주세요.")

        let resp = await this.props.login_account(this.state.email.trim(), this.state.password, this.state.continue_login);
        if(resp.code == 1) {
            return history.replace("/legal-advice/home")
        } else {
            return alert("로그인에 실패하였습니다.")
        }
    }

    keyPress = async (e) => {
        if(e.keyCode == 13){
            await this.onLogin()
        }
    }
    
    render() {
        return <div className="legal-advice-login legal-advice-maintain">
            <div className="container">
                <div className="logo"><img src="/static/anycase.png" /></div>

                <div className="text-place">
                    <div className="title">이메일</div>
                    <div className="text-box">
                        <input id="email" type="email" value={this.state.email} onChange={(e)=>{this.setState({email:e.target.value})}} onKeyDown={this.keyPress} />
                    </div>
                </div>
                <br/>
                <div className="text-place">
                    <div className="title">비밀번호</div>
                    <div className="text-box">
                        <input id="password" type="password" value={this.state.password} onChange={(e)=>{this.setState({password:e.target.value})}} onKeyDown={this.keyPress} />
                    </div>
                </div>

                <div className="continue-login">
                    <CheckBox3 on={this.state.continue_login}
                        size={24}
                        onClick={()=>this.setState({continue_login:!this.state.continue_login})}
                        text="로그인 유지"/>
                </div>

                <div className="login-button" onClick={this.onLogin}>로그인</div>

                <div className="sub">
                    <div className="register" onClick={e=>history.push("/legal-advice/register")}>회원가입하기</div>
                    <div className="forgot-password" onClick={e=>history.push("/legal-advice/change-password")}><span>비밀번호</span>를 잊으셨나요?</div>
                </div>

                <div className="sub2">
                    <div>전문가 이신가요? &nbsp;&nbsp;<span onClick={e=>history.push({pathname:"/legal-advice/register", search:`?type=expert`})}>전문가 회원가입하기</span></div>
                </div>
            </div>
            <Footer />
        </div>
    }
}
