// Global variable definitionvar canvas;
var canvas;
var gl;
var shaderProgram;

var cameraCoord = [0,0,0];
var cameraLastPos = [xPosition, yPosition, zPosition];


//ured kodo na integracijo tvoje kode
/*
var ghosts = [[2, 30, 4, 28], [6, 26, 8, 24], [10, 22, 12, 20]];
// 2, 4, 2
var ghostsCoords = [[4, 6, 4, 6], [6, 8, 6, 8], [10, 12, 10, 12]];
var ghostsCD = [[2, 4, 4, 6], [4, 6, 6, 8], [8, 10, 10, 12]];
*/
//var ghosts = [[2, 30, 4, 28], [6, 26, 8, 24], [10, 22, 12, 20]]; //pove kje se bo fural
// 2, 4, 2
//var ghostsCoords = [[4, 6, 4, 6], [6, 8, 6, 8], [10, 12, 10, 12]]; //kje se trenutno nahaja
//var ghostsCD = [[2, 4, 4, 6], [4, 6, 6, 8], [8, 10, 10, 12]]; //zazna njegov mest pa kje se
/*var ghosts = [[2, 30, 4, 28], [6, 26, 8, 24], [10, 22, 12, 20]]; //pove kje se bo fural
var ghostsCoords = [[4, 6, 4, 6], [6, 8, 6, 8], [10, 12, 10, 12]]; //kje se trenutno nahaja
var ghostsCD = [[2, 4, 4, 6], [4, 6, 6, 8], [8, 10, 10, 12]]; //TODO tasredn se zaleti tm na zečtku,
*/
var ghosts = [[2, 30, 4, 28], [6, 26, 8, 24], [10, 22, 12, 20], [10, 22, 12, 20], [10, 22, 12, 20]]; //pove kje se bo fural, šretty useless but the code needs it
// var ghostsCoords = [[4, 6, 4, 6], [4, 6, 6, 8], [10, 12, 10, 12]]; //kje se trenutno nahaja
var ghostsCoords = [[18+2, 18, 22-9, 6], [8, 6, -3, 8], [12, 12, 1, 12], [36+4, 38, 6-9, 8], [30+4, 32, 40-9, 42]]; //kje se trenutno nahaja zamik: gc[0]+2ali4?mogočeTaNi,gc[2]-9
//sam te dve koordinati sta pomembni
var ghostsCD = [[16, 18, 22, 24], [4, 6, 6, 8], [8, 10, 10, 12], [36, 38, 6, 8], [30, 32, 40, 42]]; //TODO tasredn se zaleti tm na zečtku,



// Buffers

var life = 3;

// Buffers
var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
var groundVertexPositionBuffer;
var groundVertexTextureCoordBuffer;
var groundVertexIndexBuffer;
// Model-view and projection matrix and model-view matrix stack
var mvMatrixStack = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

// Variables for storing textures
var cubeTexture;
var groundTexture;
var victoryBoxTexture;
var cubeTextureGhosts;
var cubeTexture5;
var cubeTexture6;

// Variable that stores  loading state of textures.
var texturesLoaded = false;

// Variables for storing curent rotation of cube
var lastTime = 0;

var pitch = 0;
var pitchRate = 0;
var yaw = 180;
var yawRate = 0;
var speed = 0;
var xPosition = 0;
var yPosition = 0.4;
var zPosition = -4;
// Used to make us "jog" up and down as we move forward.
var joggingAngle = 0;

var tloris;

var currentlyPressedKeys = {};


//AUDIO:
var audio = new Audio('./assets/footstep.wav');
var audiofast = new Audio('./assets/footstepfast.wav');
var music = new Audio('./assets/music.mp3');



//
// Matrix utility functions
//
// mvPush   ... push current matrix on matrix stack
// mvPop    ... pop top matrix from stack
// degToRad ... convert degrees to radians
//
function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

//
// initGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initGL(canvas) {
  var gl = null;
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch(e) {}

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  return gl;
}


