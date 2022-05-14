import {
  CanvasAnimation,
  WebGLUtilities
} from "../lib/webglutils/CanvasAnimation.js";
import { GUI } from "./Gui.js";
import { Terrain } from "./Terrain.js";
import {
  defaultFSText,
  defaultVSText,
  terrainFSText,
  terrainVSText,
  skyFSText,
  skyVSText
} from "./Shaders.js";
import { Mat4, Vec2, Vec3, Vec4 } from "../lib/TSM.js";
import { Sky } from "./Sky.js"

export class CloudsAnimation extends CanvasAnimation {
  private gui: GUI;

  /* The Terrain */
  private terrain: Terrain;

  /* Terrain Rendering Info */
  private terrainVAO: WebGLVertexArrayObjectOES = -1;
  private terrainProgram: WebGLProgram = -1;

  /* Terrain Buffers */
  private terrainPosBuffer: WebGLBuffer = -1;
  private terrainIndexBuffer: WebGLBuffer = -1;
  private terrainNormBuffer: WebGLBuffer = -1;
  private terrainShadowBuffer: WebGLBuffer = -1;

  /* Terrain Attribute Locations */
  private terrainPosAttribLoc: GLint = -1;
  private terrainNormAttribLoc: GLint = -1;
  private terrainShadowAttribLoc: GLint = -1;

  /* Terrain Uniform Locations */
  private terrainWorldUniformLocation: WebGLUniformLocation = -1;
  private terrainViewUniformLocation: WebGLUniformLocation = -1;
  private terrainProjUniformLocation: WebGLUniformLocation = -1;
  private terrainLightUniformLocation: WebGLUniformLocation = -1;
  private terrainTexUniformLocation : WebGLUniformLocation = -1; // texture
  private terrainTimeUniformLocation : WebGLUniformLocation = -1; // texture
  private terrainCloudCoverUniformLocation : WebGLUniformLocation = -1; // texture

  /* The Sky */
  private sky: Sky = new Sky();

  /* Sky Rendering Info */
  private skyVAO: WebGLVertexArrayObjectOES = -1;
  private skyProgram: WebGLProgram = -1;

  /* Sky Buffers */
  private skyPosBuffer: WebGLBuffer = -1;
  private skyIndexBuffer: WebGLBuffer = -1;
  private skyNormBuffer: WebGLBuffer = -1;

  /* Sky Attribute Locations */
  private skyPosAttribLoc: GLint = -1;
  private skyNormAttribLoc: GLint = -1;
  private skyTexPosAttribLoc: GLint = -1; // texture
  private skyTexCoordAttribLoc: GLint = -1; // texture

  /* Sky Uniform Locations */
  private skyWorldUniformLocation: WebGLUniformLocation = -1;
  private skyViewUniformLocation: WebGLUniformLocation = -1;
  private skyProjUniformLocation: WebGLUniformLocation = -1;
  private skyLightUniformLocation: WebGLUniformLocation = -1;
  private skyTexUniformLocation : WebGLUniformLocation = -1; 
  private skyTimeUniformLocation : WebGLUniformLocation = -1; 
  private skyCloudCoverUniformLocation: WebGLUniformLocation = -1;

  /* Moving Sky */
  private texCoordScale = 0.3;
  private texCoordXOffset = 0;
  private texCoordYOffset = 0;
  private texMaxYOffset = 1 - this.texCoordScale; 
  private texMaxXOffset = this.texMaxYOffset;
  private startMillis = 0.0;
  private currMillis = 0.0;

  /* Sliders */
  private cloudMinMillis = 20000.0;
  private cloudMaxMillis = 120000.0;
  private cloudSpeed = 0.5; // between 0 and 1
  private texTotalMillis = this.cloudMinMillis + this.cloudSpeed * (this.cloudMaxMillis - this.cloudMinMillis);
  private skyScrollPercent = 0.0;

  public customCloudCover: boolean = false;
  public cloudCover: number = 0.0;

  private maxTerrainIncr = 5;

