import aesjs from 'aes-js'
import FormData from 'form-data';
import jsPDF from "jspdf" 
import pdfjsLib from "pdfjs-dist"
import { Base64 } from 'js-base64'
import CancelablePromise from 'cancelable-promise';
import html2canvas from "html2canvas"
import { sha256 } from 'js-sha256'
import md5 from 'md5'
import fs from "../web/filesystem"

// window.Promise = global.Promise = CancelablePromise;

window.CONST = {
    SERVICE_TYPE: {
        E_CONTRACT: 0,
        LEGAL_ADVICE: 1,
    },
    ACCOUNT_TYPE: {
    	PERSONAL: 0,
    	CORP_MASTER: 1,
    	CORP_SUB: 2,
    	EXPERT: 3,
    },
    CONTRACT_LOG: {
        CREATE: 1,
        READ: 2,
        MODIFY: 3,
        CHANGE_SIGN_INFO: 4,
        CHANGE_SIGN: 5,
        GIVE_MODIFY: 6,
    },
    NO_REGISTER_USER_CORP_ID: -1,
    PERSONAL_CORP_ID: -1000,
    DUMMY_CORP_ID: 0,
    DUMMY_GROUP_ID: 0,
    DUMMY_CONTRACT_ID: 0,
    SUBSCRIPTION_PLAN_TYPE: {
        ONETIME: 1,
        MONTHLY: 2,
        YEARLY: 3,
        MEMBER: 4,
    },
    PAYMENT_LOG_TYPE: {
        YEARLY_COMMITMENT: 1,
        YEARLY_PAYMENT_REGULAR: 2,
        YEARLY_PAYMENT_UPGRADE: 3,
        YEARLY_DISTRIBUTE_TICKET: 4,
        MONTHLY_PAYMENT_AND_DISTRIBUTE: 5,
        ONETIME_PAYMENT_AND_DISTRIBUTE: 6,
        PROMOTION_DISTRIBUTE_TICKET: 7,
        MEMBER_PAYMENT_REGULAR: 8,
        MEMBER_PAYMENT_UPGRADE: 9,
        PROMOTION_MEMBER: 10,
    },
    PAYMENT_LOG_STATUS: {
        PENDING:0,
        SUCCESS:1,
        TERMINATE:2,
        REFUND:3,
    },
    APPROVAL_STATUS: {
        DRAFT:0,
        ING_APPROVAL:1,
        COMPLETED:2,
        REJECTED:3,
    },
    MEMBER_PRICE: 2000,
    MEMBER_FREE_COUNT: 1,
    VAT_RATE : 1.1,

	IMP_USER_CODE: "imp80774794",
	FIRST_PURCHASE : "first_purchase",
	FROALA: {
        key:"sD1H2B1D2lA6F6E5E3A1E3C10A3A5F6gxhwkeC5kl==",
        language:"ko",
        height:"100%",
        heightMax:"100%",
        charCounterCount: false,
        toolbarSticky: false,

        fontFamily: {
            "'Nanum Gothic',sans-serif":'나눔 고딕',
            'Arial,Helvetica,sans-serif': 'Arial',
            'Georgia,serif': 'Georgia',
            'Impact,Charcoal,sans-serif': 'Impact',
            'Tahoma,Geneva,sans-serif': 'Tahoma',
            "'Times New Roman',Times,serif": 'Times New Roman',
            'Verdana,Geneva,sans-serif': 'Verdana'
        },

        toolbarButtons:['paragraphFormat', 'fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'strikeThrough', '|',
            'color', 'align', 'outdent', 'indent', 'formatOL', 'formatUL', 'lineHeight', '|',
            'subscript', 'superscript', 'quote', 'paragraphStyle', '-',
            /*'insertLink', */'insertImage', 'insertTable', '|',
            'specialCharacters', 'insertHR', 'selectAll', 'clearFormatting', '|',
            'print', /*'getPDF', */'spellChecker', 'help', '|', 'undo', 'redo', 'check'],

	}

}


global.Buffer = require('buffer').Buffer;
global.process = require('process');

//no use this HOST
const HOST = "";
// const HOST = "test.firma-solutions.com"
// const HOST = "127.0.0.1:9999"

if (typeof btoa === 'undefined') {
	global.btoa = function (str) {
		return new Buffer(str, 'binary').toString('base64');
	};
}

