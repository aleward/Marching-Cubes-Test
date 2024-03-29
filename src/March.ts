import {vec3, vec2, mat3, mat2} from 'gl-matrix';
import Block from './Block';
import {map, caseArray} from './Cases'
import Triangle from './geometry/Triangle';
import Drawable from './rendering/gl/Drawable';
import { gl } from './globals';

// MARCH STARTS wAY BELOW


/// ********* SDF CALCULATIONS: *********
let rad = (Math.PI / 180);

// Smooth minimum from IQ
function smin(a : number, b : number, k : number) : number {
    let res : number = Math.exp(-k * a) + Math.exp(-k * b);
    return -Math.log(res) / k;
}


function arm(pos : vec3) : number {
    let add = vec3.create();
    vec3.add(add, pos, vec3.fromValues(0.1, -0.1, 0.2));
    let v1 : number = vec3.length(add);
    let v2 : number = vec3.length(vec3.fromValues(pos[0], pos[1] * 0.5, pos[2]));
	return smin(v1 - 0.2, v2 - 0.2, 16.);
}

function eye(pos : vec3, degrees : number) : number {
	
	// Tilts the eyes
	let c : number = Math.cos(degrees * rad);
    let s : number = Math.sin(degrees * rad);
    let  mZ : mat3 = mat3.fromValues(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);     							// Z-axis rotation
	let  mY : mat3 = mat3.fromValues(Math.cos((-degrees / 1.4) * rad), 0.0, -Math.sin((-degrees / 1.4) * rad), // Y-axis rotation
					0.0, 1.0, 0.0, 
					Math.sin((-degrees / 1.4) * rad), 0.0, Math.cos((-degrees / 1.4) * rad));

	// The main eyeball
	//let  eye : vec3 = mY * mZ * (vec3(pos.x + degrees * 0.0215, pos.y * 0.85 - 0.05, pos.z * 1.5 + 0.38));

    let eye = vec3.create();
    let zRot : vec3 = vec3.transformMat3(eye, vec3.fromValues(pos[0] + degrees * 0.0215, pos[1] * 0.85 - 0.05, pos[2] * 1.5 + 0.38), mZ);
    vec3.transformMat3(eye, zRot, mY);

	// The surrounding torus
    //let  outline : vec3 = mY * mZ * pos;
    let  outline : vec3 = vec3.create();
    vec3.transformMat3(outline, pos, mZ);
    vec3.transformMat3(outline, outline, mY);

    let t : vec2 = vec2.fromValues(0.25, 0.05);
    let mult = vec2.create();
    vec2.multiply(mult, vec2.fromValues(outline[0], outline[1]), vec2.fromValues(0.75, 0.65));
	let d : vec2 = vec2.fromValues(vec2.length(mult) - t[0], outline[2]);

	let iris : number = vec3.length(vec3.fromValues(pos[0] + degrees * 0.0035, pos[1] * 0.85, pos[2] * 1.7 - 0.07)) - 0.13;
					 
  	return Math.min(iris, Math.min(vec2.length(d) - t[1], vec3.length(eye) - 0.5));
}

function box(p : vec3, b : vec3) : number
{
  let d : vec3 = vec3.create();
  vec3.subtract(d, vec3.fromValues(Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2])), b);
  return Math.min(Math.max(d[0], Math.max(d[1],d[2])),0.0) + vec3.length(vec3.fromValues(Math.max(d[0],0.0), Math.max(d[1],0.0), Math.max(d[2],0.0)));
}

// Sphere from IQ - used for Cappy's Body
function sphere(pos : vec3) : number {
	return vec3.length(pos) - 0.97;
}

function body(p : vec3, h : vec2) : number { // major warping of IQ's capped cylinder function
    let d = vec2.create();
      let d1 : vec2 = vec2.fromValues(Math.abs(vec2.length(vec2.fromValues(p[0], p[1]))), Math.abs(p[2]));
      let d2 = vec2.create();
      let d2temp : vec2 = vec2.multiply(d2, h, vec2.fromValues(p[2] / 2.3 - Math.sin(12.0 * p[2] * rad) * 0.03 * (p[2] - 2.) * 1.2, 1.));
      
      vec2.subtract(d, d1, d2);
    return Math.min(Math.max(d[0],d[1]),0.0) + vec2.length(vec2.fromValues(Math.max(d[0],0.0), Math.max(d[1],0.0)));
}

