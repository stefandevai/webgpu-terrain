struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
}
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
}

@vertex
fn main(
  @builtin(instance_index) instanceIndex : u32,
  @location(0) position : vec4<f32>,
  @location(1) uv : vec2<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.Position = uniforms.modelViewProjectionMatrix * position;

  switch instanceIndex {
    case 0u: {
      output.Position.x += 10.0;
    }
    case 1u: {
      output.Position.x -= 10.0;
    }
    case 2u: {
      output.Position.y += 10.0;
    }
    case 3u: {
      output.Position.y -= 10.0;
    }
    case 4u: {
      output.Position.x -= 10.0;
      output.Position.y += 10.0;
    }
    case 5u: {
      output.Position.x += 10.0;
      output.Position.y -= 10.0;
    }
    case 6u: {
      output.Position.x += 10.0;
      output.Position.y += 10.0;
    }
    case 7u: {
      output.Position.x -= 10.0;
      output.Position.y -= 10.0;
    }
    default: {
      break;
    }
  }

  output.fragUV = uv;
  return output;
}
