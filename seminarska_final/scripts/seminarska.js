// Global variable definitionvar canvas;
var gl;
var shaderProgram;

// Buffers
var pyramidVertexPositionBuffer;
var pyramidVertexColorBuffer;
var cubeVertexPositionBuffer;
var cubeVertexColorBuffer;
var cubeVertexIndexBuffer;
var groundVertexPositionBuffer;
var groundVertexColorBuffer;

// Model-view and projection matrix and model-view matrix stack
var mvMatrixStack = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

// Variables for storing curent rotation of pyramid and cube
var rotationPyramid = 0;
var rotationCube = 0;

// Helper variable for animation
var lastTime = 0;

var pitch = 0;
var pitchRate = 0;
var yaw = 0;
var yawRate = 0;
var speed = 0;
var xPosition = 0;
var yPosition = 0.4;
var zPosition = 0;
// Used to make us "jog" up and down as we move forward.
var joggingAngle = 0;

var currentlyPressedKeys = {};
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

  // store location of aVertexColor variable defined in shader
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");

  // turn on vertex color attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  // store location of uPMatrix variable defined in shader - projection matrix 
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");

  // store location of uMVMatrix variable defined in shader - model-view matrix 
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
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
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we have
// two objecta -- a simple cube and pyramidß.
//
function initBuffers() {
  //GROUND

  groundVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexPositionBuffer);
  var vertices = [
    -1, -1, 0,
    -1,  1, 0,
     1, -1, 0,
     1,  1, 0   
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  groundVertexPositionBuffer.itemSize = 3;
  groundVertexPositionBuffer.numItems = 4;

  groundVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexColorBuffer);
  var colors = [
    1.0, 1.0, 1.0, 1.0, 
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  groundVertexColorBuffer.itemSize = 2;
  groundVertexColorBuffer.numItems = 4;

  // PYRAMID
  // Create a buffer for the pyramid's vertices.
  pyramidVertexPositionBuffer = gl.createBuffer();

  // Select the pyramidVertexPositionBuffer as the one to apply vertex
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
  var vertices = [
    // Front face
     0.0,  2.0,  0.0,
    -1.0,  0.0,  1.0,
     1.0,  0.0,  1.0,
    // Right face
     0.0,  2.0,  0.0,
     1.0,  0.0,  1.0,
     1.0,  0.0, -1.0,
    // Back face
     0.0,  2.0,  0.0,
     1.0,  0.0, -1.0,
    -1.0,  0.0, -1.0,
    // Left face
     0.0,  2.0,  0.0,
    -1.0,  0.0, -1.0,
    -1.0,  0.0,  1.0
  ];

  // Pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  pyramidVertexPositionBuffer.itemSize = 3;
  pyramidVertexPositionBuffer.numItems = 12;

  // Now set up the colors for the vertices
  pyramidVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
  var colors = [
    // Front face
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    // Right face
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    // Back face
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    // Left face
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 1.0
  ];

  // Pass the colors into WebGL
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  pyramidVertexColorBuffer.itemSize = 4;
  pyramidVertexColorBuffer.numItems = 3;
  
  // CUBE
  // Create a buffer for the cube's vertices.
  cubeVertexPositionBuffer = gl.createBuffer();
  
  // Select the cubeVertexPositionBuffer as the one to apply vertex
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  
  // Now create an array of vertices for the cube.
  vertices = [
    // Front face
    -1.0,  0.0,  1.0,
     1.0,  0.0,  1.0,
     1.0,  2.0,  1.0,
    -1.0,  2.0,  1.0,

    // Back face
    -1.0,  0.0, -1.0,
    -1.0,  2.0, -1.0,
     1.0,  2.0, -1.0,
     1.0,  0.0, -1.0,

    // Top face
    -1.0,  2.0, -1.0,
    -1.0,  2.0,  1.0,
     1.0,  2.0,  1.0,
     1.0,  2.0, -1.0,

    // Bottom face
    -1.0,  0.0, -1.0,
     1.0,  0.0, -1.0,
     1.0,  0.0,  1.0,
    -1.0,  0.0,  1.0,

    // Right face
     1.0,  0.0, -1.0,
     1.0,  2.0, -1.0,
     1.0,  2.0,  1.0,
     1.0,  0.0,  1.0,

    // Left face
    -1.0,  0.0, -1.0,
    -1.0,  0.0,  1.0,
    -1.0,  2.0,  1.0,
    -1.0,  2.0, -1.0
  ];
  
  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVertexPositionBuffer.itemSize = 3;
  cubeVertexPositionBuffer.numItems = 24;

  // Now set up the colors for the vertices. We'll use solid colors
  // for each face.
  cubeVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
  colors = [
      [0.5, 0.0, 0.0, 1.0], // Front face
      [1.0, 1.0, 0.0, 1.0], // Back face
      [0.0, 1.0, 0.0, 1.0], // Top face
      [1.0, 0.5, 0.5, 1.0], // Bottom face
      [1.0, 0.0, 1.0, 1.0], // Right face
      [0.0, 0.0, 1.0, 1.0]  // Left face
  ];

  // Convert the array of colors into a table for all the vertices.
  var unpackedColors = [];
  for (var i in colors) {
    var color = colors[i];

    // Repeat each color four times for the four vertices of the face
    for (var j=0; j < 4; j++) {
          unpackedColors = unpackedColors.concat(color);
      }
  }

  // Pass the colors into WebGL
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  cubeVertexColorBuffer.itemSize = 4;
  cubeVertexColorBuffer.numItems = 24;

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.
  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  var cubeVertexIndices = [
      0, 1, 2,      0, 2, 3,    // Front face
      4, 5, 6,      4, 6, 7,    // Back face
      8, 9, 10,     8, 10, 11,  // Top face
      12, 13, 14,   12, 14, 15, // Bottom face
      16, 17, 18,   16, 18, 19, // Right face
      20, 21, 22,   20, 22, 23  // Left face
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
  
  //SETUP POGLED
  mat4.translate(pMatrix, [0,0,-6]);
  mat4.rotate(pMatrix, degToRad(15), [1,0,0]);
  mat4.translate(pMatrix, [0, 0, 6]);
  //SAMO OPAZOVANJE


  // OBRAČANJE KAMERE LEVO IN DESNO
  //mat4.translate(pMatrix, [0,0,-6]);
  mat4.rotate(pMatrix, degToRad(-yaw), [0,1,0]);
  //mat4.translate(pMatrix, [0,0, 6]);
  mat4.translate(pMatrix, [-xPosition, -yPosition, -zPosition]);
  //KONEC SETUP POGLED

  //postavitev okolja
  mat4.translate(mvMatrix, [0, 0, -6]);
  mat4.scale(mvMatrix, [3,3,3]);
  //mat4.rotate(mvMatrix, degToRad(-5), [1,0,0]);

  //izris tal

  // Inicializacija ploskve
  gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, groundVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, groundVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);


  //izris tal
  drawGround();
  


  // tla poderem po x osi za 90 stopinj
  mat4.rotate(mvMatrix, degToRad(90),[1, 0, 0]);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, groundVertexPositionBuffer.numItems);

  // matriko postavim nazaj tako kot je bila
  mat4.rotate(mvMatrix, degToRad(-90),[1, 0, 0]);
  
  



  //Inicializacija za izris kocke
  mvPushMatrix();
  mat4.scale(mvMatrix, [0.2,0.2,0.2]);
  // Draw the pyramid by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the colors attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);


  




  mat4.translate(mvMatrix, [-3, 0, 0]);
  //izris prve kocke
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mat4.translate(mvMatrix, [3, 0, 0]);
  
  // izris druge kocke
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mat4.translate(mvMatrix, [3, 0, 0]);
  // izris tretje kocke
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mvPopMatrix();



}

