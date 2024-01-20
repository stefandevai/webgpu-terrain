@group(0) @binding(1) var m_sampler : sampler;
@group(0) @binding(2) var texture : texture_cube<f32>;

@fragment
fn main(@location(0) fs_direction : vec3f) -> @location(0) vec4f {
  return textureSample(texture, m_sampler, fs_direction);
}

