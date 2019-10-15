import React from "react"
import ReactDOM from "react-dom"
import { Link } from "react-router-dom";
import translate from "../../common/translate"

export default function(props){
    return (<div className="checkbox3-comp">
    	<div className={"checkbox" + (!!props.disabled ? " disabled" : "")} style={{width:props.size ? (props.size+"px") : "15px", height:props.size ? (props.size+"px") : "15px"}}
    		onClick={(e)=>{
    			if(!!props.disabled)
    				return;
                e.stopPropagation()
    			props.onClick && props.onClick(!props.on)
    		}}>
        	{props.on ? <i className="fas fa-check" style={{fontSize:props.size ? (props.size*2/3 + "px") : "12px"}}></i> : null}
        </div>
        { !!props.text ? <div className="check-label">{props.text}</div> : null }
    </div>)
}