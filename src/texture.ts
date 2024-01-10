export const createTexture = async (path: string, device: GPUDevice): GPUTexture => {
  const res = await fetch(path);
  const bitmap = await createImageBitmap(await res.blob());

  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: bitmap },
    { texture: texture },
    [bitmap.width, bitmap.height],
  );

  return texture;
}

export const createDepthTexture = (canvas: HTMLCanvasElement, device: GPUDevice): GPUTexture => {
  return device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
}
