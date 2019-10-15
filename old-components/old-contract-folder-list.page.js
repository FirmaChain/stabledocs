import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from "react-router-dom";
import ContractMenu from "./contract-menu"
import UserStatusBar from "./user-state-bar"
import Pager from "./pager"
import CheckBox from "./checkbox"
import CheckBox2 from "./checkbox2"
import history from "../history"
import moment from "moment"
import translate from "../../common/translate"
import {
    folder_list,
    new_folder,
    remove_folder,
    move_to_folder,
    fetch_user_info,
} from "../../common/actions"

let mapStateToProps = (state)=>{
	return {
        folders:state.contract.folders,
        user_info: state.user.info,
	}
}

let mapDispatchToProps = {
    folder_list,
    new_folder,
    remove_folder,
    move_to_folder,
    fetch_user_info,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(){
		super();
		this.state={
            filter:1,
            deleteMode:false
        };
	}

	componentDidMount(){
        (async()=>{
            await this.props.fetch_user_info()
            await this.props.folder_list()
        })()
    }

    componentWillReceiveProps(props){
        if(props.user_info === false){
            history.replace("/e-contract/login")
        }
    }
    
    onClickDeleteMode = ()=>{
        if(this.props.folders.list.length == 1)
            return alert("삭제할 폴더가 없습니다!")
        this.setState({
            deleteMode:true,
            del_select:[]
        })
    }

    onClickNormalMode = ()=>{
        this.setState({
            deleteMode:false
        })
    }

    onClickNewFolder = async()=>{
        window.openModal("AddFolder",{
            onClick:async(name)=>{
                await window.showIndicator()
                await this.props.new_folder(name)
                await this.props.folder_list()
                await window.hideIndicator()

                this.onClickNormalMode()
            }
        })
    }

    onClickDelete = async ()=>{
        if(this.state.del_select.length == 0)
            return alert("삭제할 폴더를 선택해주세요!")

        if( await window.confirm("폴더 삭제", "정말 삭제하시겠습니까?") ){
            await this.props.remove_folder(this.state.del_select.map((e,k)=>{
                if(e)
                    return this.props.folders.list[k].folder_id
            }).filter(e=>e))
            await this.props.folder_list()
            this.setState({
                deleteMode:false
            })
        }
    }

    onClickDelRadio = (k)=>{
        let del_select = [...this.state.del_select]
        del_select[k] = !del_select[k]; 
        this.setState({
            del_select
        })
    }

    onClickPaging = async(page)=>{
        await this.props.folder_list(page-1)
        this.setState({cur_page:page})
    }

	render() {
        if(!this.props.folders)
            return <div />

        let total_cnt = this.props.folders.total_cnt 
        let page_num = this.props.folders.page_num 

		return (<div className="default-page contract-list-page">
            <div className="logo">
                <img src="/static/logo_blue.png" onClick={()=>history.push("/")}/>
            </div>
            <div className="container">
                <h1>내 계약</h1>
                <UserStatusBar />
                <div className="page">
                    <ContractMenu page="folder" />
                    <div className="column-800 page-contents">
                        <h1>내 계약</h1>
                        <table className="table" style={{marginTop:"20px"}}>
                            <tbody>
                                <tr>
                                    {this.state.deleteMode ? <th className="text-left"></th> : null}
                                    <th></th>
                                    <th className="text-left">폴더</th>
                                    <th>계약건</th>
                                    <th>생성일자</th>
                                </tr>
                                {this.props.folders.list.map((e,k)=>{
                                    let subject = e.subject || "분류되지 않은 계약"
                                    let folder_id = e.folder_id || 0
                                    let addedAt = e.addedAt ? moment(e.addedAt).format("YYYY-MM-DD HH:mm:ss") : "-"
                                    return <tr key={k}>
                                        {this.state.deleteMode ? <td>{folder_id == 0 ? "" : <CheckBox2 on={this.state.del_select[k]} onClick={this.onClickDelRadio.bind(this,k)} />}</td> : null}
                                        <td style={{width:"20px"}}><i className={`fas ${folder_id == 0 ? "fa-thumbtack":"fa-folder"}`} /></td>
                                        <td className="text-left"><Link to={encodeURI(`/folder/${folder_id}`)}>{subject}</Link></td>
                                        <td className="date-cell">{e.contract_cnt}</td>
                                        <td className="date-cell">{addedAt}</td>
                                    </tr>
                                })}
                            </tbody>
                        </table>

                        {this.state.deleteMode ? <div className="right-align">
                            <button onClick={this.onClickNormalMode}>취소</button>
                            <button className="danger" onClick={this.onClickDelete}>폴더 삭제</button>
                        </div> : <div className="right-align">
                            <button onClick={this.onClickDeleteMode}>폴더 삭제</button>
                            <button onClick={this.onClickNewFolder} >폴더 추가</button>
                        </div>}

                        <Pager max={Math.ceil(total_cnt/page_num)} cur={this.state.cur_page||1} onClick={this.onClickPaging} />

                    </div>
                </div>
            </div>
		</div>);
	}
}