import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../history';
import Draggable from 'react-draggable';
import Resizable from "re-resizable";
import {
    get_template,
    update_template,
    fetch_user_info,
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
    get_template,
    update_template,
    fetch_user_info,
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
        };
        this.blockFlag = 1;
        this.keyMap = {};
        this.fetchChat = null;
	}

	componentDidMount(){
        this.blockFlag = 1;
        (async(r)=>{
            let template_id = this.props.match.params.id;
            await window.showIndicator("템플릿 불러오는 중")
            await this.props.fetch_user_info()

            if( await this.get_template(template_id) ) {
                document.addEventListener("keydown", this.keydown);
                document.addEventListener("keyup", this.keyup);
            } else {
                this.blockFlag = 0;
                alert("이 템플릿에 접근할 수 없습니다. 로그인 상태를 확인해주세요.");
                history.replace("/e-contract/login")
            }
            
            await window.hideIndicator()
        })()

        this.unblock = history.block(  (targetLocation) => {
            if(this.blockFlag == 2) {
                alert("파일 로딩중에는 나가실 수 없습니다.")
                return false
            }

            if(this.blockFlag == 1) {
                if(this.state.status != null && this.state.status < 2)
                    return window._confirm("템플릿 수정을 중단하고 현재 페이지를 나가시겠습니까?")
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

    async get_template(template_id){
        let template = await this.props.get_template(template_id)
        if(!template){
            throw 'ERROR DECRYPT DOCUMENT';
        }
        
        if(template.template_id){
            let objects = []
            for(let k in template.html || []){
                objects[k] = (objects[k] || []).concat(template.html[k])
            }
            this.setState({
                ...template,
                edit_page:objects,
            })

            this.blockFlag = 0;
            return true;
        }else{
            alert("정상적으로 불러오지 못했습니다.")
        }
        return false;
    }

    onClickBack = ()=>{
        history.goBack();
    }

    addObject = async(props)=>{
        let edit_page = [...this.state.edit_page]
        edit_page[this.state.page] = [...(edit_page[this.state.page]||[]), props]
        this.setState({
            edit_page
        })
    }

    onClickAddLabel = async(props)=>{
        this.addObject({
            type:"text",
            x:250,
            y:50
        })
    }

    onClickAddImg = async()=>{
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

    onRemoveItem = async(i)=>{
        if(await confirm("삭제하기", "해당 오브젝트를 삭제하시겠습니까?")){
            let edit_page = [...this.state.edit_page]
            edit_page[this.state.page].splice(i,1)
            this.setState({
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
            edit_page
        })
    }

    onClickRefresh = async()=>{
        if(await confirm("초기화","수정사항을 저장하지 않고 모두 되돌리겠습니까?")){
            location.reload()
        }
    }

    onClickSave = async()=>{
        if(await confirm("저장","템플릿을 수정사항을 적용하시겠습니까?")){
            await window.showIndicator()
            let resp = await this.props.update_template(this.state.template_id, this.state.edit_page)

            await window.hideIndicator();

            if (resp === true) {
                alert("성공적으로 저장하였습니다.");
            }else {
                alert("저장하는데 문제가 발생했습니다. 관리자에게 문의해주세요.")
            }
        }
    }

    onClickDetail = async() => {
        if(await confirm("다음으로","변경된 내용이 있다면 먼저 저장해주세요. 다음으로 넘어가시겠습니까?")){
            this.blockFlag = 0
            history.push(`/e-contract/contract-confirm/${this.state.contract_id}/${this.state.revision}`)
        }
    }

    render() {
        // if(this.state.template_id == null)
        //     return <div className="default-page"></div>

        let loading = !!this.state.template_id;
        let imgs = this.state.imgs || []
        let objects = this.state.edit_page[this.state.page] || [];
		return (<div className="editor-page">
            <div className="back-key">
                <div className="round-btn" onClick={this.onClickBack}><i className="fas fa-arrow-left" /></div>
            </div>

            <div className="left-menu" ref={ref => this.left_menu = ref}>
                {imgs.map((e,k)=>{
                    return (<div key={k} id={`page-${k}`} onClick={()=>this.setState({page:k})} className={this.state.page == k ? `img-slot active` : `img-slot`} >
                        <div>{k+1}</div>
                        <img src={e} width="120px" />
                    </div>)
                })}
            </div>

            <div className="contents">
                <div className="header-toolkit">
                    <div className="toolkit" onClick={this.onClickAddImg}>
                        <img src="/static/icon_img_upload.png"/>
                        이미지 업로드
                    </div>

                    <div className="toolkit" onClick={this.onClickAddLabel}>
                        <img src="/static/icon_textbox.png"/>
                        텍스트 입력
                    </div>
                    
                    <div style={{flex:1}} />
                        
                    <div className="toolkit" onClick={this.onClickRefresh}>
                        <i className="fas fa-undo"></i>
                        초기화
                    </div>
                    <div className="toolkit" onClick={this.onClickSave}>
                        <i className="fas fa-save"></i>
                        저장
                    </div>
                    
                </div>
                <div className="edit-box">
                    {loading ? (objects).map((e,k)=>{
                        if(!!e)
                            return <Item 
                                key={`${k}:${e.type}:${e.x}:${e.y}`} {...e} 
                                editmode={true}
                                editable={true}
                                onUpdate={this.onUpdateItem.bind(this, k)}
                                removeItem={this.onRemoveItem.bind(this, k)}
                                docStatus={0}
                        />
                    }) : <div style={{color:"white"}}>로딩중..</div>}
                    {loading ? <img className="edit-target" src={imgs[this.state.page]} />: <div></div>}
                </div>
            </div>
		</div>);
	}
}
