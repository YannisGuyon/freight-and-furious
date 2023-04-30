import * as THREE from "three";

import { LoadRock } from "./gltf";

const shrinking_angular_distance = Math.PI / 4;
const collision_angular_distance = 0.02;

export class Planet {
  scene: THREE.Object3D;
  buildings = new Array<THREE.Object3D>();
  buildings_scale = new Array<number>();

  hit_buildings = new Array<THREE.Object3D>();
  hit_buildings_parent = new Array<THREE.Object3D>();
  hit_buildings_linear_velocity = new Array<THREE.Vector3>();
  hit_buildings_angular_velocity = new Array<THREE.Quaternion>();

  constructor(scene: THREE.Object3D, planet_radius: number) {
    this.scene = scene;
    const texture_loader = new THREE.TextureLoader();
    var uniforms = {
      sand: {
        type: "t",
        value: texture_loader.load(
          "resources/texture/sand.png",
          function (texture) {
            texture.repeat = new THREE.Vector2(1000, 1000);
          }
        ),
      },
      planet_radius: { type: "f", value: planet_radius },
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
      shader
    );
    LoadRock(planet, planet_radius, this.buildings, this.buildings_scale, 200);
    scene.add(planet);
  }

  public ReduceBuildings(camera_position: THREE.Vector3) {
    var index = 0;
    for (let building of this.buildings) {
      const building_position = new THREE.Vector3();
      building.getWorldPosition(building_position);
      const angular_distance = building_position.angleTo(camera_position);
      if (angular_distance < shrinking_angular_distance) {
        const factor_y =
          0.4 + 0.6 * (angular_distance / shrinking_angular_distance);
        const factor_xz = 0.2 + 0.8 * factor_y;
        building.scale.x = factor_xz * this.buildings_scale[index];
        building.scale.y = factor_y * this.buildings_scale[index];
        building.scale.z = factor_xz * this.buildings_scale[index];
      } else {
        building.scale.y = this.buildings_scale[index];
      }
      index++;
    }
  }

  public CheckCollision(
    train_position: THREE.Vector3,
    train_direction: THREE.Vector3
  ) {
    let min_angle = 1000;
    let closest_building_index = this.buildings.length;
    for (let i = 0; i < this.buildings.length; ++i) {
      const building_position = new THREE.Vector3();
      this.buildings[i].getWorldPosition(building_position);
      const angular_distance = building_position.angleTo(train_position);
      if (angular_distance < min_angle) {
        min_angle = angular_distance;
        closest_building_index = i;
      }
    }
    if (
      closest_building_index != this.buildings.length &&
      min_angle < collision_angular_distance
    ) {
      const closest_building = this.buildings[closest_building_index];
      const building_position = new THREE.Vector3();
      closest_building.getWorldPosition(building_position);
      this.hit_buildings_linear_velocity.push(train_direction.clone());
      this.hit_buildings_angular_velocity.push(new THREE.Quaternion().random());
      this.buildings.splice(closest_building_index, 1);
      this.buildings_scale.splice(closest_building_index, 1);
      //closest_building.scale.set(0, 0, 0);

      const parent = new THREE.Object3D();
      closest_building.getWorldPosition(parent.position);
      this.scene.add(parent);
      const parent2 = new THREE.Object3D();
      parent.add(parent2);
      parent2.position.copy(parent.position.clone().setLength(closest_building.scale.y/0.001));
      parent2.attach(closest_building);
      this.hit_buildings_parent.push(parent);
      this.hit_buildings.push(parent2);

      // const box = new THREE.Mesh(
      //   new THREE.BoxGeometry(1, 1, 1),
      //   new THREE.MeshStandardMaterial({ color: 0xff0000 })
      // );
      // parent2.add(box);
      this.Punch(this.hit_buildings.length - 1, 0.3);
      return true;
    }
    return false;
  }

  Punch(i: number, quantity: number) {
    const building = this.hit_buildings[i];
    const parent = this.hit_buildings_parent[i];
    const linear_velocity = this.hit_buildings_linear_velocity[i];
    const angular_velocity = this.hit_buildings_angular_velocity[i];
    
    parent.position.add(linear_velocity.clone().multiplyScalar(quantity));
    const quaternion = new THREE.Quaternion()
      .identity()
      .rotateTowards(angular_velocity, quantity);
    building.applyQuaternion(quaternion);
  }

  public UpdateHit(duration: number) {
    const punch = duration * 10;
    for (let i = 0; i < this.hit_buildings.length; ++i) {
      this.Punch(i, punch);
    }
    return false;
  }
}
