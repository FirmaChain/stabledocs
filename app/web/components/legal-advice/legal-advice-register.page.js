import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import history from '../../history'
import translate from "../../../common/translate"
import queryString from "query-string"
import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'

import {
} from "../../../common/crypto_test"

import {
    get_my_info,
    legal_register,
} from "../../../common/legal_actions"

import {
    request_phone_verification_code,
} from "../../../common/actions"

import Footer from "../footer.comp"
import CheckBox3 from "../checkbox3"

let mapStateToProps = (state)=>{
	return {
        user_info: state.legal_user.info
	}
}

let mapDispatchToProps = {
    get_my_info,
    legal_register,
    request_phone_verification_code,
}

@connect(mapStateToProps, mapDispatchToProps )
export default class extends React.Component {
	constructor(props){
		super(props);
        let _ = {}
        let params = queryString.parse(this.props.location.search)
        if(!!params.type && params.type == "expert") {
            _ = {
                type:1,
                step:0,
                email:"",
                password:"",
                phone_number:"",
                validate_code:"",
                phone_validation:false,

                name:"",
                address1:"",
                address2:"",

                profile_pic:"/static/empty_user.jpg",
                profile_pic_file:null,
                advisory_list:[{
                    field:null,
                    certificate_pic_name:"",
                    certificate_pic_file:null,
                    career_text:"",
                    career:[]
                }]
            }
        } else {
            _ = {
                type:0,
                email:"",
                password:"",
                phone_number:"",
                validate_code:"",
                phone_validation:false
            }
        }

		this.state = _;
	}

	componentDidMount(){
        (async()=>{
            await window.showIndicator()
            await this.props.get_my_info()
            await window.hideIndicator()
        })()
    }

    componentWillReceiveProps(props){
        if(!!props.user_info){
            //return history.replace("/legal-advice/home")
        }
    }

    onClickUploadProfilePic = async (e) => {
        let file = e.target.files[0];
        if(!file) return;
        await window.showIndicator();
        let sizeMb = file.size / 1024 / 1024;
        if(sizeMb > 2) {
            await window.hideIndicator();
            return alert(translate("do_not_upload_more_than_2mb_size"))
        }

        var reader = new FileReader();
        reader.onload = (read) => {
            this.setState({profile_pic:read.target.result})
        }
        reader.readAsDataURL(file);
        console.log(file)
        await this.setState({profile_pic_file:file})
        await window.hideIndicator();
    }

    onClickUploadCertificatePic = async (k, e) => {
        let file = e.target.files[0];
        if(!file) return;
        await window.showIndicator();
        let sizeMb = file.size / 1024 / 1024;
        if(sizeMb > 2) {
            await window.hideIndicator();
            return alert(translate("do_not_upload_more_than_2mb_size"))
        }
        let n = [...this.state.advisory_list]
        n[k].certificate_pic_name = file.name;
        n[k].certificate_pic_file = file;
        await this.setState({advisory_list:n})
        await window.hideIndicator();
    }

    onClickAddAdvisory = async (e) => {
        this.setState({advisory_list:[...this.state.advisory_list, {
            field:null,
            certificate_pic_name:"",
            certificate_pic_file:null,
            career_text:"",
            career:[]
        }]})
    }

    onClickAddCareer = async (k, e) => {
        let n = [...this.state.advisory_list];

        if(!n[k].career_text || n[k].career_text == "") {
            return alert(translate("please_input_career_text"))
        }
        if(!n[k].career_start_year || n[k].career_start_year == "") {
            return alert(translate("please_input_career_start_year"))
        }

        n[k].career.push({
            text:n[k].career_text,
            start_year:n[k].career_start_year,
            end_year:n[k].career_end_year,
        })
        n[k].career_text = ""
        n[k].career_start_year = ""
        n[k].career_end_year = ""
        this.setState({advisory_list:n})
    }

    onClickRemoveCareer = async (k, career_index, e) => {
        let n = [...this.state.advisory_list]
        n[k].career.splice(career_index, 1)
        this.setState({advisory_list:n})
    }

    onClickRemoveAdvisory = async (index, e) => {
        let n = [...this.state.advisory_list]
        n.splice(index, 1)
        this.setState({advisory_list: n})
    }


    onClickRequestPhone = async ()=>{
        if(this.state.phone_number == null || this.state.phone_number.length != 13 || !/^0\d{2}-\d{4}-\d{4}$/.test(this.state.phone_number))
            return alert(translate("please_input_correct_phone"))
            
        await window.showIndicator();
        let resp = await this.props.request_phone_verification_code(this.state.phone_number)
        if(resp.code == 1 && resp.payload == true){
            alert(translate("code_was_sent"))
            this.setState({
                phone_verification_code_sent:true,
                verificated_phone:false
            })
        }else{
            alert(translate("send_code_error_occured"))
        }
        await window.hideIndicator();
    }

