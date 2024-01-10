@group(0) @binding(1) var mSampler: sampler;
@group(0) @binding(2) var mTexture: texture_2d<f32>;

@fragment
fn main(
  @location(0) fragNormal: vec3<f32>,
  @location(1) fragUV: vec2<f32>
) -> @location(0) vec4<f32> {
  var lightDirection = normalize(vec3<f32>(0.5, 0.7, -1));

  let normal = normalize(fragNormal);
  let light = dot(normal, -lightDirection);
  let texture = textureSample(mTexture, mSampler, fragUV);
  let color = texture.rgb * light;

  return vec4(color, texture.a);
}
