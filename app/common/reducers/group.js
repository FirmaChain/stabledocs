import {
	GROUP_HOME_OPEN_GROUP,
	GROUP_HOME_CLOSE_GROUP,
	GET_MY_GROUPS_INFO,
	GET_GROUP_INFO,
	GET_GROUP_MEMBERS,
} from '../actions';

let _ = {
	isOpenGroupList:[],
	groups:[],
	members:[],
}

export default function (state=_, action){
	switch (action.type) {
		case GROUP_HOME_OPEN_GROUP: {
			let list = [...state.isOpenGroupList]
			for(let i in list) {
				if(list[i] == action.payload) {
					return {...state}
				}
			}
			list.push(action.payload)
			return {
				...state,
				isOpenGroupList:list
			}
		}
		case GROUP_HOME_CLOSE_GROUP: {
			let list = [...state.isOpenGroupList]
			for(let i in list) {
				if(list[i] == action.payload) {
					list.splice(i, 1)
				}
			}
			return {
				...state,
				isOpenGroupList: list
			}
		}
		case GET_GROUP_MEMBERS:
			return {
				...state,
				members:action.payload
			}
		case GET_MY_GROUPS_INFO:
			return {
				...state,
				groups:action.payload
			}
		default:
			return state;
	}
}