if (typeof atob === 'undefined') {
	global.atob = function (b64Encoded) {
		return new Buffer(b64Encoded, 'base64').toString('binary');
	};
}

Number.prototype.number_format = function(){
	return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
String.prototype.number_format = function(){
	return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
Array.prototype.shuffle = function() {
	let currentIndex = this.length, temporaryValue, randomIndex;

	while (0 !== currentIndex) {

		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		temporaryValue = this[currentIndex];
		this[currentIndex] = this[randomIndex];
		this[randomIndex] = temporaryValue;
	}
	return this;
}


export const byte2fct = function(byte){
	if(byte == null || byte == undefined)
		return 0
	return Number( ((byte / 1024 / 1024) / 3).toFixed(2) )
}

export const request = async function(path,method="GET",body=null){
	let resp = await fetch(`http://${HOST}${path}`,{
		method: method,
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body:body ? JSON.stringify(body) : null
	})
	let raw = await resp.text()
	try{
		return JSON.parse(raw)
	}catch(err){
	}
	return raw
}

export const encrypt_with_pin = function(raw, p){
	let pin = `${p}`
	let key_256 = new Uint8Array([
		pin[0], pin[1], pin[2], pin[3], 
		pin[1], pin[2], pin[3], pin[4], 
		pin[2], pin[3], pin[4], pin[5], 
		pin[3], pin[4], pin[5], pin[4], 
		pin[4], pin[5], pin[4], pin[3], 
		pin[5], pin[4], pin[3], pin[2], 
		pin[4], pin[3], pin[2], pin[1], 
		pin[3], pin[2], pin[1], pin[0]
		]);
	let base64 = btoa(unescape(encodeURIComponent( raw )));
	let textBytes = aesjs.utils.utf8.toBytes(base64);

	let aesCtr = new aesjs.ModeOfOperation.ctr(key_256, new aesjs.Counter(5));
	let encrypted = aesCtr.encrypt(textBytes);

	return aesjs.utils.hex.fromBytes(encrypted)
}

export const decrypt_with_pin = function(raw, p){
	let pin = `${p}`
	let key_256 = new Uint8Array([
		pin[0], pin[1], pin[2], pin[3], 
		pin[1], pin[2], pin[3], pin[4], 
		pin[2], pin[3], pin[4], pin[5], 
		pin[3], pin[4], pin[5], pin[4], 
		pin[4], pin[5], pin[4], pin[3], 
		pin[5], pin[4], pin[3], pin[2], 
		pin[4], pin[3], pin[2], pin[1], 
		pin[3], pin[2], pin[1], pin[0]
		]);

	let textBytes = aesjs.utils.hex.toBytes(raw);

	let aesCtr = new aesjs.ModeOfOperation.ctr(key_256, new aesjs.Counter(5));
	let encrypted = aesCtr.decrypt(textBytes);

	let base64 = aesjs.utils.utf8.fromBytes(encrypted)
	return decodeURIComponent(escape(atob( base64 )));
}
window.email_regex = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
window.SEPERATOR = "!-!-!-!-!"

window.create_customer_uid = function(user_info) {
	let user_code = "user_";
	if(user_info.account_type == 0) {
		user_code += "personal_" + user_info.account_id
	} else {
		user_code += "corp_" + user_info.corp_id
	}
	return user_code+"_"+Math.floor(new Date().getTime() / 1000)
}
window.phoneFomatter = function(num) {

	var formatNum = '';
	if(num.length==11){
		formatNum = num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
	} else if(num.length==8) {
		formatNum = num.replace(/(\d{4})(\d{4})/, '$1-$2');
	} else {
		if(num.indexOf('02')==0) {
			formatNum = num.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
		} else {
			formatNum = num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
		}
	}
	return formatNum;
}

window.ipfs_upload = async function (buf){
	const form = new FormData();
	form.append('file', buf);
	let resp = await global.fetch("https://ipfs.infura.io:5001/api/v0/add",{
		method: 'POST',
		body:form
	})

	let raw = await resp.text()
	try{
		return JSON.parse(raw)
	}catch(err){
	}
	return raw
}

window.ipfs_download = async function (hash){
	let resp = await global.fetch(`https://ipfs.infura.io:5001/api/v0/cat?arg=${hash}`,{
		method: 'GET'
	})

	let raw = await resp.text()
	try{
		return JSON.parse(raw)
	}catch(err){
	}
	return raw
}

window.setCookie = function(name,value,days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days*24*60*60*1000));
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
window.getCookie = function(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}
window.eraseCookie = function(name) {   
	document.cookie = name+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';  
}
window.deleteAllCookies = function() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

window.getImageBase64Uri = function (img) {
	var canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;

	var ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, img.width, img.height);

	var dataURL = canvas.toDataURL("image/png");

	return dataURL;
}

