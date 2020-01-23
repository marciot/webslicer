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
// Utility functions

var Util = new Object;

Util.unique = function(array) {
	return array.filter(
		function() {
  			var seen = {};
  			return function(element, index, array) {
    			return !(element in seen) && (seen[element] = 1);
  			};
		}()
	);
}

Util.numericSort = function(array) {
	return array.sort(function compareNumbers(a, b) {return a - b;});
}

// Returns the indices of all elements equal in value to the element at
// index, except that index itself.
Util.indicesOfLikeValues = function(array, index) {
	var res = [];
	var target = array[index];
	for(var i = 0; i < array.length; i++) {
		if(array[i] === target && i != index) {
			res.push(i);
		}
	}
	return res;
}

function EdgeIterator(e, start_index) {
	// Private:
	var edges = e;
	var index = start_index || e.first();
	
	// Privileged:
	this.getStartVertexIndex = function() {
		return edges.get(index);
	}
		
	this.getEndVertexIndex = function() {
		return edges.get(edges.other(index));
	}
		
	this.getStartVertex = function() {
		return edges.getStartVertex(index);
	}
		
	this.getEndVertex = function() {
		return edges.getEndVertex(index);
	}
		
	this.next = function() {
		index = edges.next(index);
		return index != 0;
	}
		
	this.clone = function() {
		return new EdgeIterator(edges, index);
	}
}

function EdgeMarker(edgeCollection) {
	// Private:
	var marks    = [];
	marks.length = edgeCollection.count()*2;
	
	// Privileged:
	this.mark = function(index) {
		marks[index] = true;
	}
	
	this.firstUnmarked = function() {
		for (var i = 0; i < marks.length; i++) {
    		if (!marks[i]) {
         		return i;
    		};
		}; 
		return -1;
	}
	
	this.firstUnmarkedInSet = function(array) {
		for(i = 0; i < array.length; i++) {
			if(!marks[array[i]]) {
				return array[i];
			}
		}
		return -1;
	}
}

// Orders all edges into one or more loop(s)
Util.getLoops   = function(edges) {
	var loops   = [];
	var used    = new EdgeMarker(edges);
	
	var cur   = edges.first();
	
	do {
		var loop = edges.clone([]);
		first = cur;
		do {
			var end = edges.other(cur);
			loop.addEdge(edges.get(cur),edges.get(end));
		
			// Mark whether we visited an edge
			used.mark(cur);
			used.mark(end);
		
			// Find an edge connected to the current one that hasn't already been used
			var candidates = Util.indicesOfLikeValues(edges.array(), end);
			var next = used.firstUnmarkedInSet(candidates);
			if(next == -1) break;
			cur = next;
		} while(cur != first);
	
		loops.push(loop);
		
		// Did we miss any edges? If so, continue from there.
		cur = used.firstUnmarked();
	} while(cur !== -1);
	
	return loops;
}

// Returns the leftmost edge
Util.getLeftmostEdge = function(edges) {
	var i = edges.first();
	var edge = i;
	var min_x = Infinity;
	do {
		var candidate = Math.min(edges.getStartVertex(i).x, edges.getEndVertex(i).x, min_x);
		if( candidate < min_x ) {
			edge = i;
		}
		i = edges.next(i);
	} while(i);
	return edge;
}

// Returns the bounding box on the x,y plane
Util.getBoundingBox = function(edges) {
	
	var min_x = Number.POSITIVE_INFINITY;
	var max_x = Number.NEGATIVE_INFINITY;
	
	var min_y = Number.POSITIVE_INFINITY;
	var max_y = Number.NEGATIVE_INFINITY;
	
	var first = edges.first();
	var i     = first;
	do {
		min_x = Math.min(edges.getStartVertex(i).x, edges.getEndVertex(i).x, min_x);
		max_x = Math.max(edges.getStartVertex(i).x, edges.getEndVertex(i).x, max_x);
		
		min_y = Math.min(edges.getStartVertex(i).y, edges.getEndVertex(i).y, min_y);
		max_y = Math.max(edges.getStartVertex(i).y, edges.getEndVertex(i).y, max_y);
		i = edges.next(i);
	} while(i != first);
	
	return {
		min: {x: min_x, y: min_y},
		max: {x: max_x, y: max_y},
		width:  max_x - min_x,
		height: max_y - min_y
	};
}

// A geometric model consisting of vertices and edges

