# လုပ်ဆောင်ရန်စာရင်း

## ၁။ Storefront နှင့် သီးခြားဖြစ်သော Admin website
- [x] Mental Gaming Admin သည် customer storefront နှင့် သီးခြား website/project ဖြစ်ရမည်။
- [x] Admin website တွင် ကိုယ်ပိုင် login page နှင့် dashboard home ရှိရမည်။
- [ ] Admin website သည် `Mental-Gaming-Bot` repository၊ storefront၊ API တို့ကို မပြောင်းလဲဘဲ သီးခြား private GitHub repository နှင့် Vercel project ကို အသုံးပြုရမည်။

## ၂။ Gmail လိပ်စာနှင့် website password
- [x] Admin သည် Gmail လိပ်စာကို username အဖြစ် အသုံးပြုပြီး website အတွက် သီးခြား password ဖြင့် ဝင်ရမည်။
- [x] Google OAuth ကို မသုံးရ။ Gmail account ၏ မူရင်း password ကို မတောင်း၊ မသုံး၊ မသိမ်းဆည်းရ။
- [x] ကြိုတင်ခွင့်ပြုထားသော admin account တစ်ခုသာ ဝင်နိုင်ရမည်ဖြစ်ပြီး public sign-up မရှိရ။
- [x] Email၊ website password၊ session key တို့ကို ကာကွယ်ထားသော environment settings မှ ဖတ်ယူရမည်။ Server ဘက်တွင် `scrypt` နှင့် constant-time comparison ကို အသုံးပြု၍ စစ်ဆေးရမည်။
- [x] Login ကြိုးပမ်းမှုကို 15 မိနစ်လျှင် 8 ကြိမ်အထိ ကန့်သတ်ပြီး ယာယီမှတ်တမ်းကို key 2000 ထက်မပိုအောင် သိမ်းဆည်းရမည်။
- [x] Email သို့မဟုတ် password မှားယွင်းပါက တူညီသော ယေဘုယျအသိပေးချက်ကို ပြသပြီး လျှို့ဝှက်တန်ဖိုးများကို log တွင် မရေးသားရ။

## ၃။ Dashboard နှင့် session လုံခြုံရေး
- [x] မှန်ကန်စွာ login ဝင်ပြီးနောက် `/dashboard` ကို ပြသရမည်ဖြစ်ပြီး ခွင့်ပြုချက်မရှိသူများသည် ကန့်သတ်ထားသောအပိုင်းသို့ ဝင်ရောက်မရစေရ။
- [x] မချိတ်ဆက်ထားသော orders၊ products၊ users ဒေတာများကို တကယ့်ဒေတာများကဲ့သို့ မဖော်ပြရ။
- [x] Session တွင် `HttpOnly`၊ `Secure` cookie နှင့် server ဘက်မှ လက်မှတ်/သက်တမ်း စစ်ဆေးမှုတို့ ပါရှိရမည်။ Logout လုပ်ပြီးနောက် session သည် အကျုံးမဝင်တော့ရ။
- [x] `/csrf` မှ ရရှိသော HMAC ပါသည့်၊ 10 မိနစ်သက်တမ်းရှိသော token ကို login/logout POST request ၏ `X-CSRF-Token` header မှတစ်ဆင့် စစ်ဆေးရမည်။ Cross-site request များကို ပိတ်ပင်ရမည်။ Browser cookie ပိတ်ထားသည့်အခါတွင်လည်း login အလုပ်လုပ်ရမည်။

## ၄။ Vercel တွင် သီးခြားတင်ထားခြင်း
- [ ] `mental-gaming-admin` အမည်ရှိ သီးခြား Vercel project နှင့် private source repository ကို ဖန်တီးရမည်။
- [ ] `MG_ADMIN_EMAIL`၊ `MG_ADMIN_PASSWORD`၊ `MG_ADMIN_SESSION_SECRET` တို့ကို Production နှင့် Preview ပတ်ဝန်းကျင်များတွင် encrypted environment values အဖြစ် သတ်မှတ်ရမည်။ Browser bundle၊ Git၊ build log တို့တွင် မပါဝင်စေရ။
- [ ] Vercel HTTPS လိပ်စာတွင် မှန်ကန်သော admin email နှင့် ဤ website အတွက်သာ သတ်မှတ်ထားသော password ဖြင့် login ဝင်နိုင်ပြီး dashboard ကို ကြည့်ရှုနိုင်ကာ logout လုပ်နိုင်ရမည်။
- [ ] `/`၊ `/login`၊ `/dashboard`၊ `/api/health`၊ login နှင့် CSRF လုပ်ငန်းစဉ်တို့ကို စစ်ဆေးပြီးနောက် Production လိပ်စာကို အသိပေးရမည်။
