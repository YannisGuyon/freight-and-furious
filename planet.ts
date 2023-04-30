import * as THREE from "three";

import { LoadRock } from "./gltf";

const shrinking_angular_distance = Math.PI / 4;
const collision_angular_distance = 0.02;

export class Planet {
  buildings = new Array<THREE.Object3D>();
  current_collision:THREE.Object3D|null = null;

  constructor(scene: THREE.Object3D, planet_radius: number) {

    const texture_loader = new THREE.TextureLoader();
    var uniforms = {
      sand: { type: "t", value: texture_loader.load(
        "resources/texture/sand.png",
        function (texture) {texture.repeat = new THREE.Vector2(1000, 1000);}) },
      planet_radius: {type: "f", value: planet_radius},
    };
    var shader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: `
        out vec2 in_uv;
        out vec3 in_position;
        
        vec4 mod289(vec4 x) {
          return x-floor(x*(1.0/289.0))*289.0;
        }
      
        vec4 perm(vec4 x) {
          return mod289(((x*34.0)+1.0)*x);
        }

        float noise3D(vec3 p) {
          vec3 a = floor(p);
          vec3 d = p-a;
          d = d*d*(3.0-2.0*d);
          vec4 b = a.xxyy+vec4(0.0, 1.0, 0.0, 1.0);
          vec4 k1 = perm(b.xyxy);
          vec4 k2 = perm(k1.xyxy+b.zzww);
          vec4 c = k2+a.zzzz;
          vec4 k3 = perm(c);
          vec4 k4 = perm(c+1.0);
          vec4 o1 = fract(k3*(1.0/41.0));
          vec4 o2 = fract(k4*(1.0/41.0));
          vec4 o3 = o2*d.z+o1*(1.0-d.z);
          vec2 o4 = o3.yw*d.x+o3.xz*(1.0-d.x);
          return o4.y*d.y+o4.x*(1.0-d.y);
        }

        void main() {
          float noise = noise3D(position*0.5)*0.05;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position-position*noise, 1.0);
          in_position = position.xyz;
          in_uv = uv;
        }
        `,
      fragmentShader: `
        precision highp float;
        in vec2 in_uv;
        in vec3 in_position;
        uniform sampler2D sand;
        uniform float planet_radius;
        out vec4 output_color;
        void main() {
          vec3 color = texture2D(sand, mod((in_uv*4.0), 1.0)).rgb;
          output_color = vec4(color, 1.0);
        }
      `,
      glslVersion: THREE.GLSL3,
    });

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(planet_radius, 128, 64),
      shader,
    );
    LoadRock(planet, planet_radius, this.buildings, 200);
    scene.add(planet);
  }

  public ReduceBuildings(camera_position: THREE.Vector3) {
    for (let building of this.buildings) {
      const building_position = new THREE.Vector3();
      building.getWorldPosition(building_position);
      const angular_distance = building_position.angleTo(camera_position);
      if (angular_distance < shrinking_angular_distance) {
        const factor_y = 0.4 + 0.6 * (angular_distance / shrinking_angular_distance);
        const factor_xz = 0.2 + 0.8 * factor_y;
        building.scale.x = factor_xz*0.002;
        building.scale.y = factor_y*0.002;
        building.scale.z = factor_xz*0.002;
      } else {
        building.scale.y = 0.002;
      }
    }
  }

  public CheckCollision(train: THREE.Object3D) {
    var min_angle = 1000;
    var closest_building:THREE.Object3D|null = null;
    for (let building of this.buildings) {
      const building_position = new THREE.Vector3();
      building.getWorldPosition(building_position);
      const train_position = new THREE.Vector3();
      train.getWorldPosition(train_position);
      const angular_distance = building_position.angleTo(train_position);
      if (angular_distance < min_angle) {
        min_angle = angular_distance;
        closest_building = building;
      }
    }
    if (closest_building !== null && this.current_collision === null && min_angle < collision_angular_distance) {
      this.current_collision = closest_building;
      return true;
    }
    if (min_angle > collision_angular_distance) {
      this.current_collision = null;
    }
    return false;
  }
}
