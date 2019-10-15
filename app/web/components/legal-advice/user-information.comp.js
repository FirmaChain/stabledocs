import React from "react"
import ReactDOM from "react-dom"
import history from '../../history';
import { connect } from 'react-redux';
import translate from "../../../common/translate"
import {
    get_my_info,
    logout,
} from "../../../common/legal_actions"
import moment from "moment"

function onClickAddContract(){
    history.push("/e-contract/add-contract")
}

let mapStateToProps = (state)=>{
	return {
        user_info: state.legal_user.info
	}
}

let mapDispatchToProps = {
    get_my_info,
    logout,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component{
    constructor(){
		super();
		this.state={};
    }

    componentDidMount(){
        /*if(!this.props.user_info){
            (async()=>{
                await window.showIndicator()
                await this.props.fetch_user_info()
                await window.hideIndicator()
            })()
        }*/
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            //history.replace("/legal-advice/login")
        }
    }

    componentWillUnmount(){
    }

    onMyProfile = () => {

    }

    onPurchaseLog = () => {

    }

    onFAQ = () => {

    }

    onLogout = async () => {
        window.legal_logout()
        await this.props.logout();
        history.push("/legal-advice/login")
    }

    
    render(){
        if(!this.props.user_info)
            return <div />

        let info = this.props.user_info

        return (<div className="legal-advice-user-information">
            <div className="profile">
                <div className="name">
                    {info.email} <i className="fas fa-caret-down"></i>
                </div>
                {/*<div className="email">{info.email}</div>*/}
                <div className="profile-dropdown">
                    <div className="info-container">
                        <div className="my-info" onClick={this.onMyProfile}>내 정보 수정</div>
                        <div className="my-info" onClick={this.onPurchaseLog}>결제 내역</div>
                        <div className="my-info" onClick={this.onFAQ}>서비스 문의하기</div>
                        <div className="logout" onClick={this.onLogout}>로그아웃</div>
                    </div>
                </div>
            </div>
        </div>)
    }
}
// <div className="pic" style={{backgroundImage:`url(https://identicon-api.herokuapp.com/${info.code}/70?format=png)`}} />