function drawGround(){
	mat4.rotate(mvMatrix, degToRad(90),[1, 0, 0]);
	mvPushMatrix();
    var n = 20;
  	for (var i = 0; i < n; i++){
  	
  		mvPushMatrix();
	  	for (var j = 0; j < n; j++){
	  		// tla poderem po x osi za 90 stopinj
			mat4.translate(mvMatrix, [2,0,0])
      //ROB LABIRINTA
			if ( i == 0 || j == 0 || i == n - 1 || j == n - 1){
          mvPushMatrix()
          mat4.translate(mvMatrix, [0, -1, -1]);
				  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          // Set the colors attribute for the vertices.
          gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

          mvPopMatrix()
                //setMatrixUniforms();
          				//gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			}
        gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, groundVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
        gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, groundVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

				setMatrixUniforms();
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, groundVertexPositionBuffer.numItems);
	
			
			
			// matriko postavim nazaj tako kot je bila
	  	}
  		mvPopMatrix();	
  		mat4.translate(mvMatrix, [0,2,0]);
  	}
	mvPopMatrix();
	mat4.rotate(mvMatrix, degToRad(-90),[1, 0, 0]);
}


//
// Keyboard handling helper functions
//
// handleKeyDown    ... called on keyDown event
// handleKeyUp      ... called on keyUp event
//
function handleKeyDown(event) {
  // storing the pressed state for individual key
  console.log(speed);
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
  } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
    // Down cursor key
    speed = -0.006;
  } else {
    speed = 0;
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

//
// start
//
// Called when the canvas is created to get the ball rolling.
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
    
    // Set up to draw the scene periodically.
    setInterval(function() {
      requestAnimationFrame(animate);
      handleKeys();
      drawScene();
    }, 15);
  }
}
