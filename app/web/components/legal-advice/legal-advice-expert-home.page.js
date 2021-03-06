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
        console.log("this.props.user_info", this.props.user_info)
        return <div className="legal-advice-home">
        </div>
    }
}