    onChangePhoneForm = async (name, e) => {
        let text = e.target.value;
        text = text.replace(/[^0-9]/g,"")
        text = window.phoneFomatter(text)

        this.setState({
            [name]:text
        })
    }

    onRegisterPersonal = async () => {
        if(this.state.email == "")
            return alert("이메일을 입력해주세요.")

        if(this.state.password == "")
            return alert("비밀번호를 입력해주세요.")

        if(this.state.validate_code == "")
            return alert("인증 번호를 입력해주세요")

        if(this.state.phone_number == "")
            return alert("핸드폰 번호를 입력해주세요")

        if(this.state.password.length < 8)
            return alert("비밀번호는 8자리 이상이여야 합니다.")

        if(!window.email_regex.test(this.state.email))
            return alert("이메일이 형식에 맞지 않습니다. 다시 입력홰주세요.")

        if(this.state.phone_number == null || this.state.phone_number.length != 13 || !/^0\d{2}-\d{4}-\d{4}$/.test(this.state.phone_number))
            return alert(translate("please_input_correct_phone"));

        await window.showIndicator();
        let resp = await this.props.legal_register(this.state.email, this.state.password, this.state.phone_number, this.state.validate_code);
        if(resp.code == 1) {
            alert("가입에 성공하였습니다.")
            return history.replace("/legal-advice/login")
        } else if(resp.code == -7) {
            alert("인증 번호가 틀립니다.")
        } else {
            alert("가입에 실패하였습니다.")
        }
        await window.hideIndicator();
    }

    render_expert_step_0() {
        let phone_send_active = true;
        if(this.state.phone_number == null || this.state.phone_number.length != 13 || !/^0\d{2}-\d{4}-\d{4}$/.test(this.state.phone_number))
            phone_send_active = false;

        let next = false;
        if(this.state.email != "" && this.state.password != "" && this.state.phone_number != "" && this.state.validate_code != "")
            next = true;

        return <div className="legal-advice-register legal-advice-maintain">
            <div className="header">
                <div className="logo-img" onClick={e=>history.push("/legal-advice/")}><img src="/static/duite_review.png"/></div>
                <div className="title">전문가 회원가입</div>
            </div>
            <div className="legal-advice-register-expert">
                <div className="container" style={{textAlign: 'left' }}>
                </div>
                <div className="container">
                    <div className="subject enable-sub">계정,일반 정보</div>

                    <div className="title">계정</div>

                    <div className="text-place">
                        <div className="title">이메일</div>
                        <div className="text-box">
                            <input id="email" type="email" 
                                placeholder="example@example.com"
                                value={this.state.email} onChange={(e)=>{this.setState({email:e.target.value})}}/>
                        </div>
                    </div>

                    <div className="text-place">
                        <div className="title">비밀번호</div>
                        <div className="text-box">
                            <input type="password" 
                                placeholder="영문 + 숫자 + 특수문자 (최소 8자)"
                                value={this.state.password} onChange={(e)=>{this.setState({password:e.target.value})}}/>
                        </div>
                    </div>
                    <div className="text-place">
                        <div className="title">휴대폰 번호 인증</div>
                        <div className="text-box">
                            <input type="text" 
                                placeholder="010-1234-1234"
                                value={this.state.phone_number} onChange={this.onChangePhoneForm.bind(this, "phone_number")}/>
                            <div className={`right-button ${phone_send_active ? "" : "deactive"}`}>전송</div>
                        </div>
                    </div>
                    <div className="text-place">
                        <div className="title">인증번호</div>
                        <div className="text-box">
                            <input type="text" 
                                value={this.state.validate_code} onChange={(e)=>{this.setState({validate_code:e.target.value})}}/>
                        </div>
                    </div>

                    <div className="title" style={{marginTop:"20px"}}>일반</div>

                    <div className="text-place">
                        <div className="title">이름</div>
                        <div className="text-box">
                            <input type="text" 
                                placeholder="이름을 입력해주세요."
                                value={this.state.name} onChange={(e)=>{this.setState({name:e.target.value})}}/>
                        </div>
                    </div>

                    <div className="text-place">
                        <div className="title">주소</div>
                        <div className="text-box">
                            <input type="text" 
                                placeholder="아래의 검색 버튼을 통해 검색해 주세요."
                                value={this.state.address1} onChange={(e)=>{this.setState({address1:e.target.value})}}/>
                        </div>
                        <div className="text-box">
                            <input type="text" 
                                placeholder="상세 주소"
                                value={this.state.address2} onChange={(e)=>{this.setState({address2:e.target.value})}}/>
                        </div>
                    </div>
                    <div className="common-button search-button">주소 검색</div>

                    <div className="sub">전문사무소가 있을 경우, 사무실 주소를 입력해주세요</div>

                    <div className={`common-button next-button ${next?"":"deactive"}`} onClick={e=>{this.setState({step:1})}}>다음</div>
                </div>
                <div className="container" style={{textAlign: 'right' }}>
                    <div className="subject">다음 단계 : 전문가 정보, 전문 분야</div>
                </div>
            </div>
            <Footer />
        </div>
    }

