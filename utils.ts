import * as THREE from "three";

function mod289(input:THREE.Vector4) {
  var output = new THREE.Vector4();
  output.x = input.x-Math.floor(input.x*(1.0/289.0))*289.0;
  output.y = input.y-Math.floor(input.y*(1.0/289.0))*289.0;
  output.z = input.z-Math.floor(input.z*(1.0/289.0))*289.0;
  output.w = input.w-Math.floor(input.w*(1.0/289.0))*289.0;
  return output;
}

function perm(input:THREE.Vector4) {
  var output = new THREE.Vector4();
  output.x = ((input.x*34.0)+1.0)*input.x;
  output.y = ((input.y*34.0)+1.0)*input.y;
  output.z = ((input.z*34.0)+1.0)*input.z;
  output.w = ((input.w*34.0)+1.0)*input.w;
  return mod289(output);
}

function fract(input:number) {
  return input-Math.trunc(input);
}

export function Noise3D(position:THREE.Vector3) {
  var a = new THREE.Vector3(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z));
  var d = new THREE.Vector3(position.x-a.x, position.y-a.y, position.z-a.z);
  d.x = d.x*d.x*(3.0-2.0*d.x);  
  d.y = d.y*d.y*(3.0-2.0*d.y);  
  d.z = d.z*d.z*(3.0-2.0*d.z);
  var b = new THREE.Vector4(a.x, a.x+1.0, a.y, a.y+1.0);
  var k1 = perm(new THREE.Vector4(b.x, b.y, b.x, b.y));
  var k2 = perm(new THREE.Vector4(k1.x+b.z, k1.y+b.z, k1.x+b.w, k1.y+b.w));
  var c = new THREE.Vector4(k2.x+a.z, k2.y+a.z, k2.z+a.z, k2.w+a.z);
  var k3 = perm(c);
  var k4 = perm(new THREE.Vector4(c.x+1.0, c.y+1.0, c.z+1.0, c.w+1.0));
  var o1 = new THREE.Vector4(fract(k3.x*(1.0/41.0)), fract(k3.y*(1.0/41.0)), fract(k3.z*(1.0/41.0)), fract(k3.w*(1.0/41.0)));
  var o2 = new THREE.Vector4(fract(k4.x*(1.0/41.0)), fract(k4.y*(1.0/41.0)), fract(k4.z*(1.0/41.0)), fract(k4.w*(1.0/41.0)));
  var o3 = new THREE.Vector4(o2.x*d.z+o1.x*(1.0-d.z), o2.y*d.z+o1.y*(1.0-d.z), o2.z*d.z+o1.z*(1.0-d.z), o2.w*d.z+o1.w*(1.0-d.z));
  var o4 = new THREE.Vector2(o3.y*d.x+o3.x*(1.0-d.x), o3.w*d.x+o3.z*(1.0-d.x));
  return o4.y*d.y+o4.x*(1.0-d.y);
}