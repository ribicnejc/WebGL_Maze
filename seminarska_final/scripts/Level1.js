// Global variable definitionvar canvas;
var canvas;
var gl;
var shaderProgram;
// Set camera coordinates
var cameraCoord = [0, 0, 0];
var cameraLastPos = [xPosition, yPosition, zPosition];
var stuff = 67;

//AUDIO:
var audio = new Audio('./assets/footstep.wav');
var audiofast = new Audio('./assets/footstepfast.wav');
var music = new Audio('./assets/music.mp3');

//gravity
var fallingDown = false;
var fallSpeed = 0.06;

var ghosts = [[2, 30, 4, 28], [6, 26, 8, 24], [10, 22, 12, 20]];
// 2, 4, 2
var ghostsCoords = [[4, 6, 4, 6], [6, 8, 6, 8], [10, 12, 10, 12]];
var ghostsCD = [[2, 4, 4, 6], [4, 6, 6, 8], [8, 10, 10, 12]];
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

//main game variable
var life = 3;


// Variables for storing textures
var cubeTexture;
var cubeTexture2;
var cubeTexture3;
var cubeTexture4;
var cubeTexture5;
var cubeTexture6;
var groundTexture;

// Variable that stores  loading state of textures.
var texturesLoaded = false;

// Variables for storing curent rotation of cube
var lastTime = 0;

//mouse
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

//map
var tloris = false;

// ruders
var pitch = 0;
var pitchRate = 0;
var yaw = -90;
var yawRate = 0;
var speed = 0;
var xPosition = 1.5;
var yPosition = 0.4;
var zPosition = -5;


var yPlezanje = 0;
var climbDown = 1;
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
    } catch (e) {
    }

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

function initTextures6(){
    cubeTexture6 = gl.createTexture();
    cubeTexture6.image = new Image();
    cubeTexture6.image.onload = function () {
        handleTextureLoaded6(cubeTexture6);
    };  // async loading
    cubeTexture6.image.src = "./assets/marker.png";
}

function initTextures5() {
    cubeTexture5 = gl.createTexture();
    cubeTexture5.image = new Image();
    cubeTexture5.image.onload = function () {
        handleTextureLoaded5(cubeTexture5);
    };  // async loading
    cubeTexture5.image.src = "./assets/marker.png";
}

function handleTextureLoaded5(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    initTextures6();
}

function initTextures4() {
    cubeTexture4 = gl.createTexture();
    cubeTexture4.image = new Image();
    cubeTexture4.image.onload = function () {
        handleTextureLoaded4(cubeTexture4);
    };  // async loading
    cubeTexture4.image.src = "./assets/killer.png";
}

