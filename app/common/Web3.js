import Web3 from 'web3'
import SHA3 from 'keccakjs'
import poc from "../../app/contract-poc"
import fct from "../../app/contract-fct"
import { sha256 } from 'js-sha256'

const wei = 1000000000000000000
const fct_wei = 1000000000000000000

class Web3Wrapper {
    constructor(){
        this.web3 = new Web3( new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/103b22dad4f04d26818acc658e23a7ea') );

        this.contract_inst = new this.web3.eth.Contract(poc.abi, poc.address)
        this.fct_inst = new this.web3.eth.Contract(fct.abi, fct.address)
    }

    createAccount(){
        return this.web3.eth.accounts.create();
    }

    walletWithPK(privateKey){
        try{
            return this.web3.eth.accounts.privateKeyToAccount(privateKey)
        }catch(err){
            return null
        }
    }

    isValidWallet(address){
        address = address.trim()
        try{
            let res = this.isValidChecksumAddress(address)
            console.log(res)
            return res
        } catch(err) {
            console.log(err)
        }
        return false
    }

    isValidChecksumAddress(address) {
        return this.isValidAddress(address) && (this.toChecksumAddress(address).toLowerCase() == address.toLowerCase())
    }

    isValidAddress(address) {
        return /^0x[0-9a-fA-F]{40}$/.test(address)
    }

    toChecksumAddress(address) {
        address = this.stripHexPrefix(address).toLowerCase()
        let hash = this.sha3(address).toString('hex')
        let ret = '0x'

        for (let i = 0; i < address.length; i++) {
            if (parseInt(hash[i], 16) >= 8) {
                ret += address[i].toUpperCase()
            } else {
                ret += address[i]
            }
        }
        
        return ret
    }

    stripHexPrefix(str) {
        if (typeof str !== 'string') {
            return str
        }
        return this.isHexPrefixed(str) ? str.slice(2) : str
    }

    sha3(a, bytes) {
        a = this.toBuffer(a)
        if (!bytes) bytes = 256

            let h = new SHA3(bytes)
        if (a) {
            h.update(a)
        }
        return new Buffer(h.digest('hex'), 'hex')
    }

    toBuffer(v) {
        if (!Buffer.isBuffer(v)) {
            if (Array.isArray(v)) {
                v = new Buffer(v)
            } else if (typeof v === 'string') {
                if (this.isHexPrefixed(v)) {
                    v = new Buffer(this.padToEven(this.stripHexPrefix(v)), 'hex')
                } else {
                    v = new Buffer(v)
                }
            } else if (typeof v === 'number') {
                v = this.intToBuffer(v)
            } else if (v === null || v === undefined) {
                v = new Buffer([])
            } else if (v.toArray) {
                v = new Buffer(v.toArray())
            } else {
                throw new Error('invalid type')
            }
        }
        return v
    }

    intToBuffer(i) {
        let hex = this.intToHex(i)
        return new Buffer(hex.slice(2), 'hex')
    }

    intToHex(i) {
        assert(i % 1 === 0, 'number is not a integer')
        assert(i >= 0, 'number must be positive')
        let hex = i.toString(16)
        if (hex.length % 2) {
            hex = '0' + hex
        }

        return '0x' + hex
    }

    isHexPrefixed(str) {
        return str.slice(0, 2) === '0x'
    }

    padToEven(a) {
        if (a.length % 2) a = '0' + a
        return a
    }

    allAccounts(){
        let list = []
        for(let i=0; true ; i++){
            let w = this.web3.eth.accounts.wallet[i]
            if(w == null)
                return list

            list.push(w)
        }
        return []
    }

    addAccount(privateKey){
        this.web3.eth.accounts.wallet.add(privateKey);
    }

    async eth_balance(walletAddress){
        return await this.web3.eth.getBalance(walletAddress) / wei
    }

    async eth_transfer_data(pk, from, to, balance, data=null, gas=500000, gasPrice=20){
        let tx = {
            from: from,
            to: to,
            value: balance*wei,
            gas: gas,
            gasPrice: gasPrice,
            data:data
        }

        if(!data){
            delete tx["data"]
        }

        try{
            let hash = await this.web3.eth.accounts.signTransaction(tx, pk)
            try{
                let receipt = await this.web3.eth.sendSignedTransaction(hash.rawTransaction)
                return receipt;
            }catch(err){
                console.log("transaction error!", err.message)
                if(err.message.indexOf("insufficient funds for gas * price + value") > 0)
                    throw "NotEngouhETH"
            }
        }catch(err){
            console.log("signed error!", err)
            throw err
        }
        throw "SomeError"
    }

    async eth_transfer(pk, from, to, balance, gas=500000, gasPrice=20){
        return await this.eth_transfer_data(pk, from, to, balance, null, gas, gasPrice)
    }

    async fct_balance(wallet_address){
        let balance = await this.fct_inst.methods.balanceOf(wallet_address).call({from:wallet_address})
        return balance / fct_wei
    }

    async fct_transfer(from, to, balance, gas=500000, gasPrice=20){
        return await this.fct_inst.methods.transfer(to, balance * fct_wei).send({
            from:from,
            gas:gas,
            gasPrice:gasPrice
        })
    }

    async contract_newContract(docId,author,counterparties,lifetime=100000, gas=500000, gasPrice=20){
        return await this.contract_inst.methods.newContract(docId, [author, ...counterparties], lifetime).send({
            from:author,
            gas:gas,
            gasPrice:gasPrice
        })
    }

    async signed_newOrSignContract(docId,counterparties,gas=500000, gasPrice=20){
        let list = this.allAccounts()
        let account = list[0]
        let method = this.contract_inst.methods.newOrSignContract(docId, docId, counterparties);
        let tx = {
            from: account.address,
            to: poc.address,
            gas: gas,
            gasPrice: gasPrice,
            data: method.encodeABI()
        }
        let signed = account.signTransaction(tx)
        return signed
    }

    async contract_sign(docId, author, signature_ipfs, gas=500000, gasPrice=20){
        return await this.contract_inst.methods.signContract(docId, sha256(signature_ipfs), signature_ipfs).send({
            from:author,
            gas:gas,
            gasPrice:gasPrice
        })
    }

    async contract_getSignIPFS(docId, idx){
        let list = this.allAccounts()
        return await this.contract_inst.methods.extraData(docId, idx).call({from:list[0].address})
    }

    async contract_allSign(docId){
        let list = this.allAccounts()
        return (await this.contract_inst.methods.getHashes(docId).call({ from:list[0].address })).map((r)=>Web3.utils.toHex(r))
    }

    async contract_getParties(docId){
        let list = this.allAccounts()
        return await this.contract_inst.methods.getParties(docId).call({from:list[0].address})
    }

    myPrivateKey(address){
        let list = this.allAccounts()
        for(let v of list){
            console.log(v.address , address)
            if(v.address == address)
                return v.privateKey
        }
        return null
    }
    
    async transaction(transactionId){
        try{
            return await this.web3.eth.getTransaction(transactionId);
        }catch(err){
            return await this.web3.eth.getTransaction("0x"+transactionId);
        }
    }

    async receipt(transactionId){
        try{
            return await this.web3.eth.getTransactionReceipt(transactionId)
        }catch(err){
            return await this.web3.eth.getTransactionReceipt("0x"+transactionId)
        }
    }

    sign(data, privateKey) {
        let list = this.allAccounts();
        let account = list[0];
        let signed = account.sign(data);
        return signed;
    }
}

let _web3 = new Web3Wrapper();
// let account = _web3.createAccount();
// _web3.addAccount(account.privateKey)
// _web3.signed_newOrSignContract(sha256("222222"),account.address,[]).then(console.log.bind(this,"-"))
export default _web3;
