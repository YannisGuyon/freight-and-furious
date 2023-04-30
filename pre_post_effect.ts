import * as THREE from "three";

export class PrePostEffect {
  scene_background = new THREE.Scene();
  uniforms_background = {
    time: { value: 0.5 },
    center: { type: "v2", value: new THREE.Vector2(1.0, 0.0) },
  };

  scene_post_effect = new THREE.Scene();
  uniforms_post_effect = {damage: {value: 0.0}};

  constructor() {
    var sky_shader = new THREE.ShaderMaterial({
      uniforms: this.uniforms_background,
      vertexShader: `
        out vec2 out_uv;
        void main() {
          gl_Position = vec4(position.x, position.y, 0.0, 1.0);
          out_uv = vec2(position.x+1.0, position.y+1.0);
        }
        `,
      fragmentShader: `
        precision highp float;
        in vec2 out_uv;
        out vec4 output_color;
        uniform float time;
        uniform vec2 center;
        void main() {
          highp float dist = length(out_uv-center)*0.56;
          output_color = vec4(mix(vec3(0.682, 0.886, 0.973), vec3(0.063, 0.153, 0.239), dist), 1.0);
        }
      `,
      glslVersion: THREE.GLSL3,
    });
    sky_shader.depthWrite = false;
    var background_plane = new THREE.PlaneGeometry(20, 20);
    var background_mesh = new THREE.Mesh(background_plane, sky_shader);
    this.scene_background.add(background_mesh);

    const post_effect_shader = new THREE.ShaderMaterial({
      uniforms: this.uniforms_post_effect,
      vertexShader: `
        out vec2 out_uv;
        void main() {
          gl_Position = vec4(position.x, position.y, 0.0, 1.0);
          out_uv = vec2(position.x/2.0+0.5, position.y/2.0+0.5);
        }
        `,
      fragmentShader: `
        precision highp float;
        in vec2 out_uv;
        out vec4 output_color;
        uniform float damage;
        uniform vec2 center;
        void main() {
          vec2 rescale_uv = out_uv;
          rescale_uv *= 1.0-rescale_uv.yx;
          float vig = pow(rescale_uv.x*rescale_uv.y*15.0, 0.25);
          output_color = vec4(vig+damage, vig, vig, 1.0);
        }
      `,
      glslVersion: THREE.GLSL3,
      blending: THREE.MultiplyBlending,
      depthWrite: false,
    });
    var post_effect_plane = new THREE.PlaneGeometry(20, 20);
    var post_effect_mesh = new THREE.Mesh(post_effect_plane, post_effect_shader);
    this.scene_post_effect.add(post_effect_mesh);
  }

  public GetDamage() {
    return this.uniforms_post_effect.damage.value;
  }

  public SetDamage(damage_value: number) {
    this.uniforms_post_effect.damage.value = damage_value;
  }

  public PreRender(renderer:THREE.WebGLRenderer, camera:THREE.PerspectiveCamera) {
    renderer.render(this.scene_background, camera);
  }

  public PostRender(renderer:THREE.WebGLRenderer, camera:THREE.PerspectiveCamera) {
    renderer.render(this.scene_post_effect, camera);
  }
  
}
