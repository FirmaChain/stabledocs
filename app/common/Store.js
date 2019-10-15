let store = null
export default function(_){
    store = _ || store
    return store
}