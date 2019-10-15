import {
  LIST_TEMPLATE,
  FOLDER_LIST_TEMPLATE,
} from '../actions';

let _ = {
  folders:[],
  templates:{
    list:[]
  }
}

export default function (state=_, action){
        switch (action.type) {
            case LIST_TEMPLATE:
                return {
                    ...state,
                    templates: action.payload
                }
            case FOLDER_LIST_TEMPLATE:
                return {
                    ...state,
                    folders: action.payload
                }
          default:
              return state;
      }
  }