sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/MessageType",
	"com/knauf/ca/lib/utils/ModelUtils"
], function(JSONModel, MessageType, ModelUtils){
	
	return JSONModel.extend("com.knauf.hcm.forms.ZHCM_INCOME_TAX.model.XMLHttpModel", {
		read : function(sUri, sPwd, sTargetFilename, sToken){
			this._init(sTargetFilename);

			this.oWhenFileIsDownloaded = new Promise(function(resolve, reject){
				this.resolveFileIsDownloaded = resolve;
			 	this.rejectFileIsDownloaded = reject;
			}.bind(this));
			
			this.oRequest = new XMLHttpRequest();
			this.oRequest.open("GET", sUri, true);
			this.oRequest.responseType = "blob";
			this.oRequest.setRequestHeader("sap-pwd", btoa(sPwd));
			this.oRequest.setRequestHeader("sap-token", sToken);
			this.oRequest.onload = this._onFileLoad.bind(this); 
			this.oRequest.send();
			
			return this.oWhenFileIsDownloaded;
		},
		_init : function(sTargetFilename){
			this.setProperty("/filename", sTargetFilename);
			this.setProperty("/messages", {});
		},
		_onFileLoad : function(oEvent){
			if (oEvent.target.status === 200 && oEvent.target.response){
				var blobUrl = URL.createObjectURL(oEvent.target.response);
				var link = document.createElement("a");
				link.href = blobUrl;
				link.download = this.getProperty("/filename");
				document.body.appendChild(link);
				link.dispatchEvent(
					new MouseEvent("click", {
						buble : true,
						cancelable : true,
						view : window
					})
				);
				document.body.removeChild(link);
				this.resolveFileIsDownloaded();
			} else if (!oEvent.target.response){
				var messages = [];
				messages.push({
					type : MessageType.Error,
					description : ModelUtils.getI18nText("httpModel.noResponse")
				});
				this.setProperty("/messages", messages);
				this.rejectFileIsDownloaded();
			} else{
				var fileReader = new FileReader();
				fileReader.onloadend = this._onErrorXMLLoaded.bind(this);
				fileReader.readAsText(oEvent.target.response);
			}
		},
		_onErrorXMLLoaded : function(oEvent){
			var parser = new DOMParser();
			var doc = parser.parseFromString(oEvent.target.result, "application/xml");
			var	errorNode = doc.querySelector("parseerror");
			var messages = [];
					
			if (errorNode){
				messages.push({
					type : MessageType.Error,
					description : ModelUtils.getI18nText("httpModel.parseError")
				});
			} else {
				messages = this._parseXMLDocument(doc);
			}
			this.setProperty("/messages", messages);
			this.rejectFileIsDownloaded(messages);
		},
		_parseXMLDocument : function(doc){
			var messages = [];
			var MESSAGE_TYPE_MAPPING = Object.freeze({
					info: MessageType.Information,
					warning: MessageType.Warning,
					error: MessageType.Error
			});
			var lastError = doc.getElementsByTagName("error");
			if (lastError && lastError.length > 0){
				var innerErrors = doc.documentElement.getElementsByTagName("innererror");
				if (innerErrors && innerErrors.length > 0){
					var errors = innerErrors[0].getElementsByTagName("errordetail");
				}
			}
			
			if (!errors || errors.length === 0){
				messages.push({
					//title : lastError.getElementsByTagName("code")[0].childNodes[0].nodeValue,
					type : MessageType.Error,
					description : lastError[0].getElementsByTagName("message")[0].childNodes[0].nodeValue
				});
			} else{
				Array.from(errors).forEach(function(error){
					var severity = error.getElementsByTagName("severity")[0].childNodes[0].nodeValue;
					messages.push({
					//	title : error.getElementsByTagName("code")[0].childNodes[0].nodeValue,
						type : MESSAGE_TYPE_MAPPING[severity],
						description : error.getElementsByTagName("message")[0].childNodes[0].nodeValue
					});
				});
			}
			return messages;
		}
	});
});