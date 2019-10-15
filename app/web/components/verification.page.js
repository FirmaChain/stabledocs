import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../history'
import translate from "../../common/translate"
import { sha256 } from 'js-sha256'
import Web3 from "../../common/Web3"

export default class extends React.Component {
	constructor(props){
		super(props)
		this.state={
            step:0,
            percent:0,
            contract_name : this.props.match.params.id || null,
        }
	}

	componentDidMount(){
    }

    componentWillReceiveProps(nextProps){
    }

    onClickUploadFile = async (e)=>{
        let file = e.target.files[0];

        let reader = new FileReader();
        reader.readAsArrayBuffer(file)
        reader.onload = async()=>{
            await window.showIndicator()
            try{
                this.setState({
                    file: file,
                    filename: file.name,
                    check_hash:sha256(reader.result)
                })
            }catch(err){
                console.log(err)
                window.alert(translate("no_form_file", ["PDF"]))
            }
            await window.hideIndicator()
        }
    }
//9dc1a3dce74374ada23711b60a863c3daf9321e9779928fadad886667f343eac
//0x85e3e519dad768899e72eab667c815af01ad5f6e67481294a302a9f511ebb8a0
    onVerify = async() => {
        if(this.state.file == null){
            return alert(translate("select_doc_file"))
        }
        if(!this.state.contract_name || this.state.contract_name.length < 64){
            return alert(translate("input_hash"))
        }

        this.setState({
            step:1,
            percent:5
        })
        
        try{
            let tx_receipt = await Web3.transaction(this.state.contract_name)
            this.setState({ percent:13 })
            await new Promise(r=>setTimeout(r,1000))
            if( tx_receipt ){
                let head = tx_receipt.input.slice(0,10)
                let topic_1 = tx_receipt.input.slice(10,74)
                this.setState({ percent:56 })
                await new Promise(r=>setTimeout(r,1000))
                this.setState({ percent:100 })
                
                if(topic_1 == this.state.check_hash){
                    this.setState({
                        ok:true,
                        step:2,
                    })
                }else{
                    this.setState({
                        ok:false,
                        step:2,
                        warning:translate("input_hash_file_hash_different")
                    })
                }
            }else{
                if(this.state.check_hash == this.state.contract_name){
                    this.setState({
                        ok:true,
                        step:2,
                    })
                }else{
                    this.setState({
                        ok:false,
                        step:2,
                        warning:translate("input_wrong_hash")
                    })
                }
                this.setState({ percent:100 })
            }
        }catch(err){
            alert(translate("verification_failed"))
        }
    }

    onClickReset = ()=>{
        this.setState({
            step:0,
            file:null,
            percent:0
        })
    }

	render() {
        //console.log(this.state.check_hash)
		return (<div className="verification-page">
            <div className={this.state.step == 0?`top`:`top toppadding`}>
                <div className="logo">
                    <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
                </div>
                <div className="title">{translate("verification_service_title")}</div>
                <div className="desc">{translate("verification_service_title_desc_1")}</div>
                <div className={this.state.step == 0?`desc-image`:`desc-image folded`}>
                    <div>
                        <img src="/static/pic_01.png" />
                        <div className="img-desc">{translate("verification_service_title_desc_2")}</div>
                    </div>
                    <div>
                        <img src="/static/pic_02.png" />
                        <div className="img-desc">{translate("verification_service_title_desc_3")}</div>
                    </div>
                    <div>
                        <img src="/static/pic_03.png" />
                        <div className="img-desc">{translate("verification_service_title_desc_4")}</div>
                    </div>
                </div>
            </div>
            <div className="progress">
                <div className="progress-fill" style={{width:`${this.state.percent}%`}}></div>
            </div>
            <div className={this.state.step == 0?`bottom`:`bottom move-out`}>
                <div className="form-label"> {translate("contract_hash_or_transaction")} </div>
                <div className="form-input">
                    <input placeholder={translate("please_input_doc_hash_or_contract_hash")} value={this.state.contract_name || ""} onChange={e=>this.setState({contract_name:e.target.value})} />
                </div>
                <div className="form-label"> {translate("contract_name")} </div>
                {this.state.file ? <div className="selected-file">
                    <div className="filename">{this.state.file.name}</div>
                    <div className="del-btn" onClick={()=>this.setState({file:null,imgs:[]})}>{translate("remove")}</div>
                </div> : <div className="upload-form">
                    <button className="file-upload-btn" onClick={()=>this.refs.file.click()}> <i className="fas fa-file-archive"></i> {translate("file_upload")} </button>
                    <input ref="file" type="file" onChange={this.onClickUploadFile} style={{display:"none"}}/>
                </div>}
                <div className="form-button">
                    <div className="submit-button" onClick={this.onVerify}>{translate("verification")}</div>
                </div>
            </div>
            <div className={this.state.step==1?`bottom`:`bottom move-in`} style={{textAlign: "center",paddingTop:"130px"}}>
                <div className="lds-grid">
                    <div/><div/><div/>
                    <div/><div/><div/>
                    <div/><div/><div/>
                </div>
            </div>
            <div className={this.state.step==2?`bottom checked-panel`:`bottom checked-panel move-out`}>
                <i className={this.state.ok ? "far fa-check-circle ok_icon":"far fa-times-circle no_icon"}></i>
                <div className="title">{this.state.ok ? translate("verification_success") : translate("verification_fail")}</div>
                <div className="sub-title">{translate("contract_hash_or_address")}</div>
                <div className="hash-text">{this.state.contract_name}</div>
                <div className="sub-title">{translate("upload_doc_file")}</div>
                <div className="content-text">{this.state.filename}</div>
                {this.state.ok ? null : <div className="sub-title">{translate("fail_reason")}</div> }
                {this.state.ok ? null : <div className="warning-text">{this.state.warning}</div> }

                <div className="btn" onClick={this.onClickReset}>{translate("re_verification")}</div>
            </div>
		</div>);
	}
}