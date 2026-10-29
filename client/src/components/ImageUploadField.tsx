import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { MediaUploadError, uploadAdminImage } from "@/lib/media";

type ImageUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

export default function ImageUploadField({
  value,
  onChange,
  disabled = false,
  label = "ပုံဖိုင်တင်ရန်",
  onUploadingChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setNotice("");
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const imageUrl = await uploadAdminImage(file);
      onChange(imageUrl);
      setNotice("ပုံကို တင်ပြီးပါပြီ။ ဆက်လက်သိမ်းဆည်းရန် အောက်ပါ သိမ်းဆည်းရန် ခလုတ်ကို နှိပ်ပါ။");
    } catch (uploadError) {
      setError(uploadError instanceof MediaUploadError ? uploadError.message : "ပုံတင်၍ မရပါ။ ပြန်ကြိုးစားပါ။");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/8 bg-[#0a101b]/70 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-slate-500">
          {value ? (
            <img src={value} alt="တင်မည့်ပုံ အကြိုမြင်ကွင်း" className="h-full w-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          ) : (
            <ImagePlus size={21} aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-200">{label}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">JPEG၊ PNG သို့မဟုတ် WebP။ အလိုအလျောက်ချုံ့ပြီး အရှည်ဆုံးဘက် 1200 pixel၊ အများဆုံး 900 KiB သတ်မှတ်မည်။</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg border border-cyan-200/20 bg-cyan-200/[0.06] px-3 text-xs font-medium text-cyan-100 hover:bg-cyan-200/10 disabled:cursor-wait disabled:opacity-50"
          >
            {uploading ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={14} aria-hidden="true" />}
            {uploading ? "ပုံတင်နေသည်…" : "ပုံရွေးရန်"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => void handleFileChange(event)}
            disabled={disabled || uploading}
            aria-label="JPEG၊ PNG သို့မဟုတ် WebP ပုံဖိုင် ရွေးရန်"
          />
        </div>
      </div>
      {notice && <p role="status" className="mt-3 text-xs text-lime-200">{notice}</p>}
      {error && <p role="alert" className="mt-3 text-xs text-rose-200">{error}</p>}
    </div>
  );
}