function checkForCollision(){
  //var xZid = [[0, 2]];
  //var zZid = [[4, 32]];
  var objekti = [
  [-2, 44, 0, 2],
  [-4, -2, -2, 44],
  [38, 40, -2, 44],
  [-4, 44, 42, 44],
  [0, 2, 2, 6],
  [4, 10, 4, 6],
  [12, 14, 4, 6],
  [16, 18, 4, 6],
  [20, 26, 4, 6],
  [28, 30, 4, 6],
  [32, 34, 4, 6],
  [36, 38, 4, 6],
  [-2, 6, 8, 10],
  [8, 36, 8, 10],
  [0, 4, 10, 12],
  [16, 18, 10, 16],
  [26, 28, 10, 20],
  [34, 36, 10, 12],
  [6, 8, 12, 14],
  [10, 12, 12, 28],
  [22, 24, 12, 28],
  [0, 4, 14, 16],
  [2, 4, 14, 22],
  [12, 20, 14, 16],
  [30, 32, 14, 40],
  [6, 8, 16, 22],
  [18, 20, 16, 18],
  [14, 16, 18, 22],
  [0, 6, 20, 22],
  //[12, 14, 20, 24], win point?
  [12, 14, 22, 24], //dodan ker sm win point odstranu?
  [18, 20, 20, 24],
  [-2, 0, 24, 26],
  [2, 6, 24, 26],
  [4, 6, 24, 28],
  [18, 20, 24, 26],
  [26, 28, 24, 26],
  [32, 36, 24, 26],
  [20, 30, 26, 28],
  [0, 2, 28, 30],
  //![0, 2, 28, 32], prever če kaka stena fali
  [4, 6, 30, 32],
  [8, 10, 30, 40],
  [14, 18, 30, 32],
  [22, 24, 30, 42],
  [-2, 2, 32, 34],
  [26, 28, 32, 36],
  [4, 14, 34, 36],
  [36, 38, 34, 36],
  [-2, 0, 36, 38],
  [0, 2, 38, 40],
  [16, 18, 38, 40],
  [26, 30, 38, 40],
  [34, 36, 38, 42],
  [14, 18, 40, 42],
  [34, 36, 40, 42],
                 ];

var zmagovalniObjekt = [
  [12, 14, 20, 22]];

  var win=false;
  var collide = false;
  for(var i = 0; i < objekti.length; i++){
    if (cameraCoord[2] > objekti[i][2] - 0.2 && cameraCoord[2] < objekti[i][3] + 0.5 && cameraCoord[0] > objekti[i][0] - 0.3 && cameraCoord[0] < objekti[i][1]+0.5){
      if(cameraCoord[2] > objekti[i][2]+0.35 && cameraCoord[2] < objekti[i][3]){
        mat4.translate(pMatrix, [-cameraLastPos[0], -yPosition, -zPosition]);
        xPosition = cameraLastPos[0];
        collide = true;
        break;
      }else{
        mat4.translate(pMatrix, [-xPosition, -yPosition, -cameraLastPos[2]]);
        zPosition = cameraLastPos[2];
        collide = true;
        break;
      }
    }else{
      
    }
  }

  for(var i = 0; i < zmagovalniObjekt.length; i++){
    if (cameraCoord[2] > zmagovalniObjekt[i][2] - 0.2 && cameraCoord[2] < zmagovalniObjekt[i][3] + 0.5 && cameraCoord[0] > zmagovalniObjekt[i][0] - 0.3 && cameraCoord[0] < zmagovalniObjekt[i][1]+0.5){
      preusmeri("./victory.html");
    }
  }


  var ghost = false;
  for (var i = 0; i < ghostsCD.length; i++) {
    if (cameraCoord[2] > ghostsCD[i][2] - 0.2)
      if (cameraCoord[2] < ghostsCD[i][3] + 0.5)
        if (cameraCoord[0] > ghostsCD[i][0] - 0.3)
          if (cameraCoord[0] < ghostsCD[i][1] + 0.5)
            if (0 < cameraCoord[1] && 2 > cameraCoord[1]) {
              takeLife();
            }

          }






  if (!collide){
    mat4.translate(pMatrix, [-xPosition, -yPosition, -zPosition]);
    cameraLastPos[0] = xPosition;
    cameraLastPos[1] = yPosition;
    cameraLastPos[2] = zPosition;
  }
}

