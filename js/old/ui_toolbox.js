/**
 * WebSlicer
 * Copyright (C) 2016 Marcio Teixeira
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
var toolbox;

function ToolboxUI(elementId) {
	var ui = document.getElementById(elementId);
	var menu;
	var target_dom;
	var that = this;
	
	var dom_target;
	
	var getters = {};
	
	// Add the drop down menu
	menu          = document.createElement("select");
	menu.id       = "toolboxSelect";
	menu.onchange = function() {
		that.gotoPage(menu.value);
	};
	
	ui.appendChild(menu);
	
	var el      = document.createElement("hr");
	ui.appendChild(el);
	
	// private:
	
	function addTag(parent, type, id, text, className) {
		var el      = document.createElement(type);
		if(id) {
			el.id    = id;
		}
		if(text) {
			el.innerHTML = text;
		}
		if(className) {
			el.className = className;
		}
		parent.appendChild(el);
		return el;
	}
	
	// privileged:
	
	this.page  = function (id, menuText) {
		// Add a choice to the drop-down menu, unless menuText
		// is undefined, in which case this is a hidden page
		if(menuText) {
			addTag(menu, "option", null, menuText).value = id;
		}
		// Create the page itself and make it the target of future DOM insertions.
		target_dom = addTag(ui, "div", id, null, "toolbox-panel");
	}
	
	this.parameter = function(id, description, default_value) {
		if(typeof default_value === 'boolean') {
			return this.choice(id, description)
			    .option("true", "yes")
				.option("false", "no");
		}
		var container = addTag(target_dom, "div", null, null, "parameter");
		addTag(container, "label",  null, description);
		var el = addTag(container, "input", id);
		if(typeof default_value === "number") {
			el.type = "number";
			getters[id] = function() {return parseFloat(document.getElementById(id).value);}
		} else {
			el.type = "text";
			getters[id] = function() {return document.getElementById(id).value};
		}
		el.value = default_value.toString();
	}
	
	this.choice = function(id, description) {
		var container = addTag(target_dom, "div", null, null, "parameter");
		if(description) {
			addTag(container, "label",  null, description);
		} else {
			addTag(container, "label").innerHTML = "&nbsp;";
		}
		var el = addTag(container, "select", id);
		return {
			option: function(id, text) {
				var o = addTag(el, "option", null, text);
				o.value = id;
				return this;
			}
		}
		getters[id] = function() {return document.getElementById(id).value;}
	}
	
	this.heading = function(text) {
		addTag(target_dom, "h1", null, text);
	}
	
	this.separator = function(type) {
		addTag(target_dom, type || "hr");
	}
	
	this.button = function(func, label, className) {
		addTag(target_dom, "button", null, label, className).onclick = func;
	}
	
	this.buttonHelp = function(text) {
		addTag(target_dom, "div", null, text, "button-label");
	}
	
	this.textarea = function(id) {
		var container = addTag(target_dom, "div", null, null, "parameter");
		return addTag(container, "textarea", id);
	}
	
	this.div = function(id) {
		if(typeof id === 'string' || id instanceof String) {
			addTag(target_dom, "div", id);
		} else {
			target_dom.appendChild(id);
		}
	}
	
	this.element = function(idOrElement) {
		if(typeof idOrElement === 'string' || idOrElement instanceof String) {
			target_dom.appendChild(document.getElementById(idOrElement));
		} else {
			target_dom.appendChild(idOrElement);
		}
	}
	
	this.file = function(id, binary) {
		var container = addTag(target_dom, "div", null, null, "parameter drop-box empty");
		var el = addTag(container, "input", id);
		el.type = "file";
				
		// Drop area
		var da   = addTag(container, "div", null, null, "drop-area");
		addTag(da,        "div", null, "Drop file here");
		
		// Selected file & reset button
		var sf = addTag(container, "div", null, null, "selected-file");
		var selectedFile = addTag(sf, "span");
		addTag(sf, "div", null, "&#x2716;", "reset")
			.onclick = function() {
				container.className = "parameter drop-box empty";
			}
		
		var progress = addTag(da, "progress");
		
		var fileContents = null;
		
		getters[id] = function() {
			return fileContents;
		}
		
		function readSingleFile(evt) {
			evt.stopPropagation();
			evt.preventDefault();
			
			progress.style.visibility = "visible";
			
			var f = ('dataTransfer' in evt) ? (evt.dataTransfer.files[0]) : (evt.target.files[0]);
			if (f) {
				var r = new FileReader();
				r.onload = function(e) {
					container.className = "parameter drop-box full";
					progress.style.visibility = "hidden";
					
					selectedFile.innerHTML = f.name;
					fileContents = e.target.result;
				}
				r.onprogress = function(e) {
					if (e.lengthComputable) {
						progress.max   = e.total;
						progress.value = e.loaded;
					}
				}
				if(binary) {
					r.readAsArrayBuffer(f);
				} else {
					r.readAsText(f);
				}
			}
		}
		
		el.addEventListener('change', readSingleFile, false);
				 
		function handleDragOver(evt) {
			evt.stopPropagation();
			evt.preventDefault();
			evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
		}
		da.addEventListener('dragover', handleDragOver, false);
		da.addEventListener('drop',     readSingleFile, false);
	}
	
	this.done = function() {
		menu.onchange();
	}
	
	this.gotoPage = function(page) {
		$(".toolbox-panel").each(
			function() {
				var id = $(this).attr('id');
				if( id === page ) {
					$("#"+id).show();
				} else {
					$("#"+id).hide();
				}
			});
	}
	
	this.setAppendTarget = function(element) {
		target_dom = element;
	}
	
	this.get = function(option) {
		if(getters.hasOwnProperty(option)) {
			return getters[option]();
		} else {
			alert(option + "undefined");
			return null;
		}
	}
	
	this.exists = function(option) {
		return getters.hasOwnProperty(option);
	}
}

function toolboxInit() {
	var t = new ToolboxUI("toolbox");
	
	t.page(          "toolbox-design",  "Placement Menu");	
	t.choice(         "programSelect",  "");
	t.div(           "program-params");
	t.separator(     "br");
	t.button(            onRunProgram,  "Add to Platform");
	t.button(          "clear-platform","Clear Platform");
	
	t.page(          "toolbox-machine", "Machine Preferences");
	t.heading(                          "Load Preset:");
	t.choice(    "machinePresetSelect", "")
	 .option(         "deltaprintr-ks", "Deltaprintr Kickstarter Edition");
	t.heading(                          "Machine:");
	t.parameter(   "printerNozzleSize", "Nozzle (mm)",   0.4);
	t.heading(                          "Build area:");
	t.choice(    "platformStyleSelect", "Shape")
	 .option(            "rectangular", "Rectangular")
	 .option(            "circular",    "Circular");
	t.parameter(     "printerMaxWidth", "Maximum width (mm)",  300);
	t.parameter(     "printerMaxDepth", "Maximum depth (mm)",  300);
	t.parameter(    "printerMaxHeight", "Maximum height (mm)", 300);
	t.heading(                          "Start/End Gcode:");
	t.choice(          "editGcodeMenu", "Edit gcode template")
	 .option(                   "none", "...")
	 .option(            "start-gcode", "start")
	 .option(              "end-gcode", "end");
	
	t.page(              "start-gcode");
	t.heading(                          "Start GCode template:");
	t.textarea(           "startGcode");
	t.button(         doneEditingGcode, "Done");
	
	t.page(                "end-gcode");
	t.heading(                          "End GCode template:");
	t.textarea(             "endGcode");
	t.button(         doneEditingGcode, "Done");
	
	t.page(            "toolbox-print", "Print Menu");
	t.heading(                          "Quality:");
	t.parameter("bottomLayerThickness", "Bottom layer thickness (mm)",  0.2);
	t.heading(                          "Speed and Temperature:");
	t.parameter(    "printTemperature", "Printing temperature (C)",     200);
	t.parameter(          "printSpeed", "Print speed (mm/s)",           50);
	t.parameter(         "travelSpeed", "Travel speed (mm/s)",          70);
	t.heading(                          "Filament:");
	t.parameter(    "filamentDiameter", "Diameter (mm)",                1.4);
	t.parameter(        "filamentFlow", "Flow (%)",                     100);
	t.separator();
	t.button(              onSaveGcode, "Save gcode", "ninja");
	t.buttonHelp("Click this button to save .gcode you<br>can then send to your 3D printer.");
	
	t.page(             "toolbox-help", "Help");
	t.heading(                          "View Controls:");
	t.element(                          "viewport-help");
	
	t.done();

	toolbox = t;
	
	// Set the callbacks
	
	document.getElementById("editGcodeMenu").onchange = onEditGcodeSelect;
	
	// Populate the available programs in the programs menu
	$('script[type="text\/x-import-program"]' ).each(
		function (i, item) {
			$('#programSelect').append('<option value="' + item.id +'">' + item.id.replace("_"," ") + '</option>');
		});
}

function toolboxInit2() {
	//document.getElementById('fileinput').addEventListener('change', onFileChange, false);
}

function onEditGcodeSelect() {
	var choice = $("#editGcodeMenu").val();
	if(choice != "none") {
		toolbox.gotoPage(choice);
	}
}

function doneEditingGcode() {
	toolbox.gotoPage("toolbox-machine");
}

function entitiesToModel(entities) {
	model = new Model();				
	for(var i = 0; i < entities.lines.length; i++) {
		var pts = entities.lines[i].points;
		model.addEdge(pts[0][0],pts[0][1],pts[0][2],pts[1][0],pts[1][1],pts[1][2]);
	}
	model.center();
	stage.setModel(model);
}

function onFileChange(evt) {
	//Retrieve the first (and only!) File from the FileList object
	var f = evt.target.files[0]; 
	if (f) {
		var r = new FileReader();
		r.onload = function(e) {
			entitiesToModel(parseDxfData(e.target.result));
		}
		r.readAsText(f);
	} else { 
		alert("Failed to load file");
	}
}



function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

/* onRunProgram and onSaveGcode both run the program fragment,
 * but the choice of gcode object determines whether we are
 * adding edges to a model or generating gcode.
 */
