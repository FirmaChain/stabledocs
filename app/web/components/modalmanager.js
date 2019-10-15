import React from "react"
import ReactDOM from "react-dom"
import { connect } from 'react-redux';
import translate from "../../common/translate"

let ModalStore = {}
export function modal(classes){
    ModalStore[classes.name] = classes
}

export class ModalManager extends React.Component {
	constructor(){
        super()
		this.state={
            modalIdx: 0,
            modals: [],
        }
    }

	componentDidMount(){
        window.openModal = this.openModal
        window.closeModal = this.closeModal
        window.updateModal = this.updateModal
        window.allRemoveModal = this.allRemoveModal
    }

    allRemoveModal = () => {
        this.setState({ modals:[] })
    }
    
    openModal = async (name, props={})=>{
        return new Promise(r=>{
            this.setState({
                modalIdx:this.state.modalIdx+1, 
                modals:[...this.state.modals, {
                    idx:this.state.modalIdx+1,
                    name:name,
                    props:props,
                }],
            },()=>r(this.state.modalIdx))
        })
    }

    updateModal = async (idx,props)=>{
        try{
            let index = this.state.modals.findIndex(e=>e.idx == idx)
            let modals = [...this.state.modals]

            modals[index].props = {
                ...modals[index].props,
                ...props
            }
            this.setState({
                modals: modals
            })
        }catch(err){
            return false;
        }
        return true;
    }

    closeModal = async (idx)=>{
        let index = this.state.modals.findIndex(e=>e.idx == idx)
        this.state.modals.splice(index,1)
        this.setState({
            modals: [...this.state.modals]
        })
    }

	render() {
		return (<div className="modal-manager">
            <div className="modal-container" style={{
                pointerEvents: this.state.modals.length > 0 ? "auto" : "none",
                opacity: this.state.modals.length > 0 ? 1 : 0
            }}>
                {this.state.modals.map((e,k)=>{
                    let Modal = ModalStore[e.name]
                    return <div key={`${e}_${k}`} className="modal-content-container">
                        <Modal {...e.props} modalId={e.idx} />
                    </div>
                })}
            </div>
		</div>);
	}
}