function preusmeri(inputurl){
        //var b = document.getElementById('name').value,
        url = inputurl; //+ encodeURIComponent(b);
        document.location.href = url;
      }

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.
  if (!shaderScript) {
    return null;
  }
  
  // Walk through the source element's children, building the
  // shader source string.
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
        shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
  
  // Now figure out what type of shader script we have,
  // based on its MIME type.
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object
  gl.shaderSource(shader, shaderSource);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");
  
  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  // start using shading program for rendering
  gl.useProgram(shaderProgram);
  
  // store location of aVertexPosition variable defined in shader
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  
  // turn on vertex position attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  // store location of aTextureCoord variable defined in shader
  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");

  // turn on vertex texture coordinates attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  // store location of uPMatrix variable defined in shader - projection matrix 
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  // store location of uMVMatrix variable defined in shader - model-view matrix 
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

  // store location of uSampler variable defined in shader
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

//
// setMatrixUniforms
//
// Set the uniform values in shaders for model-view and projection matrix.
//
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
function initTextures() {
  cubeTexture = gl.createTexture();
  cubeTexture.image = new Image();
  cubeTexture.image.onload = function() {
    handleTextureLoaded(cubeTexture);
  };  // async loading
  cubeTexture.image.src = "./assets/doom.jpg";
}

function handleTextureLoaded(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);

}

function initTexturesFloor() {
  groundTexture = gl.createTexture();
  groundTexture.image = new Image();
  groundTexture.image.onload = function() {
    handleTextureLoadedFloor(groundTexture);
  };  // async loading
  groundTexture.image.src = "./assets/gorefloor.jpg";
}

function handleTextureLoadedFloor(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);

  // when texture loading is finished we can draw scene.
  texturesLoaded = true;
}

function initTexturesVictoryBox() {
  victoryBoxTexture = gl.createTexture();
  victoryBoxTexture.image = new Image();
  victoryBoxTexture.image.onload = function() {
    handleTextureLoadedVictoryBox(victoryBoxTexture);
  };  // async loading
  victoryBoxTexture.image.src = "./assets/door.jpg";
}

function handleTextureLoadedVictoryBox(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);

  // when texture loading is finished we can draw scene.
  texturesLoaded = true;
}



function initTextures5(){
    cubeTexture5 = gl.createTexture();
    cubeTexture5.image = new Image();
    cubeTexture5.image.onload = function () {
        handleTextureLoaded5(cubeTexture5);
    };  // async loading
    cubeTexture5.image.src = "./assets/marker.png";
}

function handleTextureLoaded5(texture){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    texturesLoaded = true;
}

function initTexturesGhosts() {
    cubeTextureGhosts = gl.createTexture();
    cubeTextureGhosts.image = new Image();
    cubeTextureGhosts.image.onload = function () {
        handleTextureLoadedGhosts(cubeTextureGhosts);
    };  // async loading
    cubeTextureGhosts.image.src = "./assets/dead.jpg";
}

function handleTextureLoadedGhosts(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // when texture loading is finished we can draw scene.
    initTextures5();
}

function initTextures6(){
    cubeTexture6 = gl.createTexture();
    cubeTexture6.image = new Image();
    cubeTexture6.image.onload = function () {
        handleTextureLoaded6(cubeTexture6);
    };  // async loading
    cubeTexture6.image.src = "./assets/sky.png";
}

function handleTextureLoaded6(texture){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    texturesLoaded = true;
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple cube.
//
function initBuffers() {

  // Create a buffer for the cube's vertices.
  cubeVertexPositionBuffer = gl.createBuffer();
  
  // Select the cubeVertexPositionBuffer as the one to apply vertex
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  
  // Now create an array of vertices for the cube.
  vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];
  
  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVertexPositionBuffer.itemSize = 3;
  cubeVertexPositionBuffer.numItems = 24;

  // Map the texture onto the cube's faces.
  cubeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  
  // Now create an array of vertex texture coordinates for the cube.
  var textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    0.0,  0.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    0.0,  0.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0
  ];

  // Pass the texture coordinates into WebGL
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  cubeVertexTextureCoordBuffer.itemSize = 2;
  cubeVertexTextureCoordBuffer.numItems = 24;

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.
  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  
  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ];
  
  // Now send the element array to GL
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  cubeVertexIndexBuffer.itemSize = 1;
  cubeVertexIndexBuffer.numItems = 36;
}

