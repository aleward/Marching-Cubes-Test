import {mat4, vec3, vec2} from 'gl-matrix';
import * as Stats from 'stats-js';
import {ComputeShaderProgramUniform} from './project/ComputeShaderProgramUniform';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Cube from './geometry/Cube';
import MarchCube from './geometry/MarchCube';
import { GLTF } from './project/GLTF';
import fsSource from './shaders/march.frag.glsl.js';
import './types/WebGL2Compute';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  // TODO: add any controls you want
  'Cubes Across' : 10,
  'Generate Mesh' : function(){}, // maybe set a boolean that'll be set to false when process ends
};

let screenQuad: Square;
let outerCube: MarchCube;

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // TODO: add any controls you need to the gui
  const gui = new DAT.GUI();
  // E.G. gui.add(controls, 'tesselations', 0, 8).step(1);
  var cubesAcross = gui.add(controls, 'Cubes Across', 5, 50).step(1);
  var generate = gui.add(controls, 'Generate Mesh');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');

  function setSize(width: number, height: number) {
    canvas.width = width;
    canvas.height = height;
  }

  // From 9ballsyndrome github
  let computeProgram:WebGLProgram;
  let computeUniform:ComputeShaderProgramUniform;
  let computeUniformDirty:boolean;
  let ssboIn:WebGLBuffer;
  let ssboOut:WebGLBuffer;
  
  let model:GLTF;
  let numGroups:number;
  let numInstances:number;

  // Want below to be context:WebGL2ComputeRenderingContext and webgl2-compute
  const gl = <WebGL2ComputeRenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  screenQuad = new Square(vec3.fromValues(0, 0, 0));
  screenQuad.create();

  // MARCHING CUBES TESTS
  outerCube = new MarchCube(vec3.fromValues(0, 0, 0));

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.disable(gl.DEPTH_TEST);
  //gl.lineWidth(2);

  // More from 9ball - change to my cube vals
  numInstances = 1024;
  numGroups = numInstances / 256;
  computeUniformDirty = true;

  let shaderSource : string = fsSource({
    
  });

  // ******** SIMILAR TO WHAT HAPPENS IN THE SHADER CLASSES*******
  // CREATE WebGLShader for ComputeShader
  const computeShader:WebGLShader = gl.createShader(gl.COMPUTE_SHADER);
  gl.shaderSource(computeShader, shaderSource);
  gl.compileShader(computeShader);
  if(!gl.getShaderParameter(computeShader, gl.COMPILE_STATUS))
  {
    console.log(gl.getShaderInfoLog(computeShader));
  }
  // CREATE WebGLProgram for ComputeShader
  computeProgram = gl.createProgram();
  gl.attachShader(computeProgram, computeShader);
  gl.linkProgram(computeProgram);
  if(!gl.getProgramParameter(computeProgram, gl.LINK_STATUS))
  {
    console.log(gl.getProgramInfoLog(computeProgram));
  }

  computeUniform = new ComputeShaderProgramUniform('Uniforms', 1);
  computeUniform.createBuffer(this.context);
  computeUniform.index = this.context.getUniformBlockIndex(this.computeProgram, this.computeUniform.name);
  computeUniformDirty = true;
  gl.bindBufferBase(this.context.UNIFORM_BUFFER, this.computeUniform.binding, this.computeUniform.buffer);
  gl.uniformBlockBinding(this.computeProgram, this.computeUniform.index, this.computeUniform.binding);

  // **********************************************************************

  const raymarchShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/screenspace-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/raymarch-frag.glsl')),
  ]);

  // NEW MARCHCUBE VALUES
  const cubeMarch = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/marching-cubes-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/marching-cubes-frag.glsl')),
  ]);

  let cubeTrans = mat4.fromValues(1.0,  0.0,  0.0,  0.0,
                                  0.0,  1.0,  0.0,  0.0,
                                  0.0,  0.0,  1.0,  0.0,
                                  0.0, -0.1, -0.2,  1.0);

  let cubeScale = mat4.fromValues(1.7,  0.0,  0.0,  0.0,
                                  0.0,  1.7,  0.0,  0.0,
                                  0.0,  0.0,  1.8,  0.0,
                                  0.0,  0.0,  0.0,  1.0);

  outerCube.setScaleTrans(vec3.fromValues(1.7, 1.7, 1.8), 
                          vec3.fromValues(0.0, -0.1, -0.2));
  
  outerCube.create();

  let cModelMat = mat4.create();
  mat4.multiply(cModelMat, cubeTrans, cubeScale);
                                  

  function setVals(modelMat: mat4) {
    cubeMarch.setEye(camera.controls.eye);
    cubeMarch.setViewMatrix(camera.viewMatrix);
    cubeMarch.setProjectionMatrix(camera.projectionMatrix);
    cubeMarch.setDimensions(vec2.fromValues(window.innerWidth, window.innerHeight));
    cubeMarch.setModelMatrix(modelMat);
    cubeMarch.setUnifDrawMode(2);
  }

  // ******** ********** MORE SHADER SETUP *********** *******
  const instanceAttributeData:Float32Array = new Float32Array(outerCube.positions.length);
  for(let i:number = 0; i < outerCube.positions.length; i++)
  {
    // position
    instanceAttributeData[i] = outerCube.positions[i];
  }
  // *********************************************************

  let time = 0.;

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // TODO: get / calculate relevant uniforms to send to shader here
    // TODO: send uniforms to shader
    raymarchShader.setEye(camera.controls.eye);
    raymarchShader.setViewMatrix(camera.viewMatrix);
    raymarchShader.setProjectionMatrix(camera.projectionMatrix);
    raymarchShader.setDimensions(vec2.fromValues(window.innerWidth, window.innerHeight));
    raymarchShader.setTime(time);

    // March!
    raymarchShader.draw(screenQuad);

    // TODO: more shaders to layer / process the first one? (either via framebuffers or blending)
    setVals(cModelMat);
    gl.enable(gl.DEPTH_TEST);
    cubeMarch.draw(outerCube);
    gl.disable(gl.DEPTH_TEST);

    time = time + 1.0;

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
