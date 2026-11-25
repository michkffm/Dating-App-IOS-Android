import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

export async function preparePhoto(bytes) {
  const processor=sharp(bytes,{failOn:"warning",limitInputPixels:12000000});
  const decoded=await processor.metadata();
  if(!["jpeg","png","webp"].includes(decoded.format)||(decoded.pages??1)!==1) throw new Error("Unsupported image");
  return processor.autoOrient().resize({width:1080,height:1080,fit:"inside",withoutEnlargement:true}).jpeg({quality:83,mozjpeg:true}).toBuffer();
}

export function cloudMedia({ cloudName, apiKey, apiSecret }) {
  if (!cloudName || !apiKey || !apiSecret) return null;
  if (!/^[a-z0-9_-]+$/i.test(cloudName)) throw new Error("Invalid Cloudinary product environment");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  const publicId = (id) => "heartpulse/" + id;
  return {
    async put(id, bytes) {
      const safe = await preparePhoto(bytes);
      await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          public_id: publicId(id), resource_type: "image", type: "authenticated", overwrite: false, timeout: 8000
        }, (error, result) => error ? reject(new Error("Media service upload failed")) : resolve(result)).end(safe);
      });
    },
    async get(id) {
      const signed = cloudinary.url(publicId(id), { resource_type: "image", type: "authenticated", format: "jpg", sign_url: true, secure: true });
      const address = new URL(signed);
      if (address.protocol !== "https:" || address.hostname !== "res.cloudinary.com") throw new Error("Unexpected media origin");
      const response = await fetch(address, { redirect: "error", signal: AbortSignal.timeout(8000) });
      if (!response.ok || response.headers.get("content-type")?.split(";")[0] !== "image/jpeg" || !response.body) throw new Error("Media unavailable");
      return response.body;
    },
    async remove(id) {
      const result = await cloudinary.uploader.destroy(publicId(id), { resource_type: "image", type: "authenticated", invalidate: true, timeout: 8000 });
      if (!["ok","not found"].includes(result.result)) throw new Error("Media deletion failed");
    }
  };
}
