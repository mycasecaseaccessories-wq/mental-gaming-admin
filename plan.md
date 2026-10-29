# Mental Gaming Admin — အကောင်အထည်ဖော်ရေး အစီအစဉ်

## ရည်ရွယ်ချက်နှင့် အတိုင်းအတာ

Mental Gaming အတွက် customer storefront နှင့် သီးခြား Admin website တည်ဆောက်ထားသည်။ Admin သည် Gmail လိပ်စာကို username အဖြစ် အသုံးပြုပြီး ဤ website အတွက်သာ သတ်မှတ်ထားသော စကားဝှက်ဖြင့် ဝင်ရောက်မည်။ Google OAuth ကို မသုံးရ၊ Gmail ၏ မူရင်းစကားဝှက်ကို မတောင်း၊ မသုံး၊ မသိမ်းဆည်းရ။ ကြိုတင်ခွင့်ပြုထားသော Admin အကောင့်သာ ဝင်နိုင်ရမည်။

## ဝင်ရောက်မှုနှင့် request ကာကွယ်ရေး

Session ကို သက်တမ်းရှစ်နာရီရှိသော `HttpOnly; Secure; SameSite=None` cookie ဖြင့် ထိန်းသိမ်းမည်။ Login/logout POST၊ ကုန်ပစ္စည်းထည့်/ပြင်သည့် POST/PATCH၊ အုပ်စုပုံပြင်သည့် PATCH နှင့် ပုံတင်သည့် POST တို့တွင် `MG_ADMIN_SESSION_SECRET` ဖြင့် လက်မှတ်ထိုးထားပြီး 10 မိနစ်သက်တမ်းရှိသော CSRF token ကို စစ်ဆေးမည်။ Cross-site request များကို ပယ်ချမည်။

## ချိတ်ဆက်ပုံ

Frontend ကို React/Vite၊ server ကို Express/Vercel Function ဖြင့် တည်ဆောက်ထားသည်။ Browser သည် Admin website ၏ same-origin `/api/admin/*` လမ်းကြောင်းများကိုသာ ခေါ်မည်။ Admin server သည် session နှင့် CSRF ကို စစ်ဆေးပြီးနောက် `mental-gaming-store` project သို့ `MG_PRODUCT_API_SECRET` ဖြင့် HMAC လက်မှတ်ထိုးထားသော server-to-server request ပို့မည်။ Secret ကို browser သို့ မပို့ရ။ API server သည် secret၊ timestamp၊ တစ်ကြိမ်သာ အသုံးပြုနိုင်သော nonce၊ method၊ path နှင့် body ကို စစ်ဆေးပြီး တူညီသော request ကို ထပ်သုံးခြင်းမှ ကာကွယ်မည်။

သီးခြား `mental-gaming-api` Vercel project ၏ Production environment တွင် `MONGODB_URI` မရှိသောကြောင့် live catalog အတွက် အသုံးမပြုပါ။ Catalog နှင့် MongoDB အချက်အလက်များသည် `mental-gaming-store` project တွင် ရှိသည်။ HMAC ဖြင့် ကာကွယ်ထားသော request ဖြင့် live catalog မှ ကုန်ပစ္စည်း 56 ခု ရရှိကြောင်း အတည်ပြုပြီးဖြစ်သည်။

API portal တွင် ကုန်ပစ္စည်းစာရင်းဖတ်ခြင်း၊ အသစ်ထည့်ခြင်းနှင့် ပြင်ဆင်ခြင်း၊ အုပ်စုအဆင့်ဆင့်ဖတ်ခြင်း၊ အုပ်စု/အုပ်စုခွဲပုံပြင်ခြင်းနှင့် ပုံတင်ခြင်းတို့ကို သီးခြားကာကွယ်ထားသော လမ်းကြောင်းများဖြင့် လုပ်ဆောင်မည်။ ကုန်ပစ္စည်းတစ်ခုစီကို `catalogId` ဖြင့် အုပ်စုတစ်ခု သို့မဟုတ် အုပ်စုခွဲတစ်ခုနှင့် ချိတ်ဆက်မည်။ `category` အမည်ကို ရွေးထားသော catalog ၏ အမည်အတိုင်း server က သတ်မှတ်မည်။

## ပုံသိမ်းဆည်းခြင်းနှင့် ပြသခြင်း

