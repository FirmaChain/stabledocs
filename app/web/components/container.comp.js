import React from "react"
import ReactDOM from "react-dom"
import { ModalManager } from "./modalmanager"
import translate from "../../common/translate"
import "./alerts"

export default class extends React.Component {
	render() {
		return <div>
			<ModalManager />
			<div style={{zoom:"90%"}}>{ this.props.children }</div>
		</div>
	}
}