window.clone_object = function (obj) {
	if (obj === null || typeof(obj) !== 'object')
		return obj;

	var copy = obj.constructor();

	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) {
			copy[attr] = window.clone_object(obj[attr]);
		}
	}

	return copy;
}
window.html2Doc = function (element, filename = ''){
	let preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
	let postHtml = "</body></html>";
	let html = preHtml+element.innerHTML+postHtml;

	let blob = new Blob(['\ufeff', html], {
		type: 'application/msword'
	});

	// Specify link url
	let url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
	
	// Specify file name
	filename = filename?filename+'.doc':'document.doc';
	
	// Create download link element
	let downloadLink = document.createElement("a");

	document.body.appendChild(downloadLink);
	
	if(navigator.msSaveOrOpenBlob ){
		navigator.msSaveOrOpenBlob(blob, filename);
	}else{
			// Create a link to the file
		downloadLink.href = url;
		
		// Setting the file name
		downloadLink.download = filename;
		
		//triggering the function
		downloadLink.click();
	}

	document.body.removeChild(downloadLink);
}

function getImg(src){
	return new Promise(r=>{
		let img = document.createElement("img")
		img.src = src
		img.onload = function(){
			r(img)
		}
	})
}

var agent = navigator.userAgent.toLowerCase();
if((navigator.appName == 'Netscape' && agent.indexOf('trident') != -1) || (agent.indexOf("msie") != -1))
	window.isIE = true;
else
	window.isIE = false;

window.logout = async function() {
	window.eraseCookie("session")
	window.eraseCookie("session_update")

	localStorage.removeItem("user_id");
	localStorage.removeItem("entropy");
	let keys = Object.keys(sessionStorage);
	for (let i = 0; i < keys.length; i++) {
		sessionStorage.removeItem(keys[i]);
	}
	keys = Object.keys(localStorage);
	for (let i = 0; i < keys.length; i++) {
		localStorage.removeItem(keys[i]);
	}
}
window.legal_logout = async function() {
	window.eraseCookie("legal_session")
	window.eraseCookie("legal_session_update")

	localStorage.removeItem("user_id");
	localStorage.removeItem("entropy");
	let keys = Object.keys(sessionStorage);
	for (let i = 0; i < keys.length; i++) {
		sessionStorage.removeItem(keys[i]);
	}
	keys = Object.keys(localStorage);
	for (let i = 0; i < keys.length; i++) {
		localStorage.removeItem(keys[i]);
	}
}

window.toPdf = async function(file){
	let data = new FormData();
	data.append('file', file)

	let resp = await fetch(`https://convert.e-contract.io/convert`,{
		method:"POST",
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
			'Accept': 'application/json',
		},
		body:data
	})

	let v = await resp.arrayBuffer()
	return v
}

window.pdf2png = async function(pdf){
	let imgs = []
	for(let i=1; i <= pdf.numPages;i++){
		let page = await pdf.getPage(i)
		let viewport = page.getViewport(1.5);

		let canvas = document.createElement('canvas');
		let context = canvas.getContext('2d');
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		let renderContext = {
			canvasContext: context,
			viewport: viewport
		};

		await page.render(renderContext);
		let v = canvas.toDataURL("image/png")
		imgs.push(v);
	}

	return imgs
}

