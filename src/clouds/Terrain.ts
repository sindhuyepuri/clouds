import { MaterialObject } from "../lib/webglutils/Objects.js";
import { Mat3, Mat4, Vec3, Vec4 } from "../lib/TSM.js";
import { Noise } from "./Noise.js";

export class Terrain implements MaterialObject {
  private vertices: Vec4[];
  private ind: Vec3[];
  private norms: Vec4[];
  private noise: Noise;

  private verticesF32: Float32Array;
  private indicesU32: Uint32Array;
  private normalsF32: Float32Array;
  private minHeight: number;
  private maxHeight: number;

  public getHeight(x: number, z: number) {
    // console.log("noise " + this.noise.noise(x, 0, z));
    let height = 10 * this.noise.noise(x/10, 0, z/10) - 5;
    if (height < this.minHeight) this.minHeight = height;
    if (height > this.maxHeight) this.maxHeight = height;
    return height;
    // return (x % 3) - 5;
  }

  constructor() {
    /* Set default position. */
    this.vertices = [];

    /* Set indices. */
    this.ind = [];

    let indx_count = 0;
    
    this.noise = new Noise();
    this.noise.permutation();
    this.minHeight = 9999999;
    this.maxHeight = -9999999;

    for (let i = -100; i < 100; i++) {
      for (let j = -100; j < 100; j++) {
        // let height = Math.sin((i + j)/8) - 5;
        this.vertices.push(new Vec4([i, this.getHeight(i, j), j, 1]));
        this.vertices.push(new Vec4([i, this.getHeight(i, j + 1), j + 1, 1]));
        this.vertices.push(new Vec4([i + 1, this.getHeight(i + 1, j + 1), j + 1, 1]));
        this.vertices.push(new Vec4([i + 1, this.getHeight(i + 1, j), j, 1]));

        this.ind.push(new Vec3([indx_count, indx_count + 1, indx_count + 2]));
        this.ind.push(new Vec3([indx_count, indx_count + 2, indx_count + 3]));

        indx_count += 4;
      }
    }
    console.log("max: " + this.maxHeight);
    console.log("min: " + this.minHeight);
    /* Flatten Position. */
    this.verticesF32 = new Float32Array(this.vertices.length*4);
    this.vertices.forEach((v: Vec4, i: number) => {this.verticesF32.set(v.xyzw, i*4)});

    /* Flatten Indices. */
    this.indicesU32 = new Uint32Array(this.ind.length*3);
    this.ind.forEach((v: Vec3, i: number) => {this.indicesU32.set(v.xyz, i*3)});

    /* Set Normals. */
    this.norms = [];

    for (let i = 0; i < this.vertices.length; i++) {
      this.norms.push(new Vec4([0.0, 1.0, 0.0, 0.0]));
    }

    this.normalsF32 = new Float32Array(this.norms.length*5);
    this.norms.forEach((v: Vec4, i: number) => {this.normalsF32.set(v.xyzw, i*5)});
  }

  public positions(): Vec4[] {
    return this.vertices;
  }

  public positionsFlat(): Float32Array {
    return this.verticesF32;
  }

  public colors(): Vec4[] {
    throw new Error("Terrain::colors() incomplete method");
    return [];
  }

  public colorsFlat(): Float32Array {
    throw new Error("Terrain::colorsFlat() incomplete method");
    return new Float32Array([]);
  }

  public setColors(colors: Vec4[]): void {
    throw new Error("Terrain::setColors() incomplete method");
  }

  public indices(): Vec3[] {
    // console.assert(this.ind.length === 4);
    return this.ind;
  }

  public indicesFlat(): Uint32Array {
    // console.assert(this.indicesU32.length === 4 * 3);
    return this.indicesU32;
  }

  public uMatrix(): Mat4 {
    throw new Error("Terrain::uMatrix() incomplete method");
    // return Mat4.identity;
  }

  public scale(s: GLfloat): void {
    throw new Error("Terrain::scale() incomplete method");
  }

  public translate(p: Vec3): void {
    throw new Error("Terrain::translate() incomplete method");
  }

  public normals(): Vec4[] {
    return this.norms;
  }

  public normalsFlat(): Float32Array {
    return this.normalsF32;
  }
}
