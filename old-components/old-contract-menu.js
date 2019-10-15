import React from "react"
import ReactDOM from "react-dom"
import { Link } from "react-router-dom";
import translate from "../../common/translate"

export default function(props){
    return (<div className="column-200 display-flex">
        <ul className="left-menu">
            <Link to="/home">
                <li className={`item ${props.page == "recent" ? 'selected' : ''}`}>
                    <i className="fas fa-plus-circle" /> 최근 사용
                </li>
            </Link>
            <Link to="/folder">
                <li className={`item ${props.page == "folder" ? 'selected' : ''}`}>
                    <i className="fas fa-folder" /> 폴더순으로
                </li>
            </Link>
            <li className="spacer" />
            <Link to="/template">
                <li className={`item ${props.page == "template" ? 'selected' : ''}`}>
                    <i className="fas fa-file-alt" /> 내 템플릿
                </li>
            </Link>
        </ul>
    </div>)
}