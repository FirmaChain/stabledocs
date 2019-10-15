import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../history';
import Draggable from 'react-draggable';
import Resizable from "re-resizable";
import {
    load_contract,
    load_contract_info,
    fetch_user_info,
    get_pin_from_storage,
    edit_contract,
    send_chat,
    fetch_chat,
    update_epin,
    clear_epin,
} from "../../common/actions"
import CancelablePromise from 'cancelable-promise';
import translate from "../../common/translate"

@connect((state)=>{return {user:state.user.info}}, {} )
export default class Item extends React.Component{
    content(isEditable){
        let props = this.props
        if(props.type == "text") {
            return <div 
                className="content" 
                contentEditable={props.docStatus == 2 ? false : true}
                onBlur={(e)=>props.onUpdate("text",e.target.innerHTML)} 
                dangerouslySetInnerHTML={{__html:props.text}}>
            </div>
        } else if(props.type == "checkbox") {
            return <div className="content">
                <input type="checkbox" disabled={props.docStatus == 2 ? true : false}/>
            </div>
        } else if(props.type == "img") {
            return <div className="content">
                <img src={props.data} style={{
                    width:"100%",
                    height:"100%"
                }} />
            </div>
        }
    }

    render(){
        let props = this.props
        let isEditable = props.editmode == true &&  props.editable == true && (props.code == null || props.code == this.props.user.code)
        return <Draggable handle=".handle" defaultPosition={{x:props.x,y:props.y}} onStop={(e,n)=>props.onUpdate("pos", {x:n.x, y:n.y})} >
            <Resizable 
                style={{position:"absolute"}} 
                defaultSize={{ width: props.width, height: props.height }}
                onResizeStop={(e, direction, ref, d) => {
                    props.onUpdate("resize",{ dx:ref.clientWidth, dy:ref.clientHeight, })
                }}
                onResizeStart={(e, direction, ref, d) => {
                    props.onUpdate("resize",{ dx:ref.clientWidth, dy:ref.clientHeight, })
                }}
                enable={{
                    top: false,
                    right: isEditable ? true : false,
                    bottom: isEditable ? true : false,
                    left: false,
                    topRight: false,
                    bottomRight: isEditable ? true : false,
                    bottomLeft: false,
                    topLeft: false,
                }}
            >
                <div className={`draggable-div ${props.editmode ? "" : "disable-edit-mode"}`}>
                    {isEditable ? <div className="handle"><i className="fas fa-arrows-alt" /></div> : null }
                    {( props.name && props.docStatus < 2 )? <div className="name-container">{props.name}</div> : null}
                    {isEditable ? <div className="trash" onClick={this.props.removeItem}><img src="/static/trash.png"/></div> : null }
                    {this.content(isEditable)}
                </div>
            </Resizable>
        </Draggable>
    }
}