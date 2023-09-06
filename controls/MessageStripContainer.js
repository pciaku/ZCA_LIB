sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	'use strict';

	return Control.extend("com.knauf.ca.lib.controls.MessageStripContainer", {
		metadata: {
			aggregations: {
				"items": {
					type: "sap.m.MessageStrip",
					multiple: true,
					singularName: "item"
				}
			},
			defaultAggregation: "items"
		},
		renderer : "com.knauf.ca.lib.controls.MessageStripContainerRenderer"
	});
});