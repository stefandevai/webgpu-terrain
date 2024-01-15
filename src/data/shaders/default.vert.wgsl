struct Uniforms {
  mvp : mat4x4<f32>,
  light_color : vec3<f32>,
  lightPosition : vec3<f32>,
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fs_position : vec3<f32>,
  @location(1) fs_normal : vec3<f32>,
  @location(2) fs_uv : vec2<f32>,
}

@vertex
fn main(
  @location(0) position : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) uv : vec2<f32>
) -> VertexOutput {
  var output: VertexOutput;
  var world_position: vec4<f32> = vec4<f32>(position, 1.0);

  output.Position = uniforms.mvp * world_position;

  output.fs_position = world_position.xyz;
  output.fs_normal = normal;
  output.fs_uv = uv;
  return output;
}
