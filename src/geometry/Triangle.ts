import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Triangle extends Drawable {
  vertices: Array<vec3>; // Store counter clockwise
  normVecs: Array<vec3>;

  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;

  constructor(vertices: Array<vec3>) {
    super(); // Call the constructor of the super class. This is required.
    this.vertices = vertices;
    this.normVecs = new Array<vec3>(3);
  }

  drawMode(): GLenum {
    return gl.TRIANGLES;
  }

  setNorms() {
    // Shorten to just be one per face
    for (let i = 0; i < 3; i++) {
        let vec1 = vec3.create();
        let vec2 = vec3.create();
        
        vec3.subtract(vec1, this.vertices[(i + 1) % 3], this.vertices[i]);
        vec3.subtract(vec2, this.vertices[(i + 2) % 3], this.vertices[i]);

        let norm = vec3.create();
        vec3.cross(norm, vec1, vec2);

        vec3.normalize(norm, norm);
        this.normVecs[i] = norm;
    }
  }

  create() {

    this.indices = new Uint32Array([0, 1, 2]);
    this.normals = new Float32Array(12);
    this.positions = new Float32Array(12);

    for (let i = 0; i < 3; i++) {
        this.normals[i * 4 + 0] = this.normVecs[i][0];
        this.normals[i * 4 + 1] = this.normVecs[i][1];
        this.normals[i * 4 + 2] = this.normVecs[i][2];
        this.normals[i * 4 + 3] = 0.0;
    }

    for (let i = 0; i < 3; i++) {
        this.positions[i * 4 + 0] = this.vertices[i][0];
        this.positions[i * 4 + 1] = this.vertices[i][1];
        this.positions[i * 4 + 2] = this.vertices[i][2];
        this.positions[i * 4 + 3] = 1.0;
    }

    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created triangle`);
  }
};

export default Triangle;