// Cylinder from IQ - used for Cappy's Hat
function sdCappedCylinder(p : vec3, h : vec2, f : number) : number {
    let d = vec2.create();
  	let d1 : vec2 = vec2.subtract(d, vec2.fromValues(Math.abs(vec2.length(vec2.fromValues(p[0], p[2]))), Math.abs(p[1])), h);
  	return Math.min(Math.max(d[0],d[1]),0.0) + vec2.length(vec2.fromValues(Math.max(d[0],0.0), Math.max(d[1],0.0))) - f;
}

function hatBrim(p : vec3, t : vec2) : number {   // Essentially a bent torus
	let c : number = Math.cos((12.0 * p[0]) * rad);
    let s : number = Math.sin((12.0 * p[0]) * rad);
    //let  m : mat2 = mat2.fromValues(c, -s, s, c);
    let temp : vec2 = vec2.fromValues(c * p[0] + s * p[1], -s * p[0] + c * p[1]);
    let  q : vec3 = vec3.fromValues(temp[0], temp[1], p[2]);
  	let d : vec2 = vec2.fromValues(vec2.length(vec2.fromValues(q[0] * 0.5, q[2] * 0.5)) - t[0], q[1] + 0.5);
  	return vec2.length(d) - t[1];
}

// The main part of the hat, using bent and beveled cylinders
function hatBase(p : vec3) : number {
    let c : number = Math.cos((12.0 * p[1]) * rad);
    let s : number = Math.sin((12.0 * p[1]) * rad);
    //mat2  m = mat2(c, -s, s, c);
    let  q = vec3.fromValues(c * p[2] + s * p[1], -s * p[2] + c * p[1], p[0]);
	let scaleVal : number= p[1] * 0.2 + 0.7;
    // Hat and ribbon!
    let add = vec3.create();
    vec3.add(add, q, vec3.fromValues(0.0, 0.2 * (1.0 + Math.cos(p[0] * rad)) - 0.25, 0.0));
    let add2 = vec3.create();
    vec3.add(add2, q, vec3.fromValues(0.0, -0.4, 0.0))
	return Math.min(sdCappedCylinder(add, vec2.fromValues(1.37 * scaleVal, 0.2), 0.05), 
			   sdCappedCylinder(add2, vec2.fromValues(1.2 * scaleVal, 0.7), 0.15));
}

// My combination SDF
function mySDF(p : vec3) : number {

    //let bgPos = pos;
    let pos = vec3.create()
    vec3.copy(pos, p);
	pos = vec3.add(pos, pos, vec3.fromValues(0.0, Math.sin(0.07 * rad) * 0.7, 0.0));

    let mult = vec3.create();
    vec3.multiply(mult, pos, vec3.fromValues(1.0, 1.0, 1.0));
	let hat : number = Math.min(hatBase(pos), hatBrim(mult, vec2.fromValues(0.6, 0.2)));
    let yScale : number = 0.7 - pos[2] / 2.2;
    
    let bodadd1 = vec3.create();
    vec3.add(bodadd1, pos, vec3.fromValues(0.0, 0.7, 0.03));
    let bodadd2 = vec3.create();
    vec3.add(bodadd2, pos, vec3.fromValues(Math.sin(3 * pos[2] * rad) * 0.1, yScale + Math.sin(10. * pos[2] * rad) * 0.1, 1.93));
    
	let bod : number = smin(sphere(bodadd1), 
                     body(bodadd2, vec2.fromValues(1.0, 1.7)), 22.0);
                     
    let subtr = vec3.create();
    vec3.subtract(subtr, pos, vec3.fromValues(0.8, -1., 1.0));                 
    let subtr2 = vec3.create();
    vec3.subtract(subtr2, pos, vec3.fromValues(-0.8, -1., 1.0));
    vec3.multiply(subtr, subtr, vec3.fromValues(-1.0, 1.0, 1.0));

	let arms : number = Math.min(arm(subtr), arm(subtr2));
    bod = smin(bod, arms, 20.0);
    
    let subtr3 = vec3.create();
    vec3.subtract(subtr3, pos, vec3.fromValues(0.34, 0.25, 0.98)); 
    let subtr4 = vec3.create();
    vec3.subtract(subtr4, pos, vec3.fromValues(-0.34, 0.25, 0.98)); 
    
	let eyes : number = smin(eye(subtr3, 23.0), eye(subtr4, -23.0), 100.0);

	let cappy : number = Math.min(Math.min(hat, bod), eyes);
	return cappy;
}





