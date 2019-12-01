import {vec3, mat4} from 'gl-matrix';
import Triangle from './geometry/Triangle';

// Have trangles on range [-0.5, 0.5]
class Case {               
  triangles: Array<Triangle>;
  canBeAmbiguous: boolean;

  // List indices for ambiguities and tests to decide which one
  ambNum: number;

  constructor(triangles: Array<Triangle>, canBeAmbiguous: boolean, ambNum: number) {
    this.triangles = triangles;
    this.canBeAmbiguous = canBeAmbiguous;
    this.ambNum = ambNum;
  }
};

export default Case;

export const cornerTris : Array<Triangle> = ([new Triangle([vec3.fromValues(-0.5, 0.0, -0.5),
                                                            vec3.fromValues(-0.5, -0.5, 0.0),
                                                            vec3.fromValues(0.0, -0.5, -0.5)]), // 0 - Bottom Front Left
                                              new Triangle([vec3.fromValues(-0.5, 0.0, 0.5),
                                                            vec3.fromValues(-0.5, -0.5, 0.0),
                                                            vec3.fromValues(0.0, -0.5, 0.5)]), // 1 - Bottom Front Right
                                              new Triangle([vec3.fromValues(0.5, 0.0, 0.5),
                                                            vec3.fromValues(0.0, -0.5, 0.5),
                                                            vec3.fromValues(0.5, -0.5, 0.0)]), // 2 - Bottom Back Right
                                              new Triangle([vec3.fromValues(0.5, 0.0, -0.5),
                                                            vec3.fromValues(0.5, -0.5, 0.0),
                                                            vec3.fromValues(0.0, -0.5, -0.5)]), // 3 - Bottom Back Left
                                              new Triangle([vec3.fromValues(-0.5, 0.0, -0.5),
                                                            vec3.fromValues(0.0, 0.5, -0.5),
                                                            vec3.fromValues(-0.5, 0.5, 0.0)]), // 4 - Top Front Left
                                              new Triangle([vec3.fromValues(-0.5, 0.0, 0.5),
                                                            vec3.fromValues(0.0, 0.5, 0.5),
                                                            vec3.fromValues(-0.5, 0.5, 0.0)]), // 5 - Top Front Right
                                              new Triangle([vec3.fromValues(0.5, 0.0, 0.5),
                                                            vec3.fromValues(0.0, 0.5, 0.5),
                                                            vec3.fromValues(0.5, 0.5, 0.0)]), // 6 - Top Back Right
                                              new Triangle([vec3.fromValues(0.5, 0.0, -0.5),
                                                            vec3.fromValues(0.0, 0.5, -0.5),
                                                            vec3.fromValues(0.5, 0.5, 0.0)])  // 7 - Top Back Left
]);

// Add values pointing to ambiguity replacements?

const Case0 : Case = new Case([], false, 0);
const Case1 : Case = new Case([cornerTris[0]], false, 1);

const Case2 : Case = new Case([new Triangle([vec3.fromValues(-0.5, 0.0, -0.5),
                                           vec3.fromValues(-0.5, 0.0, 0.5),
                                           vec3.fromValues(0.0, -0.5, 0.5)]), // Top One
                             new Triangle([vec3.fromValues(-0.5, 0.0, -0.5),
                                           vec3.fromValues(0.0, -0.5, 0.5),
                                           vec3.fromValues(0.0, -0.5, -0.5)])], // Bottom one
                              false, 2); 

const Case3 : Case = new Case([cornerTris[0], cornerTris[5]], true, 3);
const Case4 : Case = new Case([cornerTris[0], cornerTris[6]], true, 4);

