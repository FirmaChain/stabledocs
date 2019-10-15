import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import pdfjsLib from "pdfjs-dist"
import history from '../history';
import {
    convert_doc,
    add_template
} from "../../common/actions" 
import translate from "../../common/translate"

let mapStateToProps = (state)=>{
	return {
	}
}

let mapDispatchToProps = {
    convert_doc,
    add_template
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={};
	}

	componentDidMount(){
    }

    onClickNext = async ()=>{
        if(!this.state.subject)
            return alert("제목을 입력해주세요.")
        if(!this.state.imgs)
            return alert("문서를 선택해주세요.")

        await window.showIndicator()
        await new Promise(r=>setTimeout(r,100))
        
        let template_id = await this.props.add_template(this.state.subject, this.state.imgs)
        history.replace(`/e-contract/template-edit/${template_id}`)
        await window.hideIndicator()
    }

    onClickUploadFile = async (e)=>{
        let file = e.target.files[0];
        await window.showIndicator()
        
        let pdf, pdf_payload

        let names = file.name.split(".");
        let ext = names[names.length - 1];

        try {

            if(ext == "pdf"){
                let a = await new Promise(r=>{
                    let reader = new FileReader();
                    reader.readAsArrayBuffer(file)
                    reader.onload = ()=>{
                        r(reader.result) 
                    }
                })
                pdf = await pdfjsLib.getDocument({data: a}).promise;
            }else{

                try{
                    pdf_payload = await window.toPdf(file)
                    pdf = await pdfjsLib.getDocument({data: pdf_payload}).promise;
                }catch(err){
                    let ret = await this.props.convert_doc(file)    
                    pdf_payload = ret.payload.data
                    pdf = await pdfjsLib.getDocument({data: pdf_payload}).promise;
                }
            }

            this.setState({
                file:file,
                imgs: await window.pdf2png(pdf)
            })
        } catch(err) {
            console.log(err)
            await window.hideIndicator()
            return window.alert("파일 로딩 중 문제가 발생하여 중단합니다.")
        }

        await window.hideIndicator()
    }

	render() {
		return (<div className="default-page add-template-page">
            <div className="back-key">
                <div className="round-btn" onClick={()=>history.goBack()}><i className="fas fa-arrow-left"></i></div>
            </div>
            <div className="container">
                <h1>템플릿 추가</h1>
                <div className="page bottom-no-border">
                    <div className="column-300">
                        <div className="form-layout">
                            <div className="form-label"> 템플릿명 </div>
                            <div className="form-input">
                                <input placeholder="템플릿명을 입력해주세요." value={this.state.subject || ""} onChange={e=>this.setState({subject:e.target.value})}  />
                            </div>
                            
                            <div className="form-label"> 계약파일 업로드 </div>
                            
                            <div className="form-button">
                                {this.state.file ? <div className="filename">
                                    {this.state.file.name}
                                    <div className="del-btn" onClick={()=>this.setState({file:null, imgs:null})}>삭제</div>
                                </div> : null}
                                <button onClick={()=>this.refs.file.click()}> 파일 업로드 </button>
                            </div>

                            <input ref="file" type="file" accept=".png, .jpg, .jpeg, .doc, .docx, .ppt, .pptx, .pdf" onChange={this.onClickUploadFile} style={{display:"none"}}/>
                        </div>
                    </div>
                    <div className="column-300">
                        <div className="right-desc"> * 20MB 이하의 파일만 업로드 가능합니다. </div>
                    </div>
                </div>
                <button className="big-friendly-button top-no-border" onClick={this.onClickNext}> 다음 단계로 </button>
            </div>
		</div>);
	}
}