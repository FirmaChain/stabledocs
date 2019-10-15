import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import pdfjsLib from "pdfjs-dist"
import history from '../history';
import Web3 from "../../common/Web3"
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
    fetch_user_info
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={};
	}

	componentDidMount(){
        if(!this.props.user_info){
            (async()=>{
                await window.showIndicator()
                await this.props.fetch_user_info()
                await window.hideIndicator()
            })()
        }

        this.update_balance(this.props)
    }

    async update_balance(props){
        let user = props.user_info;
        if(user){
            let fct = await Web3.fct_balance( user.eth_address );
            let eth = await Web3.eth_balance( user.eth_address );

            this.setState({
                fct_balance : fct,
                eth_balance : eth
            })
        }
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
        }else{
            this.update_balance(props)
        }
    }

	render() {
        let user = this.props.user_info;
        if(!user) return <div />
        console.log(user)
		return (<div className="default-page profile-page">
            <div className="back-key">
                <div className="round-btn" onClick={()=>history.goBack()}><i className="fas fa-arrow-left"></i></div>
            </div>
            <div className="container">
                <h1>내 정보</h1>
                <div className="page">
                    <div className="column-400">
                        <div className="form-layout">
                            <div className="form-label"> 내 정보 </div>
                            <div className="form-input profile-info">
                                <div>
                                    <img src={`https://identicon-api.herokuapp.com/${user.code}/70?format=png`} />
                                </div>
                                <div className="username">{user.username} <span className="phone">({user.userphone})</span></div>
                                <div className="useraddress">{user.useraddress}</div>
                            </div>
                            <div className="form-label"> 보유 FCT </div>
                            <div className="form-input">
                                {this.state.fct_balance==null ? "..." : `${this.state.fct_balance} FCT`}
                            </div>
                            <div className="form-label"> 보유 롭스텐 이더리움 </div>
                            <div className="form-input">
                                {this.state.eth_balance==null ? "..." : `${this.state.eth_balance} ETH`}
                            </div>

                            <div className="form-label"> 이더리움 주소 </div>
                            <div className="form-input">
                                {user.eth_address}
                            </div>
                            <div className="form-button">
                                <button className="submit-button" onClick={()=>history.push("/check-mnemonic")}>마스터 키워드 확인</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
		</div>);
	}
}
