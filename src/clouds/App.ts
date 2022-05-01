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
  terrainVSText
} from "./Shaders.js";
import { Mat4, Vec4 } from "../lib/TSM.js";

export class CloudsAnimation extends CanvasAnimation {
  private gui: GUI;

  /* The Terrain */
  private terrain: Terrain = new Terrain();

  /* Terrain Rendering Info */
  private terrainVAO: WebGLVertexArrayObjectOES = -1;
  private terrainProgram: WebGLProgram = -1;

  /* Terrain Buffers */
  private terrainPosBuffer: WebGLBuffer = -1;
  private terrainIndexBuffer: WebGLBuffer = -1;
  private terrainNormBuffer: WebGLBuffer = -1;

  /* Terrain Attribute Locations */
  private terrainPosAttribLoc: GLint = -1;
  private terrainNormAttribLoc: GLint = -1;

  /* Terrain Uniform Locations */
  private terrainWorldUniformLocation: WebGLUniformLocation = -1;
  private terrainViewUniformLocation: WebGLUniformLocation = -1;
  private terrainProjUniformLocation: WebGLUniformLocation = -1;
  private terrainLightUniformLocation: WebGLUniformLocation = -1;

  /* Global Rendering Info */
  private lightPosition: Vec4 = new Vec4();
  private backgroundColor: Vec4 = new Vec4();

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    // this.gui = new GUI(canvas, this, this.sponge);
    this.gui = new GUI(canvas, this);


    /* Setup Animation */
    this.reset();
  }

  /**
   * Setup the animation. This can be called again to reset the animation.
   */
  public reset(): void {

    /* debugger; */
    this.lightPosition = new Vec4([-10.0, 10.0, -10.0, 1.0]);
    this.backgroundColor = new Vec4([0.529411764705882, 0.807843137254902, 0.980392156862745, 1.0]);

    this.initTerrain();

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
    console.log("terrain positions " + this.terrain.positionsFlat());
    console.log("terrain normals " + this.terrain.normalsFlat());
    console.log("terrain indices " + this.terrain.indicesFlat())

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
  }

  /**
   * Draws a single frame
   */
  public draw(): void {

    const gl: WebGLRenderingContext = this.ctx;

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
  }

  public getGUI(): GUI {
    return this.gui;
  }
}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  /* Start drawing */
  const canvasAnimation: CloudsAnimation = new CloudsAnimation(canvas);
  canvasAnimation.start();
}