window.pdf = {
	gen:async function(imgs, saveAs = false){
		let name = "_"+md5(JSON.stringify(imgs))
		try{
			if(saveAs == false){
				let ret = await fs.readAsArrayBuffer(name);
				if( ret && ret.byteLength > 0){
					return ret;
				}
			}
		}catch(err){
		}

		let pdfs = []

		for(let i in imgs){
			let div = document.createElement("div")
			div.style.width=800;
			div.style.display="inline-block";
			div.style.position="fixed";
			div.style.left=1000000;
			div.style.top=1000000;

			document.body.append(div)

			let img = document.createElement("img")
			img.src = imgs[i].img
			img.width=800;
			div.appendChild(img)

			let objects = imgs[i].objects
			for(let o of objects){
				let element = null 
				if(o.type == "img"){
					let img = element = document.createElement("img")
					img.src = o.data
				}
				if(o.type == "text"){
					let text = element = document.createElement("div")
					text.innerText = o.text
				}

				if(element == null)
					continue;

				element.width=o.width;
				element.height=o.height;
				element.style.left=o.x;
				element.style.top=o.y;
				element.style.position="absolute";
				div.appendChild(element)
			}

			let canvas = await html2canvas(div)
			pdfs.push({img:canvas.toDataURL("png")})
			div.remove();
		}

		let fileId = md5(JSON.stringify(pdfs));
		let creatationDate = new Date(1540977124241);

		let byte = await window.pdf.make( fileId, creatationDate, pdfs, saveAs );
		try{
			await fs.writeAsBinary(name,byte);
		}catch(err){
		}

		return byte
	},
	make:function(fileId, creatationDate, imgs, saveAs){
		return new Promise(async(r)=>{

			let width = 0;
			let height = 0;
			for(let info of imgs){
				let img = info.i = await getImg(info.img);
				width = width > img.width ? width : img.width
				height = height > img.height ? height : img.height
			}

			let doc = new jsPDF("p","px",[width,height],true)
			doc.deletePage(1)
			for(let info of imgs){
				doc.addPage(width, height)
				doc.setFontSize( 40 )
				doc.setDrawColor( 0 )
				doc.setFillColor( 255, 255, 255 )
				doc.rect( 0, 0, width,  height, 'F' )
				doc.addImage( info.img, "png", 0, 0, info.i.width, info.i.height, undefined, "FAST" )
			}

			doc.setCreationDate(creatationDate)
			doc.setFileId(fileId.toUpperCase())

			if(saveAs){
				doc.save(fileId+".pdf")
			}

			r(doc.output("arraybuffer"))
		})
	}
}

if(window.getCookie("LANGUAGE") != null) {
	global.LANG = window.getCookie("LANGUAGE");
}
else {
	global.LANG = "KR"
	window.setCookie("LANGUAGE", "KR")
}

window.isMobile = function() {
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
};

(function($) {    
  if ($.fn.style) {
    return;
  }

  // Escape regex chars with \
  var escape = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  // For those who need them (< IE 9), add support for CSS functions
  var isStyleFuncSupported = !!CSSStyleDeclaration.prototype.getPropertyValue;
  if (!isStyleFuncSupported) {
    CSSStyleDeclaration.prototype.getPropertyValue = function(a) {
      return this.getAttribute(a);
    };
    CSSStyleDeclaration.prototype.setProperty = function(styleName, value, priority) {
      this.setAttribute(styleName, value);
      var priority = typeof priority != 'undefined' ? priority : '';
      if (priority != '') {
        // Add priority manually
        var rule = new RegExp(escape(styleName) + '\\s*:\\s*' + escape(value) +
            '(\\s*;)?', 'gmi');
        this.cssText =
            this.cssText.replace(rule, styleName + ': ' + value + ' !' + priority + ';');
      }
    };
    CSSStyleDeclaration.prototype.removeProperty = function(a) {
      return this.removeAttribute(a);
    };
    CSSStyleDeclaration.prototype.getPropertyPriority = function(styleName) {
      var rule = new RegExp(escape(styleName) + '\\s*:\\s*[^\\s]*\\s*!important(\\s*;)?',
          'gmi');
      return rule.test(this.cssText) ? 'important' : '';
    }
  }

  // The style function
  $.fn.style = function(styleName, value, priority) {
    // DOM node
    var node = this.get(0);
    // Ensure we have a DOM node
    if (typeof node == 'undefined') {
      return this;
    }
    // CSSStyleDeclaration
    var style = this.get(0).style;
    // Getter/Setter
    if (typeof styleName != 'undefined') {
      if (typeof value != 'undefined') {
        // Set style property
        priority = typeof priority != 'undefined' ? priority : '';
        style.setProperty(styleName, value, priority);
        return this;
      } else {
        // Get style property
        return style.getPropertyValue(styleName);
      }
    } else {
      // Get CSSStyleDeclaration
      return style;
    }
  };
})(jQuery);
