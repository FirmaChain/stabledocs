import React from "react"
import ReactDOM from "react-dom"

import 'froala-editor/js/froala_editor.pkgd.min.js';
import 'froala-editor/js/languages/ko.js';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

import { connect } from 'react-redux';
import { Link, Prompt } from 'react-router-dom'
import history from '../history';
import translate from "../../common/translate"
import Information from "./information.comp"
import moment from "moment"
import md5 from 'md5'
import {modal} from "./modalmanager"

import {
    get256bitDerivedPublicKey,
    aes_encrypt,
    decrypt_corp_info,
} from "../../common/crypto_test"


@modal
export default class PreviewContract extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            /*contract:props.location.state.contract || null,
            infos:props.location.state.infos || null*/
        }
    }

    componentDidMount() {
        if(!this.props.model) {
            alert(translate("wrong_url_enter"))
            return this.closeSelf()
        }

        let model = this.props.model;
        
        if(!!this.props.infos) {
            for(let v of this.props.infos) {
                let regex = new RegExp(`<\\s*span\\s*class="t-sign corp_${v.corp_id} entity_${v.entity_id}"[^>]*>(.*?)<\\s*\/\\s*span>`, "gi")

                if(v.signature)
                    model = model.replace(regex, `<img src="${v.signature}" style="margin-left: 20px;height: 100px;"/>`)
                else
                    model = model.replace(regex, `<span class="no-sign-place">${translate("no_sign_place", [v.user_info.username])}</span>`)
            }
        }

        this.setState({model:model})

    }

    componentWillUnmount() {
    }

    jqueryInputEvent() {
        $("input[type=checkbox]").attr("disabled", true)
    }

    closeSelf = () => {
        window.closeModal(this.props.modalId)
    }

    /*render_sign_info = () => {
        if(!this.props.infos && !this.props.contract)
            return

        return <div className="sign-info">
            {this.props.infos.map( (e, k) => {
                if(e.privilege != 1)
                    return
                
                return <div className="item" key={k}>
                    <div className="title">{translate("signer_counter", [k+1])}</div>
                    {(()=>{
                        let user_type = e.user_info.user_type || 0

                        let divs = []
                        if(user_type == 0) {
                            for(let v of this.props.contract.necessary_info.individual) {
                                divs.push(<div className="info" key={v}>
                                    <span className="first">{v}</span>&nbsp;:&nbsp;
                                    <spann className="desc">{e.sign_info ? e.sign_info["#"+v] || translate("unregistered") : translate("unregistered")}</spann>
                                </div>)
                            }
                        } else {
                            for(let v of this.props.contract.necessary_info.corporation) {
                                divs.push(<div className="info" key={v}>
                                    <span className="first">{v}</span>&nbsp;:&nbsp;
                                    <span className="last">{e.sign_info ? e.sign_info["#"+v] || translate("unregistered") : translate("unregistered")}</span>
                                </div>)
                            }
                        }
                        return divs
                    })()}
                    {/*e.sign_info ? Object.entries(e.sign_info).map( (ee, kk) => {
                        let title = ee[0].substring(1, ee[0].length)
                        return <div className="info" key={kk}><span className="first">{title}</span> : <span className="last">{ee[1]}</span></div>
                    }) : <div className="info">{translate("not_yet_register_sign_info")}</div>}
                    {e.sign_info ? <div className="signature">
                        {translate("sign")}
                        {e.signature ? <img src={e.signature} /> : null }
                    </div> : null}
                </div>
            })}
        </div>
    }*/

    getTitle() {
        if(this.props.contract && this.props.contract.name) {
            return this.props.contract.name
        } else {
            return this.props.title || translate("no_title")
        }
    }

	render() {
        if(!this.state.model)
            return <div></div>

        return (<div className="preview-contract-page">
            <div className="header-page">
                <div className="header">
                    <div className="left-icon">
                        <i className="fal fa-times" onClick={()=>this.closeSelf()}></i>
                    </div>
                    <div className="title">{this.getTitle()}</div>
                </div>
                <div className="container">
                    <div className="contract-main-text">
                        <div className="fr-element fr-view" dangerouslySetInnerHTML={{__html:this.state.model}} />
                    </div>
                </div>
            </div>
        </div>)
	}
}
