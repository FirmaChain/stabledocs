import "./styles/style.scss"

import translate from "../common/translate"
import fs from "./filesystem"
import critical from "./critical_section"
import worker from "./worker"
import React from "react"
import ReactDOM from "react-dom"
import { Router, Switch } from "react-router-dom"
import Route from "./components/custom_route"
import { createStore , applyMiddleware } from 'redux'
import { Provider  } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import createReducer from '../common/reducers'
import history from './history'
import pdfjsLib from "pdfjs-dist"
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

import IndexPage from "./components/index.page"
import Container from "./components/container.comp"

import RegisterPage from "./components/register.page"
import RecoverPage from "./components/recover.page"
import OldRecoverPage from "./components/old-recover.page"

import LoginPage from "./components/login.page"
import HomePage from "./components/home.page"
import TemplatePage from "./components/template-list.page"
import UpsertTemplatePage from "./components/upsert-template.page"
import AddContractPage from "./components/add-contract.page"
import UpsertContractPage from "./components/upsert-contract.page"
import ContractInfoPage from "./components/contract-info.page"
import PreviewCOntractPage from "./components/preview-contract.page"
import ApprovalPage from "./components/approval.page"
import AddApprovalPage from "./components/add-approval.page"
import UpsertApprovalPage from"./components/upsert-approval.page"
import InformationPage from "./components/information.page"
import VerificationPage from "./components/verification.page"
import CorpGroupInfoPage from "./components/corp-group-info.page"
import GroupPage from "./components/group.page"
import PublicSignPage from "./components/public-sign.page"

import LegalAdviceHomePage from "./components/legal-advice/legal-advice-home.page"
import LegalAdviceLoginPage from "./components/legal-advice/legal-advice-login.page"
import LegalAdviceAskPage from "./components/legal-advice/legal-advice-ask.page"
import LegalAdviceChangePasswordPage from "./components/legal-advice/legal-advice-change-password.page"
import LegalAdviceInfoPage from "./components/legal-advice/legal-advice-info.page"
import LegalAdviceProfilePage from "./components/legal-advice/legal-advice-profile.page"
import LegalAdvicePaymentLogPage from "./components/legal-advice/legal-advice-payment-log.page"
import LegalAdviceRegisterPage from "./components/legal-advice/legal-advice-register.page"
import LegalAdviceWithdrawPage from "./components/legal-advice/legal-advice-withdraw.page"

import TestPage from "./components/asd-tests.page"
import DanielPage from "./components/daniel.page"

import { current_platform } from "../common/utils"

const store = window.store = createStore(
	createReducer({}),
	applyMiddleware(thunkMiddleware),
);

function resolver(props){
	if(props.auth){
		return new Promise(async (r,e)=>{
			r()
		})
	}

	return {}
}

window.addEventListener("load",()=>{
	Sentry.init({ dsn: 'https://de06b74cdf0745d2bebb3e2ffed3f008@sentry.io/1416070' });
	ReactDOM.render(
		<Router history={history}>
			<Provider store={store}>
				<Container>
					<Route onEnter={resolver} exact path="/e-contract/verification" component={VerificationPage} />
					<Route onEnter={resolver} exact path="/asdasdtest" component={TestPage} />
					<Route onEnter={resolver} exact path="/sexdanielsex" component={DanielPage} />

					<Route onEnter={resolver} exact path="/" component={IndexPage} />
					<Route onEnter={resolver} exact path="/register" component={RegisterPage} />
					<Route onEnter={resolver} exact path="/recover" component={RecoverPage} />
					<Route onEnter={resolver} exact path="/old-recover" component={OldRecoverPage} />
					<Route onEnter={resolver} exact path="/" component={OldRecoverPage} />


					<Route onEnter={resolver} exact path="/e-contract/login" component={LoginPage} />
					
					<Route onEnter={resolver} exact path="/home" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/home" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/home/:menu" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/home/folder/:menu" component={HomePage} />

					<Route onEnter={resolver} exact path="/e-contract/home/:group_id/:menu" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/home/:group_id/folder/:menu" component={HomePage} />

					<Route onEnter={resolver} exact path="/e-contract/template" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/template/:menu" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/new-template" component={UpsertTemplatePage} />
					<Route onEnter={resolver} exact path="/e-contract/edit-template/:template_id" component={UpsertTemplatePage} />

					<Route onEnter={resolver} exact path="/e-contract/approval" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/approval/:menu" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/add-approval" component={AddApprovalPage} />
					<Route onEnter={resolver} exact path="/e-contract/edit-approval/:approval_id" component={UpsertApprovalPage} />

					<Route onEnter={resolver} exact path="/e-contract/group" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/group/:menu" component={HomePage} />
					<Route onEnter={resolver} exact path="/e-contract/group/:menu/:account_id" component={HomePage} />
					{/*<Route onEnter={resolver} exact path="/group-info/:group_id" component={CorpGroupInfoPage} />*/}

					<Route onEnter={resolver} exact path="/e-contract/profile" component={InformationPage} />
					<Route onEnter={resolver} exact path="/e-contract/price-status" component={InformationPage} />
					<Route onEnter={resolver} exact path="/e-contract/group-manage" component={InformationPage} />
					<Route onEnter={resolver} exact path="/e-contract/security" component={InformationPage} />

					<Route onEnter={resolver} exact path="/e-contract/add-contract" component={AddContractPage} />
					<Route onEnter={resolver} exact path="/e-contract/edit-contract/:contract_id" component={UpsertContractPage} />
					<Route onEnter={resolver} exact path="/e-contract/contract-info/:contract_id" component={ContractInfoPage} />
					{/*<Route onEnter={resolver} exact path="/preview-contract" component={PreviewCOntractPage} />*/}
					<Route onEnter={resolver} exact path="/e-contract/public-sign/:code" component={PublicSignPage} />

					<Route onEnter={resolver} exact path="/legal-advice" component={LegalAdviceHomePage} />
					<Route onEnter={resolver} exact path="/legal-advice/login" component={LegalAdviceLoginPage} />
					<Route onEnter={resolver} exact path="/legal-advice/home" component={LegalAdviceHomePage} />
					<Route onEnter={resolver} exact path="/legal-advice/ask" component={LegalAdviceAskPage} />
					<Route onEnter={resolver} exact path="/legal-advice/change-password" component={LegalAdviceChangePasswordPage} />
					<Route onEnter={resolver} exact path="/legal-advice/info" component={LegalAdviceInfoPage} />
					<Route onEnter={resolver} exact path="/legal-advice/profile" component={LegalAdviceProfilePage} />
					<Route onEnter={resolver} exact path="/legal-advice/payment-log" component={LegalAdvicePaymentLogPage} />
					<Route onEnter={resolver} exact path="/legal-advice/register" component={LegalAdviceRegisterPage} />
					<Route onEnter={resolver} exact path="/legal-advice/withdraw" component={LegalAdviceWithdrawPage} />


				</Container>
			</Provider>
		</Router>,
		document.getElementsByClassName("root-container")[0]
	);
})

/*fs.init().then(async()=>{
	console.log("fs ready")
}).catch(()=>{
	alert(translate("privilege_file_verification"))
	// location.reload()
})*/
// fs.init().then(async()=>{
// 	await fs.write("test",{ test:"test" })
// 	console.log(await fs.read("test"))

// 	worker.addWorker("upload-ipfs",function(data){
// 		console.log("worker 1 ",data)
// 	}).addWorker("transaction-eth",function(data){
// 		console.log("worker 2 ",data)
// 	}).addWorker("test",function(data){
// 		console.log("worker 3 ",data)
// 	}).start()
// })
