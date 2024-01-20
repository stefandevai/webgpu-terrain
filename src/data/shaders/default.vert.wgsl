struct Uniforms {
  mvp : mat4x4f,
  light_color : vec3f,
  light_position : vec3f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) fs_position : vec3f,
  @location(1) @interpolate(perspective) fs_normal : vec3f,
  @location(2) fs_uv : vec2f,
}

@vertex
fn main(
  @location(0) position : vec3f,
  @location(1) normal : vec3f,
  @location(2) uv : vec2f
) -> VertexOutput {
  var output: VertexOutput;
  var world_position = vec4f(position, 1.0);

  output.Position = uniforms.mvp * world_position;

  output.fs_position = world_position.xyz;
  output.fs_normal = normal;
  output.fs_uv = uv;
  return output;
}
