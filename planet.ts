import * as THREE from "three";

const shrinking_angular_distance = Math.PI / 4;
const collision_angular_distance = 0.02;

export class Planet {
  buildings = new Array<THREE.Mesh>();
  current_collision:THREE.Mesh|null = null;

  constructor(scene: THREE.Object3D, planet_radius: number) {
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(planet_radius, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x123456 })
    );
    for (let i = 0; i < 200; ++i) {
      const building_parent = new THREE.Object3D();
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(
          THREE.MathUtils.randFloat(0.1, 0.7),
          THREE.MathUtils.randFloat(2.3, 4.2),
          THREE.MathUtils.randFloat(0.1, 0.7)
        ),
        new THREE.MeshStandardMaterial({ color: 0xaabbcc })
      );
      building.position.y = planet_radius;
      this.buildings.push(building);
      building_parent.add(building);
      building_parent.setRotationFromQuaternion(
        new THREE.Quaternion().random()
      );
      planet.add(building_parent);
    }
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
        building.scale.x = factor_xz;
        building.scale.y = factor_y;
        building.scale.z = factor_xz;
      } else {
        building.scale.y = 1;
      }
    }
  }

  public CheckCollision(train: THREE.Object3D) {
    var min_angle = 1000;
    var closest_building:THREE.Mesh|null = null;
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
