import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { preparePhoto } from "../media.mjs";

test("photos are decoded, resized and re-encoded without EXIF", async()=>{
  const image=await sharp({create:{width:1350,height:1000,channels:3,background:"#6200EE"}}).jpeg().withMetadata({orientation:1}).toBuffer();
  assert.ok((await sharp(image).metadata()).exif);
  const output=await sharp(await preparePhoto(image)).metadata();
  assert.equal(output.format,"jpeg");
  assert.equal(output.width,1080);
  assert.equal(output.exif,undefined);
  await assert.rejects(preparePhoto(Buffer.from("not an image")));
});
