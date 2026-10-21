# Mental Gaming Admin

ဤ website သည် Mental Gaming customer storefront နှင့် သီးခြားဖြစ်သော Vercel admin website ဖြစ်သည်။ Login ဝင်ရာတွင် သတ်မှတ်ထားသော Gmail လိပ်စာကို အသုံးပြုရမည်။ Password သည် Gmail ၏ မူရင်း password မဟုတ်ဘဲ ဤ website အတွက်သာ သတ်မှတ်ထားသော သီးခြား password ဖြစ်သည်။

## လျှို့ဝှက် setting များ

အောက်ပါ တန်ဖိုးသုံးခုကို Vercel ၏ Production နှင့် Preview ပတ်ဝန်းကျင်များတွင် encrypted environment settings အဖြစ် ထည့်သွင်းရမည်။

- `MG_ADMIN_EMAIL` — ခွင့်ပြုထားသော admin ၏ Gmail လိပ်စာ။
- `MG_ADMIN_PASSWORD` — ဤ website အတွက် သတ်မှတ်ထားသော၊ အနည်းဆုံး စာလုံးရေ 12 လုံးပါသည့် password။
- `MG_ADMIN_SESSION_SECRET` — session ကို လက်မှတ်ထိုးရန် အသုံးပြုသော၊ အနည်းဆုံး 32 bytes ရှိသည့် ကျပန်းလျှို့ဝှက်တန်ဖိုး။

လျှို့ဝှက်တန်ဖိုးများကို source code၊ Git၊ browser bundle သို့မဟုတ် build log တွင် မထည့်သွင်းပါနှင့်။ Gmail account ၏ မူရင်း password ကို မသုံးပါနှင့်။

## Build လုပ်ခြင်းနှင့် စစ်ဆေးခြင်း

`pnpm build` သည် Vite frontend ကို `public/` ဖိုင်တွဲထဲသို့ build လုပ်ပေးသည်။ အဓိက `index.ts` သည် Vercel Express Function ၏ API ကို အလုပ်လုပ်စေသည်။ `vercel.json` သည် `/login` နှင့် `/dashboard` လမ်းကြောင်းများကို ပင်မစာမျက်နှာသို့ ညွှန်ပေးသည်။

```sh
pnpm install
pnpm check
pnpm test
pnpm build
```
