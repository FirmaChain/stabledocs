import {
    RELOAD_DOCUMENTS,
    RELOAD_IMPORTABLE_DOCUMENTS,
} from '../actions';

let _ = {
}

export default function loading(state=_, action){
    switch (action.type) {
        case RELOAD_DOCUMENTS:
            return { 
                ...state,
                recv:[...action.payload.recv],
                req:[...action.payload.req]
            }

        case RELOAD_IMPORTABLE_DOCUMENTS:
            return {
                ...state,
                importable : action.payload
            }

        default:
            return state;
    }
}