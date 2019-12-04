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
  'Cubes Across' : 10,                    // X,Y,Z number of cubes
  'Show Marching Cube Divisions' : false, // Displays the dots that show Cube layout
  'Hide Mesh Cappy' : false,              // Hides mesh output
  'Hide SDF Cappy' : true,                // Hides original SDF
};

let screenQuad: Square;

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // GUI CONTROLS
  const gui = new DAT.GUI();
  // Look above for descriptions of each
  var cubesAcross = gui.add(controls, 'Cubes Across', 5, 100).step(1);
  var showPoints = gui.add(controls, 'Show Marching Cube Divisions');
  var showMesh = gui.add(controls, 'Hide Mesh Cappy');
  var showCappy = gui.add(controls, 'Hide SDF Cappy');

  // Values that are set via gui
  let pointCheck = false;
  let meshCheck = false;


  // Get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');

  function setSize(width: number, height: number) {
    canvas.width = width;
    canvas.height = height;
  }

  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  setGL(gl);

  screenQuad = new Square(vec3.fromValues(0, 0, 0));
  screenQuad.create();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.disable(gl.DEPTH_TEST);


  // SHADERS
  const raymarchShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/screenspace-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/raymarch-frag.glsl')),
  ]);

  // An adaptable shader that can handle drawing dots or triangles
  const cubeMarch = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/marching-cubes-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/marching-cubes-frag.glsl')),
  ]);
  

  // ****YEP SO CUBE MARCHING HAPPENS FIRST BC NO COMPUTE SHADER :(****
  // - Initialize March structure - contains block vertices and divisions
  let mainMarch: March;
  
  // Primary function calls to generate the mesh
  // This function allows a 'reset' every time the divisions value changes
  function divisionsReset(divis: number) {
    mainMarch = new March(vec3.fromValues(1.7, 1.7, 1.8), // AABB Scale
                          vec3.fromValues(0.0, -0.1, -0.2), // AABB Translation
                          divis);

    // To be parallelized in a compute shader
    mainMarch.testVertexSDFs();
    mainMarch.testBoxValues();
    mainMarch.setTriangles();

    mainMarch.create();

    mainMarch.callMeshClass();
    mainMarch.finalMesh.create();
  }
  divisionsReset(10);
  // *****************************************************************
  
  // used as input to function below:
  let cModelMat = mat4.create();
  mat4.identity(cModelMat);

  // Sets the uniform values in the adaptable shader
  function setVals(modelMat: mat4) {
    cubeMarch.setEye(camera.controls.eye);
    cubeMarch.setViewMatrix(camera.viewMatrix);
    cubeMarch.setProjectionMatrix(camera.projectionMatrix);
    cubeMarch.setDimensions(vec2.fromValues(window.innerWidth, window.innerHeight));
    cubeMarch.setModelMatrix(modelMat);
  }

  let time = 0.; // not used any more

  // Initializing the raymarcher to only draw a background (no cappy)
  raymarchShader.setUnifDrawMode(1);

  // RUNNABLE FUNCTION: This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Uniforms to be sent to the raymarch shader
    raymarchShader.setEye(camera.controls.eye);
    raymarchShader.setViewMatrix(camera.viewMatrix);
    raymarchShader.setProjectionMatrix(camera.projectionMatrix);
    raymarchShader.setDimensions(vec2.fromValues(window.innerWidth, window.innerHeight));
    raymarchShader.setTime(time);

    // Interactive GUI updates
    cubesAcross.onChange(function(value: number) {
      divisionsReset(value);
    })
    showPoints.onChange(function(value: boolean) {
      pointCheck = value;
    })
    showMesh.onChange(function(value: boolean) {
      meshCheck = value;
    })
    showCappy.onChange(function(value: boolean) {
      if (value) { raymarchShader.setUnifDrawMode(1); } // 1 = Only background
      else       { raymarchShader.setUnifDrawMode(0); } // 0 = Cappy and background
    })

    // March!
    raymarchShader.draw(screenQuad);

    // Dont want depth enabled for SDFs, do for mesh and points
    gl.enable(gl.DEPTH_TEST);

    // Update uniform variables (and set shader to work for gl.Points)
    setVals(cModelMat);
    cubeMarch.setUnifDrawMode(2);

    //    - Draw Cube points display for debugging putposes
    if (pointCheck) { cubeMarch.draw(mainMarch); }

    // Change the shader to work for gl.Triangles
    cubeMarch.setUnifDrawMode(0);
    
    // Draw mesh from cube marching
    if (!meshCheck) { cubeMarch.draw(mainMarch.finalMesh); }

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
