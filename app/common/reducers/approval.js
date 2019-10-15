import {
	GET_APPROVALS,
} from '../actions';

let _ = {
}

export default function (state=_, action){
	switch (action.type) {
		case GET_APPROVALS:
			return {
				...state,
				approvals: action.payload
			}
		default:
			return state;
	}
}