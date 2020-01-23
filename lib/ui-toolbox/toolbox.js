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
class ToolboxUI {
	constructor(elementId) {
		this.ui            = document.getElementById(elementId);
		this.target_dom    = undefined;
	
		this.getters       = {};
	
		// Add the drop down menu
		this.menu          = document.createElement("select");
		this.menu.id       = "toolboxSelect";
		
		var that = this;
		this.menu.onchange = function() {
			that.gotoPage(that.menu.value);
		};
	
		this.ui.appendChild(this.menu);
	
		var el      = document.createElement("hr");
		this.ui.appendChild(el);
	}
	
	// private:
	
	static addTag(parent, type, id, text, className) {
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
	
	page(id, menuText) {
		// Add a choice to the drop-down menu, unless menuText
		// is undefined, in which case this is a hidden page
		if(menuText) {
			ToolboxUI.addTag(this.menu, "option", null, menuText).value = id;
		}
		// Create the page itself and make it the target of future DOM insertions.
		this.target_dom = ToolboxUI.addTag(this.ui, "div", id, null, "toolbox-panel");
	}
	
	parameter(id, description, default_value) {
		if(typeof default_value === 'boolean') {
			return this.choice(id, description)
			    .option("true", "yes")
				.option("false", "no");
		}
		var container = ToolboxUI.addTag(this.target_dom, "div", null, null, "parameter");
		ToolboxUI.addTag(container, "label",  null, description);
		var el = ToolboxUI.addTag(container, "input", id);
		if(typeof default_value === "number") {
			el.type = "number";
			this.getters[id] = function() {return parseFloat(document.getElementById(id).value);}
		} else {
			el.type = "text";
			this.getters[id] = function() {return document.getElementById(id).value};
		}
		el.value = default_value.toString();
	}
	
	choice(id, description) {
		var container = ToolboxUI.addTag(this.target_dom, "div", null, null, "parameter");
		if(description) {
			ToolboxUI.addTag(container, "label",  null, description);
		} else {
			ToolboxUI.addTag(container, "label").innerHTML = "&nbsp;";
		}
		var el = ToolboxUI.addTag(container, "select", id);
		return {
			option: function(id, text) {
				var o = ToolboxUI.addTag(el, "option", null, text);
				o.value = id;
				return this;
			}
		}
		this.getters[id] = function() {return document.getElementById(id).value;}
	}
	
	heading(text) {
		ToolboxUI.addTag(this.target_dom, "h1", null, text);
	}
	
	separator(type) {
		ToolboxUI.addTag(this.target_dom, type || "hr");
	}
	
	button(func, label, className) {
		ToolboxUI.addTag(this.target_dom, "button", null, label, className).onclick = func;
	}
	
	buttonHelp(text) {
		ToolboxUI.addTag(this.target_dom, "div", null, text, "button-label");
	}
	
	textarea(id) {
		var container = ToolboxUI.addTag(this.target_dom, "div", null, null, "parameter");
		return ToolboxUI.addTag(container, "textarea", id);
	}
	
	div(id) {
		if(typeof id === 'string' || id instanceof String) {
			ToolboxUI.addTag(this.target_dom, "div", id);
		} else {
			this.target_dom.appendChild(id);
		}
	}
	
	element(idOrElement) {
		if(typeof idOrElement === 'string' || idOrElement instanceof String) {
			this.target_dom.appendChild(document.getElementById(idOrElement));
		} else {
			this.target_dom.appendChild(idOrElement);
		}
	}
	
	file(id, binary) {
		var container = ToolboxUI.addTag(this.target_dom, "div", null, null, "parameter drop-box empty");
		var el = ToolboxUI.addTag(container, "input", id);
		el.type = "file";
				
		// Drop area
		var da   = ToolboxUI.addTag(container, "div", null, null, "drop-area");
		ToolboxUI.addTag(da,        "div", null, "Drop file here");
		
		// Selected file & reset button
		var sf = ToolboxUI.addTag(container, "div", null, null, "selected-file");
		var selectedFile = ToolboxUI.addTag(sf, "span");
		ToolboxUI.addTag(sf, "div", null, "&#x2716;", "reset")
			.onclick = function() {
				container.className = "parameter drop-box empty";
			}
		
		var progress = ToolboxUI.addTag(da, "progress");
		
		var fileContents = null;
		
		this.getters[id] = function() {
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
	
	done() {
		this.menu.onchange();
	}
	
	gotoPage(page) {
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
	
	setAppendTarget(element) {
		this.target_dom = element;
	}
	
	get(option) {
		if(this.getters.hasOwnProperty(option)) {
			return this.getters[option]();
		} else {
			alert(option + "undefined");
			return null;
		}
	}
	
	exists(option) {
		return this.getters.hasOwnProperty(option);
	}
}
