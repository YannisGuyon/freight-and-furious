import * as THREE from "three";

const shrinking_angular_distance = Math.PI / 4;

export class Planet {
  buildings = new Array<THREE.Mesh>();

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
}
