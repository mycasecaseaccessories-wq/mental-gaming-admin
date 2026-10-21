# Mental Gaming Admin — အကောင်အထည်ဖော်ရေး အစီအစဉ်

## ရည်ရွယ်ချက်နှင့် လုပ်ငန်းအတိုင်းအတာ

ဤ Admin website သည် Mental Gaming customer storefront နှင့် သီးခြားဖြစ်သည်။ Admin သည် Gmail လိပ်စာကို username အဖြစ် အသုံးပြုပြီး ဤ website အတွက်သာ သတ်မှတ်ထားသော သီးခြား password ဖြင့် ဝင်ရောက်မည်။ Google OAuth ကို မသုံးပါ။ Gmail account ၏ မူရင်း password ကို မတောင်း၊ မသုံး၊ မသိမ်းဆည်းပါ။ ပထမဗားရှင်းတွင် ကြိုတင်ခွင့်ပြုထားသော admin account တစ်ခုသာ ရှိမည်။

ဝင်ရောက်မရသည့် အကြောင်းရင်းမှာ Preview တွင် cookie ကို အခြေခံထားသော CSRF စစ်ဆေးမှုကြောင့် ဖြစ်နိုင်သဖြင့် Vercel ဗားရှင်းတွင် cookie မလိုအပ်သော၊ သက်တမ်းကန့်သတ်ထားသည့် HMAC token ကို အသုံးပြုမည်။ လက်ရှိအသုံးပြုနေသော storefront/API နှင့် ၎င်းတို့၏ source code၊ deployment တို့ကို မပြောင်းလဲပါ။ ဤဗားရှင်းတွင် orders၊ products၊ users ဒေတာများကို ချိတ်ဆက်မည်မဟုတ်ပါ။

## အကောင်အထည်ဖော်မှု

React/Vite frontend နှင့် Express API ကို သီးခြားစီ build လုပ်မည်။ Express app သည် Vercel Function အဖြစ် အလုပ်လုပ်မည်ဖြစ်ပြီး Vite output သည် static files များ ဖြစ်မည်။ `MG_ADMIN_EMAIL`၊ `MG_ADMIN_PASSWORD`၊ `MG_ADMIN_SESSION_SECRET` ဟူသော setting သုံးခုကို Vercel ၏ Production နှင့် Preview ပတ်ဝန်းကျင်များတွင် encrypted value များအဖြစ် သိမ်းဆည်းမည်။ လျှို့ဝှက်တန်ဖိုးများကို source code၊ Git၊ browser bundle သို့မဟုတ် log တွင် မရေးသားပါ။

Server သည် password ကို `scrypt` နှင့် constant-time comparison အသုံးပြု၍ စစ်ဆေးမည်။ 15 မိနစ်အတွင်း IP တစ်ခုမှ login ကြိုးပမ်းမှု ရှစ်ကြိမ်ထက်ပို၍ ခွင့်မပြုပါ။ ယာယီမှတ်တမ်းကို key 2000 အထိသာ သိမ်းဆည်းမည်။ Login ဝင်သည့်အခါ ရှစ်နာရီသက်တမ်းရှိသော `HttpOnly`၊ `Secure`၊ `SameSite=None` session cookie ကို ထုတ်ပေးမည်။ Logout လုပ်သည့်အခါ session cookie ကို အကျုံးမဝင်တော့အောင် လုပ်မည်။

`/api/admin-auth/csrf` သည် session key ဖြင့် HMAC လက်မှတ်ထိုးထားသော၊ 10 မိနစ်သက်တမ်းရှိသည့် token ကို ပြန်ပေးမည်။ Login နှင့် logout POST request များသည် token ကို `X-CSRF-Token` header တွင် ပေးပို့မည်ဖြစ်ပြီး server က လက်မှတ်၊ သက်တမ်းနှင့် `Sec-Fetch-Site` ကို စစ်ဆေးမည်။ Cross-site request များကို ပိတ်ပင်မည်။ ဤကာကွယ်မှုအတွက် browser cookie မလိုအပ်ပါ။