function handleTextureLoaded4(texture) {
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

function initTextures3() {
    cubeTexture3 = gl.createTexture();
    cubeTexture3.image = new Image();
    cubeTexture3.image.onload = function () {
        handleTextureLoaded3(cubeTexture3);
    };  // async loading
    cubeTexture3.image.src = "./assets/lojtrica.png";
}

function handleTextureLoaded3(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // when texture loading is finished we can draw scene.
    initTextures4();
}

function initTextures2() {
    cubeTexture2 = gl.createTexture();
    cubeTexture2.image = new Image();
    cubeTexture2.image.onload = function () {
        handleTextureLoaded2(cubeTexture2);
    };  // async loading
    cubeTexture2.image.src = "./assets/gorefloor.jpg";
}

function handleTextureLoaded2(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // when texture loading is finished we can draw scene.
    initTextures3();
    //texturesLoaded = true;
}

function initTextures() {
    cubeTexture = gl.createTexture();
    cubeTexture.image = new Image();
    cubeTexture.image.onload = function () {
        handleTextureLoaded(cubeTexture);
    };  // async loading
    cubeTexture.image.src = "./assets/notcipreska.png";
}

function handleTextureLoaded(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // when texture loading is finished we can draw scene.
    //texturesLoaded = true;
    initTextures2();
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
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0
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
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Back
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        // Top
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Bottom
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Right
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        // Left
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
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
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23    // left
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

    // Now move the drawing position a bit to where we want to start
    // drawing the cube.

    //GRADNJA LABIRINTA
    // TLORIS
    if (tloris) {
        mat4.translate(pMatrix, [0, 0, -6]);
        mat4.rotate(pMatrix, degToRad(90), [1, 0, 0]);
        mat4.translate(pMatrix, [0, -40, 6]);
    } else {
        mat4.translate(pMatrix, [0, 0, -6]);
        mat4.rotate(pMatrix, degToRad(15), [1, 0, 0]);
        mat4.translate(pMatrix, [0, 0, 6]);
    }
    //SAMO OPAZOVANJE


    // OBRAČANJE KAMERE LEVO IN DESNO
    //mat4.translate(pMatrix, [0,0,-6]);
    mat4.rotate(pMatrix, degToRad(-yaw), [0, 1, 0]);
    //mat4.translate(pMatrix, [0,0, 6]);


    // postavim koordinate kamere na 0 z odštevanjem teh čudnih števil
    cameraCoord = [xPosition - 0.86, yPosition, zPosition + 8.2];
    //console.log(xPosition - 0.86, yPosition, zPosition + 8.2);

    // first check for collision if is some then you dont move the camera
    // if(!fallingDown)
    checkForCollision();
    // else
    //     fallDownAnimation();
    //mat4.translate(pMatrix, [-xPosition, -yPosition, -zPosition]);


    mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);

    specifieTextureForMarker();
    drawMe();


    //TODO add doors when game end on top of ledder
    //doorTextureCube();
    specifieTextureForFloor();
    drawFloor();
    specifeTextureForLabirinthAndCube();
    drawLabirinth();
    // drawRoof();
    specifieTextureForGhosts();
    drawGhosts();


}

