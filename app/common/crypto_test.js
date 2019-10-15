import bip32 from 'bip32'
import bip39 from 'bip39'
import {
    ecdsa_sign,
    ecdsa_verify,
    ec_key_from_private,
    ec_key_from_public,
    ecaes_encrypt,
    ecaes_decrypt,
    aes_encrypt,
    aes_decrypt,
    aes_encrypt_async,
    aes_decrypt_async,
    bip32_from_512bit,
    hmac_sha512,
    hmac_sha256,
    get256bitDerivedPrivateKey,
    get256bitDerivedPublicKey,
    dkaes_encrypt,
    dkaes_decrypt,
    generate_random,
} from "./CryptoUtil"

export { 
    aes_encrypt_async,
    aes_decrypt_async,
    aes_encrypt,
    aes_decrypt,
    ecdsa_verify,
    generate_random,
    hmac_sha256,
    get256bitDerivedPublicKey,
    bip32_from_512bit,
} from "./CryptoUtil";

let serverDB = {};

export function generateRandomKey(length = 16) {
    const possible = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let passphrase = "";
    for (let i = 0; i < length; i++)
        passphrase += possible.charAt(Math.floor(Math.random() * possible.length));
    return passphrase;
}

export function generateMnemonic() {
	let mnemonic = bip39.generateMnemonic();
	//let mnemonic = bip39.entropyToMnemonic('000102030405060708090a0b0c0d0e0f');
	return mnemonic;
}

export function getBrowserKey(id = null, pw = null, forcedGenerate=false) {
	/*let browserKey = localStorage.getItem("browser_key");
	if (forcedGenerate || browserKey == null) {
		browserKey = generateBrowserKey().toString("base64");
		localStorage.setItem("browser_key", browserKey);
        localStorage.setItem("browser_key_virgin", 1);
	}
	return Buffer.from(browserKey, "base64");*/

    return Buffer.from(getNewBrowserKey(id, pw, forcedGenerate), "base64");
}

export function generateBrowserKey() {
	let mnemonic = generateMnemonic();
	let entropy = bip39.mnemonicToEntropy(mnemonic);
	let seed = bip39.mnemonicToSeed(mnemonic);
	let digest = hmac_sha512("FirmaChain browser seed", seed);
	return digest;
}

function getNewBrowserKey(id, pw, forcedGenerate=false) {
    let browserKey = localStorage.getItem("browser_key");
    if (forcedGenerate || browserKey == null) {
        if (id == null || pw == null)
            throw "empty id or pw";

        let digest1 = hmac_sha512("FirmaChain browser seed aux", id);
        let digest2 = hmac_sha512("FirmaChain browser seed aux", pw);
        let digest = hmac_sha512("FirmaChain browser seed", Buffer.concat([digest1, digest2]));
        browserKey = digest.toString("base64")
        localStorage.setItem("browser_key", browserKey);
        localStorage.setItem("browser_key_virgin", 1);
    }
    return browserKey;
}

export function generateCorpKey() {
	let mnemonic = generateMnemonic();
	let entropy = bip39.mnemonicToEntropy(mnemonic);
	let seed = bip39.mnemonicToSeed(mnemonic);
	let digest = hmac_sha512("FirmaChain corp seed", seed);
	return digest;
}

export function entropyToMnemonic(entropy) {
    return bip39.entropyToMnemonic(entropy);
}

export function mnemonicToSeed(mnemonic){
	return bip39.mnemonicToSeed(mnemonic);
}

export function validateMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
}

export function makeMnemonic(auth, forcedMnemonic=null) {
	let userMnemonic = forcedMnemonic ? forcedMnemonic : generateMnemonic();
	let userEntropy = bip39.mnemonicToEntropy(userMnemonic);
	let browserKey = getBrowserKey();
	let encryptedUserEntropy = aes_encrypt(userEntropy, auth);
	let encryptedUserEntropyTwice = dkaes_encrypt(browserKey, "m/0'/0'", encryptedUserEntropy);
	serverDB['encryptedUserEntropy'] = encryptedUserEntropyTwice;
	return encryptedUserEntropyTwice;
	//return userMnemonic;
}

