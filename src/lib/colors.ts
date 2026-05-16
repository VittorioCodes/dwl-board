export function extractColors(img: HTMLImageElement, count: number): string[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx || !img.naturalWidth) return [];
  
  const MAX_SIZE = 40;
  let scale = 1;
  const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
  if (maxDim > MAX_SIZE) scale = MAX_SIZE / maxDim;
  const w = Math.floor(img.naturalWidth * scale) || 1;
  const h = Math.floor(img.naturalHeight * scale) || 1;
  canvas.width = w;
  canvas.height = h;
  
  try {
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h).data;
    
    // group by quantized values
    const buckets = new Map<string, {r:number, g:number, b:number, count:number}>();
    
    for (let i = 0; i < imageData.length; i += 4) {
      if (imageData[i+3] < 128) continue; // skip transparent
      const r = imageData[i];
      const g = imageData[i+1];
      const b = imageData[i+2];
      
      // Quantize
      const qr = Math.floor(r / 32) * 32;
      const qg = Math.floor(g / 32) * 32;
      const qb = Math.floor(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;
      
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        bucket.count++;
      } else {
        buckets.set(key, {r, g, b, count: 1});
      }
    }
    
    // Average buckets and convert to hex
    const finalColorsMap = Array.from(buckets.values()).map(b => {
      const ar = Math.floor(b.r / b.count);
      const ag = Math.floor(b.g / b.count);
      const ab = Math.floor(b.b / b.count);
      const rHex = ar.toString(16).padStart(2, '0');
      const gHex = ag.toString(16).padStart(2, '0');
      const bHex = ab.toString(16).padStart(2, '0');
      const hex = `#${rHex}${gHex}${bHex}`;
      return {hex, count: b.count};
    });
    
    // Sort by count
    finalColorsMap.sort((a,b) => b.count - a.count);
    
    // Filter similar colors
    const results: string[] = [];
    for (const c of finalColorsMap) {
      if (results.length >= count) break;
      
      const r1 = parseInt(c.hex.slice(1,3), 16);
      const g1 = parseInt(c.hex.slice(3,5), 16);
      const b1 = parseInt(c.hex.slice(5,7), 16);
      
      let tooClose = false;
      for (const res of results) {
        const r2 = parseInt(res.slice(1,3), 16);
        const g2 = parseInt(res.slice(3,5), 16);
        const b2 = parseInt(res.slice(5,7), 16);
        const dist = Math.sqrt(Math.pow(r2-r1, 2) + Math.pow(g2-g1, 2) + Math.pow(b2-b1, 2));
        if (dist < 40) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) results.push(c.hex);
    }
    
    return results;
  } catch (e) {
    console.error("Color extraction error (CORS?)", e);
    return [];
  }
}