type Edge = [number, number];

// *********** MARCH CLASS *************
class March extends Drawable {
    positions: Array<vec3>;
    weights: Array<number>;
    blocks: Array<Block>;
    
    divisions: number;
    numVerts: number;
    numBlocks: number;
    
    tempRefScale: vec3;
    tempRefTrans: vec3;
    
    constructor(scale: vec3, trans: vec3, divs: number) {
        super();
        this.tempRefScale = scale;
        this.tempRefTrans = trans;
    
        this.divisions = divs;
        this.numBlocks = divs * divs * divs;
        this.numVerts = (divs + 1) * (divs + 1) * (divs + 1);
    
        let delta : number = 2.0 / this.divisions;
    
        this.positions = new Array<vec3>(this.numVerts);
        this.weights = new Array<number>(this.numVerts);
        this.blocks = new Array<Block>(this.numBlocks);
    
        // Vertex loop
        for (let x: number = 0.0; x <= this.divisions; x++) {
            for (let y: number = 0.0; y <= this.divisions; y++) {
                for (let z: number = 0.0; z <= this.divisions; z++) {
                    let temp = vec3.fromValues((x * delta - 1.0) * this.tempRefScale[0] + this.tempRefTrans[0],
                                               (y * delta - 1.0) * this.tempRefScale[1] + this.tempRefTrans[1],
                                               (z * delta - 1.0) * this.tempRefScale[2] + this.tempRefTrans[2]);
                    let index = z + 
                                (this.divisions + 1) * y +
                                (this.divisions + 1) * (this.divisions + 1) * x;
                    
                    this.positions[index] = temp;
                }
            }
        }

    
        let newScale = vec3.fromValues(this.tempRefTrans[0] * 2.0 / this.divisions,
                                       this.tempRefTrans[1] * 2.0 / this.divisions,
                                       this.tempRefTrans[2] * 2.0 / this.divisions);
        // Block loop
        for (let x: number = 0.0; x <= this.divisions; x++) {
            for (let y: number = 0.0; y <= this.divisions; y++) {
                for (let z: number = 0.0; z <= this.divisions; z++) {
                    let newPos = vec3.fromValues(((x * delta - 1.0) + delta / 2) * this.tempRefScale[0] + this.tempRefTrans[0],
                                                 ((y * delta - 1.0) + delta / 2) * this.tempRefScale[1] + this.tempRefTrans[1],
                                                 ((z * delta - 1.0) + delta / 2) * this.tempRefScale[2] + this.tempRefTrans[2]);
                    
                    // FILL ARRAY
                    let vertArr : Array<number> = new Array<number>(8);
                    let idxNum: number = 0;
                    // Its gonna have verts w displacement [0, 0, 0] [0, 0, 1] [1, 0, 1] [1, 0, 0] [0, 1, 0] [0, 1, 1] [1, 1, 1] [1, 1, 0]
                    for (let iY = 0; iY < 2; iY++) {
                        for (let iX = 0; iX < 2; iX++) {
                            for (let iZ = 0; iZ < 2; iZ++) {
                                let tempZ = iZ;
                                if (iX == 1) { tempZ = 1 - iZ; }

                                let index = (z + tempZ) + 
                                            (this.divisions + 1) * (y + iY) +
                                            (this.divisions + 1) * (this.divisions + 1) * (x + iX);
                                            
                                vertArr[idxNum] = index;
                                idxNum++;
                            }
                        }
                    }
                  
                    let index = z + 
                                (this.divisions + 1) * y +
                                (this.divisions + 1) * (this.divisions + 1) * x;
                    this.blocks[index] = new Block(vertArr, newPos, newScale);
                }
            }
        }

        let xjhs = 0;
    }
  