//
// drawScene
//
// Draw the scene.
//

//mat4.translate(pMatrix, [4,0,4]);
//setMatrixUniforms();

function drawScene() {
  // set the rendering environment to full canvas size
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  mat4.identity(mvMatrix);
  //mat4.rotate(pMatrix, degToRad(180), [0,1,0]);
  // Now move the drawing position a bit to where we want to start
  // drawing the cube.

  //GRADNJA LABIRINTA
  //mat4.translate(pMatrix, [0,0,2]);
  mat4.translate(pMatrix, [0,0,-6]);
  if (tloris){
    mat4.rotate(pMatrix, degToRad(90), [1, 0, 0]);
    mat4.translate(pMatrix, [0,-30,6]);
  }else{
    mat4.rotate(pMatrix, degToRad(15), [1,0,0]);
    mat4.translate(pMatrix, [0, 0, 6]);
  }
  //SAMO OPAZOVANJE



  // OBRAČANJE KAMERE LEVO IN DESNO
  //mat4.translate(pMatrix, [0,0,-6]);
  mat4.rotate(pMatrix, degToRad(-yaw), [0,1,0]);
  mat4.translate(pMatrix, [-2, 0, 3]); //zmer od začetka riše zato je to konstanta...
  //mat4.translate(pMatrix, [-xPosition, -yPosition, -zPosition]);

  cameraCoord = [xPosition - 0.86, yPosition, zPosition + 7.2];
  //console.log(xPosition - 0.86, yPosition, zPosition + 7.2);

  checkForCollision();
  //console.log(cameraCoord);

  mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);


  //drawFloor
  specifeTextureAndFloor()
  drawFloor();
  specifeTextureAndCube();
  drawSideWalls();

  //mvPushMatrix();
  mat4.translate(mvMatrix, [0.0, 0.0, -38.0]);
  drawInsideWalls();


  specifeTextureForMarker(); //added
  drawMe();



  specifeTextureAndWin();
  mat4.identity(mvMatrix);
  mvPushMatrix();
  mat4.translate(mvMatrix,[2*8,2,11])
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0); 
  mvPopMatrix();

  specifeTextureForGhosts();
  drawGhosts();

  specifeTextureForSky() //sky block
  mvPushMatrix();
  mat4.scale(mvMatrix, [50, 50, 50]);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  mvPopMatrix();
  //gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0); 



}

function resetStartPosition(){
    yaw = 180;
    xPosition = 0;
    yPosition = 0.4;
    zPosition = -4;
}


function takeLife(){ //TODO
    //Remove life icon
    document.getElementById("life" + life).style.visibility = 'hidden';
    //Show blood for one second
    var bloodBG = document.getElementById("bloodBG");
    bloodBG.style.display="block";
    setTimeout(function(){
        bloodBG.style.display = "none";
    }, 1000);
    //Reset start position
    resetStartPosition();
    life--;
    if(life == 0){
        document.location.href = "./seminarskaGO2.html";
    }
    //console.log("TRK Z ROBOTOM");
}

function specifeTextureForMarker(){
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Specify the texture to map onto the faces.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture5);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}

function specifeTextureAndWin(){
  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Specify the texture to map onto the faces.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, victoryBoxTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}

function specifeTextureAndFloor(){
  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Specify the texture to map onto the faces.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, groundTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}


function specifeTextureAndCube(){
  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Specify the texture to map onto the faces.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}

