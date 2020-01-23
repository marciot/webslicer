var SlicerOps = SlicerOps || new Object;

function SlicerEngine() {
	// Private:
	var that                  = this;	
	var geometry;
	
	var nozzleSize            = 0.4;
	var layerHeight           = 0.1;
	var shellThickness        = 1.2;
	var topBotThickness       = 1.2;
	var initialLayerThickness = 0.2;
	var fillDensity           = 0.5;
	
	function infillDensityToSpacing(nozzleSize, density) {
		/* The following equation comes from solving for spacing the
		 * following equation:
		 *
		 *    (spacing - nozzleSize)^2
		 *    ------------------------   =  1 - density
		 *            spacing^2
		 *
		 * When all variables are positive (solved using
		 * WolframAlpha)
		 */
		var n  = nozzleSize, n2 = nozzleSize*nozzleSize;
		var d  = density,    d2 = density*density;
		return n/d + Math.sqrt((n2-d*n2)/d2);
	}
	
	function getSlice(z) {
		var scale = 1000;
		
		var meshSlicer = new MeshSlicer(geometry);
		var paths      = meshSlicer.getSlice(z, scale);
		if(!paths.isSane) {
			return {sane: false};
		}
		
		var infillSpacing = infillDensityToSpacing(nozzleSize, fillDensity);		
		var infillMethod  = new SlantedInfill(geometry.boundingBox, infillSpacing);
		
		var cPerimeter    = paths.openContours;
		var cOuterShell   = cPerimeter.inset(nozzleSize/2);
		var cFillRegion   = cOuterShell;
		var cInnerShells  = new ClipperPaths([], cOuterShell.scalingFactor);
		var nShells       = Math.floor(shellThickness/nozzleSize);
		for(var i = 1; i <= nShells; i++) {
			cFillRegion   = cOuterShell.inset(nozzleSize*i);
			cInnerShells.append(cFillRegion);
		}
		var cInfill       = cFillRegion.infill(infillMethod);

		return {
			z:           z,
			sane:        paths.isSane,
			outer_shell: cOuterShell.paths,
			inner_shell: cInnerShells.paths,
			infill:      cInfill.paths
		};
	}
	
	function prepareGeometry() {
		geometry.mergeVertices(); // Necessary for extracting closed paths
		geometry.computeFaceNormals();
		geometry.computeBoundingBox();
	}
	
	// Privileged:
	this.setGeometry = function(g) {
		geometry = g;
	}
	
	this.getSlices = function(layerHeight) {
		var layerHeight = layerHeight || 0.1;
		/*prepareGeometry();
		var slices = [];
		slices.push(getSlice(12));
		return slices;*/
		
		prepareGeometry();
		
		// Slice the model
		var slices = [];
		for( var z = geometry.boundingBox.min.z; z <= geometry.boundingBox.max.z; z += layerHeight) {
			var slice = getSlice(z);
			if(!slice.sane) {
				console.log("Skipping invalid slice: ", slice.z);
				continue;
			}
			slices.push(slice);
		}
		return slices;
	}
}