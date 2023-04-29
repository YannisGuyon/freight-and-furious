import * as THREE from "three";

function GetOrtho(v: Float32Array, ia: number, ib: number, ic: number) {
  const a = new THREE.Vector3(v[ia * 3], v[ia * 3 + 1], v[ia * 3 + 2]);
  const b = new THREE.Vector3(v[ib * 3], v[ib * 3 + 1], v[ib * 3 + 2]);
  const c = new THREE.Vector3(v[ic * 3], v[ic * 3 + 1], v[ic * 3 + 2]);
  const ab = b.clone().sub(a);
  const ac = c.clone().sub(a);
  return ab.clone().cross(ac).normalize();
}

class Rail {
  container = new THREE.Object3D();
  profiles = new Array<THREE.Mesh>();
  last_position = new THREE.Vector3();

  vertices = new Array<number>();

  constructor(scene: THREE.Object3D) {
    scene.add(this.container);
  }

  public AddPoint(position: THREE.Vector3, rotation: THREE.Quaternion) {
    if (this.last_position.clone().sub(position).length() < 0.1) {
      return;
    }
    const up = new THREE.Vector3(0, 0, 0.1);
    const right = new THREE.Vector3(-0.1, 0, 0);
    up.applyQuaternion(rotation);
    right.applyQuaternion(rotation);
    this.GenerateRailProfile(position, up, right);
    this.ClearOldProfiles();
    this.last_position = position;
  }

  GenerateRailProfile(
    position: THREE.Vector3,
    up: THREE.Vector3,
    right: THREE.Vector3
  ) {
    const num_vertices = 4;
    const num_values = 3 * num_vertices;
    if (this.vertices.length == 0) {
      // Resize
      while (this.vertices.length < num_values * 2) {
        this.vertices.push(0);
      }
    } else {
      // Copy previous points to beginning of buffer
      for (let i = 0; i < num_values; ++i) {
        this.vertices[i] = this.vertices[i + num_values];
      }
    }
    let i = num_values;
    this.vertices[i++] = position.x - up.x - right.x;
    this.vertices[i++] = position.y - up.y - right.y;
    this.vertices[i++] = position.z - up.z - right.z;

    this.vertices[i++] = position.x + up.x - right.x;
    this.vertices[i++] = position.y + up.y - right.y;
    this.vertices[i++] = position.z + up.z - right.z;

    this.vertices[i++] = position.x + up.x + right.x;
    this.vertices[i++] = position.y + up.y + right.y;
    this.vertices[i++] = position.z + up.z + right.z;

    this.vertices[i++] = position.x - up.x + right.x;
    this.vertices[i++] = position.y - up.y + right.y;
    this.vertices[i++] = position.z - up.z + right.z;

    // Temporary Float32Array because it fails to compile
    // at runtime (?) with Array<number>.
    i = 0;
    const vertices = new Float32Array([
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
      this.vertices[i++],
    ]);

    const normals = new Float32Array(vertices.length);
    for (let j = 0; j < vertices.length; ++j) {
      normals[j] = 0;
    }

    const indices: number[] = [];
    for (let j = 0; j < num_vertices - 1; ++j) {
      indices.push(j);
      indices.push(j + num_vertices);
      indices.push(j + 1);
      let normal = GetOrtho(vertices, j, j + num_vertices, j + 1);
      normals[3 * j] = normal.x;
      normals[3 * (j + num_vertices)] = normal.y;
      normals[3 * (j + 1)] = normal.z;
      //const a = new THREE.Vector3(vertices[]);
      indices.push(j + 1);
      indices.push(j + num_vertices);
      indices.push(j + num_vertices + 1);
      normal = GetOrtho(
        vertices,
        j + 1,
        j + num_vertices,
        j + num_vertices + 1
      );
      normals[3 * (j + 1)] = normal.x;
      normals[3 * (j + num_vertices)] = normal.y;
      normals[3 * (j + num_vertices + 1)] = normal.z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    this.profiles.push(mesh);
    this.container.add(mesh);
  }

  ClearOldProfiles() {
    while (this.profiles.length > 50) {
      this.container.remove(this.profiles[0]);
      this.profiles[0].clear();
      this.profiles.shift();
    }
  }
}

class Traverse {
  container = new THREE.Object3D();
  boxes = new Array<THREE.Mesh>();
  last_position = new THREE.Vector3();

  constructor(scene: THREE.Object3D) {
    scene.add(this.container);
  }

  public AddPoint(position: THREE.Vector3, rotation: THREE.Quaternion) {
    if (this.last_position.clone().sub(position).length() < 0.5) {
      return;
    }
    // Lower a bit.
    const lower_position = position
      .clone()
      .sub(new THREE.Vector3(0, 0, 0.01).applyQuaternion(rotation));

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x503540 })
    );
    box.position.x = lower_position.x;
    box.position.y = lower_position.y;
    box.position.z = lower_position.z;
    box.setRotationFromQuaternion(rotation);
    this.ClearOldBoxes();
    this.last_position = position;
    this.boxes.push(box);
    this.container.add(box);
  }

  ClearOldBoxes() {
    while (this.boxes.length > 20) {
      this.container.remove(this.boxes[0]);
      this.boxes[0].clear();
      this.boxes.shift();
    }
  }
}

export class Rails {
  left: Rail;
  right: Rail;
  traverse: Traverse;

  constructor(scene: THREE.Object3D) {
    this.left = new Rail(scene);
    this.right = new Rail(scene);
    this.traverse = new Traverse(scene);
  }

  public AddPoint(position: THREE.Vector3, rotation: THREE.Quaternion) {
    const right = new THREE.Vector3(0.5, 0, 0).applyQuaternion(rotation);
    this.left.AddPoint(position.clone().sub(right), rotation);
    this.right.AddPoint(position.clone().add(right), rotation);
    this.traverse.AddPoint(position, rotation);
  }
}
