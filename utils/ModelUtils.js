sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/resource/ResourceModel"
], function(BaseObject, ResourceModel){
	"use strict";
	
	var ModelUtils = BaseObject.extend("com.knauf.ca.lib.utils.ModelUtils", {});
	
	resourceModel : undefined,
	
	ModelUtils.getI18nModel = function(){
		if (!this.resourceModel){
			this.resourceModel = new ResourceModel({ 
				bundleName: "com.knauf.ca.lib.i18n.i18n" 
			});
		}
		return this.resourceModel;
	};
	
	ModelUtils.getI18nText = function(sTextId){
		return this.getI18nModel().getResourceBundle().getText(sTextId, arguments[1]);
	};
	
	return ModelUtils;
});