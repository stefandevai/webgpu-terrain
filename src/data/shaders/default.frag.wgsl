struct Uniforms {
  mvp : mat4x4<f32>,
  light_color : vec3<f32>,
  light_position : vec3<f32>,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var mSampler: sampler;
@group(0) @binding(2) var texture: texture_2d<f32>;

@fragment
fn main(
  @location(0) fs_position: vec3<f32>,
  @location(1) fs_normal: vec3<f32>,
  @location(2) fs_uv: vec2<f32>,
) -> @location(0) vec4<f32> {
  var light_position = uniforms.light_position.xyz;
  var light_color = uniforms.light_color.xyz;

  var ambient_strength = 0.2;
  var ambient = light_color * ambient_strength;

  let normal = normalize(fs_normal);
  let light_dir = normalize(light_position - fs_position);
  let diffuse = light_color * max(dot(normal, light_dir), 0.0);
  let texture = textureSample(texture, mSampler, fs_uv);

  let color = texture.rgb * (ambient + diffuse);

  return vec4(color, texture.a);
}