const Case5 : Case = new Case([new Triangle([vec3.fromValues(0.5, 0.0, 0.5),
                                             vec3.fromValues(0.5, 0.0, -0.5),
                                             vec3.fromValues(-0.5, 0.0, 0.5)]), // Top Piece
                               new Triangle([vec3.fromValues(-0.5, 0.0, 0.5),
                                             vec3.fromValues(0.5, 0.0, -0.5),
                                             vec3.fromValues(0.0, -0.5, -0.5)]), // Middle Piece
                               new Triangle([vec3.fromValues(-0.5, 0.0, 0.5),
                                             vec3.fromValues(0.0, -0.5, -0.5),
                                             vec3.fromValues(-0.5, -0.5, 0.0)])],  // Bottom one
                               false, 5);

const Case6 : Case = new Case([new Triangle([vec3.fromValues(-0.5, 0.0, -0.5),
                                           vec3.fromValues(-0.5, 0.0, 0.5),
                                           vec3.fromValues(0.0, -0.5, 0.5)]), // Top One
                             new Triangle([vec3.fromValues(-0.5, 0.0, -0.5),
                                           vec3.fromValues(0.0, -0.5, 0.5),
                                           vec3.fromValues(0.0, -0.5, -0.5)]), cornerTris[6]], // Bottom one
                               true, 6); 

const Case7 : Case = new Case([cornerTris[1], cornerTris[6], cornerTris[4]], true, 7);

const Case8 : Case = new Case([new Triangle([vec3.fromValues(0.5, 0.0, 0.5),
                                             vec3.fromValues(0.5, 0.0, -0.5),
                                             vec3.fromValues(-0.5, 0.0, -0.5)]), // Back Piece
                               new Triangle([vec3.fromValues(0.5, 0.0, 0.5),
                                             vec3.fromValues(-0.5, 0.0, -0.5),
                                             vec3.fromValues(-0.5, 0.0, 0.5)])], // Front one
                               false, 8); 

const Case9 : Case = new Case([new Triangle([vec3.fromValues(0.0, -0.5, 0.5),
                                             vec3.fromValues(-0.5, 0.0, -0.5),
                                             vec3.fromValues(-0.5, -0.5, 0.0)]), // bottom Piece
                               new Triangle([vec3.fromValues(0.0, -0.5, 0.5),
                                             vec3.fromValues(0.0, 0.5, -0.5),
                                             vec3.fromValues(-0.5, 0.0, -0.5)]), // Midbottom Piece
                               new Triangle([vec3.fromValues(0.0, -0.5, 0.5),
                                             vec3.fromValues(0.5, 0.0, 0.5),
                                             vec3.fromValues(0.0, 0.5, -0.5)]), // Midtop Piece
                               new Triangle([vec3.fromValues(0.5, 0.0, 0.5),
                                             vec3.fromValues(0.5, 0.5, 0.0),
                                             vec3.fromValues(0.0, 0.5, -0.5)])], // top one
                              false, 9); 

const Case10 : Case = new Case([new Triangle([vec3.fromValues(-0.5, 0.5, 0.0),
                                             vec3.fromValues(0.0, -0.5, -0.5),
                                             vec3.fromValues(0.0, 0.5, -0.5)]), // Left top
                               new Triangle([vec3.fromValues(-0.5, 0.5, 0.0),
                                             vec3.fromValues(-0.5, -0.5, 0.0),
                                             vec3.fromValues(0.0, -0.5, -0.5)]), // Left bottom
                               new Triangle([vec3.fromValues(0.0, 0.5, 0.5),
                                             vec3.fromValues(0.5, 0.5, 0.0),
                                             vec3.fromValues(0.5, -0.5, 0.0)]), // Right top
                               new Triangle([vec3.fromValues(0.0, 0.5, 0.5),
                                             vec3.fromValues(0.5, -0.5, 0.0),
                                             vec3.fromValues(0.0, -0.5, 0.5)])], // Right bottom
                              true, 10); 

