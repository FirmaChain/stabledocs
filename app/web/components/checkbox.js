import React from "react"
import ReactDOM from "react-dom"
import { Link } from "react-router-dom";
import translate from "../../common/translate"

export default function(props){
    return (<div className="checkbox-comp" onClick={()=>{props.onClick(!props.on)}}>
        <div className="radius">
            <div className={props.on ? "active" : "" }></div>
        </div>
        <div className="label">{props.text}</div>
    </div>)
}