export const SHOW_LOADING = "SHOW_LOADING"
export const HIDE_LOADING = "HIDE_LOADING"

export function showLoading(){
	return async function (dispatch){
		dispatch({type:SHOW_LOADING})
	}
}

export function hideLoading(){
	return async function (dispatch){
		dispatch({type:HIDE_LOADING})
	}
}
