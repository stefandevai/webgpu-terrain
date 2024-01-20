struct Uniforms {
  front: vec3<f32>,
  right: vec3<f32>,
  up: vec3<f32>,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) fs_direction : vec3f,
}

// TODO: Replace var<private> with const after wgpu bug is fixed
// https://github.com/gfx-rs/wgpu/issues/4493
var<private> positions: array<vec2<f32>, 6> = array(
  vec2<f32>( 1.0,  1.0),
  vec2<f32>( 1.0, -1.0),
  vec2<f32>(-1.0, -1.0),
  vec2<f32>( 1.0,  1.0),
  vec2<f32>(-1.0, -1.0),
  vec2<f32>(-1.0,  1.0),
);

@vertex
fn main(@builtin(vertex_index) index : u32) -> VertexOutput {
  var output: VertexOutput;

  output.Position = vec4f(positions[index], 1.0, 1.0);

  let x = positions[index].x;
  let y = positions[index].y;

  output.fs_direction = normalize(uniforms.front + x * uniforms.right + y * uniforms.up);
  return output;
}