    render_expert_step_1() {
        let list = [
            {value:"0", label: translate("expert_0")},
            {value:"1", label: translate("expert_1")},
            {value:"2", label: translate("expert_2")},
            {value:"3", label: translate("expert_3")},
            {value:"4", label: translate("expert_4")},
            {value:"5", label: translate("expert_5")},
            {value:"6", label: translate("expert_6")},
        ]

        return <div className="legal-advice-register legal-advice-maintain">
            <div className="header">
                <div className="logo-img" onClick={e=>history.push("/legal-advice/")}><img src="/static/duite_review.png"/></div>
                <div className="title">전문가 회원가입</div>
            </div>
            <div className="legal-advice-register-expert">
                <div className="container" style={{textAlign: 'left' }}>
                    <div className="subject">이전 단계 : 계정,일반 정보</div>
                    <div className="go-back" onClick={e=>{this.setState({step:0})}}><i className="fal fa-long-arrow-left"></i> 뒤로가기</div>
                </div>
                <div className="container">
                    <div className="subject enable-sub">전문가 정보, 전문 분야</div>

                    <div className="title">전문가 정보</div>

                    <div className="profile-pic">
                        <div className="title">{translate("profile_pic")}</div>
                        <div className="upload-image">
                            <img className="img" src={this.state.profile_pic}/>
                            <div className="blue-but" onClick={()=>this.refs["profile-file"].click()}>{translate("choose_pic")}</div>
                            <input ref="profile-file" className="hidden-file" type="file" accept="image/x-png,image/jpeg" onChange={this.onClickUploadProfilePic} />
                        </div>
                    </div>

                    <div className="text-place">
                        <div className="title">자기 소개</div>
                        <div className="text-box">
                            <textarea rows="5"
                                placeholder="자기 소개를 입력해주세요."
                                value={this.state.introduce} onChange={(e)=>{this.setState({introduce:e.target.value})}}></textarea>
                            <div className="text-counter"><span>0</span> / 1000</div>
                        </div>
                    </div>

                    <div className="expert-title">
                        <div className="title">전문 분야</div>
                        <div className="add-expert" onClick={this.onClickAddAdvisory}>전문 분야 추가</div>
                    </div>

                    <div className="add-list">
                        {this.state.advisory_list ? this.state.advisory_list.map((e, k) => {
                            return <div className="item" key={k}>
                                <div className="row">
                                    <div className="box">
                                        <div className="title">{translate("field")}</div>
                                        <div className="desc">
                                            <Dropdown className="legal-select"
                                                controlClassName="control"
                                                menuClassName="item"
                                                placeholder={translate("advisory_field_select")}
                                                options={list}
                                                onChange={e=>{
                                                    let n = [...this.state.advisory_list]
                                                    n[k].field = e.value;
                                                    n[k].field_label = e.label;
                                                    this.setState({advisory_list:n})
                                                }}
                                                value={this.state.advisory_list[k].field_label} />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="box">
                                        <div className="title">{translate("certificate_pic")}</div>
                                        <div className="desc">
                                            <input className="text-input" 
                                                type="text"
                                                placeholder={translate("no_certificate")}
                                                value={this.state.advisory_list[k].certificate_pic_name} disabled />
                                            <input ref={`ceriticate_${k}`} className="hidden-file" type="file" accept="image/x-png,image/jpeg" onChange={this.onClickUploadCertificatePic.bind(this, k)}/>
                                            <div className="search-button" onClick={()=>this.refs[`ceriticate_${k}`].click()}>{translate("upload")}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="box">
                                        <div className="title">{translate("career")}</div>
                                        <div className="desc">
                                            <input className="text-input" type="number"
                                                value={this.state.advisory_list[k].career_start_year || ""}
                                                onChange={e=>{
                                                    let n = [...this.state.advisory_list]
                                                    n[k].career_start_year = e.target.value;
                                                    this.setState({advisory_list:n})
                                                }}
                                                placeholder={translate("begin_year")}/>
                                            <input className="text-input" type="number"
                                                value={this.state.advisory_list[k].career_end_year || ""}
                                                onChange={e=>{
                                                    let n = [...this.state.advisory_list]
                                                    n[k].career_end_year = e.target.value;
                                                    this.setState({advisory_list:n})
                                                }}
                                                placeholder={translate("end_year")}/>
                                        </div>
                                    </div>
                                    <div className="box">
                                        <div className="title"></div>
                                        <div className="desc">
                                            <input className="text-input" type="text"
                                                value={this.state.advisory_list[k].career_text || ""}
                                                onChange={e=>{
                                                    let n = [...this.state.advisory_list]
                                                    n[k].career_text = e.target.value;
                                                    this.setState({advisory_list:n})
                                                }}
                                                placeholder={translate("history_example")}/>
                                        </div>
                                        <div className="add-button" onClick={this.onClickAddCareer.bind(this, k)}>{translate("career_add")}</div>
                                    </div>
                                </div>
                                <div className="row">
                                    {this.state.advisory_list[k].career.map((e, career_index) => {
                                        return <div className="career-item" key={career_index}>
                                            <div className="text">{e.start_year} ~ {e.end_year || translate("now")} | {e.text}</div>
                                            <div className="delete-but" onClick={this.onClickRemoveCareer.bind(this, k, career_index)}>{translate("delete")}</div>
                                        </div>
                                    })}
                                </div>

                                <div className="row">
                                    {this.state.advisory_list.length > 1 ? <div className="delete-advisory" onClick={this.onClickRemoveAdvisory.bind(this, k)}>{translate("expert_part_delete")}</div> : null}
                                </div>
                            </div>
                        }) : null}
                    </div>

                    <div className="common-button next-button deactive" onClick={this.onRegister}>회원 가입 신청</div>
                    <div className="sub">
                        회원가입 버튼을 클릭할 경우, 본 서비스의 <span>이용약관</span> 및 <br/>
                        <span>개인정보 취급방침</span>에 동의하신걸로 간주합니다 <br/>
                        <br/>
                        전문가의 경우, 승인 후에 계정을 사용하실 수 있습니다 <br/>
                        승인 알림은 입력하신 이메일로 알려드립니다
                    </div>
                </div>
                <div className="container">
                </div>
            </div>
            <Footer />
        </div>
    }

