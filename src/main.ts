import {mat4, vec3, vec2} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Cube from './geometry/Cube';
import MarchCube from './geometry/MarchCube';
import March from './March';
import Triangle from './geometry/Triangle';
import {cornerTris, caseArray} from './Cases'

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  // TODO: add any controls you want
  'Cubes Across' : 10,
  'Show Marching Cube Divisions' : true, // Generate: maybe set a boolean that'll be set to false when process ends
  'Hide SDF Cappy' : true,
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
  var cubesAcross = gui.add(controls, 'Cubes Across', 5, 30).step(1);
  var showPoints = gui.add(controls, 'Show Marching Cube Divisions');
  var showCappy = gui.add(controls, 'Hide SDF Cappy');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');

  function setSize(width: number, height: number) {
    canvas.width = width;
    canvas.height = height;
  }

  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
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
  // CHANGING FOR CHECKS
  mat4.identity(cModelMat);


  // ****YEP SO CUBE MARCHING HAPPENS FIRST BC NO COMPUTE SHADER ****
  
  // Initialize March structure - contains vertices and block divisions
  let mainMarch: March;
  
  function divisionsReset(divis: number) {
    mainMarch = new March(outerCube.tempRefScale, 
    outerCube.tempRefTrans, divis);

    //To be parallelized
    mainMarch.testVertexSDFs();
    mainMarch.testBoxValues();
    mainMarch.setTriangles();

    mainMarch.create();

    //let checkNumss = 0;
    for (let i = 0; i < mainMarch.blocks.length; i++) {
      let currBlock = mainMarch.blocks[i];
      /*if (currBlock.caseNum == 3) {
        checkNumss++;
      }*/
      for (let j = 0; j < currBlock.triangles.length; j++) {
        currBlock.triangles[j].setNorms();
        currBlock.triangles[j].create();
      }
    }
  }
  divisionsReset(outerCube.divisions);

  // *****************************************************************

  function setVals(modelMat: mat4) {
    cubeMarch.setEye(camera.controls.eye);
    cubeMarch.setViewMatrix(camera.viewMatrix);
    cubeMarch.setProjectionMatrix(camera.projectionMatrix);
    cubeMarch.setDimensions(vec2.fromValues(window.innerWidth, window.innerHeight));
    cubeMarch.setModelMatrix(modelMat);
  }

  let time = 0.;
  let pointCheck = true;

  raymarchShader.setUnifDrawMode(1);

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

    // Interactive GUI
    cubesAcross.onChange(function(value: number) {
      divisionsReset(value);
    })
    showPoints.onChange(function(value: boolean) {
      pointCheck = value;
    })
    showCappy.onChange(function(value: boolean) {
      if (value) { raymarchShader.setUnifDrawMode(1); }
      else       { raymarchShader.setUnifDrawMode(0); }
    })

    // March!
    raymarchShader.draw(screenQuad);

    // Dont want depth enabled for SDFs, do for meshes
    gl.enable(gl.DEPTH_TEST);

    // Update uniform variables (and set shader to work for gl.Points)
    setVals(cModelMat);
    cubeMarch.setUnifDrawMode(2);
    // Draw Cube corner display for debugging putposes
    if (pointCheck) { cubeMarch.draw(mainMarch); }

    // Change the shader to work for gl.Triangles
    cubeMarch.setUnifDrawMode(0);
    
    // Draw triangles from cube marching, parse each block for values
    for (let i = 0; i < mainMarch.blocks.length; i++) {
      let currBlock = mainMarch.blocks[i];
      for (let j = 0; j < currBlock.triangles.length; j++) {
        cubeMarch.draw(currBlock.triangles[j]);
      }
    }
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