const Case11 : Case = new Case([new Triangle([vec3.fromValues(0.0, -0.5, 0.5),
                                             vec3.fromValues(0.0, 0.5, 0.5),
                                             vec3.fromValues(-0.5, -0.5, 0.0)]), // bottom right
                               new Triangle([vec3.fromValues(0.0, 0.5, 0.5),
                                             vec3.fromValues(0.5, 0.0, -0.5),
                                             vec3.fromValues(-0.5, -0.5, 0.0)]), // Mid
                               new Triangle([vec3.fromValues(0.5, 0.0, -0.5),
                                             vec3.fromValues(-0.5, 0.0, -0.5),
                                             vec3.fromValues(-0.5, -0.5, 0.0)]), // bottom left
                               new Triangle([vec3.fromValues(0.0, 0.5, 0.5),
                                             vec3.fromValues(0.5, 0.5, 0.0),
                                             vec3.fromValues(0.5, 0.0, -0.5)])], // top Piece
                               false, 11); 

const Case12 : Case = new Case([cornerTris[4],
                               new Triangle([vec3.fromValues(0.5, 0.0, 0.5),
                                             vec3.fromValues(0.5, 0.0, -0.5),
                                             vec3.fromValues(-0.5, 0.0, 0.5)]), // Top Piece
                               new Triangle([vec3.fromValues(-0.5, 0.0, 0.5),
                                             vec3.fromValues(0.5, 0.0, -0.5),
                                             vec3.fromValues(0.0, -0.5, -0.5)]), // Middle Piece
                               new Triangle([vec3.fromValues(-0.5, 0.0, 0.5),
                                             vec3.fromValues(0.0, -0.5, -0.5),
                                             vec3.fromValues(-0.5, -0.5, 0.0)])], // Bottom one
                              true, 12); 

const Case13 : Case = new Case([cornerTris[0], cornerTris[2], cornerTris[5], cornerTris[7]], true, 13);

const Case14 : Case = new Case([new Triangle([vec3.fromValues(-0.5, -0.5, 0.0),
                                             vec3.fromValues(-0.5, 0.0, 0.5),
                                             vec3.fromValues(0.5, 0.0, 0.5)]), // bottom right
                               new Triangle([vec3.fromValues(-0.5, -0.5, 0.0),
                                             vec3.fromValues(0.5, 0.0, 0.5),
                                             vec3.fromValues(0.0, 0.5, -0.5)]), // Mid
                               new Triangle([vec3.fromValues(-0.5, -0.5, 0.0),
                                             vec3.fromValues(0.0, 0.5, -0.5),
                                             vec3.fromValues(0.0, -0.5, -0.5)]), // bottom left
                               new Triangle([vec3.fromValues(0.5, 0.0, 0.5),
                                             vec3.fromValues(0.5, 0.5, 0.0),
                                             vec3.fromValues(0.0, 0.5, -0.5)])], // top Piece
                               false, 14); 

export const caseArray : Array<Case> = [Case0, Case1, Case2, Case3, Case4, Case5, Case6, Case7, Case8, Case9, Case10, Case11, Case12, Case13, Case14];


type Tuple = [number, vec3];

