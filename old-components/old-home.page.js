import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import ContractMenu from "./contract-menu"
import UserStatusBar from "./user-state-bar"
import Pager from "./pager"
import CheckBox from "./checkbox"
import TransactionBackgroundWork from "./transaction_background_work"
import CheckBox2 from "./checkbox2"
import history from '../history';
import moment from "moment"
import translate from "../../common/translate"
import {
    recently_contracts,
    folder_in_contracts,
    all_folders,
    move_to_folder,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        board:state.contract.board,
	}
}

let mapDispatchToProps = {
    recently_contracts,
    folder_in_contracts,
    all_folders,
    move_to_folder,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
            filter:1,
            moveMode:false,
            board:{},
            loaded:false,
        };
	}

	componentDidMount(){
        (async()=>{
            let params = this.props.match.params;
            if(params.id){
                await window.showIndicator()
                this.setState({
                    folder_id: params.id,
                })
                await this.props.folder_in_contracts(params.id);

                await window.hideIndicator();
            }else{
                await this.props.recently_contracts();
            }
            this.setState({
                loaded:true
            })
        })()
    }

    onClickPage = async(page)=>{
        if(this.state.folder_id == null){
            await this.props.recently_contracts(page-1);
        }else{
            await this.props.folder_in_contracts(this.state.folder_id,page-1);
        }
        this.setState({
            cur_page:page
        })
    }

    onClickMove = async ()=>{
        let move = this.state.move_select.map((e,k)=>e?this.props.board.list[k].contract_id : null).filter(e=>e);
        if(move.length == 0)
            return alert("이동시킬 계약을 선택해주세요.")

        await window.showIndicator();
        let list = await this.props.all_folders();
        await window.hideIndicator();
        if(list.length == 0){
            return alert("생성된 폴더가 없습니다.")
        }

        await window.openModal("MoveToFolder",{
            move_select:move,
            list:list,
            onClickMove:async(folder_id)=>{
                await window.showIndicator();
                await this.props.move_to_folder(folder_id, move)
                await window.hideIndicator();

                await this.props.folder_in_contracts(this.state.folder_id);
                this.onClickNormalMode()
                return true;
            }
        })
    }

    onClickMoveMode = async()=>{
        await window.showIndicator();
        let list = await this.props.all_folders();
        await window.hideIndicator();
        if(list.length == 0){
            return alert("생성된 폴더가 없습니다.")
        }

        this.setState({
            moveMode:true,
            move_select:[]
        })
    }
    onClickNormalMode=()=>{
        this.setState({
            moveMode:false,
            move_select:[]
        })
    }
    onClickContract=(contract_id)=>{
        history.push(`/e-contract/contract-editor/${contract_id}`)
    }
    onClickMoveSel=(k)=>{
        let move_select = [...this.state.move_select]
        move_select[k] = !move_select[k]
        this.setState({
            move_select
        })
    }
    render_board_slot(e,k){
        let status_text = (status)=>{
            if(status == 0){
                return "배포 전"
            }else if(status == 1){
                return "서명 전"
            }else if(status == 2){
                return "서명 완료"
            }
        }
        let mm = this.state.moveMode;
        let lock_status;
        let lock_src
        if (e.epin) {
            lock_src = "/static/icon_unlocked.png";
        } else if (sessionStorage.getItem(`contract:${e.contract_id}`)) {
            lock_src = "/static/icon_unlocked_session.png";
        } else {
            lock_src = "/static/icon_locked.png";
        }
        return <tr key={k} className={mm ? "" : "clickable"} onClick={mm ? null : this.onClickContract.bind(this,e.contract_id)}>
            {mm ? <td style={{width:"10px"}}><CheckBox2 on={this.state.move_select[k]} onClick={this.onClickMoveSel.bind(this,k)} /></td> : null}
            <td className="text-center">{status_text(e.status)}</td>
            <td className="text-center"><img src={lock_src} height={19}/></td>
            <td className="text-left">{e.name}</td>
            <td style={{width:"100px"}} className="text-center">{e.username}{e.counterpartyCnt > 0 ?` 외 ${e.counterpartyCnt}명`:""}</td>
            <td className="date-cell">{moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss")}</td>
        </tr>
    }

	render() {
        let board = this.state.loaded && this.props.board ? this.props.board : { list:[] };
        let total_cnt = board.total_cnt
        let page_num = board.page_num
		return (<div className="default-page contract-list-page">
            <div className="logo">
                <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
            </div>
            <div className="container">
                <h1>내 계약</h1>
                <UserStatusBar />
                <div className="page">
                    <ContractMenu page={this.state.folder_id != null ? "folder" : "recent"} />
                    <div className="column-800 page-contents">
                        <h1>{this.state.folder_id == 0? "분류되지 않은 계약" : (board.subject || "최근 사용한 계약")}</h1>
                        {/* <div className="filter-checkbox">
                            <CheckBox text="요청받은 계약" on={this.state.filter==1} onClick={(b)=>b ? this.setState({filter:1}): null} />
                            <CheckBox text="요청한 계약" on={this.state.filter==2} onClick={(b)=>b ? this.setState({filter:2}): null} />
                            <CheckBox text="완료된 계약" on={this.state.filter==3} onClick={(b)=>b ? this.setState({filter:3}): null} />
                            <CheckBox text="거절된 계약" on={this.state.filter==4} onClick={(b)=>b ? this.setState({filter:4}): null} />
                        </div> */}
                        <table className="table" style={{marginTop:"20px"}}>
                            <thead>
                                <tr>
                                    {this.state.moveMode ? <th>-</th> : null}
                                    <th style={{width:"70px"}}>상태</th>
                                    <th style={{width:"50px"}}>잠금</th>
                                    <th className="text-left">계약명</th>
                                    <th>서명자</th>
                                    <th>수정 일자</th>
                                </tr>
                            </thead>
                            <tbody>
                                {board.list.map((e,k)=>{
                                    return this.render_board_slot(e,k)
                                })}
                                {board.list.length == 0 ? <tr><td colSpan="6" style={{textAlign:"center", fontSize:"14px"}}>계약서가 없습니다.</td></tr> : null}
                            </tbody>
                        </table>

                        {this.state.folder_id ?(this.state.moveMode ? <div className="right-align">
                            <button onClick={this.onClickNormalMode}>취소</button>
                            <button className="danger" onClick={this.onClickMove}>선택 이동</button>
                        </div> : <div className="right-align">
                            <button onClick={this.onClickMoveMode}>선택 이동</button>
                        </div>): null}

                        <Pager max={Math.ceil(total_cnt/page_num)} cur={this.state.cur_page||1} onClick={this.onClickPage} />

                    </div>
                </div>
                {/* <TransactionBackgroundWork /> */}
            </div>
		</div>);
	}
}