function Model() {
	// Private:
	var vertices = new VertexCollection();
	var edges    = new EdgeCollection(vertices);
	
	// Privileged:
	this.numberOfVertices = function() {
		return vertices.count();
	}
	
	this.numberOfEdges = function() {
		return edges.count();
	}
	
	this.getEdgeIterator = function() {
		return edges.getIterator();
	}
	
	this.getEdges = function() {
		return edges;
	}
	
	this.addEdge = function() {
		return edges.addEdge.apply(edges,arguments);
	};
	
	// Returns a list of unique z values
	this.getLayers = function() {
		var layers = [];
		for( var i = 0; i < vertices.count(); i++) {
			layers.push(vertices.get(i).z);
		}
		return Util.unique(layers);
	}
	
	// Returns a list of edges coplanar to a layer
	this.getEdgesInLayer = function(z) {
		var result = [];
		var i = edges.first();
		do {
			if(vertices.get(edges.get(i)).z === z && vertices.get(edges.get(i+1)).z === z) {
				result.push(edges.get(i));
				result.push(edges.get(i+1));
			}
			i = edges.next(i);
		} while(i);
		return result;
	}
	
	this.layeredEdges = function() {
		var res = [];
		
		var layers = Util.numericSort(this.getLayers());
		for( var i = 0; i < layers.length; i++ ) {
			var edges = this.getEdgesInLayer(layers[i]);
			var loops = Util.getLoops(new EdgeCollection([],edges));
			for( var l = 0; l < loops.length; l++ ) {
				res = res.concat(loops[l]);
			}
		}
		
		return res;
	}
	
	// Centers the model on the X,Y plane
	this.center = function() {
		var bounds = Util.getBoundingBox(edges);
		var dx = -bounds.min.x - bounds.width/2;
		var dy = -bounds.min.y - bounds.height/2;
		vertices.offset(dx, dy, 0);
		
		var bounds = Util.getBoundingBox(edges);
		console.log(bounds.min.x, bounds.max.x, bounds.min.y, bounds.max.y);
	}
}

// Returns a model of a simple cube centered about the origin
function makeCubeModel(s) {
	var model = new Model();
	var v1 = [-s,-s,-s];
	var v2 = [ s,-s,-s];
	var v3 = [ s, s,-s];
	var v4 = [-s, s,-s];
	
	var v5 = [-s,-s, s];
	var v6 = [ s,-s, s];
	var v7 = [ s, s, s];
	var v8 = [-s, s, s];
	
	var e1 = model.addEdge(v1,v2);
	var e2 = model.addEdge(v2,v3);
	var e3 = model.addEdge(v3,v4);
	var e4 = model.addEdge(v4,v1);
	
	var e5 = model.addEdge(v5,v6);
	var e6 = model.addEdge(v6,v7);
	var e7 = model.addEdge(v7,v8);
	var e8 = model.addEdge(v8,v5);
	
	var e9 = model.addEdge(v1,v5);
	var e10 = model.addEdge(v2,v6);
	var e11 = model.addEdge(v3,v7);
	var e12 = model.addEdge(v4,v8);
	return model;
};

// Returns a model of a simple polygon on the x,y plane
function makePolyModel(s) {
	var model = new Model();
	var v1 = [-0.20 * s, -0.70 * s,0];
	var v2 = [-0.40 * s, -0.90 * s,0];
	var v3 = [+0.50 * s, -0.60 * s,0];
	var v4 = [+0.80 * s, -0.80 * s,0];
	var v5 = [+0.20 * s, +0.30 * s,0];
	var v6 = [+0.60 * s, +0.90 * s,0];
	var v7 = [-0.40 * s, +0.20 * s,0];
	var v8 = [-0.70 * s, +0.80 * s,0];
	
	model.addEdge(v1,v2);
	model.addEdge(v2,v3);
	model.addEdge(v3,v4);
	model.addEdge(v4,v5);
	model.addEdge(v5,v6);
	model.addEdge(v6,v7);
	model.addEdge(v7,v8);
	model.addEdge(v8,v1);
	return model;
};