    testVertexSDFs() {
        for (let i = 0; i < this.numVerts; i++) {
            this.weights[i] = mySDF(this.positions[i]);
        }
    }

    resolveAmbiguities(ambiguities : Array<number>, blockNum : number) {
        let avg = vec3.create()
        for (let i = 0; i < ambiguities.length; i++) {
            vec3.add(avg, avg, this.positions[ambiguities[i]]);
        }
        vec3.divide(avg, avg, vec3.fromValues(ambiguities.length, ambiguities.length, ambiguities.length));

        let result = mySDF(avg);
        if (result <= 0) {
            let cNum = this.blocks[blockNum].caseNum;
            this.blocks[blockNum].caseNum = caseArray[cNum].ambNum;
        }
    }

    testBoxValues() {
        let i = 0;
        for (let b = 0; b < this.blocks.length; b++) {
            // Vertices to check for VERY BASIC ambiguity testing
            let ambiguities : Array<number> = new Array<number>();
            let a = 0;

            let binary = 0;
            let bit = 128;
            for (let v = 0; v < 8; v++) {
                if (this.weights[this.blocks[b].vertIdxs[v]] <= 0.0) {
                    binary = binary | bit;

                    // For ambiguities
                    ambiguities[a] = this.blocks[b].vertIdxs[v];
                    a++;
                }
                bit /= 2;
            }
            
            // Variable to check inverse
            let opposite = 255 ^ binary;

            // For NORMAL CASES
            if (map[binary] != undefined) {
                this.blocks[b].caseNum = map[binary][0];
                vec3.copy(this.blocks[b].rotation, map[binary][1]);
            } 
            // FOR OPPOSITES OF NORMAL CASES
            else if (map[opposite] != undefined) {
                this.blocks[b].caseNum = map[opposite][0];
                vec3.copy(this.blocks[b].rotation, map[opposite][1]);
                this.blocks[b].invert = true;
                i++;
            }

            // RESOLVE FOR MULTIPLE CASES
            let cNum = this.blocks[b].caseNum;
            if (cNum != -1 && caseArray[cNum].canBeAmbiguous) {
                this.resolveAmbiguities(ambiguities, b);
            }
        }
        let ijn = i;

        // **** MAKE CASE FOR if map[binary] = empty, 
        //  set caseNum and rotation to map[!binary], 
        // Add value to blocks saying to reverse order of 
        // triangle verts (and thus normals)
    }

    // Maybe make some epsilon range
    edgeCheck(point: vec3) : Edge {
        if (point[1] == -0.5 && point[2] == -0.5) { return [0, 3]; }
        if (point[1] == -0.5 && point[2] ==  0.5) { return [1, 2]; }
        if (point[1] ==  0.5 && point[2] ==  0.5) { return [5, 6]; }
        if (point[1] ==  0.5 && point[2] == -0.5) { return [4, 7]; }

        if (point[0] == -0.5 && point[2] == -0.5) { return [0, 4]; }
        if (point[0] == -0.5 && point[2] ==  0.5) { return [1, 5]; }
        if (point[0] ==  0.5 && point[2] ==  0.5) { return [2, 6]; }
        if (point[0] ==  0.5 && point[2] == -0.5) { return [3, 7]; }
        
        if (point[0] == -0.5 && point[1] == -0.5) { return [0, 1]; }
        if (point[0] == -0.5 && point[1] ==  0.5) { return [4, 5]; }
        if (point[0] ==  0.5 && point[1] ==  0.5) { return [7, 6]; }
        if (point[0] ==  0.5 && point[1] == -0.5) { return [3, 2]; }

        return [0, 0]; // error
    }

