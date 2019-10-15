import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../history';
import FroalaEditor from 'froala-editor';
import Resizable from "re-resizable";
import translate from "../../common/translate"
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
import Chatting from "./chatting"
import CancelablePromise from 'cancelable-promise';
import Item from "./editor-item.comp"

let mapStateToProps = (state)=>{
	return {
        user:state.user.info
	}
}

let mapDispatchToProps = {
    load_contract,
    load_contract_info,
    fetch_user_info,
    get_pin_from_storage,
    edit_contract,
    send_chat,
    fetch_chat,
    update_epin,
    clear_epin,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
            imgs: [],
            page: 0,
            page_count: 0,
            edit_page:[],
            editmode:true,
            changed:false,
        };
        this.blockFlag = 1;
        this.keyMap = {};
        this.fetchChat = null;
	}

	componentDidMount(){
        this.blockFlag = 1;
        this.refresh_contract = async(r)=>{
            let contract_id = this.props.match.params.id;
            await window.showIndicator("계약서 불러오는 중")
            await this.props.fetch_user_info()

            let contract_info = await this.props.load_contract_info(contract_id);
            if (contract_info) {
                let pin = await this.props.get_pin_from_storage(contract_id)
                if( pin ){
                    this.blockFlag = 2;
                    try{
                        await this.load_contract(contract_id, pin, async(count, length) => {
                            await window.showIndicator(`계약서 불러오는 중 (${count}/${length})`)
                        }, contract_info.epin ? true : false)
                    }catch(err){
                        alert("문서 로드에 실패했습니다.")
                        history.replace("/e-contract/home")    
                    }
                    this.blockFlag = 1;
                }else{
                    while(1){
                        try{
                            this.blockFlag = 0;
                            let pin_save_checked = false;
                            let result = await new Promise(r=>window.openModal("TypingPin",{
                                onFinish:(pin, pin_save_checked)=>{
                                    r([pin, pin_save_checked])
                                },
                                updatePIN:async(pin_input)=>{
                                    return await this.props.update_epin(contract_id, pin_input);
                                },
                            }))
                            pin = result[0];
                            pin_save_checked = result[1];
                            this.blockFlag = 2;
                            await this.load_contract(contract_id, pin, async(count, length) => {
                                await window.showIndicator(`계약서 불러오는 중 (${count}/${length})`)
                            }, pin_save_checked)
                            this.blockFlag = 1;
                            break;
                        }catch(err){
                            alert("PIN 번호가 잘못되었습니다.")
                        }
                    }
                }
                document.addEventListener("keydown", this.keydown);
                document.addEventListener("keyup", this.keyup);
            } else {
                this.blockFlag = 0;
                alert("이 계약에 접근할 수 없습니다. 로그인 상태를 확인해주세요.");
                history.replace("/e-contract/login")
            }
            
            await window.hideIndicator()
        }
        this.refresh_contract()

        this.unblock = history.block(  (targetLocation) => {
            if(this.blockFlag == 2) {
                alert("파일 로딩중에는 나가실 수 없습니다.")
                return false
            }

            if(this.blockFlag == 1) {
                if(this.state.status != null && this.state.status < 2)
                    return window._confirm("계약작성을 중단하고 현재 페이지를 나가시겠습니까?")
            }
            return true;
       })
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
        }
    }

    componentWillUnmount(){
        this.unblock();
        document.removeEventListener("keydown", this.keydown);
        document.removeEventListener("keyup", this.keyup);
    }

    keydown = (e) => {
        this.keyMap[e.keyCode] = true;

        let moveFlag = 0;
        let pageElement = document.getElementById(`page-${this.state.page}`);

        if(Object.keys(this.keyMap).length > 1)
            return

        if(e.keyCode == 37 || e.keyCode == 38) {
            if(0 < this.state.page) {
                this.setState({page:this.state.page-1})
                moveFlag = -1;
            }
        } else if(e.keyCode == 39 || e.keyCode == 40) {
            if(this.state.imgs.length - 1 > this.state.page) {
                this.setState({page:this.state.page+1})
                moveFlag = 1;
            }
        }
        if(moveFlag != 0 && !!this.left_menu) {
            let topPos = pageElement.offsetTop;
            this.left_menu.scrollTop = topPos - (moveFlag == 1 ? 400 : 532);
        }
    }

    keyup = (e) => {
        delete this.keyMap[e.keyCode];
    }

    async load_contract(contract_id, pin, listener, is_pin_saved){
        let contract = await this.props.load_contract(contract_id,pin,listener)
        if(!contract){
            throw 'ERROR DECRYPT DOCUMENT';
        }
        
        if(contract.contract_id){

            let objects = []
            for(let k in contract.html){
                objects[k] = (objects[k] || []).concat(contract.html[k])
            }
            for(let c of contract.counterparties){
                for(let k in c.html || []){
                    objects[k] = (objects[k] || []).concat(c.html[k])
                }
            }
            this.setState({
                ...contract,
                pin:pin,
                changed:false,
                edit_page:objects,
                is_pin_saved:is_pin_saved,
            })

            if(contract.status == 2)
                this.blockFlag = 0;
        }else{
            alert("정상적으로 불러오지 못했습니다.")
        }
    }

    onClickBack = ()=>{
        history.goBack();
    }

    addObject = async(props)=>{
        let edit_page = [...this.state.edit_page]
        edit_page[this.state.page] = [...(edit_page[this.state.page]||[]), props]
        this.setState({
            changed:true,
            edit_page
        })
    }

    onClickAddLabel = async(props)=>{
        if(!this.state.editmode)return ;
        this.addObject({
            type:"text",
            x:250,
            y:50
        })
    }

    onClickAddCheckbox = async()=>{
        if(!this.state.editmode)return ;
        this.addObject({
            type:"checkbox",
            x:250,
            y:50
        })
    }

    onClickAddImg = async()=>{
        if(!this.state.editmode)return ;
        let input = document.createElement("input")
        input.type = "file"
        input.accept=".png, .jpg, .jpeg"
        input.onchange = (e)=>{
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.readAsDataURL(file)
            reader.onload = ()=>{
                let img = new Image();
                img.onload = ()=>{
                    this.addObject({
                        type:"img", 
                        data:reader.result,
                        x:250,
                        y:50,
                        width:img.width,
                        height:img.height,
                    })
                };
                img.src = reader.result 
            }
        }
        input.click()
    }

    onClickAddSign = async()=>{
        if(!this.state.editmode)return ;
        await new Promise(r=>{ window.openModal("DrawSign",{
                onFinish : (base64)=>{
                    if(base64){
                        this.addObject({
                            type:"img", 
                            data:base64,
                            x:250,
                            y:50,
                            width:300,
                            height:150,
                        })
                    }
                    r();
                }
            })
        })
    }

    onRemoveItem = async(i)=>{
        if(await confirm("삭제하기", "해당 오브젝트를 삭제하시겠습니까?")){
            let edit_page = [...this.state.edit_page]
            edit_page[this.state.page].splice(i,1)
            this.setState({
                changed:true,
                edit_page:edit_page
            })
        }
    }
        
    onUpdateItem = (i, type, data)=>{
        let edit_page = [...this.state.edit_page]
        if(type == "pos"){
            edit_page[this.state.page][i].x = data.x
            edit_page[this.state.page][i].y = data.y
        }else if(type == "text"){
            edit_page[this.state.page][i].text = data
        }else if(type == "resize"){
            edit_page[this.state.page][i].width = data.dx
            edit_page[this.state.page][i].height = data.dy
        }

        this.setState({
            changed:true,
            edit_page
        })
    }

    onClickNext = async ()=>{
    }

    onClickFinishEdit = ()=>{
        if(_confirm("현재까지 저장한 내용으로 계약이 발행됩니다.\n계속 진행하시겠습니까?")){
            window.openModal("RegistContract",{
                subject:this.state.name,
                pin:this.state.pin,
                account_id: this.state.account_id,
                counterparties: this.state.counterparties,
                login_user_code:this.props.user.code,
                is_pin_saved: this.state.is_pin_saved,
                author:{
                    name:this.state.author_name,
                    code:this.state.author_code,
                    eth_address:this.state.author_eth_address,
                },
                updatePIN:async()=>{
                    return await this.props.update_epin(this.state.contract_id, this.state.pin);
                },
                clearPIN:async()=>{
                    return await this.props.clear_epin(this.state.contract_id);
                },
                onOK:async()=>{
                    await window.showIndicator()
                    let resp = await this.props.edit_contract(this.state.contract_id, this.state.pin, window.clone_object(this.state.edit_page))
                    if(resp){
                        this.blockFlag = 0
                        alert("성공적으로 저장했습니다.")
                        history.replace("/e-contract/home")
                    }else{
                        alert("저장에 문제가 발생했습니다.")
                    }
                    await window.hideIndicator()
                }
            })
        }
    }

    onClickEditMode = ()=>{
        this.setState({
            editmode:!this.state.editmode
        })
    }

    onClickRefresh = async()=>{
        if(await confirm("초기화","수정사항을 저장하지 않고 모두 되돌리겠습니까?")){
            location.reload()
        }
    }

    onClickSave = async()=>{
        if(!this.state.changed) {
            return alert("변경 사항이 없습니다.");
        }
        if(await confirm("저장","계약서를 수정사항을 적용하시겠습니까?")){
            console.log("this.state.edit_page",this.state.edit_page)
            let myObject = this.state.edit_page.map(e => {
                if(!e) return []
                return e.filter(o=>{
                    if(!!o) return o.code == null || o.code == this.props.user.code
                })
            })

            await window.showIndicator()
            let resp = await this.props.edit_contract(
                this.state.contract_id,
                this.state.pin,
                window.clone_object(myObject))

            await window.hideIndicator();

            if (resp == -1) {
                alert("저장하는데 문제가 발생했습니다. 관리자에게 문의해주세요.")
            } else {
                if (this.state.revision + 1 == resp) {
                    alert("성공적으로 저장하였습니다.");
                    if (this.fetchChat) {
                        this.fetchChat();
                    }
                    this.setState({
                        revision: resp
                    });
                } else {
                    alert("계약 내용에 변화가 발생하였습니다.\n확인하여 주십시오.");
                }
                this.refresh_contract();
            }
        }
    }

    onClickDetail = async() => {
        if(await confirm("다음으로","변경된 내용이 있다면 먼저 저장해주세요. 다음으로 넘어가시겠습니까?")){
            this.blockFlag = 0
            history.push(`/e-contract/contract-confirm/${this.state.contract_id}/${this.state.revision}`)
        }
    }

    render_finish_button(){
        if(this.state.status == 0)
            return <div className="confirm-box" onClick={this.onClickFinishEdit}>
                <i className="fas fa-check" />
                입력 완료
            </div>
        return <Chatting 
            contract_id={this.state.contract_id} 
            revision={this.state.revision}
            author={{
                name: this.state.author_name,
                code: this.state.author_code,
                account_id: this.state.account_id,
                confirm:this.state.author_confirm,
            }} 
            counterparties={this.state.counterparties}
            contract_name={this.state.name}
            contract_status={this.state.status}
            unblockFunction={()=>{this.blockFlag = 0}}
            mapFetchChat={(fn)=>{this.fetchChat = fn}}/>
    }

    render_save_recover_btn(){
        if(this.state.status == 1){
            return [
                <div key={0} className="line" />,
                <div key={1} className={`toolkit ${this.state.editmode?'selected':""}`} onClick={this.onClickEditMode}>
                    <i className={this.state.editmode ? "fas fa-pen-fancy" : "fas fa-print"}></i>
                    {this.state.editmode ? "편집모드" : "출력모드"}
                </div>,
                <div key={1} className="toolkit" onClick={this.onClickRefresh}>
                    <i className="fas fa-undo"></i>
                    초기화
                </div>,
                <div key={2} className="toolkit" onClick={this.onClickSave}>
                    <i className="fas fa-save"></i>
                    저장
                </div>,
                <div key={3} className="toolkit" onClick={this.onClickDetail}>
                    <i className="fas fa-check"></i>
                    컨펌
                </div>
            ]
        }
    }
    
	render() {
        if(this.state.pin == null)
            return <div className="default-page"><div className="container">{/*<h1>로딩중..</h1>*/}</div></div>

        let objects = this.state.edit_page[this.state.page] || [];
        console.log(this.state.edit_page)
		return (<div className="editor-page">
            <div className="back-key">
                <div className="round-btn" onClick={this.onClickBack}><i className="fas fa-arrow-left" /></div>
            </div>

            <div className="left-menu" ref={ref => this.left_menu = ref}>
                {this.state.imgs.map((e,k)=>{
                    return (<div key={k} id={`page-${k}`} onClick={()=>this.setState({page:k})} className={this.state.page == k ? `img-slot active` : `img-slot`} >
                        <div>{k+1}</div>
                        <img src={e} width="120px" />
                    </div>)
                })}
            </div>

            <div className="contents">
                {this.state.status <= 1 ? <div className="header-toolkit">
                    {this.state.status == 1 ?[
                        <div key={0} className={this.state.editmode?"toolkit":"toolkit disable"} onClick={this.onClickAddSign}>
                            <img src="/static/icon_sign.png"/>
                            서명
                        </div>,
                        <div key={1} className={this.state.editmode?"toolkit":"toolkit disable"} onClick={this.onClickAddImg}>
                            <img src="/static/icon_sign_upload.png"/>
                            도장 선택
                        </div>
                    ] : null}

                    <div className={this.state.editmode?"toolkit":"toolkit disable"} onClick={this.onClickAddImg}>
                        <img src="/static/icon_img_upload.png"/>
                        이미지 업로드
                    </div>

                    <div className={this.state.editmode?"toolkit":"toolkit disable"} onClick={this.onClickAddLabel}>
                        <img src="/static/icon_textbox.png"/>
                        텍스트 입력
                    </div>
                    
                    {/*<div className="toolkit" onClick={this.onClickAddCheckbox}>
                        <img src="/static/icon_checkbox.png"/>
                        체크박스 추가
                    </div>*/}
                    {this.state.status == 0 ? <div style={{flex:1}} /> : null }
                    
                    {this.render_save_recover_btn()}
                </div> : null}
                <div className="edit-box">
                    {(objects).map((e,k)=>{
                        if(!!e)
                            return <Item 
                                key={`${k}:${e.type}:${e.x}:${e.y}`} {...e} 
                                editmode={this.state.editmode}
                                onUpdate={this.onUpdateItem.bind(this, k)}
                                removeItem={this.onRemoveItem.bind(this, k)}
                                editable={this.state.status < 2}
                                docStatus={this.state.status}
                        />
                    })}
                    <img className="edit-target" src={this.state.imgs[this.state.page]} />
                </div>
            </div>
            
            {this.render_finish_button()}
		</div>);
	}
}
