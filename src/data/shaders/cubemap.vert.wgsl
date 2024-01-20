struct Uniforms {
  view_projection: mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) fs_direction : vec3f,
}

// TODO: Replace var<private> with const after wgpu bug is fixed
// https://github.com/gfx-rs/wgpu/issues/4493
var<private> positions: array<vec2<f32>, 3> = array(
  vec2<f32>(-1.0, -1.0),
  vec2<f32>( 3.0, -1.0),
  vec2<f32>(-1.0,  3.0),
);

@vertex
fn main(@builtin(vertex_index) index : u32) -> VertexOutput {
  var output: VertexOutput;

  output.Position = vec4f(positions[index], 1.0, 1.0);

  var vp = uniforms.view_projection * output.Position;

  output.fs_direction = vp.xyz;
  return output;
}

