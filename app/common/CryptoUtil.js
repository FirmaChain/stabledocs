let secureRandom = require('./crypto/secure_random.js');
let crypto = require('crypto');
let bip32 = require('bip32');
let bip39 = require('bip39');
let EC = require('elliptic').ec;
let ec = new EC('curve25519');
let ecdsa = new EC('secp256k1'); //ec for ecdsa or compatible with HD keys
let ebtk = require('evp_bytestokey');

export function ecdsa_sign(msgHash, privateKey) {
	var key = ecdsa.keyFromPrivate(privateKey);
	return key.sign(msgHash);
}

export function ecdsa_verify(msgHash, publicKey, signature) {
	var key = ecdsa.keyFromPublic(publicKey);
	return key.verify(msgHash, signature);
}

// curve_type
// 0 : curve25519
// 1 : secp256k1
function get_ec(curve_type) {
	let curve;
	if (curve_type == 0) {
		curve = ec;
	} else if (curve_type == 1) {
		curve = ecdsa;
	}
	return curve;
}

export function ec_key_from_private(privateKey, enc, curve_type=0) {
	const curve = get_ec(curve_type);
	return curve.keyFromPrivate(privateKey, enc);
}

export function ec_key_from_public(publicKey, enc, curve_type=0) {
	const curve = get_ec(curve_type);
	return curve.keyFromPublic(publicKey, enc);
}

export function ecaes_encrypt(m, keyPair, curve_type=0) {
	const curve = get_ec(curve_type);
	var tempKey = curve.genKeyPair();
	var thisTime = tempKey.derive(keyPair.getPublic()).toArrayLike(Buffer, 'be', 32);
	var cipherText = aes_encrypt(m, thisTime);
	return {encrypted_message: cipherText, temp_key_public: tempKey.getPublic()};
}

export function ecaes_decrypt(c, keyPair, output_buffer=false) {
	var tempKeyPublic = c.temp_key_public;
	var encryptedMessage = c.encrypted_message;
	//var thisTime = tempKeyPublic.mul(keyPair.getPrivate()).getX().toBuffer('be', 32);
	var thisTime = keyPair.derive(tempKeyPublic).toArrayLike(Buffer, 'be', 32);
	var plainText = aes_decrypt(encryptedMessage, thisTime, output_buffer);
	return plainText;
}

export async function aes_encrypt_async(m, k, is_legacy=true) {
	if( !Buffer.isBuffer(k) ) {
		console.log("key is not buffer")
		throw "key is not buffer"
	}
    let key, iv;
    if (is_legacy) {
        let keys = ebtk(k, false, 256, 16);
        key = keys.key;
        iv = keys.iv;
    } else {
        key = k;
        iv = key.slice(0, 16);
    }
    let importedKey = await window.crypto.subtle.importKey("raw", key, {name: "AES-CBC"}, false, ["encrypt"]);
    let buffered = Buffer.from(m, 'binary');
    let result = await window.crypto.subtle.encrypt({"name": "AES-CBC", "iv":iv}, importedKey, buffered);
    return Buffer.from(result).toString('binary');
}

export async function aes_decrypt_async(c, k, output_buffer=false, is_legacy=true) {
	if( !Buffer.isBuffer(k) ) {
		console.log("key is not buffer")
		throw "key is not buffer"
	}
    let key, iv;
    if (is_legacy) {
        let keys = ebtk(k, false, 256, 16);
        key = keys.key;
        iv = keys.iv;
    } else {
        key = k;
        iv = key.slice(0, 16);
    }
    let importedKey = await window.crypto.subtle.importKey("raw", key, {name: "AES-CBC"}, false, ["decrypt"]);
    let buffered = Buffer.from(c, "binary");
    let result = await window.crypto.subtle.decrypt({"name": "AES-CBC", "iv":iv}, importedKey, buffered);
    if (output_buffer) {
        return Buffer.from(result);
    } else {
        return Buffer.from(result).toString();
    }
}

export function aes_encrypt(m, k) {
	if( !Buffer.isBuffer(k) ) {
		console.log("key is not buffer")
		throw "key is not buffer"
	}
	const cipher = crypto.createCipher('aes-256-cbc', k);
	let c = cipher.update(m, 'utf8', 'hex');
	c += cipher.final('hex');
	return c;
}

export function aes_decrypt(c, k, output_buffer=false) {
	if( !Buffer.isBuffer(k) ) {
		console.log("key is not buffer")
		throw "key is not buffer"
	}
	const decipher = crypto.createDecipher('aes-256-cbc', k);
	let m;
	if (output_buffer) {
		m = Buffer.concat([decipher.update(c, 'hex'), decipher.final()]);
	} else {
		m = decipher.update(c, 'hex', 'utf8');
		m += decipher.final('utf8');
	}
	return m;
}

export function bip32_from_512bit(I) {
	let IL = I.slice(0, 32);
	let IR = I.slice(32);
	return bip32.fromPrivateKey(IL, IR);
}

export function hmac_sha512(key, msg) {
	return crypto.createHmac("sha512", key).update(msg).digest();
}

export function hmac_sha256(key, msg) {
	return crypto.createHmac("sha256", key).update(msg).digest();
}

export function get256bitDerivedPrivateKey(bits, path) {
	var masterNode = bip32_from_512bit(bits);
	var childNode = masterNode.derivePath(path);
	var key = hmac_sha256(childNode.chainCode, Buffer.concat([Buffer.alloc(1), childNode.privateKey]));
	return key;
}

export function get256bitDerivedPublicKey(bits, path) {
	var masterNode = bip32_from_512bit(bits);
	var childNode = masterNode.derivePath(path);
	var key = hmac_sha256(childNode.chainCode, childNode.publicKey);
	return key;
}

export function dkaes_encrypt(key, path, plainText) {
	var derivedKey = get256bitDerivedPrivateKey(key, path);
	return aes_encrypt(plainText, derivedKey);
}

export function dkaes_decrypt(key, path, cipherText, output_buffer=false) {
	var derivedKey = get256bitDerivedPrivateKey(key, path);
	return aes_decrypt(cipherText, derivedKey, output_buffer);
}

export function generate_random(a1, a2) {
    return secureRandom.randomBuffer(a1, a2);
}

// module.exports = {
// 	bip32, bip39, 
// 	hmac_sha256, hmac_sha512, 
// 	bip32_from_512bit, 
// 	get256bitDerivedPrivateKey, get256bitDerivedPublicKey,
// 	aes_encrypt, aes_decrypt, 
// 	ecaes_encrypt, ecaes_decrypt, 
// 	dkaes_encrypt, dkaes_decrypt,
// 	ecdsa_sign, ecdsa_verify,
// };
// module.exports.generate_random = secureRandom.randomBuffer;

// for(let i=1;i<15;i++){
//     let canvas = document.createElement('canvas');
//     let context = canvas.getContext('2d');
//     canvas.height = i*i*60;
//     canvas.width = i*i*60;

//     var grd=context.createLinearGradient(0,0,canvas.width,canvas.height);
//     grd.addColorStop(0,"black");
//     grd.addColorStop(0.3,"red");
//     grd.addColorStop(0.6,"green");
//     grd.addColorStop(1,"white");

//     context.fillStyle=grd;
//     context.fillRect(0,0,canvas.width,canvas.height);

//     let v = canvas.toDataURL("image/png")
// 	console.log("try",v.length)
// 	let en = aes_encrypt(v, "111111")
// 	let de = aes_decrypt(en, "111111")
// 	console.log(i,"ok!")
// }
