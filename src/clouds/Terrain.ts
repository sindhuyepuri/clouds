import { MaterialObject } from "../lib/webglutils/Objects.js";
import { Mat3, Mat4, Vec3, Vec4 } from "../lib/TSM.js";
import { Noise } from "./Noise.js";
import { CloudsAnimation } from "./App.js";

export class Terrain implements MaterialObject {
  private width: number = 600;
  private depth: number = 500;
  private vertices: Vec4[];
  private ind: Vec3[];
  private norms: Vec4[];
  private noise: Noise;
  public shadow: number[];

  public shadowF32: Float32Array;
  private verticesF32: Float32Array;
  private indicesU32: Uint32Array;
  private normalsF32: Float32Array;
  private minHeight: number;
  private maxHeight: number;
  private vertNorms: Vec3[][];
  private lightPosition: Vec3 = new Vec3();

  clamp = (num, min, max) => Math.min(Math.max(num, min), max)
  
  public getHeight(x: number, z: number) {
    let height = -15;
    let skip_iters = [3, 5, 7];
    // let skip_iters = [1, 2, 3];
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

  public inShadow(pos: Vec3) {
    let light_dir = Vec3.difference(this.lightPosition, pos);
    let t = Vec3.distance(light_dir, new Vec3([0.0, 0.0, 0.0]));
    // console.log(light_dir.xyz);
    // console.log(t);
    light_dir.normalize();
    let cur_pos = pos.copy();
    // let max_height_dif = -99999;
    let res = 1.0;
    // for (let i = 0.2; i < t; i += 10) {
    //   cur_pos = Vec3.sum(cur_pos, light_dir.scale(i));
    //   // if difference is positive, then in shadow
    //   let height_dif = this.getHeight(cur_pos.x, cur_pos.z) - cur_pos.y;
    //   res = Math.min(res, 32.0 * height_dif/i);
    //   if (height_dif > 1.0) {
    //     // console.log(this.getHeight(cur_pos.x, cur_pos.z), cur_pos.y, pos.y);
    //     return this.clamp(1.0/height_dif + 0.4, 0.4, 1.0);
    //   }
    // }
    let t_incr = 0.2;
    for (let i = 0; i < 5; i++) {
      cur_pos = Vec3.sum(cur_pos, light_dir.scale(t_incr));
      let height_dif = this.getHeight(cur_pos.x, cur_pos.z) - cur_pos.y;
      if (height_dif > 1.0) {
        return this.clamp(t_incr/height_dif + 0.4, 0.4, 1.0);
      }
      t_incr += this.clamp(-height_dif, 0.5 + t * 0.05, 25.0);
    }
    return 1.0;
  }

  constructor(light: Vec4) {
    /* Set default position. */
    this.vertices = [];
    /* Set indices. */
    this.ind = [];

    let indx_count = 0;
    this.lightPosition = new Vec3(light.xyz);
    this.noise = new Noise();
    this.noise.permutation();
    this.minHeight = 9999999;
    this.maxHeight = -999;
    // this.shadow = new Number[][];
    this.shadowF32 = new Float32Array();    
    // console.log(light.xyz);

    /* Set Normals. */
    this.norms = [];
    let incr = 1;

    // let width = 600;
    // let depth = 500;

    for (let i = -this.width/2; i < this.width/2; i+=incr) {
      for (let j = 0; j < this.depth; j+=incr) { // was 300
        let v1 = new Vec4([i, this.getHeight(i, j), j, 1]);
        let v2 = new Vec4([i, this.getHeight(i, j + 1), j + 1, 1]);
        let v3 = new Vec4([i + 1, this.getHeight(i + 1, j + 1), j + 1, 1]);
        let v4 = new Vec4([i + 1, this.getHeight(i + 1, j), j, 1]);
        // shadows[i + this.width/2][j] = this.inShadow(new Vec3(v1.xyz));
        this.vertices.push(v1, v2, v3, v4);
        this.norms.push(this.getNormal(i, j), this.getNormal(i, j + 1), this.getNormal(i + 1, j + 1), this.getNormal(i + 1, j));
        this.ind.push(new Vec3([indx_count, indx_count + 1, indx_count + 2]));
        this.ind.push(new Vec3([indx_count, indx_count + 2, indx_count + 3]));

        indx_count += 4;
      }
    }

    // console.log("shadow", this.shadow);
    this.updateShadows();

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

  public updateShadows() {
    let shadows = [];
    for (let i = 0; i < this.width + 1; i++) {
      shadows.push([]);
      for (let j = 0; j < this.depth + 1; j++) {
        shadows[i].push(0);
      }
    }
    for (let i = -this.width/2; i < this.width/2; i+=1) {
      for (let j = 0; j < this.depth; j+=1) { // was 300
        let v1 = new Vec4([i, this.getHeight(i, j), j, 1]);
        shadows[i + this.width/2][j] = this.inShadow(new Vec3(v1.xyz));
      }
    }
    this.shadow = [];
    for (let i = -this.width/2; i < this.width/2; i += 1) {
      for (let j = 0; j < this.depth; j += 1) {
        this.shadow.push(shadows[i + this.width/2][j]);
        this.shadow.push(shadows[i + this.width/2][j + 1]);
        this.shadow.push(shadows[i + 1 + this.width/2][j + 1]);
        this.shadow.push(shadows[i + 1 + this.width/2][j]);
      }
    }
    this.shadowF32 = new Float32Array(this.shadow);
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