export function showMnemonic(auth) {
	let browserKey = getBrowserKey();
	let encryptedUserEntropyTwice = serverDB['encryptedUserEntropy'];
	let encryptedUserEntropy = dkaes_decrypt(browserKey, "m/0'/0'", encryptedUserEntropyTwice);
	let userEntropy = aes_decrypt(encryptedUserEntropy, auth);
	let userMnemonic = bip39.entropyToMnemonic(userEntropy);
	return userMnemonic;
}

export function makeAuth(id, pw) {
	let browserKey = getBrowserKey(id, pw, true);
	let hmackey = get256bitDerivedPublicKey(browserKey, "m/0'/0'");
	let hmacpw = hmac_sha256(hmackey, pw);
	let msg = Buffer.concat([hmackey, Buffer.from(id, "utf8"), hmacpw]);
	let auth = hmac_sha256("", msg);
	return auth;
}

export function SeedToMasterKeyPublic(seed){
	let masterKey = hmac_sha512("FirmaChain master seed", seed);
	return get256bitDerivedPublicKey(masterKey, "m/0'/0'");
}

export function SeedToMasterKeyPublicContract(seed){
	let masterKey = hmac_sha512("FirmaChain master seed", seed);
	return bip32_from_512bit(masterKey).derivePath("m/2'/0'").publicKey;
}

export function SeedToEthKey(seed, subpath){
	let masterKey = hmac_sha512("Bitcoin seed", seed);
    let coinMasterKey = bip32_from_512bit(masterKey).derivePath("m/44'/60'");
    let requestKey = bip32_from_512bit(masterKey).derivePath("m/44'/60'/"+subpath);
    if (coinMasterKey.toBase58() == requestKey.toBase58()) {
        return null;
    } else {
        return requestKey;
    }
}

export function BrowserKeyBIP32(){
	let browserKey = getBrowserKey();
	return {
		privateKey : bip32_from_512bit(browserKey).derivePath("m/0'/1'").privateKey,
		publicKey : bip32_from_512bit(browserKey).derivePath("m/0'/1'").publicKey,
	}
}

export function makeSignData(str, auth, nonce){
	let browserKey = BrowserKeyBIP32();
	let msgHash = hmac_sha512(str, Buffer.concat([Buffer.from(nonce.toString()), auth]))

	let sign = Buffer.from(ecdsa_sign(msgHash, browserKey.privateKey).toDER()).toString('hex')
	return {
		payload: sign,
		publicKey:browserKey.publicKey,
		privateKey:browserKey.privateKey,
		msgHash:msgHash
	}
}

export function new_account(id, pw){
	let auth = makeAuth(id, pw);
	let encryptedMasterSeed = makeMnemonic(auth)
	let rawMnemonic = showMnemonic(auth);
	let seed = mnemonicToSeed(rawMnemonic)
	let masterKeyPublic = SeedToMasterKeyPublic(seed)
	let masterKeyPublicContract = SeedToMasterKeyPublicContract(seed)
	let browserKey = BrowserKeyBIP32();

    const possible = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let passphrase2_length = 12;
    let passphrase2 = "";
    for (let i = 0; i < passphrase2_length; i++)
        passphrase2 += possible.charAt(Math.floor(Math.random() * possible.length));

	return {
		auth:auth,
		encryptedMasterSeed:encryptedMasterSeed,
		rawMnemonic:rawMnemonic,
		seed:seed,
		masterKeyPublic:masterKeyPublic,
		masterKeyPublicContract:masterKeyPublicContract,
		browserKey:browserKey,
        recoverPassword:passphrase2
	}
}

export function getUserEntropy(auth, eems){
	let bk = getBrowserKey();
	let eems_buffer = Buffer.from(eems, "base64").toString("hex");
	let encryptedUserEntropy = dkaes_decrypt(bk, "m/0'/0'", eems_buffer);
	let userEntropy = aes_decrypt(encryptedUserEntropy, auth);

	return userEntropy;
}

export function decrypt_user_info(entropy, encrypted_info){
	let mnemonic = bip39.entropyToMnemonic(entropy);
	let seed = bip39.mnemonicToSeed(mnemonic);
	let masterKey = hmac_sha512("FirmaChain master seed", seed);
	let masterKeyPublic = get256bitDerivedPublicKey(masterKey, "m/0'/0'");
	let result = aes_decrypt(encrypted_info, masterKeyPublic);

	try{
		return JSON.parse(result)
	}catch(err){
		return result
	}
}

