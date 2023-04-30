import * as THREE from "three";

class Rail {
  container = new THREE.Object3D();
  profiles = new Array<THREE.Mesh>();
  readonly max_profiles = 30;
  last_position = new THREE.Vector3();

  current_profile = new Array<THREE.Vector3>();
  previous_profile = new Array<THREE.Vector3>();

  vertices = new Array<THREE.Vector3>();
  normals = new Array<THREE.Vector3>();
  vertex_counter = 0;

  vertices_float = new Float32Array();
  normals_float = new Float32Array();

  constructor(scene: THREE.Object3D) {
    scene.add(this.container);
  }

  public AddPoint(position: THREE.Vector3, rotation: THREE.Quaternion) {
    if (this.last_position.clone().sub(position).length() < 0.3) {
      return;
    }
    const up = new THREE.Vector3(0, 0.01, 0);
    const right = new THREE.Vector3(-0.01, 0, 0);
    up.applyQuaternion(rotation);
    right.applyQuaternion(rotation);

    for (let i = 0; i < this.current_profile.length; ++i) {
      this.previous_profile[i] = this.current_profile[i];
    }
    this.GenerateRailProfile(position, up, right);
    this.GenerateRailChunk();
    this.SaveRailProfile();
    this.ClearOldProfiles();
    this.last_position = position;
  }

  GenerateRailProfile(
    position: THREE.Vector3,
    up: THREE.Vector3,
    right: THREE.Vector3
  ) {
    this.current_profile[0] = position.clone().sub(up).sub(right);
    this.current_profile[1] = position.clone().add(up).sub(right);
    this.current_profile[2] = position.clone().add(up).add(right);
    this.current_profile[3] = position.clone().sub(up).add(right);
  }

  SaveRailProfile() {
    if (this.previous_profile.length != this.current_profile.length) {
      this.previous_profile = new Array<THREE.Vector3>(
        this.current_profile.length
      );
    }
    for (let i = 0; i < this.current_profile.length; ++i) {
      this.previous_profile[i] = this.current_profile[i];
    }
  }

  GenerateRailChunkFaceVertex(vertex: THREE.Vector3, normal: THREE.Vector3) {
    while (this.vertices.length < this.vertex_counter) {
      this.vertices.push(new THREE.Vector3());
      this.normals.push(new THREE.Vector3());
    }
    this.vertices[this.vertex_counter] = vertex;
    this.normals[this.vertex_counter] = normal;
    ++this.vertex_counter;
  }
  GenerateRailChunkFace(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    const normal = ab.clone().cross(ac).normalize();
    this.GenerateRailChunkFaceVertex(a, normal);
    this.GenerateRailChunkFaceVertex(b, normal);
    this.GenerateRailChunkFaceVertex(c, normal);
  }

  GenerateRailChunk() {
    if (this.previous_profile.length == 0) {
      return;
    }

    this.vertex_counter = 0;
    for (let i = 0; i < this.current_profile.length - 1; ++i) {
      this.GenerateRailChunkFace(
        this.previous_profile[i],
        this.current_profile[i],
        this.previous_profile[i + 1]
      );
      this.GenerateRailChunkFace(
        this.previous_profile[i + 1],
        this.current_profile[i],
        this.current_profile[i + 1]
      );
    }

    this.vertices_float = new Float32Array(this.vertices.length * 3);
    this.normals_float = new Float32Array(this.normals.length * 3);
    // if (this.vertices_float.length == 0) {
    //   this.vertices_float = new Float32Array(this.vertices.length * 3);
    //   this.normals_float = new Float32Array(this.normals.length * 3);
    // }
    for (let i = 0; i < this.vertices.length; ++i) {
      this.vertices_float[i * 3] = this.vertices[i].x;
      this.vertices_float[i * 3 + 1] = this.vertices[i].y;
      this.vertices_float[i * 3 + 2] = this.vertices[i].z;
      this.normals_float[i * 3] = this.normals[i].x;
      this.normals_float[i * 3 + 1] = this.normals[i].y;
      this.normals_float[i * 3 + 2] = this.normals[i].z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.vertices_float, 3)
    );
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(this.normals_float, 3)
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0x787879,
      metalness: 1,
      roughness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.profiles.push(mesh);
    this.container.add(mesh);
  }

  ClearOldProfiles() {
    while (this.profiles.length > this.max_profiles) {
      this.container.remove(this.profiles[0]);
      this.profiles[0].clear();
      this.profiles.shift();
    }
  }

  public IsLoaded() {
    return this.profiles.length >= this.max_profiles;
  }
}

class Traverse {
  container = new THREE.Object3D();
  boxes = new Array<THREE.Mesh>();
  readonly max_boxes = 50;
  last_position = new THREE.Vector3();

  constructor(scene: THREE.Object3D) {
    scene.add(this.container);
  }

  public AddPoint(position: THREE.Vector3, rotation: THREE.Quaternion) {
    if (this.last_position.clone().sub(position).length() < 0.15) {
      return;
    }
    // Lower a bit.
    const lower_position = position
      .clone()
      .sub(new THREE.Vector3(0, 0.01, 0).applyQuaternion(rotation));

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.02, 0.05),
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
    while (this.boxes.length > this.max_boxes) {
      this.container.remove(this.boxes[0]);
      this.boxes[0].clear();
      this.boxes.shift();
    }
  }

  public IsLoaded() {
    return this.boxes.length >= this.max_boxes;
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
    const right = new THREE.Vector3(0.05, 0, 0).applyQuaternion(rotation);
    this.left.AddPoint(position.clone().sub(right), rotation);
    this.right.AddPoint(position.clone().add(right), rotation);
    this.traverse.AddPoint(position, rotation);
  }

  public IsLoaded() {
    return this.left.IsLoaded() && this.right.IsLoaded() && this.traverse.IsLoaded();
  }
}