function checkForCollision() {
    //var xZid = [[0, 2]];
    //var zZid = [[4, 32]];
    var lestev = [[14, 16, 14, 16]];


    var objekti = [[0, 2, 4, 32],
        [0, 32, 0, 2],
        [4, 28, 4, 6],
        [4, 6, 4, 28],
        [4, 16, 26, 28],
        [0, 32, 30, 32],
        [30, 32, 0, 32],
        [26, 28, 4, 28],
        [18, 26, 26, 28],
        [10, 24, 8, 10],
        [8, 10, 8, 12],
        [8, 10, 14, 24],
        [10, 24, 22, 24],
        [22, 24, 8, 22],
        [12, 20, 12, 14],
        [12, 14, 14, 16],
        [12, 16, 16, 20],
        [18, 20, 14, 20],
        [-2, 0, 2, 4]];
    var collide = false;
    for (var i = 0; i < objekti.length; i++) {
        if (cameraCoord[2] > objekti[i][2] - 0.2 && cameraCoord[2] < objekti[i][3] + 0.5 && cameraCoord[0] > objekti[i][0] - 0.3 && cameraCoord[0] < objekti[i][1] + 0.5 && 0 < cameraCoord[1] && 2 > cameraCoord[1]) {
            if (cameraCoord[2] > objekti[i][2] + 0.35 && cameraCoord[2] < objekti[i][3]) {
                mat4.translate(pMatrix, [-cameraLastPos[0], -yPosition, -zPosition]);
                xPosition = cameraLastPos[0];
                collide = true;
                break;
            } else {
                mat4.translate(pMatrix, [-xPosition, -yPosition, -cameraLastPos[2]]);
                zPosition = cameraLastPos[2];
                collide = true;
                break;
            }
        } else {

        }
    }



    var ledder = false;
    if (!fallingDown && !collide && cameraCoord[1] < 10.6) {
        for (var i = 0; i < lestev.length; i++) {
            if (cameraCoord[2] > lestev[i][2] - 0.7 && cameraCoord[2] < lestev[i][3] + 1 && cameraCoord[0] > lestev[i][0] - 0.8 && cameraCoord[0] < lestev[i][1] + 1) {
                if (cameraCoord[2] > lestev[i][2] + 0.35 && cameraCoord[2] < lestev[i][3]) {
                    //zaustavim premik sedaj moram postopoma zvisevat visino
                    mat4.translate(pMatrix, [-cameraLastPos[0], -yPosition, -cameraLastPos[2]]);
                    zPosition = cameraLastPos[2];
                    xPosition = cameraLastPos[0];
                    yPlezanje += 0.06;
                    ledder = true;
                    break;
                } else {
                    mat4.translate(pMatrix, [-cameraLastPos[0], -yPosition, -cameraLastPos[2]]);
                    xPosition = cameraLastPos[0];
                    zPosition = cameraLastPos[2];
                    yPlezanje += 0.06;
                    ledder = true;
                    break;

                }
            } else {

            }
        }
    }


    var door = [4, 6, 14, 16];
    if (cameraCoord[2] > door[2] - 0.2)
        if (cameraCoord[2] < door[3] + 0.5)
            if (cameraCoord[0] > door[0] - 0.3)
                if (cameraCoord[0] < door[1] + 0.5)
                    if (10 < cameraCoord[1] && 12 > cameraCoord[1]) {
                        console.log("Game completed");
                        proceedToNextLevel();
                    }


    //Climbing down
    if (!fallingDown && cameraCoord[1] > 0.46 && cameraCoord[1] < 10.6 && climbDown == -1) {
        mat4.translate(pMatrix, [-cameraLastPos[0], -yPosition, -cameraLastPos[2]]);
        zPosition = cameraLastPos[2];
        xPosition = cameraLastPos[0];
        yPlezanje -= 0.06;
        ledder = true;
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

    // if(fallingDown) fallDownAnimation();
    if(cameraCoord[1] < 0.35){
        fallingDown=false;
        resetStartPosition();
        document.location.href = "./seminarskaGO1.html";
        // takeLife();
    }
    var roadOnSky = [4, 17, 14, 16];
    if (cameraCoord[1] > 10.5 && !fallingDown) {
        if (!(cameraCoord[2] > roadOnSky[2] && cameraCoord[2] < roadOnSky[3])) {
            fallingDown = true;
            console.log("time to fall down");
        }
        if (cameraCoord[0] < roadOnSky[0] || cameraCoord[0] > roadOnSky[1]) {
            fallingDown = true;
            console.log("time to fall down");
        }
    }

    if (!collide && !ledder) {
        mat4.translate(pMatrix, [-xPosition, -yPosition, -zPosition]);
        cameraLastPos[0] = xPosition;
        cameraLastPos[1] = yPosition;
        cameraLastPos[2] = zPosition;
    }

}

function proceedToNextLevel(){
    document.location.href = "./Level2.html";
}

function resetStartPosition() {
    yaw = -90;
    xPosition = 1.5;
    yPosition = 0.4;
    zPosition = -5;
    cameraCoord[0] = xPosition;
    cameraCoord[1] = yPosition;
    cameraCoord[2] = zPosition;
    cameraLastPos[0] = xPosition;
    cameraLastPos[1] = yPosition;
    cameraLastPos[2] = zPosition;
    mat4.translate(pMatrix, [-xPosition, -yPosition, -zPosition]);
}

function takeLife() {
    //Remove life icon
    document.getElementById("life" + life).style.visibility = 'hidden';
    //Show blood for one second
    var bloodBG = document.getElementById("bloodBG");
    bloodBG.style.display = "block";
    setTimeout(function () {
        bloodBG.style.display = "none";
    }, 1000);
    //Reset start position
    resetStartPosition();
    life--;
    if (life == 0) {
        document.location.href = "./seminarskaGO1.html";
    }
    console.log("TRK Z ROBOTOM");
}

function specifieTextureForMarker() {
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

function specifieTextureForFloor() {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Specify the texture to map onto the faces.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture2);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}

function doorTextureCube() {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Specify the texture to map onto the faces.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture3);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}

