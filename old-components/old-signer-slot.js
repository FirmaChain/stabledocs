import React from "react";
import translate from "../../common/translate"

export default function(props){
    return (<div className="signer-slot-comp">
        {props.onDelete ? <div className="delete-btn" onClick={()=>{
            props.onDelete(props.code)
        }}>삭제</div> : null }
        <div className="info">
            <div className="profile" style={{backgroundImage:`url(https://identicon-api.herokuapp.com/${props.code}/70?format=png)`}} />
            <div className="info-text">
                <div className="name">
                    {props.name} {props.me == true ? <div className="gray">(본인)</div> : null }
                </div>
                <div className="email">{props.email || props.code}</div>
                <div className="account">{props.eth_address}</div>
            </div>
            {props.confirm ? <div className="confirm-icon"><i className="fas fa-fingerprint"/></div> : null}
            {props.reject ? <div className="reject-icon"><i className="fas fa-exclamation-circle"/></div> : null}
        </div>
        {props.confirm ? <div className="additional-text"> 승락하였습니다. </div> : null}
        {props.reject ? <div className="additional-text"> [<b>{props.reject}</b>]의 이유로 거절하였습니다. </div> : null}
    </div>)
}