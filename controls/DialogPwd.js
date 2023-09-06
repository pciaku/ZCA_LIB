/*eslint linebreak-style: ["error", "unix"]*/
sap.ui.define([
	"sap/m/Dialog",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"com/knauf/ca/lib/utils/ModelUtils",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/MessageType",
	"sap/m/MessageBox"
], function(Dialog, JSONModel, ODataModel, ModelUtils, Controller, MessageType, MessageBox){
	"use strict";
	
	return Dialog.extend("com.knauf.ca.lib.controls.DialogPwd",{
		metadata : {
			properties : {
				"contentWidth": {
					type: "sap.ui.core.CSSSize",
					defaultValue: "auto"
				}
			},
			aggregations : {
				"sessionODataModels" : { type : "com.knauf.ca.lib.controls.SessionODataModel", multiple : true },
				"_dialog" : { type : "sap.m.Dialog", multiple : false, visibility : "hidden" }
			}
		},
		events : {},
		renderer : {},
		
		FRAGMENT_PATH : "com.knauf.ca.lib.view.fragment.DialogPwd",
		ODATA_LOGIN_PATH : "/login",
		ODATA_SYSINFO_PATH : "/readSysInfo",
		ODATA_PWD_SRV : "/sap/opu/odata/sap/ZHCM_PWD_PROT_SRV/",

		init : function(){
			this._oMessageManager = sap.ui.getCore().getMessageManager();
			
			var oDialog = sap.ui.xmlfragment(this.getId(), this.FRAGMENT_PATH, {
			   	onSend : this._send.bind(this),
			  	onCancel : this.close.bind(this)
			});
			oDialog.setBusyIndicatorDelay(500);
			this.setAggregation("_dialog", oDialog);
			this._setModels();	
		},
		open : function(){
			this._initFields();

			this.oWhenUserIsLogged = new Promise(function(resolve, reject){
				this.resolveUserIsLogged = resolve;
				this.rejectUsetIsLogged = reject;
			}.bind(this));
			
			this._readInfoData()
				.then(function(){
					this.getAggregation("_dialog").open();		
					this._registerEnterPress();
				}.bind(this));
			return this.oWhenUserIsLogged;
		},
		close : function(oEvent){
			this._oMessageManager.removeAllMessages();
			this._initFields();
			this.getAggregation("_dialog").close();
			this.rejectUsetIsLogged();
		},
		_setModels : function(){
			var oPwdModel = new ODataModel(this.ODATA_PWD_SRV, "pwd");
			oPwdModel.setDefaultBindingMode("TwoWay");
			oPwdModel.setUseBatch(false);
			this._registerSessionErrorHandler(oPwdModel);	
			this.getAggregation("_dialog")
				.setModel(oPwdModel, "pwd")
				.setModel(new JSONModel({
					pwd : "",
					contentWidth : "25%"
				}), "dialog")
				.setModel(this._oMessageManager.getMessageModel(), "messages")
				.setModel(new JSONModel({
					placeholder : ""
				}), "texts")
				.setModel(ModelUtils.getI18nModel(), "i18n");
		},
		_registerEnterPress : function(){
			var oDomPwd = document.getElementById(this.getId()+"--InputPwdId");
			var oProtBtn = sap.ui.getCore().byId(this.getId()+"--BtnProtectId");

			oDomPwd.addEventListener("keypress", function(oEvent){
				if (oEvent.key === 'Enter'){
					oProtBtn.firePress();
				}
			});
		},
		_registerSessionErrorHandler : function(oDataModel){
			var dfd = $.Deferred();
			
			oDataModel.attachRequestCompleted(function(oEvent){
				var oResp = oEvent.getParameter("response");
				var bSuccess = oEvent.getParameter("success");
				if (!bSuccess && oResp && oResp.statusCode >= "400"){
					var oRespText = JSON.parse(oResp.responseText);
					if ("error" in oRespText && "code" in oRespText.error && oRespText.error.code.split('/')[0] === "ZCA_PWD_PROT"){
						dfd.resolve(oRespText.error.message.value);
					}
				}
			}, this);	
			
			// oDataModel.attachRequestFailed(function(oEvent){
			// 	var sMsg = 
			// 		oEvent.getParameter("statusText") +
			// 		oEvent.getParameter("message") +
			// 		oEvent.getParameter("statusCode");
			// 	MessageBox.show(sMsg, sap.m.MessageBox.Icon.ERROR, "Error");
			// 		dfd.resolve();
			// }, this);
			return dfd.promise();
		},
		_send : function(){
			this.getAggregation("_dialog").getModel("pwd").setHeaders({ 
				"sap-pwd" : btoa(this.getAggregation("_dialog").getModel("dialog").getProperty("/pwd")),
				"sap-token" : "Request"
			});
			this.getAggregation("_dialog").setBusy(true);
			this._login();	
		},
		_login : function(oDataModel){
			var oDialog = this.getAggregation("_dialog"),
				oPwdModel = oDialog.getModel("pwd"),
				sessionPromises = [];
				
			oPwdModel.create(this.ODATA_LOGIN_PATH, {}, {
				success : function(oData){
					if ("Token" in oData && oData.Token !== null){
						for (var i=0; i<this.getAggregation("sessionODataModels").length; i++){
					 		var oSessionModel = this.getAggregation("sessionODataModels")[i].getModel();
					 		oSessionModel.setHeaders({ "sap-token" : oData.Token });
					 		sessionPromises.push(this._registerSessionErrorHandler(oSessionModel));
					 	}
						Promise.any(sessionPromises).then(function(oRespText){
							MessageBox.show(oRespText, MessageBox.Icon.ERROR, "Error");
						});
						this.resolveUserIsLogged({ session : oData || { Token : undefined, ValidTo : undefined } });
					}
					this._oMessageManager.removeAllMessages();
					this.getAggregation("_dialog").setBusy(false);
					oDialog.close();   
				}.bind(this),
				error : function(oError){
					var aMessages = oDialog.getModel("messages").getData();
					var aUniqueMessages = aMessages.filter(function(oMess, index){
					 		return aMessages.findIndex(function(item){ return item.getTarget() === oMess.getTarget() }) === index;
						}
					);
					this._oMessageManager.removeMessages(aUniqueMessages);
					this.getAggregation("_dialog").setBusy(false);
					this._initFields();
				}.bind(this)
			});
		},
		_readInfoData : function(oResourceBundle){
			var sysInfoDfd = $.Deferred(),
				oDialog = this.getAggregation("_dialog"),
				oPwdModel = oDialog.getModel("pwd");
			
			oPwdModel.read(this.ODATA_SYSINFO_PATH, {
				success : function(oData){
					if (oData.SysId && oData.UserName){
						oDialog.getModel("texts").setProperty("/placeholder", ModelUtils.getI18nText("dialogPwd.placeholder", [ oData.SysId, oData.UserName ]));
					}
					sysInfoDfd.resolve();
				}.bind(this),
				error : function(){
					oDialog.getModel("message").setProperty("/type", MessageType.Error);
					oDialog.getModel("message").setProperty("/message",  ModelUtils.getI18nText("mess.errorReadSysInfo"));
					sysInfoDfd.reject();
				}.bind(this)
			});
			return sysInfoDfd;
		},
		_initFields : function(){
			this.getAggregation("_dialog").getModel("dialog").setProperty("/pwd", "");
		}
	});
});