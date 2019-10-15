import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../history';
import translate from "../../common/translate"
import {
    confirm_contract,
    reject_contract,
    load_contract,
    fetch_user_info,
    get_pin_from_storage,
    load_contract_info,
    decrypt_contract_hexstring,
} from "../../common/actions"
import moment from "moment"
import { sha256 } from 'js-sha256'

let mapStateToProps = (state)=>{
	return {
        user:state.user.info
	}
}

let mapDispatchToProps = {
    confirm_contract,
    reject_contract,
    load_contract,
    fetch_user_info,
    get_pin_from_storage,
    load_contract_info,
    decrypt_contract_hexstring,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
        };
	}

	componentDidMount(){
        let contract_id = this.props.match.params.id;
        let last_seen_revision = this.props.match.params.revision;
        (async()=>{
            await window.showIndicator()
            await this.props.fetch_user_info()

            let contract_info = await this.props.load_contract_info(contract_id);
            if (contract_info) {

                let pin = await this.props.get_pin_from_storage(contract_id)
                if( pin ){

                    await this.load_contract(contract_id, pin, last_seen_revision, async(count, length) => {
                        await window.showIndicator(`계약서 불러오는 중 (${count}/${length})`)
                    }, contract_info.epin ? true : false)
                    
                }else{
                    history.replace(`/e-contract/contract-editor/${contract_id}`)
                }

            } else {
                alert("이 계약에 접근할 수 없습니다. 로그인 상태를 확인해주세요.");
                history.replace("/e-contract/login")
            }
            await window.hideIndicator()
        })()
    }

    componentWillUnmount(){
    }

    getContractRaw(){
        let imgs = []
        for(let i in this.state.imgs){
            let objects = [ ...(this.state.html[i] || []) ]
            for(let c of this.state.counterparties){
                objects = (objects || []).concat(c.html[i])
            }
            imgs.push({
                img : this.state.imgs[i],
                objects : objects.filter(e=>e)
            })
        }
        return imgs
    }

    getCounterpartiesEth(){
        return [this.state.author_eth_address, ...this.state.counterparties.map(e=>e.eth_address)]
    }

    async load_contract(contract_id, pin, last_seen_revision){
        let contract = await this.props.load_contract(contract_id,pin, null )
        if(!contract){
            alert("문서 로드에 실패했습니다.")
            return history.replace('/e-contract/home') 
        }
        if (contract.revision != last_seen_revision) {
            alert("계약 내용에 변화가 발생하였습니다. 다시 확인하여 주십시오.");
            return history.replace(`/e-contract/contract-editor/${contract_id}`)
        }

        if(contract.contract_id){
            await new Promise(r=>this.setState({
                ...contract,
                pin:pin,
            },r))

            if(this.state.status == 2){
                if(!contract.pdf){
                    let byte = await window.pdf.gen( this.getContractRaw() )
                    this.setState({
                        doc_hash : sha256(byte)
                    })
                }
            }
        }else{
            alert("정상적으로 불러오지 못했습니다.")
        }
    }

    onClickConfirm = async()=>{
        if(await confirm("승인하기","계약을 승인하시겠습니까?")){
            await window.showIndicator()
            let docByte = await window.pdf.gen( this.getContractRaw() )
            console.log("??->?",docByte)
            let resp = await this.props.confirm_contract(this.state.contract_id, this.getCounterpartiesEth(), docByte, this.state.revision)
            await window.hideIndicator()
            if (resp == -1) {
                alert("이미 종료된 계약입니다.");
                history.replace('/e-contract/home');
            } else if (resp == -2) {
                alert("계약 내용에 변화가 발생하였습니다. 다시 확인하여 주십시오.");
                history.replace(`/e-contract/contract-editor/${this.state.contract_id}`)
            } else if (resp == -3) {
                alert("이미 승인 혹은 거절한 계약입니다.");
                history.replace('/e-contract/home');
            } else { // 0 or 1
                alert("계약이 성공적으로 승인되었습니다.")
                history.replace('/e-contract/home')
            }
        }
    }

    onClickReject = async()=>{
        if(await confirm("승인하기","계약을 거절하시겠습니까?")){
            let str = prompt("거절 이유를 작성해주세요.")
            if( str ){
                let resp = await this.props.reject_contract(this.state.contract_id, str, this.state.revision);
                if (resp == 0) {
                    history.replace('/e-contract/home');
                } else if (resp == -1) {
                    alert("이미 종료된 계약입니다.");
                    history.replace('/e-contract/home');
                } else if (resp == -2) {
                    alert("계약 내용에 변화가 발생하였습니다. 다시 확인하여 주십시오.");
                    history.replace(`/e-contract/contract-editor/${this.state.contract_id}`)
                } else if (resp == -3) {
                    alert("이미 승인 혹은 거절한 계약입니다.");
                    history.replace('/e-contract/home');
                }
            }else{
                alert("거절하시는 이유를 작성해주세요.")
            }
        }
    }

    onClickPrint = async()=>{
        await window.showIndicator()

        await window.pdf.gen( this.getContractRaw(), true )

        await window.hideIndicator()
    }

    onClickValidation = async()=>{
        window.open(`/e-contract/verification/${this.state.doc_hash}`, "_blank")
        //history.push(`/e-contract/verification/${this.state.doc_hash}`)
    }

    onClickDownloadDecrypt = async() => {
        let url = "https://ipfs.infura.io:5001/api/v0/cat?arg="+this.state.ipfs; 
        try{ 
            let resp = await fetch(url,{
                method:"GET",
            })   
            let text = await resp.text();
            let buffer = await this.props.decrypt_contract_hexstring(this.state.contract_id, text);
            let blob = new Blob([buffer], {type:'application/pdf'});
            let urlblob = URL.createObjectURL(blob);
            let anchor = document.createElement('a');
            anchor.target = "_blank";
            anchor.href = urlblob;
            anchor.click();
        }catch(err){
            console.log(err)
        }    
    }

    render_status_text(){
        if(this.state.status == 0){
            return "배포 전"
        }else if(this.state.status == 1){
            return "서명 전"
        }else if(this.state.status == 2){
            return "서명 완료"
        }
    }

	render() {
        if(!this.state.contract_id || !this.props.user)
            return <div className="default-page"><div className="container">{/*<h1>로딩중..</h1>*/}</div></div>

        let alreadySelect = false;
        if (this.state.author_code == this.props.user.code) {
            alreadySelect = (this.state.author_confirm == 1) || (this.state.author_msg ? true : false)
        } else {
            let me = this.state.counterparties.filter((e, k)=>{
                return e.code == this.props.user.code
            })
            if (me.length == 0) {
                console.log("Impossible!");
                return "m";
            } else {
                alreadySelect = (me[0].confirm == 1) || (me[0].reject ? true : false);
            }
        }

        return (<div className="">
            <div className="default-page confirm-contract-page">
                <div className="logo">
                    <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
                </div>
                <div className="back-key">
                    <div className="round-btn" onClick={()=>history.goBack()}><i className="fas fa-arrow-left"></i></div>
                </div>
                <div className="container">
                    <h1>계약 상세보기</h1>
                    <div className={`page ${this.state.status < 2 && alreadySelect ? '' : 'bottom-no-border'}`}>
                        <div className="column-300">
                            <div className="form-layout">
                                <div className="form-label"> 계약명 </div>
                                <div className="form-info">
                                    {this.state.name}
                                </div>

                                <div className="form-label"> 계약 상태 </div>
                                <div className="form-info">
                                    {this.render_status_text()}
                                </div>

                                <div className="form-label"> 계약 등록일자 </div>
                                <div className="form-info">
                                    {moment(this.state.addedAt).format("YYYY-MM-DD HH:mm:ss")}
                                </div>

                                {this.state.status == 2 ? null : <div>
                                    <div className="form-label"> 계약 PIN </div>
                                    <div className="form-info">
                                        <div className="pin-box"> {this.state.pin} </div>
                                    </div>
                                </div>}

                                {this.state.status == 2 ? <div>
                                    <div className="form-label"> 트랜잭션 해쉬 </div>
                                    <div className="form-info hash-section">
                                        {[{
                                            name:this.state.author_name,
                                            transaction:this.state.author_transaction,
                                            original:this.state.author_original,
                                        },...this.state.counterparties].map((e,k)=>(<div key={k}>
                                            <div className="user-name">{e.name}</div>
                                            {e.transaction ? <div className="transaction-hash"><a href={`https://ropsten.etherscan.io/tx/${e.transaction}`} target="_blank">{e.transaction}</a></div> : <div className="transaction-hash">Waiting...</div>}
                                        </div>))}
                                    </div>
                                </div> : null}
                                
                                {this.state.status == 2 ? <div>
                                    <div className="form-label"> 계약서 해쉬 </div>
                                    <div className="form-info" style={{fontSize:"13px"}}>
                                        {this.state.doc_hash ? this.state.doc_hash : "계산중.."}
                                    </div>
                                </div> : null}

                                {this.state.ipfs ? <div>
                                    <div className="form-label"> IPFS 해쉬 </div>
                                    <div className="form-info" style={{fontSize:"13px"}}>
                                        <a onClick={this.onClickDownloadDecrypt}>{this.state.ipfs}</a>
                                    </div>
                                </div> : null}

                                {/*this.state.status == 2 ? null : [
                                    <div key={1} className="form-label bold"> 확인하기 </div>,
                                    <div key={2} className="form-submit">
                                        <button className="border confirm-btn" onClick={this.onClickConfirm}>승인</button>
                                        <button className="border reject-btn" onClick={this.onClickReject}>거절</button>
                                    </div>
                                ]*/}
                            </div>
                        </div>
                        <div className="column-300">
                            <div className="form-layout">
                                <div className="form-label"> 서명자 </div>
                                <div className="form-info">
                                    <SignerSlot 
                                        code={this.state.author_code}
                                        name={this.state.author_name}
                                        eth_address={this.state.author_eth_address}
                                        reject={this.state.author_confirm == 1 ? null : this.state.author_msg}
                                        confirm={this.state.author_confirm == 1}
                                        me={this.state.author_code == this.props.user.code}
                                    />
                                    {this.state.counterparties.map((e,k)=>{
                                        return <SignerSlot 
                                            key={k}
                                            code={e.code}
                                            name={e.name}
                                            eth_address={e.eth_address}
                                            me={e.code == this.props.user.code}
                                            confirm={e.confirm == 1}
                                            reject={e.confirm == 1 ? null : e.reject}
                                        />
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    {this.state.status == 2 || alreadySelect ? null : [
                        <button className="left-friendly-button" onClick={this.onClickConfirm}> 승 인 </button>,
                        <button className="right-friendly-button" onClick={this.onClickReject}> 거 절 </button>
                    ]}
                    {this.state.status == 2 ? [
                        <button className="left-friendly-button" onClick={this.onClickPrint}> 출 력 </button>,
                        <button className="right-friendly-button" onClick={this.onClickValidation}> 검 증 </button>
                    ] : null}
                </div>
            </div>
		</div>);
	}
}
