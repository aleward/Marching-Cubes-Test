import { vec3, vec4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';
class MarchCube extends Drawable {
    constructor(center) {
        super(); // Call the constructor of the super class. This is required.
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
        this.drawType = gl.POINTS; //gl.LINES;
        this.tempRefScale = vec3.fromValues(1.0, 1.0, 1.0);
        this.tempRefTrans = vec3.fromValues(0.0, 0.0, 0.0);
        this.divisions = 10.0;
    }
    setScaleTrans(scale, trans) {
        vec3.copy(this.tempRefScale, scale);
        vec3.copy(this.tempRefTrans, trans);
    }
    setDrawType(drawT) {
        // IF DRAWTYPE IS DIFFERENT, MUST RECREATE
        this.drawType = drawT;
    }
    drawMode() {
        return this.drawType;
    }
    generateCubes() {
        // OKAY instead of this, have shader write out values to texture,
        // eight floats for each cube
    }
    create() {
        if (this.drawType == gl.TRIANGLES) {
            this.indices = new Uint32Array([0, 1, 2, 0, 2, 3,
                4, 5, 6, 4, 6, 7,
                8, 9, 10, 8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23]); //back
            this.normals = new Float32Array([
                0, 0, 1, 0,
                0, 0, 1, 0,
                0, 0, 1, 0,
                0, 0, 1, 0,
                // right quad          
                1, 0, 0, 0,
                1, 0, 0, 0,
                1, 0, 0, 0,
                1, 0, 0, 0,
                // upper quad          
                0, 1, 0, 0,
                0, 1, 0, 0,
                0, 1, 0, 0,
                0, 1, 0, 0,
                // left quad           
                -1, 0, 0, 0,
                -1, 0, 0, 0,
                -1, 0, 0, 0,
                -1, 0, 0, 0,
                // lower quad          
                0, -1, 0, 0,
                0, -1, 0, 0,
                0, -1, 0, 0,
                0, -1, 0, 0,
                // back quad           
                0, 0, -1, 0,
                0, 0, -1, 0,
                0, 0, -1, 0,
                0, 0, -1, 0
            ]);
            this.positions = new Float32Array([
                -1, -1, 1, 1,
                1, -1, 1, 1,
                1, 1, 1, 1,
                -1, 1, 1, 1,
                // right quad
                1, 1, 1, 1,
                1, 1, -1, 1,
                1, -1, -1, 1,
                1, -1, 1, 1,
                // upper quad
                1, 1, 1, 1,
                1, 1, -1, 1,
                -1, 1, -1, 1,
                -1, 1, 1, 1,
                // left quad
                -1, 1, 1, 1,
                -1, 1, -1, 1,
                -1, -1, -1, 1,
                -1, -1, 1, 1,
                // lower quad
                -1, -1, 1, 1,
                -1, -1, -1, 1,
                1, -1, -1, 1,
                1, -1, 1, 1,
                // back quad
                -1, -1, -1, 1,
                1, -1, -1, 1,
                1, 1, -1, 1,
                -1, 1, -1, 1
            ]); //23
        }
        else if (this.drawType == gl.LINES) {
            // Tracking variables
            let maxIndexCount = Math.pow(this.divisions + 1, 3);
            let maxVertexCount = maxIndexCount * 4;
            this.indices = new Uint32Array(maxIndexCount);
            this.positions = new Float32Array(maxVertexCount);
            let idxNum = 0;
            let delta = 2.0 / this.divisions;
            // Vertex loop
            for (let x = -1.0; x <= 1.0; x += delta) {
                for (let y = -1.0; y <= 1.0; y += delta) {
                    for (let z = -1.0; z <= 1.0; z += (delta * 3.4 / 3.6)) {
                        this.positions[4 * idxNum] = x * this.tempRefScale[0] + this.tempRefTrans[0];
                        this.positions[4 * idxNum + 1] = y * this.tempRefScale[1] + this.tempRefTrans[1];
                        this.positions[4 * idxNum + 2] = z * this.tempRefScale[2] + this.tempRefTrans[2];
                        this.positions[4 * idxNum + 3] = 1.0;
                        this.indices[idxNum] = idxNum;
                        idxNum++;
                    }
                }
            }
        }
        else if (this.drawType == gl.POINTS) {
            // Tracking variables
            let maxIndexCount = Math.pow(this.divisions + 1, 3);
            let maxVertexCount = maxIndexCount * 4;
            this.indices = new Uint32Array(maxIndexCount);
            this.positions = new Float32Array(maxVertexCount);
            let idxNum = 0;
            let delta = 2.0 / this.divisions;
            let mmX = this.tempRefScale[0];
            let mmY = this.tempRefScale[1];
            let mmZ = this.tempRefScale[2];
            // Vertex loop
            for (let x = -1.0; x <= 1.0; x += delta) {
                for (let y = -1.0; y <= 1.0; y += delta) {
                    for (let z = -1.0; z <= 1.0; z += delta) {
                        this.positions[4 * idxNum] = x * this.tempRefScale[0] + this.tempRefTrans[0];
                        this.positions[4 * idxNum + 1] = y * this.tempRefScale[1] + this.tempRefTrans[1];
                        this.positions[4 * idxNum + 2] = z * this.tempRefScale[2] + this.tempRefTrans[2];
                        this.positions[4 * idxNum + 3] = 1.0;
                        this.indices[idxNum] = ((x + 1.0) / delta) +
                            (this.divisions + 1) * ((y + 1.0) / delta) +
                            (this.divisions + 1) * (this.divisions + 1) * ((z + 1.0) / delta);
                        idxNum++;
                    }
                }
            }
        }
        this.generateIdx();
        this.generatePos();
        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        if (this.drawType == gl.TRIANGLES) {
            this.generateNor();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
            gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
        console.log(`Created MarchCube`);
    }
}
;
export default MarchCube;
//# sourceMappingURL=MarchCube.js.map