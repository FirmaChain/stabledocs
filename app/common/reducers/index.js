import { combineReducers } from 'redux';
import user from "./user"
import legal_user from "./legal_user"
import document from "./document"
import contract from "./contract"
import group from "./group"
import template from "./template"
import approval from "./approval"

export default function createStore(reducers){
    return combineReducers({
        user,
        document,
        contract,
        group,
        template,
        approval,
        legal_user,
        ...reducers
    })
}
