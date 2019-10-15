import React from "react"
import ReactDOM from "react-dom"
import {modal} from "./modalmanager"
import history from '../history';
import translate from "../../common/translate"
import moment from "moment"
import creditcardutils from 'creditcardutils';

import Dropdown from "react-dropdown"
import 'react-dropdown/style.css'



@modal
class AddCommonModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            text:""
        }
    }

    componentDidMount() {
        this.setState({
            text: this.props.text || ""
        })
    }

    closeSelf = async () => {
        if(!!this.props.onCancel)
            await this.props.onCancel()

        window.closeModal(this.props.modalId)
    }

    onConfirm = async () => {
        if(!!this.props.onConfirm)
            await this.props.onConfirm(this.state.text.trim())
        this.closeSelf()
    }

    render() {
        let cancelable = this.props.cancelable == undefined ? true : this.props.cancelable
        return <div className="add-common-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className={this.props.icon}></i></div>
                <div className="title">{this.props.title}</div>
                <div className="text-box">
                    <div className="sub-title">{this.props.subTitle}</div>
                    <input type="text" className="common-textbox"
                        onChange={(e)=>this.setState({text:e.target.value})}
                        value={this.state.text}
                        placeholder={this.props.placeholder}/>
                </div>
                <div className="button">
                    <div className="confirm" onClick={this.onConfirm}>{this.props.confirmText || translate("create")}</div>
                    { cancelable ? <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div> : null }
                </div>
            </div>
        </div>
    }
}


@modal
class TextareaModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            text:""
        }
    }

    componentDidMount() {
        this.setState({
            text: this.props.text || ""
        })
    }

    closeSelf = () => {
        window.closeModal(this.props.modalId)
    }

    onConfirm = async () => {
        if(!!this.props.onConfirm)
            await this.props.onConfirm(this.state.text.trim())
        this.closeSelf()
    }

    render() {
        let cancelable = this.props.cancelable == undefined ? true : this.props.cancelable
        return <div className="textarea-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className={this.props.icon}></i></div>
                <div className="title">{this.props.title}</div>
                <div className="text-box">
                    <div className="sub-title">{this.props.subTitle}</div>
                    <textarea type="text" className="input-slot"
                        onChange={(e)=>this.setState({text:e.target.value})}
                        value={this.state.text}
                        placeholder={this.props.placeholder}/>
                </div>
                <div className="button">
                    <div className="confirm" onClick={this.onConfirm}>{this.props.confirmText || translate("create")}</div>
                    { cancelable ? <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div> : null }
                </div>
            </div>
        </div>
    }
}

