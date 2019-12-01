import { vec3, vec2, mat3 } from 'gl-matrix';
import Block from './Block';
// MARCH STARTS wAY BELOW
/// ********* SDF CALCULATIONS: *********
// Smooth minimum from IQ
function smin(a, b, k) {
    let res = Math.exp(-k * a) + Math.exp(-k * b);
    return -Math.log(res) / k;
}
function arm(pos) {
    let add = vec3.create();
    vec3.add(add, pos, vec3.fromValues(0.1, -0.1, 0.2));
    let v1 = vec3.length(add);
    let v2 = vec3.length(vec3.fromValues(pos[0], pos[1] * 0.5, pos[2]));
    return smin(v1 - 0.2, v2 - 0.2, 16.);
}
function eye(pos, degrees) {
    // Tilts the eyes
    let c = Math.cos(degrees * (Math.PI / 180));
    let s = Math.sin(degrees * (Math.PI / 180));
    let mZ = mat3.fromValues(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); // Z-axis rotation
    let mY = mat3.fromValues(Math.cos((-degrees / 1.4) * (Math.PI / 180)), 0.0, -Math.sin((-degrees / 1.4) * (Math.PI / 180)), // Y-axis rotation
    0.0, 1.0, 0.0, Math.sin((-degrees / 1.4) * (Math.PI / 180)), 0.0, Math.cos((-degrees / 1.4) * (Math.PI / 180)));
    // The main eyeball
    //let  eye : vec3 = mY * mZ * (vec3(pos.x + degrees * 0.0215, pos.y * 0.85 - 0.05, pos.z * 1.5 + 0.38));
    let eye = vec3.create();
    let zRot = vec3.transformMat3(eye, vec3.fromValues(pos[0] + degrees * 0.0215, pos[1] * 0.85 - 0.05, pos[2] * 1.5 + 0.38), mZ);
    vec3.transformMat3(eye, zRot, mY);
    // The surrounding torus
    //let  outline : vec3 = mY * mZ * pos;
    let outline = vec3.create();
    vec3.transformMat3(outline, pos, mZ);
    vec3.transformMat3(outline, outline, mY);
    let t = vec2.fromValues(0.25, 0.05);
    let mult = vec2.create();
    vec2.multiply(mult, vec2.fromValues(outline[0], outline[1]), vec2.fromValues(0.75, 0.65));
    let d = vec2.fromValues(vec2.length(mult) - t[0], outline[2]);
    let iris = vec3.length(vec3.fromValues(pos[0] + degrees * 0.0035, pos[1] * 0.85, pos[2] * 1.7 - 0.07)) - 0.13;
    return Math.min(iris, Math.min(vec2.length(d) - t[1], vec3.length(eye) - 0.5));
}
function box(p, b) {
    let d = vec3.create();
    vec3.subtract(d, vec3.fromValues(Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2])), b);
    return Math.min(Math.max(d[0], Math.max(d[1], d[2])), 0.0) + vec3.length(vec3.fromValues(Math.max(d[0], 0.0), Math.max(d[1], 0.0), Math.max(d[2], 0.0)));
}
// Sphere from IQ - used for Cappy's Body
function sphere(pos) {
    return vec3.length(pos) - 0.97;
}
function body(p, h) {
    let d = vec2.create();
    let d1 = vec2.fromValues(Math.abs(vec2.length(vec2.fromValues(p[0], p[1]))), Math.abs(p[2]));
    let d2 = vec2.create();
    let d2temp = vec2.multiply(d2, h, vec2.fromValues(p[2] / 2.3 - Math.sin(12.0 * p[2]) * 0.03 * (p[2] - 2.) * 1.2, 1.));
    vec2.subtract(d, d1, d2);
    return Math.min(Math.max(d[0], d[1]), 0.0) + vec2.length(vec2.fromValues(Math.max(d[0], 0.0), Math.max(d[1], 0.0)));
}
// Cylinder from IQ - used for Cappy's Hat
function sdCappedCylinder(p, h, f) {
    let d = vec2.create();
    let d1 = vec2.subtract(d, vec2.fromValues(Math.abs(vec2.length(vec2.fromValues(p[0], p[2]))), Math.abs(p[1])), h);
    return Math.min(Math.max(d[0], d[1]), 0.0) + vec2.length(vec2.fromValues(Math.max(d[0], 0.0), Math.max(d[1], 0.0))) - f;
}
function hatBrim(p, t) {
    let c = Math.cos((12.0 * p[0]) * (Math.PI / 180));
    let s = Math.sin((12.0 * p[0]) * (Math.PI / 180));
    //let  m : mat2 = mat2.fromValues(c, -s, s, c);
    let temp = vec2.fromValues(c * p[0] + s * p[1], -s * p[0] + c * p[1]);
    let q = vec3.fromValues(temp[0], temp[1], p[2]);
    let d = vec2.fromValues(vec2.length(vec2.fromValues(q[0] * 0.5, q[2] * 0.5)) - t[0], q[1] + 0.5);
    return vec2.length(d) - t[1];
}
// The main part of the hat, using bent and beveled cylinders
function hatBase(p) {
    let c = Math.cos((12.0 * p[1]) * (Math.PI / 180));
    let s = Math.sin((12.0 * p[1]) * (Math.PI / 180));
    //mat2  m = mat2(c, -s, s, c);
    let q = vec3.fromValues(c * p[2] + s * p[1], -s * p[2] + c * p[1], p[0]);
    let scaleVal = p[1] * 0.2 + 0.7;
    // Hat and ribbon!
    let add = vec3.create();
    vec3.add(add, q, vec3.fromValues(0.0, 0.2 * (1.0 + Math.cos(p[0])) - 0.25, 0.0));
    let add2 = vec3.create();
    vec3.add(add2, q, vec3.fromValues(0.0, -0.4, 0.0));
    return Math.min(sdCappedCylinder(add, vec2.fromValues(1.37 * scaleVal, 0.2), 0.05), sdCappedCylinder(add2, vec2.fromValues(1.2 * scaleVal, 0.7), 0.15));
}
// My combination SDF
function mySDF(pos) {
    let bgPos = pos;
    pos = vec3.add(pos, pos, vec3.fromValues(0.0, Math.sin(0.07) * 0.7, 0.0));
    let mult = vec3.create();
    vec3.multiply(mult, pos, vec3.fromValues(1.0, 1.0, 1.0));
    let hat = Math.min(hatBase(pos), hatBrim(mult, vec2.fromValues(0.6, 0.2)));
    let yScale = 0.7 - pos[2] / 2.2;
    let bodadd1 = vec3.create();
    vec3.add(bodadd1, pos, vec3.fromValues(0.0, 0.7, 0.03));
    let bodadd2 = vec3.create();
    vec3.add(bodadd2, pos, vec3.fromValues(Math.sin(3 * pos[2]) * 0.1, yScale + Math.sin(10. * pos[2]) * 0.1, 1.93));
    let bod = smin(sphere(bodadd1), body(bodadd2, vec2.fromValues(1.0, 1.7)), 22.0);
    let subtr = vec3.create();
    vec3.subtract(subtr, pos, vec3.fromValues(0.8, -1., 1.0));
    let subtr2 = vec3.create();
    vec3.subtract(subtr2, pos, vec3.fromValues(-0.8, -1., 1.0));
    vec3.multiply(subtr, subtr, vec3.fromValues(-1.0, 1.0, 1.0));
    let arms = Math.min(arm(subtr), arm(subtr2));
    bod = smin(bod, arms, 20.0);
    let subtr3 = vec3.create();
    vec3.subtract(subtr3, pos, vec3.fromValues(0.34, 0.25, 0.98));
    let subtr4 = vec3.create();
    vec3.subtract(subtr4, pos, vec3.fromValues(-0.34, 0.25, 0.98));
    let eyes = smin(eye(subtr3, 23.0), eye(subtr4, -23.0), 100.0);
    let cappy = Math.min(Math.min(hat, bod), eyes);
    return cappy;
}
// *********** MARCH CLASS *************
class March {
    constructor(scale, trans, divs) {
        this.tempRefScale = scale;
        this.tempRefTrans = trans;
        this.divisions = divs;
        this.numBlocks = divs * divs * divs;
        this.numVerts = (divs + 1) * (divs + 1) * (divs + 1);
        let delta = 2.0 / this.divisions;
        this.positions = new Array(this.numVerts);
        this.weights = new Array(this.numVerts);
        this.blocks = new Array(this.numBlocks);
        // Vertex loop
        for (let x = -1.0; x <= 1.0; x += delta) {
            for (let y = -1.0; y <= 1.0; y += delta) {
                for (let z = -1.0; z <= 1.0; z += delta) {
                    let temp = vec3.fromValues(x * this.tempRefScale[0] + this.tempRefTrans[0], y * this.tempRefScale[1] + this.tempRefTrans[1], z * this.tempRefScale[2] + this.tempRefTrans[2]);
                    let index = ((x + 1.0) / delta) +
                        (this.divisions + 1) * ((y + 1.0) / delta) +
                        (this.divisions + 1) * (this.divisions + 1) * ((z + 1.0) / delta);
                    this.positions[index] = temp;
                    //this.positions[idxNum] = temp;
                    //idxNum++;
                }
            }
        }
        let newScale = vec3.fromValues(this.tempRefTrans[0] * 2.0 / this.divisions, this.tempRefTrans[1] * 2.0 / this.divisions, this.tempRefTrans[2] * 2.0 / this.divisions);
        // Block loop
        for (let x = -1.0; x < 1.0; x += delta) {
            for (let y = -1.0; y < 1.0; y += delta) {
                for (let z = -1.0; z < 1.0; z += delta) {
                    let newPos = vec3.fromValues((x + delta / 2) * this.tempRefScale[0] + this.tempRefTrans[0], (y + delta / 2) * this.tempRefScale[1] + this.tempRefTrans[1], (z + delta / 2) * this.tempRefScale[2] + this.tempRefTrans[2]);
                    // FILL ARRAY
                    let vertArr = new Array(8);
                    let idxNum = 0;
                    // Its gonna have verts w displacement [0, 0, 0] [0, 0, 1] [1, 0, 1] [1, 0, 0] [0, 1, 0] [0, 1, 1] [1, 1, 1] [1, 1, 0]
                    for (let iY = 0; iY < 2; iY++) {
                        for (let iX = 0; iX < 2; iX++) {
                            for (let iZ = 0; iZ < 2; iZ++) {
                                let tempZ = iZ;
                                if (iX == 1) {
                                    tempZ = 1 - iZ;
                                }
                                let index = ((x + 1.0) / delta + iX) +
                                    (this.divisions + 1) * ((y + 1.0) / delta + iY) +
                                    (this.divisions + 1) * (this.divisions + 1) * ((z + 1.0) / delta + tempZ);
                                vertArr[idxNum] = index;
                                idxNum++;
                            }
                        }
                    }
                    let index = ((x + 1.0) / delta) +
                        (this.divisions + 1) * ((y + 1.0) / delta) +
                        (this.divisions + 1) * (this.divisions + 1) * ((z + 1.0) / delta);
                    this.blocks[index] = new Block(vertArr, newPos, newScale);
                }
            }
        }
    }
    testVertexSDFs() {
        for (let i = 0; i < this.numVerts; i++) {
            this.weights[i] = mySDF(this.positions[i]);
        }
    }
    testBoxValues() {
    }
    setTriangles() {
    }
}
;
export default March;
//# sourceMappingURL=March.js.map