Admin စာမျက်နှာတွင် login၊ dashboard နှင့် logout လုပ်ဆောင်ချက်များ ပါရှိမည်။ မချိတ်ဆက်ထားသော store ဒေတာများကို တကယ့်ဒေတာများကဲ့သို့ မဖော်ပြပါ။

## Vercel တွင် တင်ထားခြင်း

Admin အတွက် private GitHub repository အသစ်တစ်ခု ဖန်တီးပြီး `mental-gaming-admin` အမည်ရှိ သီးခြား Vercel project နှင့် ချိတ်ဆက်မည်။ Storefront လိပ်စာနှင့် မတူသော HTTPS လိပ်စာကို အသုံးပြုမည်။ လျှို့ဝှက် setting များကို Production နှင့် Preview တွင် သီးခြားစီ ထည့်သွင်းမည်။ Password ကို chat တွင် ရေးခိုင်းမည်မဟုတ်ဘဲ လုံခြုံစွာ ကာကွယ်ထားသော လျှို့ဝှက်အချက်အလက်ဖြည့်သွင်းသည့် form ကို အသုံးပြုမည်။

## အဓိကဖိုင်များ

- `index.ts` — Vercel Express Function နှင့် health endpoint။
- `server/adminAuth.ts` — login၊ CSRF၊ session နှင့် logout API။
- `server/adminAuth.test.ts` — auth နှင့် လုံခြုံရေးဆိုင်ရာ စမ်းသပ်စစ်ဆေးမှုများ။
- `client/src/App.tsx`, `client/src/pages/` — login နှင့် dashboard စာမျက်နှာများ။
- `client/src/lib/adminAuth.ts` — browser မှ auth API သို့ ချိတ်ဆက်မှု။
- `vite.config.ts`, `vercel.json` — static build နှင့် စာမျက်နှာလမ်းကြောင်း setting များ။
- `plan.md`, `TODO.md` — ဤအစီအစဉ်နှင့် လုပ်ဆောင်ရန်စာရင်း။

## ဒီဇိုင်း

Nordic Control Room (5.5%)၊ Neo-brutalist Ops Console (4.4%)၊ Midnight Arcade Command Deck (1.4%) ဟူသော ဒီဇိုင်းပုံစံသုံးမျိုးကို စဉ်းစားပြီး **Midnight Arcade Command Deck** ကို ရွေးချယ်ထားသည်။ ဂိမ်းထိန်းချုပ်မှုအငွေ့အသက်ကို စနစ်တကျ စီစဉ်ထားသော admin မျက်နှာပြင်နှင့် ပေါင်းစပ်မည်။ နောက်ခံတွင် နက်ပြာရောင်၊ အဓိကလုပ်ဆောင်ချက်များတွင် cyan၊ အောင်မြင်မှုအခြေအနေတွင် lime ကို အသုံးပြုမည်။ ဖတ်ရှုရလွယ်ကူမှု၊ ဖုန်းမျက်နှာပြင်နှင့် လိုက်ဖက်မှု၊ တုံ့ပြန်မှုမြန်ဆန်မှုတို့ကို ဦးစားပေးမည်။ Space Grotesk၊ Inter font များနှင့် မြန်မာစာအတွက် သင့်လျော်သော fallback font ကို အသုံးပြုမည်။ Logo သည် gamepad ပုံစံ MG သင်္ကေတဖြစ်ပြီး အမှတ်တံဆိပ်၏ အဓိကအရောင်မှာ electric cyan ဖြစ်မည်။

## လုံခြုံရေး

Google OAuth နှင့် Gmail ၏ မူရင်း password ကို မသုံးပါ။ လျှို့ဝှက် setting များကို Vercel ၏ encrypted environment တွင် သိမ်းဆည်းပြီး source code သို့မဟုတ် Git တွင် မရေးသားပါ။
