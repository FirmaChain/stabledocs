import React from "react"
import ReactDOM from "react-dom"
import { ModalManager } from "./modalmanager"
import translate from "../../common/translate"
import "./alerts"

export default class extends React.Component {
	
    download = (url) => {
        window.open(url, "_blank")
    }

    render() {
		return (<div className="footer">
            <div className="left">
                주식회사 피르마 솔루션즈 | 서울시 성동구 성수이로 58 | <b>대표이사</b> 권승훈 | <b>사업자등록번호</b> 261-88-01086 | <b>전화번호</b> 070-4276-9499<br/>
                Copyright 2018 Firma Solutions Co. Ltd. All right reserved
            </div>
            <div className="right">
                <span onClick={this.download.bind(this, "https://stabledocs.com/static/[E-Contract]%20Terms%20&%20Conditions.pdf")}>{translate("service_term")}</span> | <span onClick={this.download.bind(this, "https://stabledocs.com/static/[E-Contract]%20Privacy%20Policy.pdf")}>{translate("privacy_statement")}</span> <br/>
                developer@firma-solutions.com
            </div>
        </div>)
	}
}