Admin form မှ JPEG၊ PNG သို့မဟုတ် WebP ပုံဖိုင်ကို ရွေးနိုင်မည်။ Browser သည် ပုံ၏ အရှည်ဆုံးဘက်ကို 1200 pixel ထက်မကြီးစေဘဲ WebP အဖြစ် ချုံ့မည်။ ချုံ့ပြီးသောပုံသည် 900 KiB ထက်ကြီးပါက တင်ခွင့်မပြုပါ။ `POST /api/admin/media` သည် Admin session နှင့် CSRF ဖြင့် ကာကွယ်ထားမည်။ Admin server သည် ထို request ကို `mental-gaming-store` သို့ HMAC လက်မှတ်ဖြင့် ပေးပို့မည်။ API သည် MIME type နှင့် ဖိုင်အရွယ်အစားကို ထပ်မံစစ်ဆေးပြီး ပုံကို လက်ရှိအသုံးပြုနေသော MongoDB ၏ `adminImages` GridFS bucket ထဲတွင် သိမ်းမည်။ MongoDB URI နှင့် `MG_PRODUCT_API_SECRET` ကို browser ထံ မဖော်ပြရ။

တင်ပြီးသောပုံအတွက် `https://mental-gaming-store.vercel.app/api/store/media/:id` ပုံစံ HTTPS လိပ်စာကို ပြန်ပေးမည်။ Public store API သည် ID မှန်ကန်ပြီး ခွင့်ပြုထားသော image type ဖြစ်သည့်ဖိုင်ကိုသာ ဖတ်ရှုခွင့်ပေးမည်။ ပုံတင်ခြင်းနှင့် အုပ်စု/ကုန်ပစ္စည်းနှင့် ချိတ်ဆက်ခြင်းကို Admin ၏ ကာကွယ်ထားသော request မှသာ လုပ်ခွင့်ပေးမည်။ ပုံတစ်ပုံစီတွင် သီးခြား ID ရှိသဖြင့် cache အသုံးပြုနိုင်မည်။ Catalog၊ အုပ်စုခွဲနှင့် product တို့၏ ရှိပြီးသား `imageUrl` နေရာတွင် လိပ်စာကို သိမ်းမည်ဖြစ်၍ customer website သည် လက်ရှိ API မှတစ်ဆင့် ပုံကို ပြသနိုင်မည်။

## Admin စာမျက်နှာများ

`/catalogs` စာမျက်နှာတွင် အုပ်စုကြီး → အုပ်စုခွဲ → ကုန်ပစ္စည်း ဆက်စပ်မှုကို အဆင့်လိုက်ပြမည်။ အုပ်စုနှင့် အုပ်စုခွဲတစ်ခုစီတွင် ပုံအကြိုမြင်ကွင်း၊ ကုန်ပစ္စည်းအရေအတွက်နှင့် အသုံးပြုနေသည်/ဖျောက်ထားသည် အခြေအနေကို ပြမည်။ အုပ်စုတစ်ခုကို ရွေးပါက ထိုအုပ်စုနှင့် ဆက်စပ်သော ကုန်ပစ္စည်းများကို ဖော်ပြမည်။ အုပ်စုတိုင်းအတွက် ပုံတင်ခြင်း သို့မဟုတ် HTTPS ပုံလိပ်စာထည့်ခြင်းကို လုပ်နိုင်မည်။ `/products` form တွင် ရှိပြီးသား အုပ်စု သို့မဟုတ် အုပ်စုခွဲကို ရွေးပြီး ကုန်ပစ္စည်းနှင့် ချိတ်ဆက်နိုင်မည်။ ကုန်ပစ္စည်းတစ်ခုစီ၏ ပုံကိုလည်း တင်နိုင်သလို HTTPS ပုံလိပ်စာကိုလည်း ထည့်နိုင်မည်။

## ဖိုင်ဖွဲ့စည်းပုံနှင့် တာဝန်များ

