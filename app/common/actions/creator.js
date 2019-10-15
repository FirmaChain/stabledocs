async function async_dispatch(dispatch,msg,func,...args){
    dispatch({type:msg + "_LOADING"})
    let data = await func(...args);
    dispatch({type:msg, payload:data})
}

export default function actions(msg, func){
    return function (...args){
        return async function (dispatch){
            await async_dispatch(dispatch, msg, func ,...args )
        }
    }
}