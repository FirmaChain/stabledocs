import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import history from '../history'
import translate from "../../common/translate"
import {
	fetch_user_info
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        user_info: state.user.info
	}
}

let mapDispatchToProps = {
    fetch_user_info,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={};
	}

	componentDidMount(){
		this.props.fetch_user_info();
	}
	componentWillReceiveProps(props){
		if(props === false){

		}
	}

	render() {
		let user_info = this.props.user_info
		return (<div className="index-page">
			<div className="index-container">
				<div className="grid"></div>
				<img src="/static/top_back.png" className="top-back" />

				<div className="header-section">
					<div className="top">
						<div className="econtract-logo" onClick={()=>window.location.reload(true)}>
							<img className="logo-img" src="/static/stabledocs_logo.png"/>
						</div>
						<div className="nav-menu">
							<div className="language-dropdown">
								<div className="language">{global.LANG}</div>
								<div className="languages-dropdown">
									<div onClick={()=>{window.setCookie("LANGUAGE", "KR");location.reload(true)}}>Korean</div>
									<div onClick={()=>{window.setCookie("LANGUAGE", "EN");location.reload(true)}}>English</div>
									<div onClick={()=>{window.setCookie("LANGUAGE", "CN");location.reload(true)}}>Chinese</div>
								</div>
							</div>
							{/*<div className="whatis" onClick={()=>window.open("https://firmachain.org", "_blank")}>{translate("what_is_firmachain")}</div>*/}
							{/*user_info ? null : 
								<div className="login-place"><div className="login-btn" onClick={()=>history.push("/login")}>{translate("login_and_register")}</div></div>*/}
						</div>
					</div>
					<div className="mid">
						<div className="mid-container">
							<div className="title">{translate("INDEX_TITLE_1")}</div>
							<div className="sub-title"><b>{translate("INDEX_TITLE_2")}</b></div>
							<div className="start-btn" onClick={()=>history.push("/e-contract/login")}>{translate("INDEX_TITLE_3")}</div>
							{/*<div className="start-btn" onClick={()=>history.push("/legal-advice/login")}>{translate("go_legal_advice_title")}</div>*/}
						</div>
					</div>
					<div className="desc-container">
						<img className="right-img" src="/static/iphone.png" />
						<div className="place">
							<div className="title">
								{translate("MIDDLE1_TITLE_1")}<br/>
								<b>{translate("MIDDLE1_TITLE_2")}</b>
							</div>
							<div className="desc">
								{translate("MIDDLE1_DESC_1")} 
								{translate("MIDDLE1_DESC_2")} 
								{translate("MIDDLE1_DESC_3")} 
								{translate("MIDDLE1_DESC_4")} 
								{translate("MIDDLE1_DESC_5")}
							</div>
						</div>
					</div>
				</div>
				<div className="mid-section">
					<div className="desc-container" style={{textAlign:"right"}}>
						<img className="left-img" src="/static/macbook.png" />
						<div className="place place-right">
							<div className="title">
								{translate("MIDDLE2_TITLE_1")}<br/>
								<b>{translate("MIDDLE2_TITLE_2")}</b>
							</div>
							<div className="desc">
								{translate("MIDDLE2_DESC_1")} 
								{translate("MIDDLE2_DESC_2")} 
								{translate("MIDDLE2_DESC_3")} 
								{translate("MIDDLE2_DESC_4")}
							</div>
						</div>
					</div>
				</div>
				<div className="bottom-section">
					<div className="title-place">
						{/*<img src="/static/econtract_logo.png" />*/}
						<div>
							{translate("BOTTOM_TITLE_1")}<br/>
							<b>{translate("BOTTOM_TITLE_2")}</b>
						</div>
					</div>
					<div className="data-place">
						<img className="back-img" src="/static/pad.png" />
						<div className="container">
							<div className="card">
								<div className="title">{translate("BOTTOM_LEFT_DESC_TITLE")}</div>
								<div className="desc">
									{translate("BOTTOM_LEFT_DESC")}
								</div>
								<img className="desc-img" src={`/static/masterkeyword-${global.LANG}.jpg`}/>
							</div>
							<div className="card option-card">
								<div className="title">{translate("BOTTOM_RIGHT_DESC_TITLE")}</div>
								<div className="desc">
									{translate("BOTTOM_RIGHT_DESC")}
								</div>
								<img className="desc-img" src={`/static/chatting-${global.LANG}.jpg`}/>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="footer-section">
				<div className="footer-container">
					<img className="firma-logo" src="/static/firmachain_logo.png"/>
					<div className="footer-place">
						{translate("FOOTER_1")}<br/>
						{translate("FOOTER_2")}<br/>
						developer@firma-solutions.com<br/>
						COPYRIGHT @FIRMA SOLUTIONS, ALL RIGHT RESERVED.
					</div>
				</div>
			</div>
		</div>);
	}
}
