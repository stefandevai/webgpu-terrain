struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
}
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragNormal : vec3<f32>,
  @location(1) fragUV : vec2<f32>,
}

@vertex
fn main(
  @builtin(instance_index) instanceIndex : u32,
  @location(0) position : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) uv : vec2<f32>
) -> VertexOutput {
  var output: VertexOutput;
  var world_position: vec4<f32> = vec4<f32>(position, 1.0);

  switch instanceIndex {
    case 0u: {
      world_position.x += 10.0;
    }
    case 1u: {
      world_position.x -= 10.0;
    }
    case 2u: {
      world_position.y += 10.0;
    }
    case 3u: {
      world_position.y -= 10.0;
    }
    case 4u: {
      world_position.x -= 10.0;
      world_position.y += 10.0;
    }
    case 5u: {
      world_position.x += 10.0;
      world_position.y -= 10.0;
    }
    case 6u: {
      world_position.x += 10.0;
      world_position.y += 10.0;
    }
    case 7u: {
      world_position.x -= 10.0;
      world_position.y -= 10.0;
    }
    default: {
      break;
    }
  }

  output.Position = uniforms.modelViewProjectionMatrix * world_position;

  output.fragNormal = normal;
  output.fragUV = uv;
  return output;
}