  /* Global Rendering Info */
  // private lightPosition: Vec4 = new Vec4([10.0, 500.0, 10.0, 1.0]);
  // private lightPosition: Vec4 = new Vec4([10.0, -10.0, 10.0, 1.0]);
  // private lightPosition: Vec4 = new Vec4([-10.0, 10.0, -10.0, 1.0]);
  private lightPosition: Vec4 = new Vec4([50, 60, 20, 1.0]);

  private backgroundColor: Vec4 = new Vec4();

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    // this.gui = new GUI(canvas, this, this.sponge);
    this.terrain = new Terrain(new Vec3(this.lightPosition.xyz));
    this.gui = new GUI(canvas, this);
    this.reset();
    /* Setup Animation */
  }

  // // gets UV coordinates corresponding to (x, z) position (on terrain)
  // public getSkyUV(x: number, z: number): Vec2 {
  //   let uv = new Vec2();
  //   uv.x = 
  //   return uv;
  // }

  /**
   * Setup the animation. This can be called again to reset the animation.
   */
  public reset(): void {

    /* debugger; */
    // this.lightPosition = new Vec4([-10.0, 10.0, -10.0, 1.0]);
    this.backgroundColor = new Vec4([0.529411764705882, 0.807843137254902, 0.980392156862745, 1.0]);
    console.log("init terrain");
    this.initTerrain();
    this.initSky();

    this.gui.reset();
  }

  public initTerrain(): void {
    
    const gl: WebGLRenderingContext = this.ctx;

    /* Compile Shaders */
    this.terrainProgram = WebGLUtilities.createProgram(
      gl,
      terrainVSText,
      terrainFSText
    );
    gl.useProgram(this.terrainProgram);

    /* Create and setup positions buffer*/
    // Returns a number that indicates where 'vertPosition' is in the shader program
    this.terrainPosAttribLoc = gl.getAttribLocation(
      this.terrainProgram,
      "vertPosition"
    );

    this.terrainVAO = this.extVAO.createVertexArrayOES() as WebGLVertexArrayObjectOES;
    this.extVAO.bindVertexArrayOES(this.terrainVAO);

    /* Ask WebGL to create a buffer */
    this.terrainPosBuffer = gl.createBuffer() as WebGLBuffer;
    /* Tell WebGL that you are operating on this buffer */
    gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainPosBuffer);
    /* Fill the buffer with data */
    gl.bufferData(gl.ARRAY_BUFFER, this.terrain.positionsFlat(), gl.STATIC_DRAW);
    // console.log("terrain positions " + this.terrain.positionsFlat());
    // console.log("terrain normals " + this.terrain.normalsFlat());
    // console.log("terrain indices " + this.terrain.indicesFlat())

    /* Tell WebGL how to read the buffer and where the data goes */
    gl.vertexAttribPointer(
      this.terrainPosAttribLoc /* Essentially, the destination */,
      4 /* Number of bytes per primitive */,
      gl.FLOAT /* The type of data */,
      false /* Normalize data. Should be false. */,
      4 * Float32Array.BYTES_PER_ELEMENT /* Number of bytes to the next element */,
      0 /* Initial offset into buffer */
    );
    /* Tell WebGL to enable to attribute */
    gl.enableVertexAttribArray(this.terrainPosAttribLoc);

    /* Create and setup normals buffer*/
    this.terrainNormAttribLoc = gl.getAttribLocation(
      this.terrainProgram,
      "aNorm"
    );

    this.terrainNormBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainNormBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.terrain.normalsFlat(), gl.STATIC_DRAW);

    gl.vertexAttribPointer(
      this.terrainNormAttribLoc,
      4,
      gl.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      0
    );
    gl.enableVertexAttribArray(this.terrainNormAttribLoc);
    
    this.terrainShadowBuffer = gl.createBuffer() as WebGLBuffer;
    // this.updateTerrainShadow();

    /* Create and setup index buffer*/
    this.terrainIndexBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.terrainIndexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      this.terrain.indicesFlat(),
      gl.STATIC_DRAW
    );

    /* End VAO recording */
    this.extVAO.bindVertexArrayOES(this.terrainVAO);

    /* Get uniform locations */
    this.terrainWorldUniformLocation = gl.getUniformLocation(
      this.terrainProgram,
      "mWorld"
    ) as WebGLUniformLocation;
    this.terrainViewUniformLocation = gl.getUniformLocation(
      this.terrainProgram,
      "mView"
    ) as WebGLUniformLocation;
    this.terrainProjUniformLocation = gl.getUniformLocation(
      this.terrainProgram,
      "mProj"
    ) as WebGLUniformLocation;
    this.terrainLightUniformLocation = gl.getUniformLocation(
      this.terrainProgram,
      "lightPosition"
    ) as WebGLUniformLocation;
    this.terrainTexUniformLocation = gl.getUniformLocation(
      this.terrainProgram,
      "u_texture"
    ) as WebGLUniformLocation;
    this.terrainTimeUniformLocation = gl.getUniformLocation(
      this.terrainProgram,
      "t"
    ) as WebGLUniformLocation;
    this.terrainCloudCoverUniformLocation = gl.getUniformLocation(
      this.terrainProgram,
      "cloudCover"
    ) as WebGLUniformLocation;
    
    let terrainMatrix: Mat4 = Mat4.identity;
    /* Bind uniforms */
    gl.uniformMatrix4fv(
      this.terrainWorldUniformLocation,
      false,
      new Float32Array(terrainMatrix.all())
    );
    gl.uniformMatrix4fv(
      this.terrainViewUniformLocation,
      false,
      new Float32Array(Mat4.identity.all())
    );
    gl.uniformMatrix4fv(
      this.terrainProjUniformLocation,
      false,
      new Float32Array(Mat4.identity.all())
    );
    gl.uniform4fv(this.terrainLightUniformLocation, this.lightPosition.xyzw);
    gl.uniform1i(this.terrainTexUniformLocation, 0);
    gl.uniform1f(this.terrainTimeUniformLocation, 0);
    gl.uniform1f(this.terrainCloudCoverUniformLocation, this.cloudCover);

    this.updateTerrainShadow();
  }

  public setTexCoords () {
    const gl: WebGLRenderingContext = this.ctx;

    // Create a buffer for texcoords.
    var texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.enableVertexAttribArray(this.skyTexCoordAttribLoc);
    
    // We'll supply texcoords as floats.
    gl.vertexAttribPointer(this.skyTexCoordAttribLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Set Texcoords.
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.5 * this.texCoordScale + this.texCoordXOffset, 0.5 * this.texCoordScale + this.texCoordYOffset,
        1.0 * this.texCoordScale + this.texCoordXOffset, 0.5 * this.texCoordScale + this.texCoordYOffset,
        0.5 * this.texCoordScale + this.texCoordXOffset, 1.0 * this.texCoordScale + this.texCoordYOffset,
        0.0 * this.texCoordScale + this.texCoordXOffset, 0.5 * this.texCoordScale + this.texCoordYOffset,
        0.5 * this.texCoordScale + this.texCoordXOffset, 0.0 * this.texCoordScale + this.texCoordYOffset,
         
      ]),
    gl.STATIC_DRAW);    
  }

  public updateTerrainShadow() {
    /* Create and setup shadow buffer*/
    const gl = this.ctx;
    // gl.useProgram(this.terrainProgram);
    
    this.extVAO.bindVertexArrayOES(this.terrainVAO);

    this.terrainShadowAttribLoc = gl.getAttribLocation(
      this.terrainProgram,
      "shadow"
    );

    // this.terrainVAO = this.extVAO.createVertexArrayOES() as WebGLVertexArrayObjectOES;

    this.terrain.updateShadows(new Vec3(this.lightPosition.xyz));
    
    // this.terrainShadowBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainShadowBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.terrain.shadowF32, gl.STATIC_DRAW);

    gl.vertexAttribPointer(
      this.terrainShadowAttribLoc,
      1,
      gl.FLOAT,
      false,
      1 * Float32Array.BYTES_PER_ELEMENT,
      0
    );
    gl.enableVertexAttribArray(this.terrainShadowAttribLoc);
    this.extVAO.bindVertexArrayOES(this.terrainVAO);

    gl.uniform4fv(this.terrainLightUniformLocation, this.lightPosition.xyzw);
  }

  public initTexture(): void {
    const gl: WebGLRenderingContext = this.ctx;

    // look up where the vertex data needs to go.
    this.skyTexPosAttribLoc = gl.getAttribLocation(this.skyProgram, "a_position");
    this.skyTexCoordAttribLoc = gl.getAttribLocation(this.skyProgram, "a_texcoord");
      
    this.setTexCoords();

    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Fill the texture with a 1x1 white pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([255, 255, 255, 255]));
    
    // Asynchronously load an image
    var image = new Image();
    image.src = "resources/noise3-mirrored2.png";
    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
  }

  /**
   * Sets up the sky and sky drawing
   */
  public initSky(): void {
      /* Alias context for syntactic convenience */
    const gl: WebGLRenderingContext = this.ctx;

    /* Compile Shaders */
    this.skyProgram = WebGLUtilities.createProgram(
      gl,
      skyVSText,
      skyFSText
    );
    gl.useProgram(this.skyProgram);

    /* Create and setup positions buffer*/
    // Returns a number that indicates where 'vertPosition' is in the shader program
    this.skyPosAttribLoc = gl.getAttribLocation(
      this.skyProgram,
      "vertPosition"
    );

    this.skyVAO = this.extVAO.createVertexArrayOES() as WebGLVertexArrayObjectOES;
    this.extVAO.bindVertexArrayOES(this.skyVAO);

    this.initTexture();

    /* Ask WebGL to create a buffer */
    this.skyPosBuffer = gl.createBuffer() as WebGLBuffer;
    /* Tell WebGL that you are operating on this buffer */
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyPosBuffer);
    /* Fill the buffer with data */
    gl.bufferData(gl.ARRAY_BUFFER, this.sky.positionsFlat(), gl.STATIC_DRAW);
    console.log("sky positions " + this.sky.positionsFlat());
    console.log("sky normals " + this.sky.normalsFlat());
    console.log("sky indices " + this.sky.indicesFlat())

    /* Tell WebGL how to read the buffer and where the data goes */
    gl.vertexAttribPointer(
      this.skyPosAttribLoc /* Essentially, the destination */,
      4 /* Number of bytes per primitive */,
      gl.FLOAT /* The type of data */,
      false /* Normalize data. Should be false. */,
      4 *
        Float32Array.BYTES_PER_ELEMENT /* Number of bytes to the next element */,
      0 /* Initial offset into buffer */
    );
    /* Tell WebGL to enable to attribute */
    gl.enableVertexAttribArray(this.skyPosAttribLoc);

    /* Create and setup normals buffer*/
    this.skyNormAttribLoc = gl.getAttribLocation(
      this.skyProgram,
      "aNorm"
    );

    this.skyNormBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyNormBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.sky.normalsFlat(), gl.STATIC_DRAW);

    gl.vertexAttribPointer(
      this.skyNormAttribLoc,
      4,
      gl.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      0
    );
    gl.enableVertexAttribArray(this.skyNormAttribLoc);

    /* Create and setup index buffer*/
    this.skyIndexBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.skyIndexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      this.sky.indicesFlat(),
      gl.STATIC_DRAW
    );

    /* End VAO recording */
    this.extVAO.bindVertexArrayOES(this.skyVAO);

    /* Get uniform locations */
    this.skyWorldUniformLocation = gl.getUniformLocation(
      this.skyProgram,
      "mWorld"
    ) as WebGLUniformLocation;
    this.skyViewUniformLocation = gl.getUniformLocation(
      this.skyProgram,
      "mView"
    ) as WebGLUniformLocation;
    this.skyProjUniformLocation = gl.getUniformLocation(
      this.skyProgram,
      "mProj"
    ) as WebGLUniformLocation;
    this.skyLightUniformLocation = gl.getUniformLocation(
      this.skyProgram,
      "lightPosition"
    ) as WebGLUniformLocation;
    this.skyTexUniformLocation = gl.getUniformLocation(
      this.skyProgram,
      "u_texture"
    ) as WebGLUniformLocation;
    this.skyTimeUniformLocation = gl.getUniformLocation(
      this.skyProgram,
      "t"
    ) as WebGLUniformLocation;
    this.skyCloudCoverUniformLocation = gl.getUniformLocation(
      this.skyProgram,
      "cloudCover"
    ) as WebGLUniformLocation;

    let skyMatrix: Mat4 = Mat4.identity;
    /* Bind uniforms */
    gl.uniformMatrix4fv(
      this.skyWorldUniformLocation,
      false,
      new Float32Array(skyMatrix.all())
    );
    gl.uniformMatrix4fv(
      this.skyViewUniformLocation,
      false,
      new Float32Array(Mat4.identity.all())
    );
    gl.uniformMatrix4fv(
      this.skyProjUniformLocation,
      false,
      new Float32Array(Mat4.identity.all())
    );
    gl.uniform4fv(this.skyLightUniformLocation, this.lightPosition.xyzw);
    gl.uniform1i(this.skyTexUniformLocation, 0);
    gl.uniform1f(this.skyTimeUniformLocation, 0);
    gl.uniform1f(this.skyCloudCoverUniformLocation, this.cloudCover);
  }

  /**
   * Draws a single frame
   */
  public draw(): void {
    const gl: WebGLRenderingContext = this.ctx;

    let curr = new Date().getTime();
    if (this.startMillis == 0.0) this.startMillis = curr;
    let elapsedMillis = curr - this.startMillis - this.currMillis;
    this.currMillis += elapsedMillis;

    this.skyScrollPercent += ((elapsedMillis % this.texTotalMillis) / this.texTotalMillis);
    if (this.skyScrollPercent > 1) this.skyScrollPercent -= 1;
    this.texCoordYOffset = this.skyScrollPercent * this.texMaxYOffset; 
    this.texCoordXOffset = this.skyScrollPercent * this.texMaxXOffset; 
    this.setTexCoords();
    gl.useProgram(this.skyProgram);
    gl.uniform1f(this.skyTimeUniformLocation, this.skyScrollPercent); // update shader time
    gl.uniform1f(this.skyCloudCoverUniformLocation, this.cloudCover); // update cloud cover

    gl.useProgram(this.terrainProgram);
    gl.uniform1f(this.terrainTimeUniformLocation, this.skyScrollPercent); // update shader time
    gl.uniform1f(this.terrainCloudCoverUniformLocation, this.cloudCover); // update cloud cover


    /* Light moving across sky */
    
    
    /* Clear canvas */
    const bg: Vec4 = this.backgroundColor;
    gl.clearColor(bg.r, bg.g, bg.b, bg.a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);


    const modelTerrainMatrix = Mat4.identity;
    gl.useProgram(this.terrainProgram);

    this.extVAO.bindVertexArrayOES(this.terrainVAO);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainPosBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        this.terrain.positionsFlat(),
        gl.STATIC_DRAW
      );
      gl.vertexAttribPointer(
        this.terrainPosAttribLoc,
        4,
        gl.FLOAT,
        false,
        4 * Float32Array.BYTES_PER_ELEMENT,
        0
      );
      gl.enableVertexAttribArray(this.terrainPosAttribLoc);
      
      let t_light = 200.0 * ((this.currMillis % 30000.0)/30000.0);
      let light_x = t_light - 100.0;
      // let light_y = -0.02 * Math.pow(t_light - 50, 2) + 50;
      // this.lightPosition = new Vec4([light_x, this.lightPosition.y, this.lightPosition.z, 1.0]);
      // this.lightPosition = new Vec4([-50, 60, 20, 1.0]);
      // console.log(this.lightPosition.x);
      // this.updateTerrainShadow();

      gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainNormBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.terrain.normalsFlat(), gl.STATIC_DRAW);
      gl.vertexAttribPointer(
        this.terrainNormAttribLoc,
        4,
        gl.FLOAT,
        false,
        4 * Float32Array.BYTES_PER_ELEMENT,
        0
      );
      gl.enableVertexAttribArray(this.terrainNormAttribLoc);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.terrainIndexBuffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        this.terrain.indicesFlat(),
        gl.STATIC_DRAW
      );

    gl.uniformMatrix4fv(
      this.terrainWorldUniformLocation,
      false,
      new Float32Array(modelTerrainMatrix.all())
    );
    gl.uniformMatrix4fv(
      this.terrainViewUniformLocation,
      false,
      new Float32Array(this.gui.viewMatrix().all())
    );
    gl.uniformMatrix4fv(
      this.terrainProjUniformLocation,
      false,
      new Float32Array(this.gui.projMatrix().all())
    );

    gl.drawElements(
      gl.TRIANGLES,
      this.terrain.indicesFlat().length,
      gl.UNSIGNED_INT,
      0
    );

    // Draw the sky
    gl.disable(gl.CULL_FACE);

    const modelSkyMatrix = Mat4.identity;
    gl.useProgram(this.skyProgram);

    this.extVAO.bindVertexArrayOES(this.skyVAO);

    /* Update buffers */
  
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyPosBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        this.sky.positionsFlat(),
        gl.STATIC_DRAW
      );
      gl.vertexAttribPointer(
        this.skyPosAttribLoc,
        4,
        gl.FLOAT,
        false,
        4 * Float32Array.BYTES_PER_ELEMENT,
        0
      );
      gl.enableVertexAttribArray(this.skyPosAttribLoc);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyNormBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.sky.normalsFlat(), gl.STATIC_DRAW);
      gl.vertexAttribPointer(
        this.skyNormAttribLoc,
        4,
        gl.FLOAT,
        false,
        4 * Float32Array.BYTES_PER_ELEMENT,
        0
      );
      gl.enableVertexAttribArray(this.skyNormAttribLoc);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.skyIndexBuffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        this.sky.indicesFlat(),
        gl.STATIC_DRAW
      );

    /* Update uniforms */
    gl.uniformMatrix4fv(
      this.skyWorldUniformLocation,
      false,
      new Float32Array(modelSkyMatrix.all())
    );
    gl.uniformMatrix4fv(
      this.skyViewUniformLocation,
      false,
      new Float32Array(this.gui.viewMatrix().all())
    );
    gl.uniformMatrix4fv(
      this.skyProjUniformLocation,
      false,
      new Float32Array(this.gui.projMatrix().all())
    );

    gl.drawElements(
      gl.TRIANGLES,
      this.sky.indicesFlat().length,
      gl.UNSIGNED_INT,
      0
    );
  }

  public getGUI(): GUI {
    return this.gui;
  }

  public updateCloudSpeed (sliderValue: number, maxSliderValue: number) {
    this.cloudSpeed = (100.0 - sliderValue) / maxSliderValue;
    this.texTotalMillis = this.cloudMinMillis + this.cloudSpeed * (this.cloudMaxMillis - this.cloudMinMillis);
  }

  public updateCloudCover (sliderValue: number, maxSliderValue: number) {
    if (this.customCloudCover) {
      this.cloudCover = sliderValue / maxSliderValue;
    } else {
      this.cloudCover = 0.0;
    }
    console.log(this.cloudCover);
  }
}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  /* Start drawing */
  const canvasAnimation: CloudsAnimation = new CloudsAnimation(canvas);
  
  var cloudSpeedSlider = document.getElementById("cloud-speed") as HTMLInputElement;
  cloudSpeedSlider.oninput = function() {
    canvasAnimation.updateCloudSpeed(Number.parseInt(cloudSpeedSlider.value), 100.0);
  }

  var customCloudCoverCheckbox = document.getElementById("cloud-cover-cb") as HTMLInputElement;
  customCloudCoverCheckbox.oninput = function() {
    canvasAnimation.customCloudCover = customCloudCoverCheckbox.checked;
    canvasAnimation.updateCloudCover(Number.parseInt(cloudCoverSlider.value), 100.0);
  }

  var cloudCoverSlider = document.getElementById("cloud-cover") as HTMLInputElement;
  cloudCoverSlider.oninput = function() {
    customCloudCoverCheckbox.checked = true;
    canvasAnimation.customCloudCover = true;
    canvasAnimation.updateCloudCover(Number.parseInt(cloudCoverSlider.value), 100.0);
  }
  
  canvasAnimation.start();
}

