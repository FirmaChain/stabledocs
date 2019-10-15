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

import UserInformation from "./user-information.comp"

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
        };
	}

	componentDidMount(){
        (async()=>{
            await window.showIndicator()
            let user = await this.props.get_my_info()
            await window.hideIndicator()
            if(user === false)
                return history.replace("/legal-advice/login")
        })()
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.user_info === false) {
            return history.replace("/legal-advice/login")
        }
    }

    
    render() {
        return <div className="legal-advice-user-home">
            <div className="header">
                <div className="logo-img" onClick={e=>history.push("/legal-advice/")}><img src="/static/duite_review.png"/></div>
                <div className="right">
                    <div className="ask-button">질 문 하 기</div>
                </div>
                { !!this.props.user_info ? <UserInformation /> : null }
            </div>
        </div>
    }
}