function onRunProgram() {
	var model = new Model();
	var gcode = new GcodeToModel(model);
	runProgramWithContext(gcode);
	//stage.setModel(model);
}

function onSaveGcode() {
	if(noNinja())
		return;
	
	var gcode = new GcodeWriter();
	runProgramWithContext(gcode);
	
	var programName     = $('#programSelect').val();
	download(programName + ".gcode", gcode.getGcode());
}

/* The following function evaluates the JavaScript program fragment
   and accomplishes multiple things by doing so:
  
    1) It lets the program fragment to execute calls on the gcode
       object, thereby generating a 3D object.
	   
	2) Allows the program fragment to retrieve program parameters
	   from the UI via the option() helper function.
	   
	3) It builds DOM elements corresponding to program parameters
	   and places them in the UI, if needed.
	   
	The function does all this at once in order to execute the
	program fragment only once and to keep the program fragment
	simple (at the expense of making this function more thorny).
 */
function runProgramWithContext(gcode) {
	
	// Choose program fragment based on selection in
	// the program drop down menu.
	var programName     = $('#programSelect').val();
	var programFragment = $("#"+programName).html();
	
	// Make a DIV that will accumulate UI elements for parameters
	var programUI = document.createElement("div");
	programUI.id = "program-params";
	toolbox.setAppendTarget(programUI);
	
	// Special constants that can be used in code fragment
		
	var BINARY_FILE = new Object();

	// Define an option() function that will be called by the
	// program fragment to query each program parameter.
	//
	// This function also builds DOM elements for the program
	// parameters and sets refreshUI if the UI needs to be
	// updated (because an expected UI element did not exist).
	var refreshUI = false;
	var paramId  = 0;
	function option(desc, default_value) {
		
		// Because the program fragment does not name parameters,
		// we give them sequential names.
		var paramName = "program-parameter-" + paramId++;
		
		// Query the parameter from an UI element (if it exists)
		// or return the default_value. If the latter case,
		// set a flag saying the UI needs to be updated.
		var value;
		if(toolbox.exists(paramName)) {
			value     = toolbox.get(paramName);
		} else {
			if(default_value === BINARY_FILE) {
				value     = null;
			} else {
				value     = default_value;
			}
			refreshUI = true;
		}
		
		// Construct UI element for this parameter (we can't
		// know in advance whether the UI will be refreshed,
		// so we construct them all everytime).
		if(default_value === BINARY_FILE) {
			if(desc) toolbox.heading(desc);
			toolbox.file(paramName, true);
		} else {
			toolbox.parameter(paramName, desc, default_value);
		}
		return value;
	}
	
	function addPrintableObject(object) {
		stage.addPrintableObject(object);
		renderEngine.render();
	}
	
	// GCODE Preamble
	gcode.heater_on(toolbox.get("printTemperature"));
	gcode.start_gcode();
	gcode.home();
		
	// Execute the program fragment, which may call option()
	// multiple times and perform operations on the gcode object.
	//
	// We use "with" statements to allow the code fragment to
	// call methods of gcode and Math as top-level functions.
	//try {
		with(gcode) {
			with (Math) {
				str = eval(programFragment);
			}
		}
    //} catch(e) {
	//	str = e.name+" at line "+(e.lineNumber-56)+": "+e.message;
	//	alert(str);
    //}
	
	// GCODE Postscript
	gcode.end_gcode();
	
	// Update the UI, if and only if requested by options()
	if(refreshUI) {
		$('#program-params').replaceWith(programUI);
	}
}