# Mental Gaming Admin

ဤ website သည် Mental Gaming customer storefront နှင့် သီးခြားဖြစ်သော Vercel admin website ဖြစ်သည်။ Login ဝင်ရာတွင် ကြိုတင်ခွင့်ပြုထားသော Gmail လိပ်စာကို အသုံးပြုရမည်။ Password သည် Gmail ၏ မူရင်း password မဟုတ်ဘဲ ဤ website အတွက်သာ သတ်မှတ်ထားသော သီးခြား password ဖြစ်သည်။

## လျှို့ဝှက်ဆက်တင်များ

Admin project ၏ Production ပတ်ဝန်းကျင်တွင် အောက်ပါ encrypted environment values များ လိုအပ်သည်။

- `MG_ADMIN_EMAIL` — ခွင့်ပြုထားသော admin ၏ Gmail လိပ်စာ။
- `MG_ADMIN_PASSWORD` — ဤ website အတွက် သီးခြား password၊ အနည်းဆုံး စာလုံးရေ 12 လုံး။
- `MG_ADMIN_SESSION_SECRET` — session/CSRF လက်မှတ်ထိုးရန် အသုံးပြုသော ကျပန်းလျှို့ဝှက်တန်ဖိုး၊ အနည်းဆုံး 32 bytes။
- `MG_PRODUCT_API_SECRET` — Admin နှင့် `mental-gaming-store` API project နှစ်ခုစလုံးတွင် တူညီရမည့် service လျှို့ဝှက်တန်ဖိုး၊ အနည်းဆုံး 32 bytes။
- `MG_PRODUCT_API_ORIGIN` — Preview/local ပတ်ဝန်းကျင်တွင် ချိတ်ဆက်မည့် Store API HTTPS origin။ Production တွင် မသတ်မှတ်ထားပါက `https://mental-gaming-store.vercel.app` ကိုသာ default သုံးသည်။

လျှို့ဝှက်တန်ဖိုးများကို source code၊ Git၊ browser bundle သို့မဟုတ် build log ထဲ မထည့်ပါနှင့်။ Gmail account ၏ မူရင်း password ကို မသုံးပါနှင့်။ Preview နှင့် local development တွင် `MG_PRODUCT_API_ORIGIN` မသတ်မှတ်ထားပါက Store API ခေါ်ဆိုမှုကို HTTP 503 ဖြင့် ပိတ်ထားပြီး production API သို့ အလိုအလျောက် မချိတ်ဆက်ပါ။ Preview စမ်းသပ်ရာတွင် Store API ၏ တူညီသော branch preview origin ကိုသာ သတ်မှတ်ပါ။ Catalog နှင့် image upload များသည် MongoDB `MONGODB_URI` သတ်မှတ်ထားသော `mental-gaming-store` API မှတစ်ဆင့် လုပ်ဆောင်သည်။

## Admin မှ ပုံထည့်နည်း

Admin website သို့ ဝင်ပြီး ဘေးဘက်မီနူးရှိ **အုပ်စုနှင့် ပုံများ** ကိုဖွင့်ပါ။ အုပ်စုကြီး သို့မဟုတ် အုပ်စုခွဲတစ်ခုကို ရွေးပါ။ **ပုံရွေးရန်** ကိုနှိပ်ပြီး JPEG၊ PNG သို့မဟုတ် WebP ဖိုင်ကို ရွေးပါ။ အကြိုမြင်ကွင်းမှန်ကန်ပါက **ပုံသိမ်းရန်** ကိုနှိပ်ပါ။ HTTPS ပုံလိပ်စာကိုလည်း ထည့်ပြီး သိမ်းနိုင်သည်။

ကုန်ပစ္စည်းပုံအတွက် **ကုန်ပစ္စည်းများ** စာမျက်နှာတွင် **ကုန်ပစ္စည်းအသစ်** သို့မဟုတ် **ပြင်ဆင်ရန်** ကိုဖွင့်ပါ။ အုပ်စု/အုပ်စုခွဲကို ရွေးပြီး **ပုံရွေးရန်** ကိုနှိပ်ပါ၊ သို့မဟုတ် HTTPS ပုံလိပ်စာကို ထည့်ပါ။ ထို့နောက် **သိမ်းဆည်းရန်** ကိုနှိပ်ပါ။ Browser သည် ပုံကို WebP အဖြစ် ချုံ့ပြီး အရှည်ဆုံးဘက်ကို 1200 pixel အထိ လျှော့ကာ အပြီးသတ်ဖိုင် 900 KiB ထက်မကြီးစေရန် ပြင်ဆင်ပေးသည်။ ဆိုင်တွင် ပြသရန် ပုံများကို public image URL အဖြစ် သိမ်းဆည်းထားသည်။

## Build နှင့် စစ်ဆေးခြင်း

`pnpm build` သည် Vite frontend ကို `public/` ဖိုင်တွဲထဲသို့ build လုပ်ပေးသည်။ `index.ts` သည် Vercel Express Function ၏ API ကို အလုပ်လုပ်စေသည်။ `vercel.json` သည် `/login`၊ `/dashboard`၊ `/products` နှင့် `/catalogs` လမ်းကြောင်းများကို ပင်မစာမျက်နှာသို့ ညွှန်ပေးသည်။

```sh
pnpm install
pnpm check
pnpm test
pnpm build
```
