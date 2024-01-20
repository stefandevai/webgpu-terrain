struct Uniforms {
  mvp : mat4x4f,
  light_color : vec3f,
  light_position : vec3f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var m_sampler: sampler;
@group(0) @binding(2) var texture: texture_2d<f32>;

@fragment
fn main(
  @location(0) fs_position: vec3f,
  @location(1) @interpolate(perspective) fs_normal: vec3f,
  @location(2) fs_uv: vec2f,
) -> @location(0) vec4f {
  // Positioned light
  // var light_position = uniforms.light_position;
  // let light_dir = normalize(light_position - fs_position);

  // Directional light
  let light_dir = normalize(vec3f(-1.5, -1.5, 0.0));
  let light_color = uniforms.light_color;

  var ambient_color = vec3f(0.569,0.412,0.827);
  var ambient_strength = 0.2;
  var ambient = ambient_color * ambient_strength;

  let normal = normalize(fs_normal);

  var diffuse_color = vec3f(0.996,0.686,0.549);
  let diffuse = diffuse_color * max(dot(normal, light_dir), 0.0);
  let texture_value = textureSample(texture, m_sampler, fs_uv);
  /* let color_value = vec4(1.0,1.0,1.0,1.0); */

  let color = texture_value.rgb * (ambient + diffuse);

  return vec4f(color, texture_value.a);
}