export function decrypt_corp_info(corp_key, encrypted_info){
	let result = aes_decrypt(encrypted_info, corp_key);

	try{
		return JSON.parse(result)
	}catch(err){
		return result
	}
}

export function getContractKey(pin, sharedAuxKey) {
    return hmac_sha256("FirmaChain New Contract", Buffer.concat([Buffer.from(pin), sharedAuxKey]));
}

// sealContractAuxKey
// publicKeyHex : hexstring
// sharedAuxKey : Buffer[31]
export function sealContractAuxKey(publicKeyHex, sharedAuxKey) {
    let publicKey = ec_key_from_public(Buffer.from(publicKeyHex,'hex'), undefined, 1);
    let sharedAuxKeyEncrypted = ecaes_encrypt(sharedAuxKey, publicKey, 1);
    let sharedAuxKeyEncryptedHex = Buffer.concat([Buffer.from(sharedAuxKeyEncrypted.encrypted_message, 'hex'), Buffer.from(sharedAuxKeyEncrypted.temp_key_public.encodeCompressed())]).toString('hex');
    return sharedAuxKeyEncryptedHex;
}

// unsealContractAuxKeyAux
// masterKey : Buffer[64]
// eckaiHex : hexstring
function unsealContractAuxKeyAux(masterKey, eckaiHex){
    try {
        let private_key = ec_key_from_private(bip32_from_512bit(masterKey).derivePath("m/2'/0'").privateKey, undefined, 1);

        let eckai = Buffer.from(eckaiHex, "hex");
        var encrypted_message = eckai.slice(0, 32).toString('hex');
        var temp_key_public_compressed = eckai.slice(32, 65);

        var temp_key_public = ec_key_from_public(temp_key_public_compressed, undefined, 1).getPublic();
        var cipher_text = {'encrypted_message':encrypted_message, 'temp_key_public':temp_key_public};
        var sharedAuxKeyDecrypted = ecaes_decrypt(cipher_text, private_key, true);

        return sharedAuxKeyDecrypted;
    }catch(err){
        console.log(err);
        return null;
    }
}

// unsealContractAuxKey
// entropy : hexstring
// eckaiHex : hexstring
export function unsealContractAuxKey(entropy, eckaiHex){
    try{
        let mnemonic = bip39.entropyToMnemonic(entropy);
        let seed = bip39.mnemonicToSeed(mnemonic);
        let masterKey = hmac_sha512("FirmaChain master seed", seed);
        return unsealContractAuxKeyAux(masterKey, eckaiHex);
    }catch(err){
        console.log(err);
        return null;
    }
}

// unsealContractAuxKeyGroup
// group_key : hexstring 256bit
// eckaiHex : hexstring
export function unsealContractAuxKeyGroup(group_key, eckaiHex){
    try{
        return unsealContractAuxKeyAux(getGroupMasterKey(group_key), eckaiHex);
    }catch(err){
        console.log(err);
        return null;
    }
}

// encryptPIN
// pin : string
// group_key (optional) : 
export function encryptPIN(pin, group_key=null){
    try{
        let masterKey = group_key ? getGroupMasterKey(group_key) : getAccountMasterKey();
        return dkaes_encrypt(masterKey, "m/3'/0'", pin);
    }catch(err){
        console.log(err);
        return null;
    }
}

// decryptPIN
// epin: hexstring
// group_key (optional) : 
export function decryptPIN(epin, group_key=null){
    try{
        let masterKey = group_key ? getGroupMasterKey(group_key) : getAccountMasterKey();
        return dkaes_decrypt(masterKey, "m/3'/0'", epin);
    }catch(err){
        console.log(err);
        return null;
    }
}

export function getMasterSeed() {
    try {
        let entropy = localStorage.getItem("entropy");
        let mnemonic = bip39.entropyToMnemonic(entropy);
        let seed = bip39.mnemonicToSeed(mnemonic);
        return seed;
    } catch(err) {
        console.log(err);
        return null;
    }
}

// getGroupMasterKey
// group_key : hexstring
function getGroupMasterKey(group_key) {
    let group_key2 = hmac_sha256("FirmaChain Group Key", group_key);
    let group_master_key = Buffer.concat([Buffer.from(group_key, "hex"), group_key2]);
    return group_master_key;
}

// getAccountMasterKey
function getAccountMasterKey() {
    let seed = getMasterSeed();
    return hmac_sha512("FirmaChain master seed", seed);
}

