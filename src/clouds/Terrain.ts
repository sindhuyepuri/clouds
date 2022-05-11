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
  private vertNorms: Vec3[][];

  public getHeight(x: number, z: number) {
    let height = -15;
    let skip_iters = [3, 5, 7];
    for (let i = 1; i <= 12; i++) {
      if (skip_iters.indexOf(i) !== -1) continue; // band pass filter
      let pow2 = Math.pow(1.65, i);
      height += pow2 * this.noise.noise(x/pow2, 0, z/pow2);
    }
    height /= 3.0;
    height -= 6;
    if (height < this.minHeight) this.minHeight = height;
    if (height > this.maxHeight) this.maxHeight = height;
    return height;
  }

  public getNormal(x: number, z: number) {
    let epsilon = 0.001;
    let c_pt = new Vec3 ([x, this.getHeight(x, z), z]);
    let x_pt = new Vec3 ([x + epsilon, this.getHeight(x + epsilon, z), z]);
    let z_pt = new Vec3 ([x, this.getHeight(x, z + epsilon), z + epsilon]);
    let xe = Vec3.difference(x_pt, c_pt);
    let ze = Vec3.difference(z_pt, c_pt);
    return new Vec4([...Vec3.cross(ze, xe).normalize().xyz, 0.0]);
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

    this.vertNorms = [];
    for (let i = 0; i < 201; i++) {
      this.vertNorms.push([]);
      for (let j = 0; j < 201; j++) {
        this.vertNorms[i].push(new Vec3([0, 0, 0]));
      }
    }

    /* Set Normals. */
    this.norms = [];

    let incr = 1;
    for (let i = -300; i < 300; i+=incr) {
      for (let j = 0; j < 500; j+=incr) { // was 300
        let v1 = new Vec4([i, this.getHeight(i, j), j, 1]);
        let v2 = new Vec4([i, this.getHeight(i, j + 1), j + 1, 1]);
        let v3 = new Vec4([i + 1, this.getHeight(i + 1, j + 1), j + 1, 1]);
        let v4 = new Vec4([i + 1, this.getHeight(i + 1, j), j, 1]);
        this.vertices.push(v1, v2, v3, v4);
        this.norms.push(this.getNormal(i, j), this.getNormal(i, j + 1), this.getNormal(i + 1, j + 1), this.getNormal(i + 1, j));

        this.ind.push(new Vec3([indx_count, indx_count + 1, indx_count + 2]));
        this.ind.push(new Vec3([indx_count, indx_count + 2, indx_count + 3]));

        indx_count += 4;
      }
    }

    /* Flatten Position. */
    this.verticesF32 = new Float32Array(this.vertices.length*4);
    this.vertices.forEach((v: Vec4, i: number) => {this.verticesF32.set(v.xyzw, i*4)});

    /* Flatten Indices. */
    this.indicesU32 = new Uint32Array(this.ind.length*3);
    this.ind.forEach((v: Vec3, i: number) => {this.indicesU32.set(v.xyz, i*3)});

    /* Flatten Normals. */
    this.normalsF32 = new Float32Array(this.norms.length*4);
    this.norms.forEach((v: Vec4, i: number) => {this.normalsF32.set(v.xyzw, i*4)});

    // console.log(this.normalsFlat());
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
