import React from "react"
import ReactDOM from "react-dom"
import history from '../history';
import { connect } from 'react-redux';
import translate from "../../common/translate"
import {
    fetch_user_info,
    get_current_total_ticket,
} from "../../common/actions"
import moment from "moment"

function onClickAddContract(){
    history.push("/e-contract/add-contract")
}

let mapStateToProps = (state)=>{
	return {
        user_info: state.user.info
	}
}

let mapDispatchToProps = {
    fetch_user_info,
    get_current_total_ticket,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component{
    constructor(){
		super();
		this.state={total_ticket_count: 0, unused_ticket_count: 0};
    }

    componentDidMount(){
        /*if(!this.props.user_info){
            (async()=>{
                await window.showIndicator()
                await this.props.fetch_user_info()
                await window.hideIndicator()
            })()
        }*/
        (async() => {
            let totalTicket = await this.props.get_current_total_ticket();
            if (totalTicket && totalTicket.payload && totalTicket.payload.total_count) {
                this.setState({total_ticket_count: totalTicket.payload.total_count, unused_ticket_count: totalTicket.payload.unused_count});
            }
        })();

        this.update()
        this.updateIdx = setInterval(this.update, 1000)
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
        }
    }

    componentWillUnmount(){
        clearInterval(this.updateIdx)
    }
    
    digit = (o)=>{
        if(!o)
            return null
        
        o = o.toString()
        if(o.length == 1){
            return "0"+o
        }
        return o
    }

    update = ()=>{
        let t = window.getCookie("session_update");
        let day = 60 * 60 * 3;

        let left_time = day - ((Date.now()-t)/1000);
        let left_hour = Math.floor(left_time/60/60)
        let left_min = Math.floor(left_time/60%60)
        let left_second = Math.floor(left_time%60)

        if(left_time <= 0) {
            this.deleteSession()
            history.push("/e-contract/login")
        } else {
            this.setState({
                left_hour,
                left_min,
                left_second
            })
        }
    }

    onClickUpdateLogin = ()=>{
        let session = window.getCookie("session");
        if(session){
            window.setCookie("session", session, 0.125)
            window.setCookie("session_update", Date.now(), 0.125)

            alert(translate("success_continue"))
        }
    }

    onMyInfo = ()=>{
        history.push("/e-contract/profile")
    }

    onSecurity = () => {
        history.push("/e-contract/security")
    }

    onPriceStatusInfo = ()=>{
        history.push("/e-contract/price-status")
    }

    onGroupInfo = () => {
        history.push("/e-contract/group-manage")
    }

    deleteSession = () => {
        window.logout()
    }

    onLogout = () => {
        this.deleteSession()
        history.push("/e-contract/login")
    }
    
    render(){
        if(!this.props.user_info)
            return <div />

        let info = this.props.user_info

        return (<div className="information">
            <div className="profile">
                <div className="name">
                    { (info.account_type == 1 || info.account_type == 2) ? <span className="company">{info.company_name}</span> : "" }
                    {info.username} <i className="fas fa-caret-down"></i>
                </div>
                <div className="email">{info.email}</div>
                <div className="profile-dropdown">
                    <div className="info-container">
                        <div className="login-session" onClick={this.onClickUpdateLogin}>
                            <div className="text">{translate("login_session_continue")}</div>
                            <div className="time">
                                <span className="icon"><i className="fas fa-hourglass-half"></i></span>
                                {translate("hour_minutes_seconds", [this.state.left_hour||"0", this.digit(this.state.left_min)||"00", this.digit(this.state.left_second)||"00"])}
                            </div>
                        </div>
                        <div className="price-status" onClick={this.onPriceStatusInfo}>
                            <div className="text">{translate("tickets_status")}</div>
                            <div className="status">
                                <span className="icon"><i className="fal fa-ticket-alt"></i></span>
                                {translate(info.account_type != 0 ? "corporation" : "individual")} {this.state.unused_ticket_count || 0} / {this.state.total_ticket_count || 0} <span className="small">{translate("ticket")}</span> 
                            </div>
                            {/*<div className="date">
                                {translate("yearly_purchase")} | {moment().format("YYYY-MM-DD HH:mm:ss")}
                            </div>*/}
                        </div>
                        <div className="line"></div>
                        <div className="my-info" onClick={this.onMyInfo}>{translate("my_info")}</div>
                        <div className="my-info" onClick={this.onSecurity}>{translate("security")}</div>
                        {info.account_type == 1 ? <div className="my-info" onClick={this.onGroupInfo}>{translate("group_manage")}</div> : null}
                        <div className="logout" onClick={this.onLogout}>{translate("logout")}</div>
                    </div>
                </div>
            </div>
        </div>)
    }
}
// <div className="pic" style={{backgroundImage:`url(https://identicon-api.herokuapp.com/${info.code}/70?format=png)`}} />
