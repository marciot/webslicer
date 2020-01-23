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
  function readFromDxf(lines) {
  	var group_code       = lines.shift();
  	if( typeof group_code === 'undefined' )
  		return undefined;
    group_code = parseInt(group_code, 10);
    
    var value      = lines.shift().trim();
    
    if(group_code < 10) {
		value = value;
    } else if (group_code >= 10 && group_code <= 59) {
        value = parseFloat(value);	
    } else if (group_code < 80) {
        value = parseInt(value);	
    } else if (group_code >= 210 &&  group_code <= 239) {
        value = parseFloat(value);
    } else if(group_code == 999) {
		value = value;
	}
    	
    return {
    	code  : group_code,
    	value : value
    };
  }
  
  function readEntitiesFromDxf(lines) {
  	var d = {code: 0, value: ''};
  	
  	var entities = {
  		lines : [],
  		faces : []
  	};
  	
  	console.log("Entering loop for code " + d.code);
  	
    while(d.code !== 0 || d.value != "ENDSEC") {
    	d = readFromDxf(lines);
    	if(typeof d === 'undefined') {
    		break;
    	}
    	    	
    	switch(d.code) {
    		case 0:
    			if( d.value === "LINE" || d.value === "3DLINE" ) {
    				e = {
    					layer : undefined,
    					color : undefined,
    					points : [[0,0,0],[0,0,0]]
    				};
    				entities.lines.push(e);
    			} else if(d.value === "3DFACE" ) {
    				e = {
    					layer : undefined,
    					color : undefined,
    					points : [[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
    				};
    				entities.faces.push(e);
    			}
    			break;
    		case 10: e.points[0][0] = d.value; break;
    		case 20: e.points[0][1] = d.value; break;
    		case 30: e.points[0][2] = d.value; break;
    		case 11: e.points[1][0] = d.value; break;
    		case 21: e.points[1][1] = d.value; break;
    		case 31: e.points[1][2] = d.value; break;
    		case 13: e.points[3][0] = d.value; break;
    		case 23: e.points[3][1] = d.value; break;
    		case 33: e.points[3][2] = d.value; break;
    		case 14: e.points[4][0] = d.value; break;
    		case 24: e.points[4][1] = d.value; break;
    		case 34: e.points[4][2] = d.value; break;
    		case 8:  e.layer        = e.value; break;
    		case 62: e.color        = e.value; break;
    	}
    }
	return entities;
  }
  
  function parseDxfData(fileData) {
	var entities;
	
    var lines = fileData.split('\n');
    var gotEof = false;
    while(!gotEof) {
    	d = readFromDxf(lines);
    	
    	if(typeof d === 'undefined')
    		break;
    		
    	switch(d.code) {
    		case 0:
    			if( d.value === "SECTION" ) {
    				d = readFromDxf(lines);
    				if( d.value === "ENTITIES") {
    					console.log("Reading entities section...");
    					entities = readEntitiesFromDxf(lines);
    				} else {
    					var section = d.value;
    					while(d.code !== 0 && d.value != "ENDSEC") {
    						d = readFromDxf(lines);
    						if(typeof d === 'undefined')
    							break;
    					}
    					console.log("Skipped section: " + section );
    				}
    			} else if( d.value === "EOF" ) {
					gotEof = true;
				} else {
					console.log("Unknown keyword: " + d.value );
				}
    			break;
    		case 999: // Comment
    			console.log("Comment: " + d.value);
    			break;
    	};
    }
	
	console.log("Entities: " + entities.lines.length + " Faces: " + entities.faces.length);
	return entities;
  }
 