sap.ui.define([
	"sap/ui/core/Renderer"
],function(Renderer){
	"use strict";
	
	var MessageRenderer = Renderer.extend("com.knauf.ca.lib.controls.MessageStripContainerRenderer");
	MessageRenderer.apiVersion = 2;
	MessageRenderer.render = function(oRm, oControl){
		var aItems = oControl.getItems();
		
		oRm.openStart("div", oControl);
		oRm.style("margin", "10x 10px");
		oRm.openEnd();
		oRm.openStart("table");
		oRm.style("width", "95%");
		oRm.style("margin-top", "10px");
		oRm.attr("align", "center");
		oRm.openEnd();
		for (var i=0; i < aItems.length; i++){
			oRm.openStart("tr");
			oRm.openEnd();
			oRm.openStart("td");
			oRm.openEnd();
			aItems[i].getRenderer().render(oRm, aItems[i]);
			oRm.close("td");
			oRm.close("tr");
		}
		oRm.close("table");
	};
	return MessageRenderer;
});