@modal
class RemoveCommonModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }

    closeSelf = () => {
        window.closeModal(this.props.modalId)
    }

    onDelete = async () => {
        if(!!this.props.onDelete)
            await this.props.onDelete();

        this.closeSelf()
    }

    render() {
        return <div className="remove-common-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className={this.props.icon}></i></div>
                <div className="title">{this.props.title}</div>
                <div className="sub-title" dangerouslySetInnerHTML={{__html:this.props.subTitle}}>
                </div>
                <div className="button">
                    <div className="confirm" onClick={this.onDelete}>{this.props.deleteText || translate("remove")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class OneAddModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    componentDidMount() {
    }

    closeSelf = () => {
        window.closeModal(this.props.modalId)
    }

    onConfirm = async (e) => {
        if(!!this.props.onConfirm)
            await this.props.onConfirm(e);

        this.closeSelf();
    }

    onCancel = async () => {
        if(!!this.props.onCancel)
            await this.props.onCancel();

        this.closeSelf()
    }

    render() {
        return <div className="one-add-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className={this.props.icon}></i></div>
                <div className="title">{this.props.title}</div>
                <div className="sub-title">{this.props.subTitle}</div>
                <div className="content">
                {this.props.data.map( (e, k) => {
                    return <div className="item" key={k} onClick={this.onConfirm.bind(this, e)}>
                        {e.title}
                    </div>
                })}
                </div>
                <div className="desc" dangerouslySetInnerHTML={{__html:this.props.desc}}>
                </div>
                <div className="button">
                    
                    <div className="cancel" onClick={this.onCancel}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class CommonModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    closeSelf = () => {
        window.closeModal(this.props.modalId)
    }

    render() {
        return <div className="common-modal default-modal-container">
            <div className="container">
                <div className="data">
                    <div className="icon"><i className={this.props.icon}></i></div>
                    <div className="desc-container">
                        <div className="place">
                            <div className="title">{this.props.title}</div>
                            <div className="sub-title">{this.props.subTitle}</div>
                        </div>
                        <div className="desc" dangerouslySetInnerHTML={{__html:this.props.desc}}>
                        </div>
                    </div>
                </div>
                <div className="button">
                    <div onClick={this.closeSelf}>{translate("confirm")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class CardInfo extends React.Component {
    constructor() {
        super();
        this.state = {
            expiration_month_options: [],
            expiration_year_options: [],
            selected_expiration_month: 0,
            selected_expiration_year: 0,
            selected_expiration_month_label: "",
            selected_expiration_year_label: "",
            card_number: "",
            social_number_front: "",
        };
    }

    componentDidMount() {
        let expiration_month_options = [];
        let expiration_year_options = [];
        for (let i = 1; i <= 12; i++) {
            expiration_month_options.push({value: i, label: i+"월"});
        }
        for (let i = 2019; i <= 2028; i++) {
            expiration_year_options.push({value: i, label: i+"년"});
        }
        let selected_expiration_month = this.props.selected_expiration_month || expiration_month_options[0].value;
        let selected_expiration_year = this.props.selected_expiration_year || expiration_year_options[0].value;
        let selected_expiration_month_label = expiration_month_options.find(e => e.value == selected_expiration_month).label;
        let selected_expiration_year_label = expiration_year_options.find(e => e.value == selected_expiration_year).label;

        let _ = {
            expiration_month_options,
            expiration_year_options,
            selected_expiration_month,
            selected_expiration_year,
            selected_expiration_month_label,
            selected_expiration_year_label,
        }
        this.setState(_);
    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onChangeCardNumber = (e) => {
        let card_number = e.target.value
        let card_type_label = translate("purchase_info_card_type_no")
        let is_valid = creditcardutils.validateCardNumber(card_number)


        if(is_valid) {
            card_type_label = creditcardutils.parseCardType(card_number).toUpperCase()
            console.log("card_type_label", card_type_label)
            console.log("card_number", card_number)
            card_number = creditcardutils.formatCardNumber(card_number)
        }

        this.setState({
            card_number,
            card_type_label,
        })
    }
    int_pad = (n, width) => {
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    }

    onResponse = async () => {

        if(!this.state.card_number || this.state.card_number == "")
            return alert(translate("please_input_card_number"))
/*
        if(!this.state.cvc || this.state.cvc == "")
            return alert(translate("please_input_cvc"))

        if(!this.state.name || this.state.name == "")
            return alert(translate("please_input_name"))*/

        if(!this.state.selected_expiration_month || this.state.selected_expiration_month == "")
            return alert(translate("please_input_expiration_month"))

        if(!this.state.selected_expiration_year || this.state.selected_expiration_year == "")
            return alert(translate("please_input_expiration_year"))

        if(!this.state.social_number_front || this.state.social_number_front == "")
            return alert(translate("please_input_social_number_front"))

        if(!this.state.card_front_password_2 || this.state.card_front_password_2 == "")
            return alert(translate("please_card_front_password_2"))

        


        let is_valid = creditcardutils.validateCardNumber(this.state.card_number)
        if(!is_valid)
            return alert(translate("card_number_not_valid"))

        let card_type = creditcardutils.parseCardType(this.state.card_number)
        let is_valid_expiry = creditcardutils.validateCardExpiry(this.state.selected_expiration_month, this.state.selected_expiration_year)
        //let is_valid_cvc = creditcardutils.validateCardCVC(this.state.cvc, card_type)

        if(!is_valid_expiry)
            return alert(translate("card_expiry_not_valid"))
/*
        if(!is_valid_cvc)
            return alert(translate("card_cvc_not_valid"))*/

        this.closeSelf();
        this.props.onResponse && (await this.props.onResponse({
            card_type: card_type.toUpperCase(),
            card_number: this.state.card_number.trim().replace(/ /gi, "-"),
            expiry: this.state.selected_expiration_year + "-" + this.int_pad(this.state.selected_expiration_month, 2),
            birth: this.state.social_number_front,
            pwd_2digit: this.state.card_front_password_2,
        }) );
    }

    render() {
        return <div className="card-info-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="far fa-credit-card"></i></div>
                <div className="title">{translate("purchase_info_input_change")}</div>
                <div className="text-box">
                    <div className="sub-title">{translate("card_number")}</div>
                    <input type="text" className="common-textbox"
                        onChange={this.onChangeCardNumber}
                        value={this.state.card_number}
                        placeholder={translate("please_input_card_number")}/>
                </div>
                <div className="text-box">
                    <div className="sub-title">{translate("purchase_info_card_type")}</div>
                    <input type="text" className="common-textbox"
                        disabled
                        value={this.state.card_type_label}
                        placeholder={translate("purchase_info_card_type_no")}/>
                </div>
                {/*<div className="text-box">
                    <div className="sub-title">CVC</div>
                    <input type="number" className="common-textbox"
                        onChange={(e)=>this.setState({cvc:e.target.value})}
                        value={this.state.cvc}
                        placeholder={translate("please_input_cvc")}/>
                </div>*/}
                <div className="text-box">
                    <div className="sub-title">{translate("validation_date")}</div>
                    <Dropdown className="common-select"
                        controlClassName="control"
                        menuClassName="item"
                        options={this.state.expiration_month_options}
                        onChange={e=>{this.setState({selected_expiration_month:e.value, selected_expiration_month_label:e.label})}}
                        value={this.state.selected_expiration_month_label} placeholder={translate("month")} />
                    <Dropdown className="common-select"
                        controlClassName="control"
                        menuClassName="item"
                        options={this.state.expiration_year_options}
                        onChange={e=>{this.setState({selected_expiration_year:e.value, selected_expiration_year_label:e.label})}}
                        value={this.state.selected_expiration_year_label} placeholder={translate("year")} />
                </div>
                <div className="text-box">
                    <div className="sub-title">{translate("social_number_front_or_duns_number")}</div>
                    <input type="number" className="common-textbox"
                        onChange={(e)=>this.setState({social_number_front:e.target.value})}
                        value={this.state.social_number_front}
                        placeholder={translate("please_input_social_number_front")}/>
                    <div className="sub-desc">{translate("social_number_front_or_duns_number_desc")}</div>
                </div>
                <div className="text-box">
                    <div className="sub-title">{translate("card_front_password_2")}</div>
                    <input type="password" className="common-textbox"
                        onChange={(e)=>{
                            if(e.target.value && e.target.value.length > 2)
                                return;
                            this.setState({card_front_password_2:e.target.value})
                        }}
                        value={this.state.card_front_password_2}
                        placeholder={translate("please_card_front_password_2")}/>
                </div>
                <div className="button">
                    <div className="submit" onClick={this.onResponse}>{translate("confirm")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class PurchaseGroupMemberChange extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            member_count:props.member_count,
            max_member_count:props.max_member_count,
            change_count:null,
        };
    }

    componentDidMount() {
    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onResponse = async () => {
        if(this.state.change_count < 5)
            return alert(translate("more_than_default_number", [translate("modify_account_group_count"), 5]))

        await window.showIndicator()
        this.closeSelf();
        this.props.onResponse && (await this.props.onResponse(this.state.change_count))
        await window.hideIndicator()
    }

    render() {
        return <div className="purchase-group-member-add default-modal-container">
            <div className="container">
                <div className="icon"><i className="fal fa-ticket-alt"></i></div>
                <div className="title">{translate("group_account_modify")}</div>
                <div className="sub-title">
                    {translate("group_account_add_desc", [window.CONST.MEMBER_PRICE.number_format()])}<br/>
                    {translate("not_vat_include_price_desc")}
                </div>

                <div className="text-box">
                    <div className="sub-title">{translate("modify_account_group_count")}</div>
                    <input type="number" className="common-textbox"
                        onChange={(e)=>this.setState({change_count:e.target.value})}
                        value={this.state.change_count}
                        placeholder={translate("please_input_modify_account_group_count")}/>
                </div>
                <div className="sub-title">
                    {translate("info_of_now_account", [this.props.member_count])}<br/>
                    {translate("info_of_max_account", [this.props.max_member_count])}
                </div>
                <div className="sub-desc" dangerouslySetInnerHTML={{__html:translate("add_sub_account_purchase_desc")}}></div>
                <div className="button">
                    <div className="submit" onClick={this.onResponse}>{translate("change")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class PurchaseTicket extends React.Component {
    constructor() {
        super();
        this.state = {
            give_count:10
        };
    }

    componentDidMount() {

    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onResponse = async () => {
        if(this.state.give_count < 1)
            return alert(translate("too_low_ticket_count"))

        this.closeSelf();
        this.props.onResponse && (await this.props.onResponse(this.state.give_count))
    }

    render() {
        let price = this.props.ticket_plan.total_price
        return <div className="purchase-ticket default-modal-container">
            <div className="container">
                <div className="icon"><i className="fal fa-ticket-alt"></i></div>
                <div className="title">{translate("buy_one_time_ticket")}</div>
                <div className="sub-title">
                    {translate("buy_one_time_ticket_desc")}<br/>
                    {translate("not_vat_include_price_desc")}
                </div>
                <div className="content" dangerouslySetInnerHTML={{__html:translate("one_time_price_info", [price.number_format()])}}></div>

                <div className="text-box">
                    <div className="sub-title">{translate("will_buy_ticket_count")}</div>
                    <input type="number" className="common-textbox"
                        onChange={(e)=>this.setState({give_count:e.target.value})}
                        value={this.state.give_count}
                        placeholder={translate("please_input_will_buy_ticket_count")}/>
                </div>
                <div className="result" dangerouslySetInnerHTML={{__html:translate("price_info_msg", [(this.state.give_count * price).number_format()]) }}>
                    
                </div>
                <div className="button">
                    <div className="submit" onClick={this.onResponse}>{translate("buy")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class PurchaseRegularPayment extends React.Component {
    constructor() {
        super();
        this.state = {
            select_monthly_plan: {data:{title:null}},
            select_yearly_plan: {data:{title:null}},
            select_period: 0,
        };
    }

    componentDidMount() {
        /*let select_monthly_plan = this.props.planMonthly.filter(e=>e.plan_id==this.props.selectedMonthlyIndex)[0];
        let select_yearly_plan = this.props.planYearly.filter(e=>e.plan_id==this.props.selectedYearlyIndex)[0];
        let select_period = this.props.selectPeriod;
        this.setState({
            select_monthly_plan,
            select_yearly_plan,
            select_period,
        });*/
    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onResponse = async () => {
        let plan_id = this.state.select_period == 0 ? this.state.select_monthly_plan.plan_id : this.state.select_yearly_plan.plan_id
        if (this.state.is_current_subscription && this.state.current_subscription.plan_id == plan_id) {
            return alert(translate("dont_change_same_subscribe_plan"));
        }

        this.closeSelf();
        this.props.onResponse && (await this.props.onResponse(this.state.select_period, plan_id, this.props.is_current_subscription));
    }

    onClickType = (type) => {
        this.setState({
            select_period: type
        })
    }

    render() {
        let monthly_master_account = window.CONST.MEMBER_FREE_COUNT;
        let monthly_sub_account = window.CONST.MEMBER_FREE_COUNT;
        let yearly_master_account = window.CONST.MEMBER_FREE_COUNT;
        let yearly_sub_account = window.CONST.MEMBER_FREE_COUNT;
        let monthly_data = this.state.select_monthly_plan.data;
        let yearly_data = this.state.select_yearly_plan.data;
        if (monthly_data && monthly_data.bundle) {
            let monthly_bundle_member = this.props.allPlans.find(g=>g.plan_id==monthly_data.bundle.find(e=>this.props.allPlans.find(f=>f.plan_id==e).type == window.CONST.SUBSCRIPTION_PLAN_TYPE.MEMBER));
            if (monthly_bundle_member) {
                monthly_sub_account = monthly_bundle_member.ticket_count - monthly_master_account;
            }
        }
        if (yearly_data && yearly_data.bundle) {
            let yearly_bundle_member = this.props.allPlans.find(g=>g.plan_id==yearly_data.bundle.find(e=>this.props.allPlans.find(f=>f.plan_id==e).type == window.CONST.SUBSCRIPTION_PLAN_TYPE.MEMBER));
            if (yearly_bundle_member) {
                yearly_sub_account = yearly_bundle_member.ticket_count - yearly_master_account;
            }
        }
        return <div className="purchase-regular-payment-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="fas fa-credit-card"></i></div>
                <div className="title">{translate("select_subscribe_purchase")}</div>
                <div className="sub-title">
                    {translate("select_subscribe_purchase_desc")}<br/>
                    {translate("not_vat_include_price_desc")}
                </div>
                <div className="btn-container">
                    <div className={"btn" + (this.state.select_period == 0 ? " active" : "")} onClick={this.onClickType.bind(this, 0)}>
                        <div className="title">{translate("monthly_subscribe")}</div>
                        <div className="give-count">
                            <Dropdown className="common-select"
                                controlClassName="control"
                                menuClassName="item"
                                options={this.props.planMonthlyOptions}
                                onChange={e=>{this.setState({select_monthly_plan:this.props.planMonthly.filter(f=>e.value==f.plan_id)[0], select_period:0})}}
                                value={this.state.select_monthly_plan.data.title} placeholder={translate("one_time")} />
                            <span className="last"> {translate("use_by_monthly")}</span>
                        </div>
                        <div className="price-info">{(this.state.select_monthly_plan.total_price ? this.state.select_monthly_plan.total_price : 0).number_format()}<span className="last">{translate("price_by_monthly")}</span></div>
                        <div className="sub">
                            {(this.state.select_monthly_plan.total_price ? this.state.select_monthly_plan.total_price : 0) / (this.state.select_monthly_plan.ticket_count ? this.state.select_monthly_plan.ticket_count : 1)} {translate("price_by_one_time")}<br/>
                            {this.props.account_type == 0 ? null : translate("i_give_you_many_account", [monthly_master_account, monthly_sub_account])} 
                        </div>
                    </div>
                    {/*onClick={this.onClickType.bind(this, 1)}*/}
                    {/*<div className={"btn" + (this.state.select_period == 1 ? " active" : "")} >
                        <div className="title">{translate("yearly_subscribe")}</div>
                        <div className="give-count">
                            <Dropdown className="common-select"
                                controlClassName="control"
                                menuClassName="item"
                                options={this.props.planYearlyOptions}
                                onChange={e=>{this.setState({select_yearly_plan:this.props.planYearly.filter(f=>e.value==f.plan_id)[0], select_period:1})}}
                                value={this.state.select_yearly_plan.data.title} placeholder={translate("one_time")} />
                            <span className="last"> {translate("use_by_monthly")}</span>
                        </div>
                        <div className="price-info">{(this.state.select_yearly_plan.total_price ? this.state.select_yearly_plan.total_price : 0).number_format()}<span className="last">{translate("price_by_yearly")}</span></div>
                        <div className="sub">
                            {(this.state.select_yearly_plan.total_price ? this.state.select_yearly_plan.total_price : 0) / (this.state.select_yearly_plan.ticket_count ? this.state.select_yearly_plan.ticket_count : 1) / (this.state.select_monthly_plan.data.total_month ? this.state.select_monthly_plan.data.total_month : 12)} {translate("price_by_one_time")}<br/>
                            {this.props.account_type == 0 ? null : translate("i_give_you_many_account", [yearly_master_account, yearly_sub_account])} 
                        </div>
                    </div>*/}
                </div>
                <div className="button">
                    <div className="submit" onClick={this.onResponse}>{this.props.is_current_subscription ? translate("change") : translate("register")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }

}

@modal
class StartContract extends React.Component{
    constructor(){
        super()
        this.state = {}
    }
    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onClick = (type)=>{

        this.props.onClick && this.props.onClick( type )
        this.closeSelf()
    }

    render(){
        return <div className="start-contract-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="fal fa-file-code"></i></div>
                <div className="title">{translate("start")}</div>
                <div className="btn-container">
                    <div className="btn" onClick={this.onClick.bind(this, 1)}>
                        <i className="fal fa-comment-alt-edit"></i>
                        <div className="btn-desc">
                            <div className="title">{translate("use_web_editor")}</div>
                            <div className="sub">{translate("use_web_editor_desc_1")}<br/>{translate("use_web_editor_desc_2")}</div>
                        </div>
                    </div>
                    <div className="btn" onClick={this.onClick.bind(this, 2)}>
                        <i className="fal fa-paste"></i>
                        <div className="btn-desc">
                            <div className="title">{translate("use_template")}</div>
                            <div className="sub">{translate("use_template_desc_1")}<br/>{translate("use_template_desc_2")}</div>
                        </div>
                    </div>
                    {this.props.is_approval ? <div className="btn" onClick={this.onClick.bind(this, 3)}>
                        <i className="fal fa-file-alt"></i>
                        <div className="btn-desc">
                            <div className="title">{translate("use_approval")}</div>
                            <div className="sub">{translate("use_approval_desc_1")}<br/>{translate("use_approval_desc_2")}</div>
                        </div>
                    </div>:null}
                </div>
                <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
            </div>
        </div>
    }
}

@modal
class BrowserNotVerified extends React.Component{
    constructor(){
        super()
        this.state = {}
    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    render(){
        return <div className="browser-not-verified-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="fal fa-browser"></i></div>
                <div className="title">{translate("what_is_browser_unauth")}</div>
                <div className="sub-title">{translate("what_is_browser_unauth_desc_1")}</div>
                <div className="desc-container">
                    <div className="place">
                        <i className="fal fa-sign-in"></i>
                        <div className="title">{translate("register_account")}</div>
                        <div className="sub">{translate("register_account_desc")}</div>
                    </div>
                    <div className="place">
                        <i className="fal fa-key"></i>
                        <div className="title">{translate("master_keyword_issue")}</div>
                        <div className="sub">{translate("master_keyword_issue_desc")}</div>
                    </div>
                    <div className="place">
                        <i className="fal fa-money-check"></i>
                        <div className="title">{translate("master_keyword_verify")}</div>
                        <div className="sub">{translate("master_keyword_verify_desc")}</div>
                    </div>
                </div>
                <div className="button">
                    <div onClick={this.closeSelf}>{translate("confirm")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class Confirm extends React.Component{

    clickOk = ()=>{
        this.props.resolve && this.props.resolve(true)
        this.closeSelf();
    }

    clickNo = ()=>{
        this.props.resolve && this.props.resolve(false)
        this.closeSelf();
    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    componentDidMount() {
        document.addEventListener("keydown", this.onKeyDown, false);
    }

    componentWillUnmount(){
        document.removeEventListener("keydown", this.onKeyDown, false);
    }

    onKeyDown = (e) => {
        if(e.key == "Enter") {
            this.clickOk();
        } else if(e.key == "Escape") {
            this.clickNo();
        }
    }

    render(){
        return <div className="confirm-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="fal fa-user-check"></i></div>
                <div className="title" dangerouslySetInnerHTML={{__html:this.props.title || translate("title")}}></div>
                <div className="sub-title" dangerouslySetInnerHTML={{__html:this.props.msg || translate("message")}}></div>

                <div className="button">
                    <div className="confirm" onClick={this.clickOk}>{this.props.right_btn || translate("confirm")}</div>
                    <div className="cancel" onClick={this.clickNo}>{this.props.left_btn || translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class MoveCanEditAccount extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            select:null
        }
    }

    componentDidMount() {
    }

    closeSelf = () => {
        window.closeModal(this.props.modalId)
    }

    onConfirm = async () => {
        if(!this.state.select)
            return alert(translate("select_edit_privilege_account"))

        if(!!this.props.onConfirm) 
            await this.props.onConfirm(this.state.select);

        this.closeSelf();
    }

    onSelect = (e) => {
        this.setState({select:e})
    }

    render() {
        let availabe_user_infos = this.props.user_infos.filter(e=>e.privilege == 1 && this.props.my_account_id != e.entity_id )
        return <div className="move-can-edit-account-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="fas fa-arrow-alt-right"></i></div>
                <div className="title">{translate("move_edit_privilege")}</div>
                <div className="sub-title">{translate("move_edit_privilege_desc")}</div>
                <div className="content">
                {availabe_user_infos.map( (e, k) => {
                    return <div className={"item" + (this.state.select == e ? " enable" : "")} key={k} onClick={this.onSelect.bind(this, e)}>
                        <div className="name">{e.user_info.username ? e.user_info.username : e.user_info.title}</div>
                        <div className="email">{e.user_info.email ? e.user_info.email : e.user_info.company_name}</div>
                    </div>
                })}
                {availabe_user_infos.length == 0 ? <div className="item">{translate("not_available_move_user")}</div> : null}
                </div>
                <div className="button">
                    <div className="confirm" onClick={this.onConfirm}>{translate("move_edit_privilege")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>        
    }
}


@modal
class TypingPin extends React.Component{
    constructor(){
        super()
        this.state = { 
            value : ""
        }
    }
    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onClickOK = async ()=>{
        if(this.state.value.length == 6) {
            if(!!this.props.onFinish)
                await this.props.onFinish(this.state.value);

            this.closeSelf()
        } else {
            alert(translate("please_input_pin_6"))
        }
    }

    onClickCancel = async () => {
        if(!!this.props.onFinish)
            await this.props.onFinish(false);

        this.closeSelf()
    }

    /*keydown = (e)=>{
        if(e.key == "Backspace") {
            this.setState({
                value: this.state.value.slice(0,this.state.value.length-1)
            })
        } else if(e.key == "Enter" || e.keyCode == 13) {
            this.onClickOK()
        }
        let key = Number(e.key)
        if( 0 <= key && key <= 9 ){
            if(this.state.value.length < 6){
                this.setState({
                    value: this.state.value + "" + key
                })
            }
        }
    }*/

    componentDidMount(){
        //document.addEventListener("keydown", this.keydown);
    }

    componentWillUnmount(){
       //document.removeEventListener("keydown", this.keydown);
    }

    render(){
        return <div className="default-modal type-pin-modal default-modal-container">
            <div className="contents">
                <div className="title">{translate("please_input_pin")}</div>
                <input className="pin-box"
                    type="number" 
                    value={this.state.value}
                    onChange={(e)=>(this.setState({value:e.target.value}))}/>
            </div>
            <div className="buttons">
                <button onClick={this.onClickOK}>{translate("confirm")}</button>
                <button onClick={this.onClickCancel}>{translate("cancel")}</button>
            </div>
        </div>
    }
}


@modal
class DrawSign extends React.Component{
    constructor(props) {
        super(props);
        
        this.first_drawing = false
        this.isImage = false

        this.state = {};
    }

    componentDidMount(){
    }

    finishDraw = async () => {
        if(!this.first_drawing)
            return alert(translate("please_draw_sign"));

        let dataUrl = this.refs.canvas.toDataURL("image/png");
        let result = await this.props.onFinish(dataUrl);
        if(result) window.closeModal(this.props.modalId);
    }

    dataURItoBlob(dataURI) {
        let byteString = atob(dataURI.split(',')[1]);
        let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
        let ab = new ArrayBuffer(byteString.length);
        let ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++)
        {
            ia[i] = byteString.charCodeAt(i);
        }

        let bb = new Blob([ab], { "type": mimeString });
        return bb;
    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onUploadSignImage = async (e) => {
        let file = e.target.files[0];
        if(!file) {
            console.log("no file")
            return
        }

        await window.showIndicator()

        let names = file.name.split(".");
        let ext = names[names.length - 1];

        let reader = new FileReader();
        reader.onload = () => {
            console.log("asdasd")
            let img = new Image()
            img.onload = () => {
                let ctx = this.refs.canvas.getContext('2d');

                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height)
                ctx.restore();

                let max = Math.max(img.width / 490, img.height / 240)
                let width = img.width / max
                let height = img.height / max

                ctx.drawImage(img, 500 / 2 - width / 2, 250 / 2 - height / 2, width, height);
                this.isDrawing = false
                this.isImage = true
                this.first_drawing = true
            }
            img.src = reader.result
        }
        reader.readAsDataURL(file);

        await window.hideIndicator()
    }

    onClear = (e) => {
        let ctx = this.refs.canvas.getContext('2d');
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height)
        ctx.restore();
        this.isImage = false
        this.isDrawing = false
        this.first_drawing = false
    }
    
    onmousedown = (e)=>{
        e.stopPropagation()
        e.preventDefault();
        if(this.isImage)
            return;

        let clientX = e.clientX || e.touches[0].clientX
        let clientY = e.clientY || e.touches[0].clientY

        let ctx = this.refs.canvas.getContext('2d');

        this.isDrawing = true;
        ctx.moveTo(clientX - e.target.offsetLeft, clientY - e.target.offsetTop);
        ctx.beginPath()
    }

    onmousemove = (e)=>{
        e.stopPropagation()
        e.preventDefault();
        if(this.isImage)
            return;

        let clientX = e.clientX || e.touches[0].clientX
        let clientY = e.clientY || e.touches[0].clientY

        let ctx = this.refs.canvas.getContext('2d');

        if (this.isDrawing) {
            ctx.lineTo(clientX - e.target.offsetLeft, clientY - e.target.offsetTop);
            ctx.stroke();
        }
    }

    onmouseup = (e)=>{
        e.stopPropagation();
        e.preventDefault();
        if(this.isImage)
            return;

        this.isDrawing = false;
        let ctx = this.refs.canvas.getContext('2d');
        ctx.closePath()

        if(!this.first_drawing)
            this.first_drawing = true
    }

    render(){
        let width = 500, height = 250;
        if(window.isMobile()) {
            width = window.innerWidth - 112;
            height = width / 2;
        }
        console.log("window.innerWidth", window.innerWidth)

        return <div className="draw-sign-modal default-modal-container">
            <div className="container">

                <div className="icon"><i className="far fa-file-signature"></i></div>
                <div className="title">{translate("draw_sign")}</div>
                <div className="desc">{translate("draw_sign_desc_1")}<br/>{translate("draw_sign_desc_2")}</div>
                
                <div className="canvas">
                    <div className="clear" onClick={this.onClear}>{translate("reset")}</div>
                </div>
                <canvas ref="canvas" 
                    width={width}
                    height={height}
                    onMouseDown={this.onmousedown} 
                    onMouseMove={this.onmousemove}
                    onMouseUp={this.onmouseup}
                    onTouchStart={this.onmousedown}
                    onTouchMove={this.onmousemove}
                    onTouchEnd={this.onmouseup} />

                <div className="image-upload">
                    <div className="button" onClick={()=>{
                        this.refs['sign-image'].value = ""
                        this.refs['sign-image'].click()
                    }}>{translate("image_upload")}</div>
                    <input ref="sign-image" type="file" accept=".png, .jpg, .jpeg" onChange={this.onUploadSignImage} style={{display:"none"}}/>
                </div>

                <div className="button">
                    <div className="submit" onClick={this.finishDraw}>{translate("sign")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class MoveToFolder extends React.Component {

    constructor(props) {
        super(props);

        this.state = {};
    }

    componentDidMount() {

    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onClickMove = ()=>{
        if(!this.state.select_folder_id) {
            return alert(translate("please_set_move_folder"))
        }
        
        this.props.onClickMove && this.props.onClickMove(this.state.select_folder_id)
        this.closeSelf()
    }

    render(){
        return <div className="move-folder default-modal-container">
            <div className="container">
                <div className="icon"><i className="far fa-folder"></i></div>
                <div className="title">{translate("set_folder")}</div>
                
                <div className="select">
                    <Dropdown className="folder-dropdown"
                        controlClassName="control"
                        menuClassName="item"
                        options={this.props.folders.map(e=>{ return {value:e.folder_id, label:e.subject} })}
                        onChange={e=>{this.setState({select_folder_id:e.value, select_folder_title:e.label})}}
                        value={this.state.select_folder_title} placeholder={translate("choose_move_folder")} />
                </div>

                <div className="msg" dangerouslySetInnerHTML={{__html:translate("noti_move_contract_folder_multiple", [this.props.contract_ids.length]) }}></div>

                <div className="button">
                    <div className="submit" onClick={this.onClickMove}>{translate("move")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>

            </div>
        </div>
    }
}

@modal
class ContractListModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {

    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onConfirm = ()=>{
        this.props.onConfirm && this.props.onConfirm()
        this.closeSelf()
    }

    onMoveContract = (contract_id) => {
        history.push("/e-contract/contract-info/"+contract_id)
    }


    render() {
        return <div className="contract-list-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className={this.props.icon}></i></div>
                <div className="title">{this.props.title}</div>
                <div className="desc" dangerouslySetInnerHTML={{__html:this.props.desc}}></div>

                <div className="list">
                    {this.props.list.map( (e, k) => {
                        return <div className="item" key={k} onClick={this.onMoveContract.bind(this, e.contract_id)}>
                            {e.name}
                        </div>
                    })}
                </div>

                <div className="button">
                    <div className="submit" onClick={this.onConfirm}>{translate("remove")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class AddGroupMember extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email:"",
            selected_group:null
        };
    }

    componentDidMount() {

    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onConfirm = async ()=>{
        if(!this.state.selected_group)
            return alert(translate("select_group"))

        let result = false
        if(this.props.onConfirm) {
            await window.showIndicator()
            result = await this.props.onConfirm(this.state.email, this.state.selected_group)
            await window.hideIndicator()
        }

        if(result) this.closeSelf()
    }

    render() {
        return <div className="add-group-member-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="fas fa-users"></i></div>
                <div className="title">{translate("add_sub_account")}</div>
                <div className="desc">{translate("add_sub_account_desc_2")}</div>

                <div className="text-box">
                    <div className="sub-title">{translate("email")}</div>
                    <input type="text" className="common-textbox"
                        onChange={(e)=>this.setState({email:e.target.value})}
                        value={this.state.email}
                        placeholder={translate("please_input_email_invite")}/>
                </div>
                <div className="text-box">
                    <div className="sub-title">{translate("group")}</div>
                    <Dropdown className="common-select"
                        controlClassName="control"
                        menuClassName="item"
                        options={this.props.list}
                        onChange={e=>{this.setState({selected_group:e, selected_group_label:e.label})}}
                        value={this.state.selected_group_label} placeholder={translate("group")} />
                </div>
                

                <div className="button">
                    <div className="submit" onClick={this.onConfirm}>{translate("add")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }

}


@modal
class AddCorpMemberName extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            add_name:null,
            add_account_id: null,
        };
    }

    componentDidMount() {

    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onConfirm = async ()=>{
        if(!this.state.add_account_id)
            return alert(translate("please_select_user"))

        let result = false
        if(this.props.onConfirm) {
            await window.showIndicator()
            result = await this.props.onConfirm(this.state.add_account_id)
            await window.hideIndicator()
        }

        if(result) this.closeSelf()
    }

    render_add_input_dropdown() {
        let search_text = ""
        if(this.state.add_name)
            search_text = this.state.add_name.trim()

        let _ = this.props.member_list.filter(e=>{
            return e.public_info.username.includes(search_text)
        })

        if(_.length == 0)
            return;

        return <div className="user-dropdown">
            <div className="info-container">
            {_.map( (e, k) => {
                return <div className={`user ${this.state.add_account_id == e.account_id ? "user-active":""}`} key={e.account_id} onClick={()=>{
                        this.setState({add_account_id:e.account_id, add_name:e.public_info.username})
                    }}>
                    {this.props.user_div(e, k)}
                </div>
            })}
            </div>
        </div>
    }

    render() {
        return <div className="add-corp-member-name-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="fas fa-users"></i></div>
                <div className="title">{this.props.title}</div>
                <div className="desc">{this.props.desc}</div>

                <div className="text-box">
                    <div className="sub-title">{this.props.input_title}</div>
                    <input className="common-textbox" type="text"
                        placeholder={translate("please_input_approval_user_name")}
                        value={this.state.add_name || ""}
                        onFocus={e=>this.setState({add_name_focus:true})}
                        onBlur={e=>setTimeout(()=>this.setState({add_name_focus:false}), 500)}
                        onChange={e=>{
                            this.setState({
                                add_name:e.target.value,
                                add_account_id:null,
                            })
                        }}/>
                </div>
                
                {this.render_add_input_dropdown()}

                <div className="button">
                    <div className="submit" onClick={this.onConfirm}>{translate("add")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }

}

@modal
class NoSignUserAdd extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            email:"",
            name:"",
            cell_phone_number:""
        }
    }

    componentDidMount() {
        this.setState({
            email: this.props.email || "",
            name: this.props.name || ""
        })
    }

    closeSelf = () => {
        window.closeModal(this.props.modalId)
    }

    onConfirm = async () => {
        if(this.state.cell_phone_number == null || this.state.cell_phone_number.length != 13 || !/^0\d{2}-\d{4}-\d{4}$/.test(this.state.cell_phone_number))
            return alert(translate("please_input_correct_phone"))

        if(!!this.props.onConfirm) {
            await this.props.onConfirm({
                email:this.state.email,
                name:this.state.name,
                cell_phone_number:this.state.cell_phone_number
            });
        }
        this.closeSelf()
    }


    onChangePhoneForm = async (name, e) => {
        let text = e.target.value;
        text = text.replace(/[^0-9]/g,"")
        text = window.phoneFomatter(text)
        
        this.setState({
            [name]:text
        })
    }

    render() {
        return <div className="no-sign-user-add-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="far fa-user-tag"></i></div>
                <div className="title">{translate("no_sign_user_add_title")}</div>
                <div className="sub-desc">{translate("no_sign_user_add_desc")}</div>
                <div className="text-box">
                    <div className="sub-title">{translate("email")}</div>
                    <input type="text" className="common-textbox"
                        onChange={(e)=>this.setState({email:e.target.value})}
                        value={this.state.email}
                        disabled={!this.props.email_enable}
                        placeholder={this.props.placeholder}/>
                </div>
                <div className="text-box">
                    <div className="sub-title">{translate("name")}</div>
                    <input type="text" className="common-textbox"
                        onChange={(e)=>this.setState({name:e.target.value})}
                        value={this.state.name}
                        placeholder={this.props.placeholder}/>
                </div>
                <div className="text-box">
                    <div className="sub-title">{translate("cellphone_number")}</div>
                    <input type="text" className="common-textbox"
                        onChange={this.onChangePhoneForm.bind(this,"cell_phone_number")}
                        value={this.state.cell_phone_number}
                        placeholder={this.props.placeholder}/>
                    <div className="desc">{translate("no_register_user_add_contract_info_cellphone_number_correctly")}</div>
                </div>
                <div className="button">
                    <div className="confirm" onClick={this.onConfirm}>{translate("add")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class UnlockContractPublic extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            contract_open_key:""
        }
    }

    componentDidMount() {
    }

    closeSelf = () => {
        window.closeModal(this.props.modalId)
    }

    onConfirm = async () => {
        if(!!this.props.onConfirm) {
            let result = await this.props.onConfirm(this.state.contract_open_key);
            if(result) this.closeSelf()
        }
    }

    render() {
        let creator = this.props.infos.find(e=>e.corp_id == 0 && e.entity_id == this.props.contract.account_id)

        return <div className="unlock-contract-public-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className="far fa-pencil"></i></div>
                <div className="title">{translate("unlock_contract_public_title")}</div>
                <div className="desc">{translate("unlock_contract_public_desc")}</div>

                <div className="text-box">
                    <div className="sub-title">{translate("unlock_contract_open_key")}</div>
                    <input type="text" className="common-textbox"
                        onChange={(e)=>this.setState({contract_open_key:e.target.value})}
                        value={this.state.contract_open_key}
                        placeholder={translate("contract_open_key_placeholder")}/>
                </div>

                <div className="text-box">
                    <div className="sub-title">{translate("contract_name")}</div>
                    <div className="text">{this.props.contract.name}</div>
                    <div className="sub-desc">{translate("dont_know_contract_open_key_please_ask_creator")}</div>
                </div>
                
                {/*<div className="text-box">
                    <div className="sub-title">{translate("contract_creator")}</div>
                    <div className="user">
                        <div className="item">
                            <div className="icon"><i className="far fa-user"></i></div>
                            <div className="desc">
                                <div className="username">{creator.user_info.username}</div>
                                <div className="email">{creator.user_info.email}</div>
                            </div>
                        </div>
                    </div>
                    <div className="">{translate("dont_know_contract_open_key_please_ask_creator")}</div>
                </div>*/}

                <div className="button">
                    <div className="submit" onClick={this.onConfirm}>{translate("unlock_contract_public_title")}</div>
                </div>
            </div>
        </div>
    }
}

@modal
class AddContractUserModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            text:"",
            add_role:"",
            add_role_label:"",
        }
    }

    componentDidMount() {
        this.setState({
            text: this.props.text || ""
        })
    }

    closeSelf = async () => {
        if(!!this.props.onCancel)
            await this.props.onCancel()

        window.closeModal(this.props.modalId)
    }

    onConfirm = async () => {
        if(this.state.add_role == "" || this.state.text == "")
            return alert(translate("please_input_all"));

        let res = true;
        if(!!this.props.onConfirm)
            res = await this.props.onConfirm(this.state.text.trim(), this.state.add_role)
        if(res) this.closeSelf()
    }

    render() {
        let _roles = [
            {value:0, label: translate("creator")},
            {value:1, label: translate("signer")},
            {value:2, label: translate("viewer")}
        ].filter( (e, k) => k != 0 );

        return <div className="add-contract-user-modal default-modal-container">
            <div className="container">
                <div className="icon"><i className={this.props.icon}></i></div>
                <div className="title">{this.props.title}</div>
                <div className="text-box">
                    <div className="sub-title">{translate("user_email")}</div>
                    <input type="text" id="email" className="common-textbox"
                        onChange={(e)=>this.setState({text:e.target.value})}
                        value={this.state.text}
                        placeholder={this.props.placeholder}/>
                </div>
                <div className="text-box">
                    <div className="sub-title">{translate("user_role")}</div>
                    <Dropdown className="common-select"
                        controlClassName="control"
                        menuClassName="item"
                        options={_roles}
                        onChange={e=>{this.setState({add_role:e.value, add_role_label:e.label})}}
                        value={this.state.add_role_label} placeholder={translate("user_role")} />
                </div>
                <div className="button">
                    <div className="confirm" onClick={this.onConfirm}>{translate("add")}</div>
                    <div className="cancel" onClick={this.closeSelf}>{translate("cancel")}</div>
                </div>
            </div>
        </div>
    }
}



























@modal
class RegistContract extends React.Component{

    constructor() {
        super()
        this.state = {
            isPinSaved : false
        }
    }

    componentDidMount() {
        this.setState({
            isPinSaved: this.props.is_pin_saved
        })
    }

    closeSelf = ()=>{
        window.closeModal(this.props.modalId)
    }

    onClickOK = ()=>{
        this.state.isPinSaved ? this.props.updatePIN() : this.props.clearPIN()
        this.props.onOK && this.props.onOK()
        this.closeSelf()
    }

    pinCheckChange = (e) => {
        this.setState({
            isPinSaved: e.target.checked
        });
    }

    render(){
        let author = this.props.author
        let user_code = this.props.login_user_code
        return <div className="default-modal register-contract-modal">
            <div className="contents">
                <div className="title">{translate("register_contract")}</div>
                <div className="form-content">
                    <div>
                        <div className="label">{translate("contract_name")}</div>
                        <div className="info">{this.props.subject}</div>

                        <div className="label">{translate("contract_pin")}</div>
                        <div className="info">
                            <div className="pin-box">
                                {this.props.pin}
                            </div>
                        </div>
                        
                        <div className="checkbox">
                            <input
                                type="checkbox" 
                                onChange={this.pinCheckChange}
                                defaultChecked={this.props.is_pin_saved}/> {translate("save_pin")}
                        </div>

                        <div className="desc">{translate("save_pin_desc")}</div>
                    </div>
                    <div>
                        <div className="label">{translate("signer")}</div>
                        <SignerSlot me={user_code == author.code} code={author.code} name={author.name} eth_address={author.eth_address}  />
                        {this.props.counterparties.map((e,k)=>{
                            return <SignerSlot 
                                key={k}
                                me={user_code == e.code} 
                                code={e.code}
                                name={e.name}
                                eth_address={e.eth_address}  />
                        })}
                        
                    </div>
                </div>
            </div>
            <div className="buttons">
                <button onClick={this.onClickOK}>{translate("confirm")}</button>
                <button onClick={this.closeSelf}>{translate("cancel")}</button>
            </div>
        </div>
    }
}

@modal
class Loading extends React.Component {

    render() {
        return <div style={{color:"#fff",textAlign:"center",zIndex:"9999999999"}}>
            <div className="loader"></div>
            <div style={{marginTop:"20px"}}>{this.props.text || translate("loading")}</div>
        </div>
    }
}


@modal
class RefreshSession extends React.Component {
    constructor(props) {
        super(props);
        let t;
        switch(this.props.type) {
            case 0:
                t = "session"
            break;
            case 1:
                t = "legal_session"
            break;
        }
        this.state = {
            type_string : t
        }
    }

    componentDidMount() {
        this.interval = setInterval(this.update, 1000)
        this.update()
    }

    componentWillUnmount() {
        clearInterval(this.interval)
    }

    digit = (o)=>{
        o = o.toString()
        if(o.length == 1){
            return "0"+o
        }
        return o
    }

    update = ()=>{
        let t = window.getCookie(`${this.state.type_string}_update`)
        if(t){
            let day = 60 * 60 * 3;

            let left_time = day - ((Date.now()-t)/1000);
            let left_hour = Math.floor(left_time/60/60)
            let left_min = Math.floor(left_time/60%60)
            let left_sec = Math.floor(left_time%60)

            this.setState({
                hour:this.digit(left_hour),
                min:this.digit(left_min),
                sec:this.digit(left_sec),
            })
        }
    }

    onClickRenewal= ()=>{
        let session = window.getCookie(this.state.type_string);
        if(session){
            window.setCookie(this.state.type_string, session, 0.125)
            window.setCookie(`${this.state.type_string}_update`, Date.now(), 0.125)
        }

        window.closeModal(this.props.modalId)
        this.props.onClose && this.props.onClose()
    }
    
    onClickLogout = ()=>{
        window.eraseCookie(this.state.type_string)
        window.eraseCookie(`${this.state.type_string}_update`)
        
        location.reload(true)
    }

    render(){
        try{
            return <div className="default-modal session-expired-warning-modal">
                <div className="title">
                    {translate("session_will_be_expired_after", [this.state.hour, this.state.min, this.state.sec])}
                </div>
                <div className="content">
                    {translate("session_will_be_expired_after_desc_1")}<br/>
                    {translate("session_will_be_expired_after_desc_2")}
                </div>
                <div className="btns">
                    <button onClick={this.onClickRenewal}>{translate("continue")}</button>
                    <button onClick={this.onClickLogout}>{translate("logout")}</button>
                </div>
            </div>
        }catch(err){
            return <div />
        }
    }
}

window._confirm = window.confirm;
window.confirm = (title, msg, left, right)=>{
    return new Promise(r=>{
        window.openModal("Confirm",{
            title:title, 
            msg:msg, 
            left_btn:left, 
            right_btn:right,
            resolve:r
        })
    })
}

let indicator_idx = 0;
window.showIndicator = async (text)=>{
    if(indicator_idx)
        if(await window.updateModal(indicator_idx, {text}))
            return ;

    indicator_idx = await window.openModal("Loading",{
        text:text
    })
}

window.hideIndicator = ()=>{
    window.closeModal(indicator_idx)
    indicator_idx = null
}

let refesh_modal_idx = null
setInterval(()=>{

    let t, cookie, type;
    if(location.pathname.indexOf("/e-contract")) {
        t = window.getCookie("session_update");
        cookie = "session"
        type = 0
    } else if(location.pathname.indexOf("/legal-advice")) {
        t = window.getCookie("legal_session_update");
        cookie = "legal_session"
        type = 1
    }

    if(t){
        let day = 60 * 60 * 3;

        let left_time = day - ((Date.now() - t) / 1000);

        if(left_time < 0){
            window.logout();
            //window.eraseCookie(cookie);
            //window.eraseCookie(`${cookie}_update`);
            
            location.reload(true)
        }

        if(left_time < 60 * 5 && !refesh_modal_idx){
            refesh_modal_idx = window.openModal("RefreshSession",{
                type:type,
                onClose:()=>{
                    refesh_modal_idx = null
                }
            })
        }
    } else {
        let exclude = [
            "/",
            '/register',
            '/recover',
            '/old-recover',
            '/sexdanielsex',
        ]
        let home_flag = true;
        if(location.pathname.indexOf("/e-contract")) {
            exclude = [
                '/e-contract/login',
                '/e-contract/verification',
                '/e-contract/public-sign',
                ...exclude
            ]
        } else if(location.pathname.indexOf("/legal-advice")) {
            exclude = [
                '/legal-advice/login',
                ...exclude
            ]
        } 

        for(let v of exclude) {
            if(location.pathname.indexOf(v) != -1) {
                home_flag = false
                break;
            }
        }

        if(home_flag) {
            location.href = "/";
        }
    }
},1000)
