# Mental Gaming Admin — အကောင်အထည်ဖော်ရေး အစီအစဉ်

## ရည်ရွယ်ချက်နှင့် အတိုင်းအတာ

Mental Gaming အတွက် customer storefront နှင့် သီးခြား Admin website တည်ဆောက်ထားသည်။ Admin သည် Gmail လိပ်စာကို username အဖြစ်သုံးပြီး ဤ website အတွက်သာ သတ်မှတ်ထားသော စကားဝှက်ဖြင့် ဝင်ရောက်မည်။ Google OAuth မသုံးရ၊ Gmail ၏ မူရင်းစကားဝှက်ကို မတောင်း၊ မသုံး၊ မသိမ်းဆည်းရ။ ကြိုတင်ခွင့်ပြုထားသော Admin အကောင့်သာ ဝင်နိုင်ရမည်။

Session ကို သက်တမ်းရှစ်နာရီရှိသော `HttpOnly; Secure; SameSite=None` cookie ဖြင့် ထိန်းသိမ်းမည်။ တောင်းဆိုမှုတစ်ကြိမ်စီတွင် server က JWT ကို စစ်ဆေးမည်။ Login နှင့် logout POST၊ ထုတ်ကုန်ထည့်သည့် POST နှင့် ထုတ်ကုန်ပြင်သည့် PATCH တို့အတွက် `MG_ADMIN_SESSION_SECRET` ဖြင့် လက်မှတ်ထိုးထားသည့် 10 မိနစ်သက်တမ်းရှိ CSRF token ကို စစ်ဆေးမည်။ သက်တမ်းကုန် session၊ မမှန်သော CSRF လက်မှတ်နှင့် cross-site လုပ်ဆောင်မှုများကို ငြင်းပယ်မည်။

## အကောင်အထည်ဖော်မှုနည်းလမ်း

Frontend သည် React/Vite၊ server သည် Express/Vercel Function ဖြစ်သည်။ Browser သည် တူညီသော website ရှိ `/api/admin/products` လမ်းကြောင်းကိုသာ ခေါ်မည်။ Server သည် admin session ကိုစစ်ပြီး ကုန်ပစ္စည်းပြောင်းလဲမှုတစ်ခုစီတွင် CSRF ကိုလည်း စစ်မည်။ ထို့နောက် production catalog နှင့် MongoDB ပါဝင်သော `mental-gaming-store` ရှိ `/api/store/admin-portal/products` လမ်းကြောင်းသို့သာ HMAC လက်မှတ်ပါ server-to-server request ပို့မည်။ `MG_PRODUCT_API_SECRET` ၏တန်ဖိုးကို browser သို့ မပို့ရ။ API server သည် shared secret၊ timestamp၊ တစ်ကြိမ်သာသုံးနိုင်သည့် nonce၊ request method၊ path နှင့် body ကို စစ်ဆေးမည်။ ထပ်မံပို့သော တူညီသည့် လက်မှတ်ကို ငြင်းပယ်မည်။

`mental-gaming-api` သီးခြား Vercel project တွင် Production `MONGODB_URI` မရှိသဖြင့် live catalog အတွက် မသုံးရ။ Storefront/API project `mental-gaming-store` ၏ Production catalog သည် လက်ရှိထုတ်ကုန် 56 ခုကို ပြန်ပေးသည်။

API တွင် `GET`၊ `POST`၊ `PATCH` ကို ကုန်ပစ္စည်းအတွက် သီးခြား router မှတစ်ဆင့်သာ ခွင့်ပြုမည်။ လက်ရှိ Telegram admin route များသည် တူညီသော product handler များကို ဆက်လက်သုံးမည်။ Website အတွက် service-auth route သည် Telegram route များနှင့် သီးခြားဖြစ်သည်။ Storefront၊ အသုံးပြုသူနှင့် အခြား API လမ်းကြောင်းများကို ဤ service ခွင့်ပြုချက်မှ ဖယ်ထားမည်။

ကုန်ပစ္စည်းစာမျက်နှာတွင် လက်ရှိစာရင်း၊ ရှာဖွေမှု၊ စာမျက်နှာခွဲခြင်း၊ အသစ်ထည့်ခြင်း၊ ပြင်ဆင်ခြင်းနှင့် အခြေအနေပြောင်းခြင်းတို့ ပါဝင်မည်။ အမည်၊ အုပ်စု၊ နယ်မြေ/ဆာဗာ၊ အမျိုးအစား၊ ပုံ URL၊ ပုံမှန်ဈေး၊ လျှော့ဈေး၊ လက်ကျန်၊ အခြေအနေ၊ ရှင်းလင်းချက်နှင့် စီစဉ်မှုနံပါတ်တို့ကို ထည့်သွင်းနိုင်မည်။ လက်ကျန် `-1` သည် အကန့်အသတ်မရှိဟု သတ်မှတ်မည်။ အခြေအနေများမှာ အသုံးပြုနေသည်၊ ကုန်သွားသည်၊ မကြာမီရောက်ရှိမည်၊ ဖျောက်ထားသည် ဖြစ်သည်။ ကုန်ပစ္စည်းကို အပြီးတိုင်မဖျက်ရ။ Orders နှင့် users ဒေတာများကို မချိတ်ဆက်သေးသဖြင့် တကယ့်အချက်အလက်ကဲ့သို့ မဖော်ပြရ။