function specifeTextureForSky() {
    // Draw the cube by binding the array buffer to the cube's vertices
    // array, setting attributes, and pushing it to GL.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Specify the texture to map onto the faces.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture6);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}


function specifeTextureForGhosts() {
    // Draw the cube by binding the array buffer to the cube's vertices
    // array, setting attributes, and pushing it to GL.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Specify the texture to map onto the faces.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTextureGhosts);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}

var moveInterval=0;
var moveInterval1=0;
var moveInterval2=0; 
var moveInterval3=0;
var moveInterval4=0;
var moveInterval5=0;

function drawGhosts() {
    var ghostSpeed = 0.05;
    mvPushMatrix();
    mat4.translate(mvMatrix, [0, 2, 0]);
    

    /* preizkus iskanja...
    moveInterval=(++moveInterval)%100;
    if(moveInterval<50){
    	ghostsCoords[1][0] += ghostSpeed;
    	ghostsCoords[1][1] += ghostSpeed;
    }
    else{
    	ghostsCoords[1][0] -= ghostSpeed;
    	ghostsCoords[1][1] -= ghostSpeed;
    }*/
  


    //DUH 2
    if(moveInterval1<120||moveInterval1>440){
    	ghostsCoords[1][0] += ghostSpeed;
    	ghostsCD[1][0] += ghostSpeed;
    	ghostsCD[1][1] += ghostSpeed
    }
    else if (moveInterval1<=200){
    	ghostsCoords[1][2] -= ghostSpeed;
    	ghostsCD[1][2] -= ghostSpeed;
    	ghostsCD[1][3] -= ghostSpeed
    }
    else if (moveInterval1<=360){
    	ghostsCoords[1][0] -= ghostSpeed;
    	ghostsCD[1][0] -= ghostSpeed;
    	ghostsCD[1][1] -= ghostSpeed
    }
    else if (moveInterval1<=440){
    	ghostsCoords[1][2] += ghostSpeed;
    	ghostsCD[1][2] += ghostSpeed;
    	ghostsCD[1][3] += ghostSpeed
    }

  

    //DUH 1
    if(moveInterval2<80){
      ghostsCoords[2][0] -= ghostSpeed;
      ghostsCD[2][0] -= ghostSpeed;
      ghostsCD[2][1] -= ghostSpeed
    }
    else if (moveInterval2<160){
      ghostsCoords[2][2] += ghostSpeed;
      ghostsCD[2][2] += ghostSpeed;
      ghostsCD[2][3] += ghostSpeed
    }
    else if (moveInterval2<240){
      ghostsCoords[2][0] += ghostSpeed;
      ghostsCD[2][0] += ghostSpeed;
      ghostsCD[2][1] += ghostSpeed
    }
    else if (moveInterval2<320){
      ghostsCoords[2][2] -= ghostSpeed;
      ghostsCD[2][2] -= ghostSpeed;
      ghostsCD[2][3] -= ghostSpeed
    }

    //DUH 3
    if(moveInterval3<80){
      ghostsCoords[0][2] -= ghostSpeed;
      ghostsCD[0][2] -= ghostSpeed;
      ghostsCD[0][3] -= ghostSpeed
    }
    else if (moveInterval3<160){
      ghostsCoords[0][0] += ghostSpeed;
      ghostsCD[0][0] += ghostSpeed;
      ghostsCD[0][1] += ghostSpeed
    }
    else if (moveInterval3<280){
      ghostsCoords[0][2] += ghostSpeed;
      ghostsCD[0][2] += ghostSpeed;
      ghostsCD[0][3] += ghostSpeed
    }
    else if (moveInterval3<400){
      ghostsCoords[0][2] -= ghostSpeed;
      ghostsCD[0][2] -= ghostSpeed;
      ghostsCD[0][3] -= ghostSpeed
    }
    else if (moveInterval3<480){
      ghostsCoords[0][0] -= ghostSpeed;
      ghostsCD[0][0] -= ghostSpeed;
      ghostsCD[0][1] -= ghostSpeed
    }
    else if (moveInterval3<560){
      ghostsCoords[0][2] += ghostSpeed;
      ghostsCD[0][2] += ghostSpeed;
      ghostsCD[0][3] += ghostSpeed
    }


    if(moveInterval4<500){
      ghostsCoords[3][2] += ghostSpeed;
      ghostsCD[3][2] += ghostSpeed;
      ghostsCD[3][3] += ghostSpeed
    }
    else{
      ghostsCoords[3][2] -= ghostSpeed;
      ghostsCD[3][2] -= ghostSpeed;
      ghostsCD[3][3] -= ghostSpeed
    }

    
    if(moveInterval5<120){
      ghostsCoords[4][0] -= ghostSpeed;
      ghostsCD[4][0] -= ghostSpeed;
      ghostsCD[4][1] -= ghostSpeed
    }
    else if (moveInterval5<360){
      ghostsCoords[4][2] -= ghostSpeed;
      ghostsCD[4][2] -= ghostSpeed;
      ghostsCD[4][3] -= ghostSpeed
    }
    else if (moveInterval5<440){
      ghostsCoords[4][0] += ghostSpeed;
      ghostsCD[4][0] += ghostSpeed;
      ghostsCD[4][1] += ghostSpeed
    }
    else if (moveInterval5<600){
      ghostsCoords[4][2] += ghostSpeed;
      ghostsCD[4][2] += ghostSpeed;
      ghostsCD[4][3] += ghostSpeed
    }
    else if (moveInterval5<680){
      ghostsCoords[4][0] -= ghostSpeed;
      ghostsCD[4][0] -= ghostSpeed;
      ghostsCD[4][1] -= ghostSpeed
    }
    else if (moveInterval5<760){
      ghostsCoords[4][2] += ghostSpeed;
      ghostsCD[4][2] += ghostSpeed;
      ghostsCD[4][3] += ghostSpeed
    }
    else{
      ghostsCoords[4][0] += ghostSpeed;
      ghostsCD[4][0] += ghostSpeed;
      ghostsCD[4][1] += ghostSpeed
    } 

    moveInterval++;
    moveInterval1=moveInterval%480;
    moveInterval2=moveInterval%320;
    moveInterval3=moveInterval%560;
    moveInterval4=moveInterval%1000;
    moveInterval5=moveInterval%880;

   /* moveInterval1=(++moveInterval1)%480;
    moveInterval2=(++moveInterval2)%320;
    moveInterval3=(++moveInterval3)%560;
    //console.log(moveInterval1);
    */
    


    for (var i = 0; i < ghosts.length; i++) {
        mvPushMatrix();
        mat4.translate(mvMatrix, [ghostsCoords[i][0], 0, ghostsCoords[i][2]]);
        mat4.scale(mvMatrix, [0.2, 0.2, 0.2]);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        mvPopMatrix();
    }
    mvPopMatrix();
}

function drawMe(){
    mvPushMatrix();
    mat4.translate(mvMatrix, [cameraCoord[0] + 3, cameraCoord[1] + 0, cameraCoord[2]-43]);
    mat4.scale(mvMatrix, [0.2, 0.2, 0.2]);
    mat4.rotate(mvMatrix, degToRad(yaw), [0, 1, 0]);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix();
}





var stKock = 20;

function drawFloor(){
  // Draw the cube.
  //var stKock = 20;
  for(var i = 0; i < stKock; i++){
    mvPushMatrix();
    for(var j = 0; j < stKock; j++){
      mat4.translate(mvMatrix, [2, 0, 0]);
      setMatrixUniforms();
      gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);      
    }
    mvPopMatrix();
    mat4.translate(mvMatrix, [0, 0, 2]);
  }
}

var zid = [
  [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0],
  [0,0,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0,0,0,0],
  [0,1,1,0,0,0,1,1,1,1,1,0,1,0,1,0,1,0,1,0],
  [0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1,0],
  [0,0,1,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0],
  [0,1,1,1,1,0,1,1,1,0,1,0,1,0,0,0,1,0,0,0],
  [0,0,0,0,0,0,1,1,0,0,1,0,1,0,0,0,1,0,0,0],
  [1,0,1,1,0,0,1,0,0,0,1,0,1,0,1,0,1,1,1,0],
  [0,0,0,1,0,0,1,1,0,0,0,1,1,1,1,1,1,0,0,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0],
  [0,0,0,1,0,1,0,0,1,1,0,0,1,0,0,0,1,0,1,0],
  [1,1,0,0,0,1,0,0,0,0,0,0,1,0,1,0,1,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0,0,1,0,1,0,1,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0],
  [0,1,0,0,0,1,0,0,0,1,0,0,1,0,1,1,1,0,1,0],
  [0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,0,1,0]];


function drawInsideWalls(){
  // Draw the cube.
  //var stKock = 20;
  for(var i = 0; i < stKock; i++){
    mvPushMatrix();
    for(var j = 0; j < stKock; j++){
      mat4.translate(mvMatrix, [2, 0, 0]);
      if(i!=9||j!=7){

      if(zid[i][j]==1){
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }      
      }
    }
    mvPopMatrix();
    mat4.translate(mvMatrix, [0, 0, 2]);
  }

  //setMatrixUniforms();
  //gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawSideWalls(){
  mat4.translate(mvMatrix, [-2, 2, 0]);
  for (var i = 0; i <= stKock; i++) {
    mat4.translate(mvMatrix, [2, 0, 0]);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }

  mat4.translate(mvMatrix, [-stKock*2, 0, -stKock*2-2]);

  for (var i = 0; i <= stKock; i++) {
    mat4.translate(mvMatrix, [2, 0, 0]);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }

  for (var i = 0; i <= stKock; i++) {
    mat4.translate(mvMatrix, [0, 0, 2]);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }

  mat4.translate(mvMatrix, [-stKock*2-2, 0, -stKock*2-4]);

  for (var i = 0; i <= stKock; i++) {
    mat4.translate(mvMatrix, [0, 0, 2]);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }

}


//
// animate
//
// Called every time before redeawing the screen.
//
function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;

    if (speed != 0) {
      xPosition -= Math.sin(degToRad(yaw)) * speed * elapsed;
      zPosition -= Math.cos(degToRad(yaw)) * speed * elapsed;

      joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - makes it feel more realistic :-)
      yPosition = Math.sin(degToRad(joggingAngle)) / 20 + 0.4
    }

    yaw += yawRate * elapsed;
    pitch += pitchRate * elapsed;
  }
  lastTime = timeNow;
}

