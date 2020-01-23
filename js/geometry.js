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
// An unordered collection of vertices
function VertexCollection() {
	// Private:
	var that = this;	
	var vertices = [];
	
	// Privileged:
	this.findVertex = function(x, y, z) {
		// Find whether the vertex already exists
		for( var i = 0; i < vertices.length; i++) {
			if( x === vertices[i].x && y === vertices[i].y && z === vertices[i].z )
				return i;
		}
		
		// If it does not exist, create it
		var v = {x:x,y:y,z:z};
		return vertices.push(v) - 1;
	}
	
	this.get = function(index) {
		return vertices[index];
	}
	
	this.count = function() {
		return vertices.length;
	}
	
	this.offset = function(dx,dy,dz) {
		for( var i = 0; i < vertices.length; i++) {
			vertices[i].x += dx;
			vertices[i].y += dy;
			vertices[i].z += dz;
		}
	}
}

// An unordered collection disjoint edges
function EdgeCollection(vertices, edges) {
	// Private:
	var that     = this;
	var edges    = edges || [];
	var vertices = vertices;
	
	// Privileged:
	this.addEdge = function(x1, y1, z1, x2, y2, z2) {
		if(arguments.length == 2) {			
			if(x1.constructor === Array) {
				// Option 1: Arguments are two arrays of [x,y,z]
				return this.addEdge(x1[0],x1[1],x1[2],y1[0],y1[1],y1[2]);
			}
			
			// Option 2: Arguments are two edge indices
			edges.push(x1,y1);
			return edges.length - 2;
		} else {
			// Option 3: Arguments are six coordinates
			var v1, v2;
			// Push the edge into the list, subject to the constraint that the first
			// point is the lowest one.
			if(z1 <= z2) {
				v1 = vertices.findVertex(x1,y1,z1);
				v2 = vertices.findVertex(x2,y2,z2);
			} else {
				v1 = vertices.findVertex(x2,y2,z2);
				v2 = vertices.findVertex(x1,y1,z1);
			}
			edges.push(v1,v2);
			return [v1,v2];
		}
	};
	
	this.get = function(index) {
		return edges[index];
	}
	
	this.count = function() {
		return edges.length/2;
	}
	
	this.first = function() {
		return 0;
	}
	
	this.next = function(index) {
		// If this is a reversed edge index, then the direction is flipped
		index += (index%2) ? -2 : 2;
		if(index >= edges.length) {
			return index - edges.length;
		} else if(index < 0) {
			return index + edges.length;
		} else {
			return index;
		}
	}
	
	this.array = function() {
		return edges;
	}
	
	this.vertices = function() {
		return vertices;
	}
	
	this.getStartVertex = function(index) {
		return vertices.get(edges[index]);
	}
	
	this.getEndVertex = function(index) {
		return vertices.get(edges[this.other(index)]);
	}
	
	this.getIterator = function(start_index) {
		return new EdgeIterator(this, start_index);
	}
	
	this.getEdgeDirection = function(index) {
		function unit(e) {
			var d = Math.sqrt(Math.pow(e.x,2)+Math.pow(e.y,2));
			return {x:e.x/d,y:e.y/d};
		}
	
		var sv        = this.getStartVertex(index);
		var ev        = this.getEndVertex(index);
	
		return unit({x:ev.x - sv.x, y:ev.y - sv.y});
	}
	
	this.append = function(e) {
		if(vertices != e.vertices()) {
			throw "Mismatched vertices in EdgeCollection.append";
		}
		edges = edges.concat(e.array());
	}
	
	// Public:
	
	// Each edge can be identified by either an even or odd index, given
	// one index, find the other
	this.other = function(index) {
		return (index % 2 == 0) ? index + 1 : index - 1;
	}
	
	this.toString = function () {
		return edges.join();
	}
	
	this.clone = function(e) {
		return new EdgeCollection(vertices, e || edges);
	}
}

function Mesh() {
	// Private:
	var that     = this;
	var vertices = new VertexCollection();
	var faces    = [];
	
	var loop     = [];
	
	// Privileged:
	this.startLoop = function() {
		loop = [];
	}
	
	this.addVertex = function(x,y,z) {
		loop.push(vertices.addVertex(x,y,z));
	}
	
	this.closeLoop = function() {
		faces.push(loop);
	}
}

function SimpleEdgeCollection() {
	// Private:
	var that     = this;
	var edges    = [];
	
	// Privileged:
	
	this.addEdge = function(v1, v2) {
		edges.push(v1,v2);
	}
}