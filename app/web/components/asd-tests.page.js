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
import queryString from "query-string"
import translate from "../../common/translate"
import Web3 from "../../common/Web3"

import {
    decryptPIN,
    aes_encrypt,
    mnemonicToSeed,
    SeedToEthKey,
} from "../../common/crypto_test"

import {
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        user_info: state.user.info,
	}
}

let mapDispatchToProps = {
}

const LIST_DISPLAY_COUNT = 6

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {

	constructor(props) {
        super(props);
        this.state = {
            asdasdas:"",
            eth_key_start:[],
        };
	}

	componentDidMount() {

	}

    asdasd = (e) => {
        this.setState({asdasdas:e.target.value})
    }

    click_asdasd = (e) => {
        let seed = mnemonicToSeed(this.state.asdasdas);

        let arr = []
        for(var i = 0 ; i < 400 ; i++) {
            let keyPair = SeedToEthKey(seed, "0'/" + i)
            let privateKey = "0x"+keyPair.privateKey.toString('hex');
            let wallet = Web3.walletWithPK(privateKey)
            arr.push(wallet.address)
        }
        this.setState({eth_key_start:arr});
    }

    render() {
        return <div className="eth" style={{padding:"20px"}}>
            <input type="text"
                value={this.state.asdasdas}
                onChange={this.asdasd}/>
            <button onClick={this.click_asdasd}>ㅂㅈㄹㅂㅈㄹㅂㅈㄹㅂ</button>

            <div>
                {this.state.eth_key_start.map((e, k) => {
                    return <div>{k} : {e}</div>
                })}
            </div>
        </div>
	}
}