/*
The algorithm for the following line intersection routine can be
derived from the parametric forms for lines AB and CD:

  x = (bx - ax) * t + ax  [1]
  y = (by - ay) * t + ay  [2]

  x = (dx - cx) * s + cx  [3]
  y = (dy - cy) * s + cy  [4]

Let:

  s1.x = bx - ax
  s1.y = by - ay
  s2.x = dx - cx
  s2.y = dy - cy

So:

  x = s1.x * t + ax  [1]
  y = s1.y * t + ay  [2]

  x = s2.x * s + cx  [3]
  y = s2.y * s + cy  [4]


Set the equations equal to each other:

  s1.x * t + ax = s2.x * s + cx    [5]
  s1.y * t + ay = s2.y * s + cy    [6]

Solve equation [5] for t:

       s2.x        ax - cx
  t =  ---- * s -  -------   [7]
	   s1.x          s1.x

Solve equation [6] for s:

        s1.y           ay - cy
  s =   ------- * t +  -------   [8]
  	    s2.y             s2.y

Substitute equation [7] into equation [8]:

        s1.y   s2.x         s1.y     ax - cx    ay - cy
  s =   ---- * ---- * s  -  ----  *  -------  + -------   [8]
        s2.y   s1.x         s2.y      s1.x       s2.y
	   
Multiply all terms in [8] by s2.y * s1.x:

  s2.y * s1.x * s = s1.y * s2.x * s - s1.y * (ax - cx) + s1.x * (ay - cy)

Move terms with s to the left side of the equation:

  s2.y * s1.x * s - s1.y * s2.x * s = -s1.y * (ax - cx) + s1.x * (ay - cy)

Solve for s:

  s = (-s1.y * (ax - cx) + s1.x * (ay - cy)) / (s2.y * s1.x - s1.y * s2.x)

A similar derivation can be done for t
*/

/* Computes the intersection of lines AB and CD,
   specified by four points a, b, c, d.
   
   Source:
      http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
 */
function lineIntersection(a, b, c, d, unbounded) {
	var s1 = {x:b.x - a.x, y:b.y - a.y};
	var s2 = {x:d.x - c.x, y:d.y - c.y};

    s = (-s1.y * (a.x - c.x) + s1.x * (a.y - c.y)) / (-s2.x * s1.y + s1.x * s2.y);
    t = ( s2.x * (a.y - c.y) - s2.y * (a.x - c.x)) / (-s2.x * s1.y + s1.x * s2.y);
		
    if (unbounded || (s >= 0 && s <= 1 && t >= 0 && t <= 1)) {
		return {
			s : s,
			t : t,
			x: a.x + (t * s1.x),
			y: a.y + (t * s1.y)
		}
    }
}

/* polyFill: Raster fills a polygon on the XY plane.
 * Generates a collection of edges spaced by "spacing"
 * and with a slope of "angle" that covers the
 * polygon.
 *
 * Limitations: Polygon must be a single loop of ordered
 * edges. Currently does not handle when angle is
 * 90 (best to keep between -45 and 45)
 */ 
Util.polyFill = function(edges, spacing, angle, fillStyle) {
	var fill = new (fillStyle || Util.polyFill.RasterFill);
	
	var rad     = angle * Math.PI / 180;
	var slope_x = Math.cos(rad);
	var slope_y = Math.sin(rad);
	var bounds  = Util.getBoundingBox(edges);
	var rise    = bounds.width / slope_x * slope_y;
	var start_y = (slope_y > 0) ? -rise : 0;
	
	var row     = 0;
	var nRows   = (bounds.height + Math.abs(rise))/spacing;
		
	for(var row = 0; row <= nRows; row++) {
		// Find all intersections of this line with the polygon
		
		var intersections = [];
		var i = edges.first();
		do {
			var intersection = lineIntersection(
				// A line transecting the polygon:
				{x:bounds.min.x, y:bounds.min.y + start_y + row * spacing},
				{x:bounds.max.x, y:bounds.min.y + start_y + row * spacing + rise},
				// The current edge:
				edges.getStartVertex(i),
				edges.getEndVertex(i)
			);
			if(intersection) {
				intersections.push(intersection);
			}
			i = edges.next(i);
		} while(i);
		
		// Sort the intersections by t
		function compareByT(a, b) {
			if (a.t < b.t) {
				return -1;
			}
			if (a.t > b.t) {
				return 1;
			}
			// a must be equal to b
			return 0;
		}

		intersections = intersections.sort(compareByT);
		
		// Create line segments based on the even odd rule
		
		for( var i = 0; i < (intersections.length-1); i+=2) {
			fill.addEdge(row, i/2, intersections[i].x, intersections[i].y, 0, intersections[i+1].x, intersections[i+1].y, 0);
		}
	}
	
	return fill.getEdges();
}

// Fill style for the polyFill that orders edges left to right,
// as in a raster fill.
Util.polyFill.RasterFill = function() {
	var sorted = edges.clone([]);
	
	this.addEdge = function(row, intersection, x1, y1, z1, x2, y2, z2) {
		sorted.addEdge(x1, y1, z1, x2, y2, z2);
	};
	
	this.getEdges = function() {
		return sorted;
	}
}