- `index.ts`, `vercel.json` — Express Function၊ health endpoint၊ `/dashboard`၊ `/products`၊ `/catalogs` လမ်းကြောင်းနှင့် SPA refresh rewrite များ။
- `server/adminAuth.ts` — login၊ CSRF၊ session စစ်ဆေးခြင်းနှင့် logout။
- `server/adminProducts.ts` — session/CSRF ကာကွယ်မှုပါသော product၊ catalog၊ media proxy နှင့် HMAC ချိတ်ဆက်မှု။
- `server/adminProducts.test.ts` — proxy session၊ CSRF၊ ခွင့်ပြုထားသောလမ်းကြောင်း၊ HMAC နှင့် POST/PATCH ကာကွယ်မှုများကို စစ်ဆေးခြင်း။
- `client/src/App.tsx`, `client/src/pages/Home.tsx` — protected routing နှင့် dashboard menu။
- `client/src/pages/Products.tsx`, `client/src/pages/Catalogs.tsx` — ကုန်ပစ္စည်း form နှင့် အုပ်စု/အုပ်စုခွဲ/ကုန်ပစ္စည်း အဆင့်လိုက်မြင်ကွင်း။
- `client/src/components/ImageUploadField.tsx` — ပုံရွေးခြင်း၊ အကြိုကြည့်ခြင်း၊ လိပ်စာထည့်ခြင်းနှင့် အမှားအသိပေးခြင်း။
- `client/src/lib/products.ts`, `client/src/lib/catalogs.ts`, `client/src/lib/media.ts` — browser API အမျိုးအစားများ၊ same-origin request၊ ပုံချုံ့ခြင်းနှင့် upload။
- API repository ၏ `artifacts/api-server/src/middlewares/adminProductServiceAuth.ts`, `src/routes/admin.ts`, `src/routes/store.ts`, `src/routes/index.ts` — HMAC ကာကွယ်မှု၊ product/catalog handler၊ GridFS upload/download နှင့် public media route။
- API repository ၏ `api/store/admin-portal/catalogs.js`, `catalogs/[id].js`, `media.js`, `products.js`, `products/[id].js`, `api/store/media/[id].js` — Vercel Function လမ်းကြောင်းများ။
- API repository ၏ `scripts/api-vercel-entry.ts`, `api/[...path].js`, `scripts/build-api-bundle.mjs` — Express API ကို Vercel တွင် အသုံးပြုရန် တည်ဆောက်သည့်ဖိုင်များ။
- `plan.md`, `TODO.md`, `README.md` — အစီအစဉ်၊ လုပ်ငန်းအခြေအနေနှင့် ပုံထည့်နည်းလမ်းညွှန်။

## Vercel Production နှင့် လျှို့ဝှက်ဆက်တင်များ

Admin အတွက် သီးခြား private GitHub repository နှင့် `mental-gaming-admin` Vercel project ကို သုံးမည်။ Admin ၏ Production လိပ်စာမှာ `https://mental-gaming-store-admin.vercel.app` ဖြစ်သည်။ တူညီသော `MG_PRODUCT_API_SECRET` ကို Admin နှင့် catalog/API တာဝန်ရှိသော `mental-gaming-store` Vercel project ၏ Production environment တွင် လျှို့ဝှက်တန်ဖိုးအဖြစ် သိမ်းဆည်းမည်။ `MG_ADMIN_EMAIL`၊ `MG_ADMIN_PASSWORD`၊ `MG_ADMIN_SESSION_SECRET` တို့ကိုလည်း ကာကွယ်ထားသော Production environment တွင်သာ ထားမည်။ လျှို့ဝှက်တန်ဖိုးများကို source code၊ Git၊ browser bundle သို့မဟုတ် build log ထဲတွင် မရေးသားရ။

## ဒီဇိုင်း

Nordic Control Room (5.5%)၊ Neo-brutalist Ops Console (4.4%)၊ Midnight Arcade Command Deck (1.4%) ဟူသော ပုံစံသုံးမျိုးထဲမှ **Midnight Arcade Command Deck** ကို ရွေးထားသည်။ ဂိမ်းထိန်းချုပ်ခန်း၏ ခံစားမှုကို စနစ်တကျ Admin dashboard နှင့် ပေါင်းစပ်မည်။ နောက်ခံအတွက် အပြာရင့်ရောင်၊ အဓိကလုပ်ဆောင်ချက်အတွက် cyan၊ အောင်မြင်မှုအခြေအနေအတွက် lime ကို အသုံးပြုမည်။ ဖတ်ရှုရလွယ်ကူခြင်း၊ ဖုန်းမျက်နှာပြင်နှင့် ကိုက်ညီခြင်း၊ တုံ့ပြန်မှုမြန်ဆန်ခြင်းတို့ကို ဦးစားပေးမည်။ Space Grotesk၊ Inter နှင့် မြန်မာစာအတွက် သင့်လျော်သော fallback font ကို သုံးမည်။ အမှတ်တံဆိပ်သင်္ကေတမှာ gamepad ပုံစံ MG ဖြစ်ပြီး ထင်ရှားသောအရောင်မှာ electric cyan ဖြစ်သည်။

## လုံခြုံရေး

Google OAuth နှင့် Gmail ၏ မူရင်းစကားဝှက်ကို မသုံးရ။ Admin password၊ session secret၊ API shared secret နှင့် MongoDB URI ကို Vercel ၏ protected environment ထဲတွင်သာ ထိန်းသိမ်းမည်။ Public media route သည် ပုံကိုဖတ်ရန်သာ ခွင့်ပြုမည်။ Upload နှင့် product/catalog ပြောင်းလဲမှုတိုင်းကို Admin session၊ CSRF နှင့် API ၏ HMAC၊ timestamp၊ nonce စစ်ဆေးမှုတို့ဖြင့် ကာကွယ်မည်။
