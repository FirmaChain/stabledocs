import React from "react"
import ReactDOM from "react-dom"
import { Link } from "react-router-dom";
import translate from "../../common/translate"

export default class extends React.Component {
    constructor(){
        super()
        this.state = {}
    }
    
    onClickFold = ()=>{
        this.setState({
            fold:!this.state.fold
        })
    }

    render(){
        return (<div className="transaction-background-work-comp">
            <div className="header" onClick={this.onClickFold}>
                <div className="title">{translate("contract_progression_number", [1])}</div>
                <div> <i className="fas fa-chevron-up" />  </div>
            </div>
            <div className="content">
                <div style={this.state.fold ? {} : {height:0}}>
                    <div className="slot">
                        <div className="slot-info">
                            <div className="title">자동차 일일 렌트 계약서</div>
                            <div className="desc">트랜젝션 전파중</div>
                        </div>
                        <div className="progress"><div style={{flex:0.5}} /></div>
                    </div>
                </div>
            </div>
        </div>)
    }
}