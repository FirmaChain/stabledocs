import {
    SUCCESS_LOGIN,
    RELOAD_USERINFO
} from '../actions';

let _ = {
    info:false
}

export default function (state=_, action){
        switch (action.type) {
            case SUCCESS_LOGIN:
                return {
                    ...state,
                    login: action.payload
                }
            case RELOAD_USERINFO:
                return {
                    ...state,
                    info: action.payload
                }
          default:
              return state;
      }
  }