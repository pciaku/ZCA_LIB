sap.ui.define([
	"sap/ui/core/Element"
], function(Element){
	
	return Element.extend("com.knauf.ca.lib.controls.SessionODataModel", {
		metadata : {
			properties : {
				model : "sap.ui.model.odata.v2.ODataModel"
			}
		}
	});
});