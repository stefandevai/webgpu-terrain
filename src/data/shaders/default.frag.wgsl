@group(0) @binding(1) var mSampler: sampler;
@group(0) @binding(2) var mTexture: texture_2d<f32>;

@fragment
fn main(
  @location(0) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
  return textureSample(mTexture, mSampler, fragUV);
}
