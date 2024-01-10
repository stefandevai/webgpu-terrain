export const createVertexBuffer = (device: GPUDevice, data: Float32Array): GPUBuffer => {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });

  new Float32Array(buffer.getMappedRange()).set(data);
  buffer.unmap();

  return buffer;
}

export const createUniformBuffer = (device: GPUDevice, size: number): GPUBuffer => {
  const buffer = device.createBuffer({
    size: size,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  return buffer;
}

export const createIndexBuffer = (device: GPUDevice, data: Uint32Array): GPUBuffer => {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  new Uint32Array(buffer.getMappedRange()).set(data);
  buffer.unmap();

  return buffer;
}
