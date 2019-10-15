import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../../history'
import translate from "../../../common/translate"
import {
} from "../../../common/crypto_test"
import {
    fetch_user_info
} from "../../../common/legal_actions"

import Footer from "../footer.comp"
import CheckBox3 from "../checkbox3"

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
		this.state={
            email:"",
        };
	}

	componentDidMount(){
        (async()=>{
            await window.showIndicator()
            await this.props.fetch_user_info()
            await window.hideIndicator()
        })()
    }

    componentWillReceiveProps(props){
        if(!!props.user_info){
            //return history.replace("/legal-advice/home")
        }
    }
    
    render() {
        return <div className="legal-advice-change-password legal-advice-maintain">
            <div className="header">
                <div className="logo-img" onClick={e=>history.push("/legal-advice/")}><img src="/static/duite_review.png"/></div>
                <div className="title">비밀번호 변경</div>
            </div>
            <div className="container">
                <div className="text-place">
                    <div className="title">기존 이메일</div>
                    <div className="text-box">
                        <input id="email" type="email" 
                            placeholder="example@example.com"
                            value={this.state.email} onChange={(e)=>{this.setState({email:e.target.value})}}/>
                    </div>
                </div>

                <div className="change-password-button">비밀번호 변경</div>

                <div className="sub">
                    기존 이메일로 새 비밀번호를 보내드립니다.
                </div>

            </div>
            <Footer />
        </div>
    }
}