// Fill style for the polyFill that optimizes edges for pen plotters and
// 3D printing by alternating edge direction and minimizing travel.
Util.polyFill.PenFill = function() {
	var byIntersection = [];
	
	this.addEdge = function(row, intersection, x1, y1, z1, x2, y2, z2) {
		// Expand array if needed
		while(byIntersection.length <= intersection) {
			byIntersection[byIntersection.length] = [];
		}
		// Push edge into bucket corresponding to intersection number 
		byIntersection[intersection].push([x1, y1, z1, x2, y2, z2]);
	};
	
	this.getEdges = function() {
		var sorted = edges.clone([]);
		for(var i = 0; i < byIntersection.length; i++) {
			for(var j = 0; j < byIntersection[i].length; j++) {
				var k = byIntersection[i][j];
				if(j%2) {
					sorted.addEdge(k[0],k[1],k[2],k[3],k[4],k[5]);
				} else {
					sorted.addEdge(k[3],k[4],k[5],k[0],k[1],k[2]);
				}
			}
		}
		return sorted;
	}
}

/* polyOutline: Creates a new polygon that circumscribes another by moving
 * all edges outwards by distance.
 *
 * Limitations: Polygon must be a single loop of ordered edges. No correction
 * for narrow angles or self-intersections.
 */ 
Util.polyOutline = function(edges, distance) {
	// Find leftmost edge
	var first = Util.getLeftmostEdge(edges);
	
	// Figure out which way to wind around the polygon
	
	var edge_dir = edges.getEdgeDirection(first);
	if(edge_dir.y < 0) {
		first = edges.other(first);
	}
	
	// Loop around shifting each edge
	var outline = new edges.clone([]);
	
	var prev_edge = first;
	var this_edge = edges.next(prev_edge);
	var next_edge = edges.next(this_edge);
	
	do {
		// Compute the displacement of the edges
		
		function edge_displacement(edge, distance) {
			// Figure out the direction and displacement for an edge
			var edge_dir = edges.getEdgeDirection(edge);
			return {x:-edge_dir.y * distance, y:edge_dir.x * distance};
		}

		var prev_d = edge_displacement(prev_edge, distance);
		var this_d = edge_displacement(this_edge, distance);
		var next_d = edge_displacement(next_edge, distance);
		
		// Compute intersections of displaced edges
		
		var prev_sv = edges.getStartVertex( prev_edge);
		var prev_ev = edges.getEndVertex(   prev_edge);
		var this_sv = edges.getStartVertex( this_edge);
		var this_ev = edges.getEndVertex(   this_edge);
		var next_sv = edges.getStartVertex( next_edge);
		var next_ev = edges.getEndVertex(   next_edge);

		var si = lineIntersection(
			{x:this_sv.x + this_d.x, y: this_sv.y + this_d.y},
			{x:this_ev.x + this_d.x, y: this_ev.y + this_d.y},
			{x:prev_sv.x + prev_d.x, y: prev_sv.y + prev_d.y},
			{x:prev_ev.x + prev_d.x, y: prev_ev.y + prev_d.y},
			true
			);
			
		var ei = lineIntersection(
			{x:this_sv.x + this_d.x, y: this_sv.y + this_d.y},
			{x:this_ev.x + this_d.x, y: this_ev.y + this_d.y},
			{x:next_sv.x + next_d.x, y: next_sv.y + next_d.y},
			{x:next_ev.x + next_d.x, y: next_ev.y + next_d.y},
			true
			);
		
		// Add a new edge connecting the intersection points
		
		outline.addEdge( si.x, si.y, this_sv.z, ei.x, ei.y, this_ev.z);
		
		prev_edge = this_edge;
		this_edge = next_edge;
		next_edge = edges.next(next_edge);
	} while(prev_edge != first);

	return outline;
}

Util.brim = function(edges, spacing, numOfLines) {
	var brim = new edges.clone([]);
	for(var i = 0; i < numOfLines; i++) {
		brim.append(Util.polyOutline(edges, (i+1)*spacing));
	}
	return brim;
}

Util.strokeEdges = function(ctx, edges, origin_x, origin_y) {
	if(edges.count() == 0) return;
	var iter = edges.getIterator();
	ctx.beginPath();
	do {
		var start = iter.getStartVertex();
		var end   = iter.getEndVertex();

		ctx.moveTo(origin_x + start.x + start.z/2, origin_y + start.y + start.z/2);
		ctx.lineTo(origin_x + end.x   + end.z/2,   origin_y + end.y   + end.z/2);			
	} while(iter.next());
	ctx.stroke();
}