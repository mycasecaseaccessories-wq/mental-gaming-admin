import { getAdminCsrfToken } from "@/lib/adminAuth";

const MAX_UPLOAD_BYTES = 900 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_SIDE = 1200;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadError";
  }
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new MediaUploadError("ပုံကို ပြင်ဆင်၍ မရပါ။ အခြားပုံတစ်ပုံကို ရွေးပါ။"));
    }, "image/webp", quality);
  });
}

async function compressImage(file: File): Promise<Blob> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new MediaUploadError("JPEG၊ PNG သို့မဟုတ် WebP ပုံဖိုင်ကိုသာ ရွေးပါ။");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new MediaUploadError("မူရင်းပုံသည် 20 MB ထက်ကြီးနေသည်။ အရွယ်သေးသောပုံကို ရွေးပါ။");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new MediaUploadError("ပုံဖိုင်ကို ဖွင့်မရပါ။ JPEG၊ PNG သို့မဟုတ် WebP ပုံကို ရွေးပါ။");
  }

  try {
    if (bitmap.width < 1 || bitmap.height < 1) {
      throw new MediaUploadError("ပုံအရွယ်အစား မမှန်ပါ။");
    }
    const initialScale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * initialScale));
    let height = Math.max(1, Math.round(bitmap.height * initialScale));
    const canvas = document.createElement("canvas");
    const qualities = [0.86, 0.78, 0.7, 0.62, 0.54];

    for (let pass = 0; pass < 6; pass += 1) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new MediaUploadError("ပုံပြင်ဆင်ရန် browser မှ မထောက်ပံ့ပါ။");
      context.clearRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      for (const quality of qualities) {
        const blob = await canvasBlob(canvas, quality);
        if (blob.size <= MAX_UPLOAD_BYTES) return blob;
      }
      width = Math.max(1, Math.floor(width * 0.82));
      height = Math.max(1, Math.floor(height * 0.82));
    }
    throw new MediaUploadError("ချုံ့ပြီးနောက် ပုံအရွယ်အစား ကြီးနေဆဲဖြစ်သည်။ ပိုသေးသောပုံကို ရွေးပါ။");
  } finally {
    bitmap.close();
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

export async function uploadAdminImage(file: File): Promise<string> {
  const blob = await compressImage(file);
  const dataBase64 = await blobToBase64(blob);
  const csrfToken = await getAdminCsrfToken();
  const response = await fetch("/api/admin/media", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ contentType: "image/webp", dataBase64 }),
  });

  let payload: { imageUrl?: unknown; error?: unknown };
  try {
    payload = (await response.json()) as { imageUrl?: unknown; error?: unknown };
  } catch {
    throw new MediaUploadError("ဆိုင်ဒေတာဆာဗာမှ မမှန်ကန်သော အဖြေကို ရရှိခဲ့ပါသည်။");
  }
  if (!response.ok) {
    throw new MediaUploadError(typeof payload.error === "string" ? payload.error : "ပုံတင်၍ မရပါ။ ပြန်ကြိုးစားပါ။");
  }
  if (typeof payload.imageUrl !== "string" || !payload.imageUrl.startsWith("https://")) {
    throw new MediaUploadError("ပုံလိပ်စာ မမှန်ပါ။");
  }
  return payload.imageUrl;
}
