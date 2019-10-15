import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import CheckBox2 from "./checkbox2"
import translate from "../../common/translate"
import Pager from "./pager"
import history from '../history';
import moment from "moment"
import queryString from "query-string"


import {
    get_daniel_list,
    get_daniel_count,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
	}
}

let mapDispatchToProps = {
    get_daniel_list,
    get_daniel_count,
}

const LIST_DISPLAY_COUNT = 6

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
        }
	}

	componentDidMount(){
        (async()=>{
            await window.showIndicator()
            let list = await this.props.get_daniel_list();
            let res = await this.props.get_daniel_count();
            console.log(list)
            console.log(res.count)
            this.setState({
                list,
                res
            })
            await window.hideIndicator()
        })()
    }

	render() {
        if(!this.state.res)
            return <div></div>

        console.log(this.state)

        return <div style={{padding:"50px", textAlign:"center"}}>
            <div style={{fontSize:"30px"}}>총 회원수 : {this.state.res.count}</div>
            {this.state.list.map( (e, k) => {
                return <div key={k}>{e.name}</div>
            })}
        </div>
	}
}
