import React from "react"
import ReactDOM from "react-dom"
import { Link } from "react-router-dom";
import translate from "../../common/translate"

const LIST_DISPLAY_COUNT = 8

function render_left_btn(cur, display_count, onClick){
    if(cur-1 >= display_count/2){
        return <li className="slot chevron left" onClick={()=>{onClick(Math.max(1, cur-display_count-1))}}> <i className="fas fa-chevron-left" /> </li>
    }
    return <li></li>
}

function render_right_btn(cur, max, display_count, onClick){
    if( max - display_count/2 > cur){
        return <li className="slot chevron right" onClick={()=>{onClick(Math.min(max, cur+display_count+1))}}> <i className="fas fa-chevron-right" /> </li>
    }
    return <li></li>
}

function render_li(cur, max, display_count, onClick){
    let list = []
    let start = cur-display_count/2;
    start = start < 1 ? 1 : start
    
    let target = Math.min(max , start + display_count)
    start = target - display_count
    start = start < 1 ? 1 : start

    for(let i=start; i <= target; i++ ){
        list.push(<li 
            key={i}
            className={cur == i ? `slot active` : `slot`} 
            onClick={()=>{onClick(i)}}
        >{i}</li>)
    }
    return list
}

export default function(props){
    let onClick = props.onClick;
    let max = props.max || 1
    let cur = props.cur || 1
    let display_count = props.display_count || LIST_DISPLAY_COUNT
    return (<div className="pager-comp">
        <ul>
            {render_left_btn(cur, display_count, onClick)}
            
            {render_li(cur, max, display_count, onClick)}

            {render_right_btn(cur, max, display_count, onClick)}
        </ul>
    </div>)
}