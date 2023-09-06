sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/library",
	"com/knauf/ca/lib/utils/ModelUtils"
], function(jQuery, library, ModelUtils){
	"use strict";
	
	sap.ui.getCore().initLibrary({
		name : "com.knauf.ca.lib",
		version : "1.0.0",
		dependencies : ["sap.ui.core", "sap.m"],
		types : [],
		interfaces : [],
		controls : [
			"com.knauf.ca.lib.controls.MessageStripContainer",
			"com.knauf.ca.lib.controls.DialogFileDownloadPwd"
		]
	});
	sap.ui.getCore().setModel(ModelUtils.getI18nModel(), "libI18n");
	
	return com.knauf.ca.lib;
}, false);