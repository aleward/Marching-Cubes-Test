import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class MarchCube extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  drawType: GLenum;
  divisions: number;

  tempRefScale: vec3;
  tempRefTrans: vec3;

  constructor(center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    
    this.drawType = gl.POINTS;//gl.LINES;
    this.tempRefScale = vec3.fromValues(1.0, 1.0, 1.0);
    this.tempRefTrans = vec3.fromValues(0.0, 0.0, 0.0);
    this.divisions = 10.0;
  }

  setScaleTrans(scale: vec3, trans: vec3) {
    vec3.copy(this.tempRefScale, scale);
    vec3.copy(this.tempRefTrans, trans);
  }

  setDrawType(drawT: GLenum) {
    // IF DRAWTYPE IS DIFFERENT, MUST RECREATE
    this.drawType = drawT;
  }

  drawMode(): GLenum {
    return this.drawType;
  }

  generateCubes() {
    // OKAY instead of this, have shader write out values to texture,
    // eight floats for each cube
  }

  create() {
    if (this.drawType == gl.TRIANGLES) {
      this.indices = new Uint32Array([0, 1, 2, 0, 2, 3,       //front
                                      4, 5, 6, 4, 6, 7,       //right
                                      8, 9, 10, 8, 10, 11,    //upper
                                      12, 13, 14, 12, 14, 15, //left
                                      16, 17, 18, 16, 18, 19, //lower
                                      20, 21, 22, 20, 22, 23]);//back
      this.normals = new Float32Array([// front quad          
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
                                        0, 0, -1, 0]);
      this.positions = new Float32Array([//front quad
                                        -1, -1, 1, 1, //0
                                        1, -1, 1, 1,  //1
                                        1, 1, 1, 1,   //2
                                        -1, 1, 1, 1,  //3
                                        // right quad
                                        1, 1, 1, 1,   //4
                                        1, 1, -1, 1,  //5
                                        1, -1, -1, 1, //6
                                        1, -1, 1, 1,  //7
                                        // upper quad
                                        1, 1, 1, 1,   //8
                                        1, 1, -1, 1,  //9
                                        -1, 1, -1, 1, //10
                                        -1, 1, 1, 1,  //11
                                        // left quad
                                        -1, 1, 1, 1,  //12
                                        -1, 1, -1, 1, //13
                                        -1, -1, -1, 1,//14
                                        -1, -1, 1, 1, //15
                                        // lower quad
                                        -1, -1, 1, 1, //16
                                        -1, -1, -1, 1,//17
                                        1, -1, -1, 1, //18
                                        1, -1, 1, 1,  //19
                                        // back quad
                                        -1, -1, -1, 1,//20
                                        1, -1, -1, 1, //21
                                        1, 1, -1, 1,  //22
                                        -1, 1, -1, 1]);//23
    }
    else if (this.drawType == gl.LINES) {
      // Tracking variables
      let maxIndexCount = Math.pow(this.divisions + 1, 3);
      let maxVertexCount = maxIndexCount * 4;  
      this.indices   = new Uint32Array(maxIndexCount);
      this.positions = new Float32Array(maxVertexCount);


      let idxNum: number = 0;
      let delta : number = 2.0 / this.divisions;

      // Vertex loop
      for (let x: number = -1.0; x <= 1.0; x += delta) {
        for (let y: number = -1.0; y <= 1.0; y += delta) {
          for (let z: number = -1.0; z <= 1.0; z += delta) {
            this.positions[4 * idxNum]     = x * this.tempRefScale[0] + this.tempRefTrans[0];
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
      this.indices   = new Uint32Array(maxIndexCount);
      this.positions = new Float32Array(maxVertexCount);


      let idxNum: number = 0;
      let delta : number = 2.0 / this.divisions;

      let mmX = this.tempRefScale[0];
      let mmY = this.tempRefScale[1];
      let mmZ = this.tempRefScale[2];

      // Vertex loop
      for (let x: number = -1.0; x <= 1.0; x += delta) {
        for (let y: number = -1.0; y <= 1.0; y += delta) {
          for (let z: number = -1.0; z <= 1.0; z += delta) {
            this.positions[4 * idxNum]     = x * this.tempRefScale[0] + this.tempRefTrans[0];
            this.positions[4 * idxNum + 1] = y * this.tempRefScale[1] + this.tempRefTrans[1];
            this.positions[4 * idxNum + 2] = z * this.tempRefScale[2] + this.tempRefTrans[2];
            this.positions[4 * idxNum + 3] = 1.0;
            
            this.indices[idxNum] = idxNum;/*((x + 1.0) / 2.0 * this.divisions) + 
                                   this.divisions * (((y + 1.0) / 2.0 * this.divisions) +
                                   this.divisions * ((z + 1.0) / 2.0 * this.divisions));*/
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
};

export default MarchCube;