    render_expert() {
        switch(this.state.step) {
            case 0:
                return this.render_expert_step_0();
            case 1:
                return this.render_expert_step_1();
        }
    }

    render_user() {
        let phone_send_active = true;
        if(this.state.phone_number == null || this.state.phone_number.length != 13 || !/^0\d{2}-\d{4}-\d{4}$/.test(this.state.phone_number))
            phone_send_active = false;

        let next = false;
        if(this.state.email != "" && this.state.password != "" && this.state.phone_number != "" && this.state.validate_code != "")
            next = true;

        return <div className="legal-advice-register legal-advice-maintain">
            <div className="header">
                <div className="logo-img" onClick={e=>history.push("/legal-advice/")}><img src="/static/duite_review.png"/></div>
                <div className="title">회원가입</div>
            </div>
            <div className="legal-advice-register-user container">
                <div className="text-place">
                    <div className="title">이메일</div>
                    <div className="text-box">
                        <input id="email" type="email" 
                            placeholder="example@example.com"
                            value={this.state.email} onChange={(e)=>{this.setState({email:e.target.value})}}/>
                    </div>
                </div>

                <div className="text-place">
                    <div className="title">비밀번호</div>
                    <div className="text-box">
                        <input type="password" 
                            placeholder="영문 + 숫자 + 특수문자 (최소 8자)"
                            value={this.state.password} onChange={(e)=>{this.setState({password:e.target.value})}}/>
                    </div>
                </div>
                <div className="text-place">
                    <div className="title">휴대폰 번호 인증</div>
                    <div className="text-box">
                        <input type="text" 
                            placeholder="010-1234-1234"
                            value={this.state.phone_number} onChange={this.onChangePhoneForm.bind(this, "phone_number")}/>
                        <div className={`right-button ${phone_send_active ? "" : "deactive"}`} onClick={this.onClickRequestPhone}>전송</div>
                    </div>
                </div>
                <div className="text-place">
                    <div className="title">인증번호</div>
                    <div className="text-box">
                        <input type="text" 
                            value={this.state.validate_code} onChange={(e)=>{this.setState({validate_code:e.target.value})}}/>
                    </div>
                </div>

                <div className={`common-button register-button ${next?"":"deactive"}`} onClick={this.onRegisterPersonal}>회원가입</div>

                <div className="sub">
                    회원가입 버튼을 클릭할 경우, 본 서비스의 <span>이용약관</span> 및 
                    <span>개인정보 취급방침</span>에 동의하신걸로 간주합니다.
                </div>
            </div>
            <Footer />
        </div>
    }
    
    render() {
        if(this.state.type == 0) 
            return this.render_user();

        return this.render_expert();
    }
}