function handleKeyDown(event) {
  // storing the pressed state for individual key
  
  currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
  // reseting the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = false;
}

//
// handleKeys
//
// Called every time before redeawing the screen for keyboard
// input handling. Function continuisly updates helper variables.
//
function handleKeys() {
  if (currentlyPressedKeys[33]) {
    // Page Up
    pitchRate = 0.1;
  } else if (currentlyPressedKeys[34]) {
    // Page Down
    pitchRate = -0.1;
  } else {
    pitchRate = 0;
  }

  if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
    // Left cursor key or A
    yawRate = 0.1;
  } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
    // Right cursor key or D
    yawRate = -0.1;
  } else {
    yawRate = 0;
  }

  if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
    // Up cursor key or W
    
    speed = 0.006;
    if(currentlyPressedKeys[16]){
      audiofast.play();
      speed = 0.009;
    }
    else
      audio.play();

  } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
    // Down cursor key
    audio.play();
    speed = -0.006;
  } else {
    speed = 0;
  }

  if (currentlyPressedKeys[77]){
    tloris = true;
  }else{
    tloris = false;
  }

}


//
// start
//
// Called when the canvas is created to get the ball rolling.ß
//
function start() {
  canvas = document.getElementById("glcanvas");

  gl = initGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
    gl.clearDepth(1.0);                                     // Clear everything
    gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.
    initShaders();
    
    // Here's where we call the routine that builds all the objects
    // we'll be drawing.
    initBuffers();
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    // Next, load and set up the textures we'll be using.
    music.play();
    initTextures();
    initTexturesFloor();
    initTexturesVictoryBox();
    initTexturesGhosts();
    initTextures6();
    
    // Set up to draw the scene periodically.
    setInterval(function() {
      if (texturesLoaded) { // only draw scene and animate when textures are loaded.
        requestAnimationFrame(animate);
        handleKeys();
        drawScene();
        music.play();
      }
    }, 15);
  }
}
