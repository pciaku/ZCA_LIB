/*eslint linebreak-style: ["error", "unix"]*/
sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/model/json/JSONModel",
	"com/knauf/ca/lib/model/HttpFileModel",
	"com/knauf/ca/lib/utils/ModelUtils"
], function(Control, JSONModel, HttpFileModel, ModelUtils) {
	"use strict";

	return Control.extend("com.knauf.hcm.forms.ZHCM_INCOME_TAX.control.DialogFileDownloadPwd", {
		metadata: {
			properties: {
				"filename": {
					type: "string",
					defaultValue: "statement"
				},
				"uri": {
					type: "string"
				},
				"token": {
					type: "string"
				},
				"contentWidth": {
					type: "sap.ui.core.CSSSize",
					defaultValue: "auto"
				}
			},
			aggregations: {
				"_dialog": {
					type: "sap.m.Dialog",
					multiple: false,
					visibility: "hidden"
				}
			}
		},
		renderer: {},

		init: function() {
			this._oMessageManager = sap.ui.getCore().getMessageManager();

			var oDialog = sap.ui.xmlfragment(this.getId(), "com.knauf.ca.lib.view.fragment.DialogFileDownloadPwd", {
				onPasswordChange: function(oEvent) {
					this._validatePwd(oEvent);
				}.bind(this),
				onPasswordProtect: this._onPasswordProtect.bind(this),
				onCancel: this.close.bind(this)
			});
			oDialog.setBusyIndicatorDelay(500);
			this.setAggregation("_dialog", oDialog);
			this._setModels();
		},
		open: function() {
			this._initFields();
			this.getAggregation("_dialog").open();
			this._registerEnterPress();
		},
		close: function(oEvent) {
			this._oMessageManager.removeAllMessages();
			this._initFields();
			this.getAggregation("_dialog").close();
		},
		_registerEnterPress: function() {
			var oDomPwd = document.getElementById(this.getId() + "--InputPwdId");
			oDomPwd.addEventListener("keypress", function(oEvent) {
				if (oEvent.key === 'Enter') {
					this.oProtBtn.firePress();
				}
			}.bind(this));
		},
		_setModels: function() {
			var oDialog = this.getAggregation("_dialog");
			oDialog
				.setModel(new JSONModel({
					pwd: "",
					contentWidth: ""
				}))
				.setModel(ModelUtils.getI18nModel(), "i18n")
				.setModel(new HttpFileModel(), "messages");
		},
		_getModel: function(sModelName) {
			return this.getAggregation("_dialog").getModel(sModelName);
		},
		_onPasswordProtect: function() {
			if (globalThis.flag === true) {
				this.getAggregation("_dialog").setBusy(true);
				this.getAggregation("_dialog").getModel("messages")
					.read(this.getProperty("uri"), this._getModel().getProperty("/pwd"), this.getProperty("filename"), this.getProperty("token"))
					.then(
						() => {
							this.getAggregation("_dialog").setBusy(false);
							this.close();
						}, () => {
							this.getAggregation("_dialog").setBusy(false);
							this._initFields();
						});
			}
		},
		_initFields: function() {
			var strongRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.*\W)(?!.* ).{8,20}$/;
			this._getModel().setProperty("/pwd", "");
			this._getModel().setProperty("/contentWidth", this.getProperty("contentWidth"));
			this.oProtBtn = sap.ui.getCore().byId(this.getId() + "--BtnProtectId");
			this.oPwd = sap.ui.getCore().byId(this.getId() + "--InputPwdId");
			this.oPwd
				.setValueState(sap.ui.core.ValueState.None)
				.setValueStateText()
				.setValue("");
		},
		_validatePwd: function(oEvent) {
			//return;
			this.oProtBtn.setEnabled(false);
			var pass = oEvent.getParameter("value");
			var errText;
			//	var strongRegex = new RegExp("^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$^*_-+=[]{}:|,.])[A-Za-z\d@$^*_-+=[]{}:|,..]{1,20}$");
			var strongRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.*\W)(?!.* ).{8,20}$/;
			if (pass.length < 8) {
				errText = ModelUtils.getI18nText("dialogFileDownloadPwd.lenError");
				this.oPwd
					.setValueState(sap.ui.core.ValueState.Error)
					.setValueStateText(errText);
				//throw new Error(errText);
				globalThis.flag = false;
				return;
			}
			if (!strongRegex.test(pass)) {
				errText = ModelUtils.getI18nText("dialogFileDownloadPwd.passError");
				this.oPwd.setValueState(sap.ui.core.ValueState.Error)
					.setValueStateText(errText);
				//throw new Error(errText);
				globalThis.flag = false;
				return;
			}
			globalThis.flag = true;
			this.oPwd
				.setValueState(sap.ui.core.ValueState.None)
				.setValueStateText();
			this.oProtBtn.setEnabled(true);
		}
	});
});