## Vercel တွင် တင်ခြင်းနှင့် လျှို့ဝှက်ဆက်တင်

Admin အတွက် သီးခြား private GitHub repository နှင့် `mental-gaming-admin` Vercel project ကို သုံးမည်။ Production လိပ်စာမှာ `https://mental-gaming-store-admin.vercel.app` ဖြစ်သည်။ `MG_PRODUCT_API_SECRET` ကို Admin နှင့် catalog/API အဖြစ်အသုံးပြုသော `mental-gaming-store` Vercel project တို့၏ Production environment တွင် sensitive variable အဖြစ် သတ်မှတ်ထားသည်။ လျှို့ဝှက်တန်ဖိုးကို browser code၊ Git သို့မဟုတ် build log တွင် မရေးရ။

## အဓိကဖိုင်များ

- `index.ts` — Express Function၊ health endpoint နှင့် SPA စာမျက်နှာလမ်းကြောင်းများ။
- `server/adminAuth.ts` — login၊ CSRF၊ session စစ်ဆေးခြင်းနှင့် logout.
- `server/adminProducts.ts` — session ကာကွယ်မှုပါသော server-to-server product proxy.
- `server/adminAuth.test.ts`, `server/adminProducts.test.ts` — login/session နှင့် product proxy အလိုအလျောက်စစ်ဆေးမှုများ။
- `client/src/App.tsx`, `client/src/pages/Home.tsx`, `client/src/pages/Products.tsx` — ခွင့်ပြုချက်အခြေအနေ၊ dashboard နှင့် product စီမံခန့်ခွဲမှုစာမျက်နှာ။
- `client/src/lib/adminAuth.ts`, `client/src/lib/products.ts` — browser နှင့် server အကြား API ချိတ်ဆက်မှု။
- API repository ၏ `src/middlewares/adminProductServiceAuth.ts`, `src/routes/admin.ts`, `src/routes/index.ts` — HMAC၊ timestamp၊ nonce စစ်ဆေးမှုနှင့် product အတွက် သီးခြား route.
- API repository ၏ `scripts/api-vercel-entry.ts`, `api/[...path].js`, `scripts/build-api-bundle.mjs` — Vercel function bundle ကို source မှပြန်တည်ဆောက်ခြင်း။
- API repository ၏ `api/store/admin-portal/products.js`, `api/store/admin-portal/products/[id].js` — ထုတ်ကုန်စာရင်းဖတ်ခြင်း၊ အသစ်ထည့်ခြင်းနှင့် ID ဖြင့်ပြင်ဆင်ခြင်းအတွက် တိကျသော Vercel လမ်းကြောင်းများ။
- `vite.config.ts`, `vercel.json` — build နှင့် စာမျက်နှာ refresh လမ်းကြောင်း.
- `plan.md`, `TODO.md` — အကောင်အထည်ဖော်ရေးအစီအစဉ်နှင့် လုပ်ဆောင်ရန်စာရင်း။

## ဒီဇိုင်း

Nordic Control Room (5.5%), Neo-brutalist Ops Console (4.4%), Midnight Arcade Command Deck (1.4%) ဟူသော ဒီဇိုင်းပုံစံသုံးမျိုးမှ **Midnight Arcade Command Deck** ကို ရွေးချယ်ထားသည်။ ဂိမ်းထိန်းချုပ်ခန်း၏ အငွေ့အသက်ကို စနစ်တကျဖွဲ့စည်းထားသော admin မျက်နှာပြင်နှင့် ပေါင်းစပ်မည်။ နောက်ခံတွင် နက်ပြာရောင်၊ အဓိကလုပ်ဆောင်ချက်များတွင် cyan၊ အောင်မြင်မှုအခြေအနေတွင် lime ကို သုံးမည်။ ဖတ်ရှုရလွယ်ကူမှု၊ ဖုန်းမျက်နှာပြင်နှင့် လိုက်ဖက်မှု၊ တုံ့ပြန်မှုမြန်ဆန်မှုတို့ကို ဦးစားပေးမည်။ Space Grotesk၊ Inter နှင့် မြန်မာစာအတွက် သင့်လျော်သော fallback font ကို အသုံးပြုမည်။ သင်္ကေတသည် gamepad ပုံစံ MG ဖြစ်ပြီး အမှတ်တံဆိပ်၏ ထင်ရှားသောအရောင်မှာ electric cyan ဖြစ်မည်။

## လုံခြုံရေး

Google OAuth နှင့် Gmail ၏ မူရင်းစကားဝှက်ကို မသုံးပါ။ Admin စကားဝှက်၊ session key နှင့် service secret တို့ကို Vercel ၏ encrypted environment ထဲတွင်သာ သိမ်းဆည်းပြီး source code၊ browser bundle သို့မဟုတ် Git တွင် မရေးသားပါ။