function specifeTextureForLabirinthAndCube() {
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

function specifieTextureForGhosts() {
    // Draw the cube by binding the array buffer to the cube's vertices
    // array, setting attributes, and pushing it to GL.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Specify the texture to map onto the faces.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture4);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}

function specifieTextureForDoor(){
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

function drawGhosts() {
    var ghostSpeed = 0.05;
    mvPushMatrix();
    mat4.translate(mvMatrix, [0, 2, 0]);
    for (var i = 0; i < ghosts.length; i++) {

        if (ghostsCoords[i][0] < ghosts[i][1] && Math.ceil(ghostsCoords[i][2]) == ghosts[i][0]) {
            ghostsCoords[i][0] += ghostSpeed;
            ghostsCD[i][0] += ghostSpeed;
            ghostsCD[i][1] += ghostSpeed;
        }
        else if (Math.floor(ghostsCoords[i][0]) == ghosts[i][1] && ghostsCoords[i][2] <= ghosts[i][3]) {
            ghostsCoords[i][2] += ghostSpeed;
            ghostsCD[i][2] += ghostSpeed;
            ghostsCD[i][3] += ghostSpeed;
        }
        else if (ghostsCoords[i][0] > ghosts[i][2] && Math.floor(ghostsCoords[i][2]) == ghosts[i][3]) {
            ghostsCoords[i][0] -= ghostSpeed;
            ghostsCD[i][0] -= ghostSpeed;
            ghostsCD[i][1] -= ghostSpeed;
        }
        else if (Math.ceil(ghostsCoords[i][0]) == ghosts[i][2] && ghostsCoords[i][2] >= ghosts[i][0]) {
            ghostsCoords[i][2] -= ghostSpeed;
            ghostsCD[i][2] -= ghostSpeed;
            ghostsCD[i][3] -= ghostSpeed;
        }


    }
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

function drawMe() {
    mvPushMatrix();
    mat4.translate(mvMatrix, [cameraCoord[0] + 1, cameraCoord[1] + 2, cameraCoord[2] - 1]);
    mat4.scale(mvMatrix, [0.2, 0.2, 0.2]);
    mat4.rotate(mvMatrix, degToRad(yaw), [0, 1, 0]);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix();
}

function drawFloor() {
    // Draw the cube.
    // za 16 X 16 labirint
    var stKock = 16;
    mvPushMatrix();
    for (var i = 0; i < stKock; i++) {
        mvPushMatrix();
        for (var j = 0; j < stKock; j++) {
            mat4.translate(mvMatrix, [2, 0, 0]);
            if (i == 7 && j == 7) {
                doorTextureCube();
                drawLedder();
                //setMatrixUniforms();
                //gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
                specifieTextureForFloor();
                //console.log("lukna");
            } else {
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
            }
        }
        mvPopMatrix();
        mat4.translate(mvMatrix, [0, 0, 2]);
    }
    mvPopMatrix();
}

function drawLedder() {
    mvPushMatrix();
    for (var i = 0; i < 5; i++) {
        mat4.translate(mvMatrix, [0, 2, 0]);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    for (var j = 0; j < 5; j++) {
        mat4.translate(mvMatrix, [-2, 0, 0]);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    //TODO add new texture
    specifieTextureForDoor();
    mat4.translate(mvMatrix, [0,2,0]);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvPopMatrix();
}

function drawLabirinth() {
    var o = "";
    var lab = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, 1],
        [1, o, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, o, 1],
        [1, o, 1, o, o, o, o, o, o, o, o, o, o, 1, o, 1],
        [1, o, 1, o, 1, 1, 1, 1, 1, 1, 1, 1, o, 1, o, 1],
        [1, o, 1, o, 1, o, o, o, o, o, o, 1, o, 1, o, 1],
        [1, o, 1, o, o, o, 1, 1, 1, 1, o, 1, o, 1, o, 1],
        [1, o, 1, o, 1, o, 1, o, o, 1, o, 1, o, 1, o, 1],
        [1, o, 1, o, 1, o, 1, 1, o, 1, o, 1, o, 1, o, 1],
        [1, o, 1, o, 1, o, 1, 1, o, 1, o, 1, o, 1, o, 1],
        [1, o, 1, o, 1, o, o, o, o, o, o, 1, o, 1, o, 1],
        [1, o, 1, o, 1, 1, 1, 1, 1, 1, 1, 1, o, 1, o, 1],
        [1, o, 1, o, o, o, o, o, o, o, o, o, o, 1, o, 1],
        [1, o, 1, 1, 1, 1, 1, 1, o, 1, 1, 1, 1, 1, o, 1],
        [1, o, o, o, o, o, o, o, o, o, o, o, o, o, o, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];
    mvPushMatrix();
    mat4.translate(mvMatrix, [0, 2, 2]);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix();

    mvPushMatrix();
    mat4.translate(mvMatrix, [0, 2, 0]);
    for (var i = 0; i < lab.length; i++) {
        mvPushMatrix();
        for (var j = 0; j < lab[i].length; j++) {
            mat4.translate(mvMatrix, [2, 0, 0]);
            if (lab[i][j] == 1) {
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
            }
        }
        mvPopMatrix();
        mat4.translate(mvMatrix, [0, 0, 2]);
    }
    mvPopMatrix();
}

function drawRoof() {
    var stKock = 16;
    mvPushMatrix();
    mat4.translate(mvMatrix, [0, 4, 0]);
    for (var i = 0; i < stKock; i++) {
        mvPushMatrix();
        for (var j = 0; j < stKock; j++) {
            mat4.translate(mvMatrix, [2, 0, 0]);
            setMatrixUniforms();
            gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
        mvPopMatrix();
        mat4.translate(mvMatrix, [0, 0, 2]);
    }
    mvPopMatrix();
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

        if (speed != 0 || fallingDown ) {//&& !climbDown) {
            if(fallingDown)
                speed = 0.003;
            xPosition -= Math.sin(degToRad(yaw)) * speed * elapsed;
            zPosition -= Math.cos(degToRad(yaw)) * speed * elapsed;

            joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - makes it feel more realistic :-)
            if(!fallingDown)
                yPosition = (Math.sin(degToRad(joggingAngle)) / 20 + 0.4) + yPlezanje;
            else{
                yPosition -= fallSpeed;
                fallSpeed += 0.005;
            }
        }

        yaw += yawRate * elapsed;
        pitch += pitchRate * elapsed;
    }
    lastTime = timeNow;
}


//
// handleMouse
//
// Called every time before redeawing the screen for keyboard
// input handling. Function continuisly updates helper variables.
//
function handleMouseMove(event) {

    //console.log(event.clientX);
}


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
    climbDown = 1;
    if (currentlyPressedKeys[77]) {
        tloris = true;
    } else {
        tloris = false;
    }

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
        if (currentlyPressedKeys[16]) {
            audiofast.play();
            speed = 0.012;
        } else {
            audio.play();
        }
    } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
        // Down cursor key
        if (cameraCoord[1] > 1) {
            climbDown = -1;
        }
        speed = -0.006;
    } else {
        speed = 0;
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
        music.play();

        initShaders();

        // Here's where we call the routine that builds all the objects
        // we'll be drawing.
        initBuffers();

        document.onmousemove = handleMouseMove;

        document.onkeydown = handleKeyDown;
        document.onkeyup = handleKeyUp;
        // Next, load and set up the textures we'll be using.
        initTextures();

        // Set up to draw the scene periodically.
        setInterval(function () {
            if (texturesLoaded) { // only draw scene and animate when textures are loaded.
                requestAnimationFrame(animate);
                handleKeys();
                drawScene();
            }
        }, 15);
    }
}