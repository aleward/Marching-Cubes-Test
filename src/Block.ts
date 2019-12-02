import {vec3, mat4} from 'gl-matrix';
import Case from './Cases';
import Triangle from './geometry/Triangle';
import Triangle2 from './geometry/Triangle2';

// Have trangles on range [-0.5, 0.5]
class Block {                                                 //  [   0    ,    1    ,    2    ,    3    ,    4    ,    5    ,    6    ,    7   ]
  vertIdxs: Array<number>; // Its gonna have verts w displacement [0, 0, 0] [0, 0, 1] [1, 0, 1] [1, 0, 0] [0, 1, 0] [0, 1, 1] [1, 1, 1] [1, 1, 0]
  pos: vec3;
  scale: vec3;

  triangles: Array<Triangle2>; // 2 for EDGEMODE
  caseNum: number;
  rotation: vec3;
  invert: boolean;

  constructor(verts: Array<number>, position: vec3, scale: vec3) {
    this.vertIdxs = verts;
    this.pos = position;
    this.scale = scale;

    this.triangles = new Array<Triangle2>(); // 2 for EDGEMODE
    this.caseNum = -1;
    this.rotation = vec3.create();
    this.invert = false;
  }
};

export default Block;