    setTriangles() {
        let center = vec3.fromValues(0, 0, 0);
        let scale = vec3.fromValues(this.tempRefScale[0] * 2.0 / this.divisions,
                                    this.tempRefScale[1] * 2.0 / this.divisions,
                                    this.tempRefScale[2] * 2.0 / this.divisions);

        for (let i = 0; i < this.blocks.length; i++) {
            let c = this.blocks[i].caseNum;
            if (c != -1) {
                for (let t = 0; t < caseArray[c].triangles.length; t++) {
                    // Track the current altered triangle to pass to this block
                    let currTriangle = new Triangle([vec3.create(), vec3.create(), vec3.create()]);
                    
                    for (let v = 0; v < 3; v++) {
                        // Copy vertex from current case
                        let vert = vec3.create();
                        // ... in reverse order if needed
                        if (this.blocks[i].invert) {
                            vec3.copy(vert, caseArray[c].triangles[t].vertices[2 - v]);
                        } else {
                            vec3.copy(vert, caseArray[c].triangles[t].vertices[v]);
                        }
                        // Rotate each vertex
                        vec3.rotateZ(vert, vert, center, this.blocks[i].rotation[2] * rad);
                        vec3.rotateY(vert, vert, center, this.blocks[i].rotation[1] * rad);
                        vec3.rotateX(vert, vert, center, this.blocks[i].rotation[0] * rad);
                        // - Check and record which edge it is on
                        let e = this.edgeCheck(vert); // for later

                        /*// Scale each vertex
                        vec3.multiply(vert, vert, scale);
                        // Translate each vertex
                        vec3.add(vert, vert, this.blocks[i].pos);*/
                        
                        // Interpolate between the existing vertices
                        let pos1: vec3 = this.positions[this.blocks[i].vertIdxs[e[0]]];
                        let pos2: vec3 = this.positions[this.blocks[i].vertIdxs[e[1]]];
                        // With existing weights
                        let weight1: number = this.weights[this.blocks[i].vertIdxs[e[0]]];
                        let weight2: number = this.weights[this.blocks[i].vertIdxs[e[1]]];
                        let lerp: number = -weight1 / (weight2 - weight1);

                        vert = vec3.fromValues(pos1[0] + lerp * (pos2[0] - pos1[0]), 
                                               pos1[1] + lerp * (pos2[1] - pos1[1]), 
                                               pos1[2] + lerp * (pos2[2] - pos1[2]))

                        vec3.copy(currTriangle.vertices[v], vert);
                    }
                    
                    // Every three vertices, push() back a new Triangle into this block's triangle array
                    //this.blocks[i].triangles[t] = currTriangle;
                    this.blocks[i].triangles.push(currTriangle);
                }
            }
        }
    }

    // DRAWABLE FUNCTIONALITY
    indxVBO: Uint32Array;
    posVBO: Float32Array;
    colVBO: Float32Array;

    drawMode(): GLenum {
        return gl.POINTS;
    }

    create() {
        // Tracking variables
        let maxIndexCount = Math.pow(this.divisions + 1, 3);
        let maxVertexCount = maxIndexCount * 4;  
        this.indxVBO   = new Uint32Array(maxIndexCount);
        this.posVBO = new Float32Array(maxVertexCount);
        this.colVBO = new Float32Array(maxVertexCount);
    
        for (let indxCount = 0; indxCount < maxIndexCount; indxCount++) {
            this.posVBO[4 * indxCount]     = this.positions[indxCount][0];
            this.posVBO[4 * indxCount + 1] = this.positions[indxCount][1];
            this.posVBO[4 * indxCount + 2] = this.positions[indxCount][2];
            this.posVBO[4 * indxCount + 3] = 1.0;

            if (this.weights[indxCount] > 0) {
                this.colVBO[4 * indxCount]     = 0.0;
                this.colVBO[4 * indxCount + 1] = 1.0;
            } else {
                this.colVBO[4 * indxCount]     = 1.0;
                this.colVBO[4 * indxCount + 1] = 0.0;
            }
            this.colVBO[4 * indxCount + 2] = 0.0;
            this.colVBO[4 * indxCount + 3] = 1.0;

            this.indxVBO[indxCount] = indxCount;
        }

        this.generateIdx();
        this.generatePos();
        this.generateCol();
    
        this.count = this.indxVBO.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indxVBO, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.posVBO, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
        gl.bufferData(gl.ARRAY_BUFFER, this.colVBO, gl.STATIC_DRAW);
    
        console.log(`Created MarchCube`);
      }
};

export default March;