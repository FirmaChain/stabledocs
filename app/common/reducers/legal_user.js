import {
    LEGAL_SUCCESS_LOGIN,
    LEGAL_RELOAD_USERINFO,
    LEGAL_LOGOUT
} from '../legal_actions';

let _ = {
    info:false
}

export default function (state=_, action){
        switch (action.type) {
            case LEGAL_SUCCESS_LOGIN:
                return {
                    ...state,
                    login: action.payload
                }
            case LEGAL_RELOAD_USERINFO:
                return {
                    ...state,
                    info: action.payload
                }
            case LEGAL_LOGOUT:
                return {
                    ...state,
                    info: false
                }
          default:
              return state;
      }
  }