function mapReturn() : Array<Tuple> {
  let temp = new Array<Tuple>(256);

  // CASE 0
  temp[0]   = [0, vec3.fromValues(0, 0, 0)];
  temp[255] = [0, vec3.fromValues(0, 0, 0)];

  // CASE 1 - 8 of em
  temp[128] = [1, vec3.fromValues(0, 0, 0)];
  temp[64]  = [1, vec3.fromValues(0, 90, 0)];
  temp[32]  = [1, vec3.fromValues(0, 180, 0)];
  temp[16]  = [1, vec3.fromValues(0, 270, 0)];
  temp[8]   = [1, vec3.fromValues(90, 0, 0)];
  temp[4]   = [1, vec3.fromValues(180, 0, 0)];
  temp[2]   = [1, vec3.fromValues(0, 270, 180)];
  temp[1]   = [1, vec3.fromValues(0, 0, 180)];

  // CASE 2 - 12 of em
  temp[192] = [2, vec3.fromValues(0, 0, 0)];
  temp[96]  = [2, vec3.fromValues(0, 90, 0)];
  temp[48]  = [2, vec3.fromValues(0, 180, 0)];
  temp[144] = [2, vec3.fromValues(0, 270, 0)];
  temp[136] = [2, vec3.fromValues(90, 0, 0)];
  temp[12]  = [2, vec3.fromValues(180, 0, 0)];
  temp[68]  = [2, vec3.fromValues(270, 0, 0)];
  temp[17]  = [2, vec3.fromValues(90, 0, 90)];
  temp[34]  = [2, vec3.fromValues(270, 0, 90)];
  temp[3]   = [2, vec3.fromValues(0, 0, 180)];
  temp[9]   = [2, vec3.fromValues(0, 90, 180)];
  temp[6]   = [2, vec3.fromValues(0, 270, 180)];

  // CASE 3 - 12 of em
  temp[132] = [3, vec3.fromValues(0, 0, 0)];
  temp[66]  = [3, vec3.fromValues(0, 90, 0)];
  temp[33]  = [3, vec3.fromValues(0, 180, 0)];
  temp[24]  = [3, vec3.fromValues(0, 270, 0)];
  temp[72]  = [3, vec3.fromValues(90, 0, 0)];
  temp[80]  = [3, vec3.fromValues(0, 0, 90)];
  temp[129] = [3, vec3.fromValues(90, 0, 90)];
  temp[10]  = [3, vec3.fromValues(0, 0, 270)];
  temp[5]   = [3, vec3.fromValues(0, 90, 270)];
  temp[160] = [3, vec3.fromValues(0, 90, 90)];
  temp[18]  = [3, vec3.fromValues(90, 0, 180)];
  temp[36]  = [3, vec3.fromValues(270, 0, 90)];

  // CASE 4 - 4 of em
  temp[130] = [4, vec3.fromValues(0, 0, 0)];
  temp[40]  = [4, vec3.fromValues(90, 0, 0)];
  temp[20]  = [4, vec3.fromValues(180, 0, 0)];
  temp[65]  = [4, vec3.fromValues(270, 0, 0)];

  // CASE 5 - 24 of em
  temp[112] = [5, vec3.fromValues(0, 0, 0)];
  temp[200] = [5, vec3.fromValues(90, 0, 270)];
  temp[140] = [5, vec3.fromValues(180, 0, 270)];
  temp[76]  = [5, vec3.fromValues(270, 0, 270)];
  temp[196] = [5, vec3.fromValues(0, 0, 270)];
  temp[224] = [5, vec3.fromValues(0, 270, 0)];
  temp[176] = [5, vec3.fromValues(0, 90, 0)];
  temp[208] = [5, vec3.fromValues(0, 180, 0)];
  temp[70]  = [5, vec3.fromValues(0, 270, 90)];
  temp[38]  = [5, vec3.fromValues(270, 0, 0)];
  temp[100] = [5, vec3.fromValues(270, 180, 0)];
  temp[98]  = [5, vec3.fromValues(270, 90, 0)];
  temp[145] = [5, vec3.fromValues(90, 0, 0)];
  temp[25]  = [5, vec3.fromValues(90, 90, 0)];
  temp[137] = [5, vec3.fromValues(90, 180, 0)];
  temp[152] = [5, vec3.fromValues(90, 270, 0)];
  temp[50]  = [5, vec3.fromValues(90, 0, 90)];
  temp[35]  = [5, vec3.fromValues(0, 0, 90)];
  temp[49]  = [5, vec3.fromValues(180, 0, 90)];
  temp[19]  = [5, vec3.fromValues(270, 0, 90)];
  temp[7]   = [5, vec3.fromValues(0, 90, 180)];
  temp[14]  = [5, vec3.fromValues(0, 0, 180)];
  temp[11]  = [5, vec3.fromValues(0, 180, 180)];
  temp[13]  = [5, vec3.fromValues(0, 270, 180)];

  // CASE 6 - 24 of em
  temp[194] = [6, vec3.fromValues(0, 0, 0)];
  temp[28]  = [6, vec3.fromValues(180, 0, 0)];
  temp[52]  = [6, vec3.fromValues(0, 0, 90)];
  temp[44]  = [6, vec3.fromValues(0, 0, 270)];
  temp[56]  = [6, vec3.fromValues(0, 180, 0)];
  temp[131] = [6, vec3.fromValues(180, 0, 90)];
  temp[193] = [6, vec3.fromValues(0, 180, 90)];
  temp[67] = [6, vec3.fromValues(0, 0, 180)];
  temp[168] = [6, vec3.fromValues(90, 0, 0)];
  temp[162] = [6, vec3.fromValues(270, 180, 0)];
  temp[42]  = [6, vec3.fromValues(90, 180, 270)];
  temp[138] = [6, vec3.fromValues(270, 0, 270)];
  temp[81]  = [6, vec3.fromValues(90, 0, 90)];
  temp[21]  = [6, vec3.fromValues(90, 180, 0)];
  temp[69]  = [6, vec3.fromValues(270, 0, 0)];
  temp[84]  = [6, vec3.fromValues(270, 180, 90)];
  temp[97]  = [6, vec3.fromValues(0, 90, 0)];
  temp[73]  = [6, vec3.fromValues(90, 270, 0)];
  temp[104] = [6, vec3.fromValues(270, 270, 0)];
  temp[41]  = [6, vec3.fromValues(0, 0, 180)];
  temp[148] = [6, vec3.fromValues(0, 270, 0)];
  temp[146] = [6, vec3.fromValues(90, 90, 0)];
  temp[22]  = [6, vec3.fromValues(0, 90, 270)];
  temp[134] = [6, vec3.fromValues(180, 270, 0)];

  // CASE 7 - 8 of em
  temp[74]  = [8, vec3.fromValues(0, 0, 0)];
  temp[37]  = [8, vec3.fromValues(0, 90, 0)];
  temp[26]  = [8, vec3.fromValues(0, 180, 0)];
  temp[133] = [8, vec3.fromValues(0, 270, 0)];
  temp[82]  = [8, vec3.fromValues(0, 0, 180)];
  temp[161] = [8, vec3.fromValues(0, 90, 180)];
  temp[88]  = [8, vec3.fromValues(0, 180, 180)];
  temp[164] = [8, vec3.fromValues(0, 270, 180)];

  // CASE 8 - 6 of em
  temp[240] = [8, vec3.fromValues(0, 0, 0)];
  temp[204] = [8, vec3.fromValues(0, 0, 270)];
  temp[51]  = [8, vec3.fromValues(0, 0, 90)];
  temp[153] = [8, vec3.fromValues(0, 90, 90)];
  temp[102] = [8, vec3.fromValues(0, 270, 90)];
  temp[15]  = [8, vec3.fromValues(0, 0, 180)];

  // CASE 9 - 8 of em
  temp[177] = [9, vec3.fromValues(0, 0, 0)];
  temp[216] = [9, vec3.fromValues(0, 90, 0)];
  temp[228] = [9, vec3.fromValues(0, 180, 0)];
  temp[114] = [9, vec3.fromValues(0, 270, 0)];
  temp[141] = [9, vec3.fromValues(0, 0, 180)];
  temp[78]  = [9, vec3.fromValues(0, 90, 180)];
  temp[39]  = [9, vec3.fromValues(0, 180, 180)];
  temp[27]  = [9, vec3.fromValues(0, 270, 180)];

  // CASE 10 - 8 of em
  temp[170] = [10, vec3.fromValues(0, 0, 0)];
  temp[85]  = [10, vec3.fromValues(0, 90, 0)];
  temp[60]  = [10, vec3.fromValues(90, 0, 0)];
  temp[195] = [10, vec3.fromValues(270, 0, 0)];

  // CASE 11 - 8 of em
  temp[178] = [11, vec3.fromValues(0, 0, 0)];
  temp[116] = [11, vec3.fromValues(0, 270, 0)];
  temp[209] = [11, vec3.fromValues(0, 90, 0)];
  temp[232] = [11, vec3.fromValues(0, 180, 0)];
  temp[77]  = [11, vec3.fromValues(0, 0, 180)];
  temp[46]  = [11, vec3.fromValues(0, 90, 180)];
  temp[23]  = [11, vec3.fromValues(0, 180, 180)];
  temp[139] = [11, vec3.fromValues(0, 270, 180)];
  temp[99]  = [11, vec3.fromValues(90, 0, 90)];
  temp[57]  = [11, vec3.fromValues(270, 0, 90)];
  temp[156] = [11, vec3.fromValues(90, 0, 270)];
  temp[198] = [11, vec3.fromValues(270, 0, 270)];

  // CASE 12 - 24 of em
  temp[120] = [12, vec3.fromValues(0, 0, 0)];
  temp[202] = [12, vec3.fromValues(90, 0, 270)];
  temp[172] = [12, vec3.fromValues(180, 0, 270)];
  temp[92]  = [12, vec3.fromValues(270, 0, 270)];
  temp[197] = [12, vec3.fromValues(0, 0, 270)];
  temp[225] = [12, vec3.fromValues(0, 270, 0)];
  temp[180] = [12, vec3.fromValues(0, 90, 0)];
  temp[210] = [12, vec3.fromValues(0, 180, 0)];
  temp[86]  = [12, vec3.fromValues(0, 270, 90)];
  temp[166] = [12, vec3.fromValues(270, 0, 0)];
  temp[101] = [12, vec3.fromValues(270, 180, 0)];
  temp[106] = [12, vec3.fromValues(270, 90, 0)];
  temp[149] = [12, vec3.fromValues(90, 0, 0)];
  temp[89]  = [12, vec3.fromValues(90, 90, 0)];
  temp[169] = [12, vec3.fromValues(90, 180, 0)];
  temp[154] = [12, vec3.fromValues(90, 270, 0)];
  temp[58]  = [12, vec3.fromValues(90, 0, 90)];
  temp[163] = [12, vec3.fromValues(0, 0, 90)];
  temp[53]  = [12, vec3.fromValues(180, 0, 90)];
  temp[83]  = [12, vec3.fromValues(270, 0, 90)];
  temp[135] = [12, vec3.fromValues(0, 90, 180)];
  temp[30]  = [12, vec3.fromValues(0, 0, 180)];
  temp[75]  = [12, vec3.fromValues(0, 180, 180)];
  temp[45]  = [12, vec3.fromValues(0, 270, 180)];
  
  // CASE 13 - 2 of em
  temp[165] = [13, vec3.fromValues(0, 0, 0)];
  temp[90]  = [13, vec3.fromValues(0, 90, 0)];

  // CASE 14 - 8 of em
  temp[113] = [14, vec3.fromValues(0, 0, 0)];
  temp[226] = [14, vec3.fromValues(0, 270, 0)];
  temp[184] = [14, vec3.fromValues(0, 90, 0)];
  temp[212] = [14, vec3.fromValues(0, 180, 0)];
  temp[142] = [14, vec3.fromValues(0, 0, 180)];
  temp[71]  = [14, vec3.fromValues(0, 90, 180)];
  temp[43]  = [14, vec3.fromValues(0, 180, 180)];
  temp[29]  = [14, vec3.fromValues(0, 270, 180)];
  temp[54]  = [14, vec3.fromValues(90, 0, 90)];
  temp[147] = [14, vec3.fromValues(270, 0, 90)];
  temp[201] = [14, vec3.fromValues(90, 0, 270)];
  temp[108] = [14, vec3.fromValues(270, 0, 270)];

  return temp;
}

export const map : Array<Tuple> = mapReturn();