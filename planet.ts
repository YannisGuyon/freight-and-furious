import * as THREE from "three";

import { LoadRock } from "./gltf";

const shrinking_angular_distance = Math.PI / 4;
const collision_angular_distance = 0.02;

export class Planet {
  buildings = new Array<THREE.Object3D>();
  current_collision:THREE.Object3D|null = null;

  constructor(scene: THREE.Object3D, planet_radius: number) {
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(planet_radius, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x123456 })
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
