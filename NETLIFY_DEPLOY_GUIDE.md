# 🚀 Netlify Deployment Guide (React / TanStack Start + Vite)

यह गाइड आपकी React/TanStack Start वेबसाइट को **Netlify** पर सफलतापूर्वक डिप्लॉय (Deploy) करने में मदद करेगी।

---

## 🛠️ Step 1: Local Setup (तैयारी)

हमने आपकी वेबसाइट को Netlify के अनुकूल बनाने के लिए निम्नलिखित फाइल्स कॉन्फ़िगर कर दी हैं:
1. **[vite.config.ts](file:///e:/New%20folder/lk/copy/vite.config.ts)**: हमने `cloudflare: false` सेट किया है ताकि क्लाउडफ्लेयर प्लगइन डिप्लॉयमेंट में बाधा न डाले।
2. **[netlify.toml](file:///e:/New%20folder/lk/copy/netlify.toml)**: यह फाइल Netlify को सही बिल्ड कमांड (`NITRO_PRESET=netlify npm run build`) और पब्लिश डायरेक्टरी (`.output/public`) बताती है।
3. **[public/_redirects](file:///e:/New%20folder/lk/copy/public/_redirects)**: यह SPA routes (जैसे `/account/orders`, `/cart`) पर **404 Page Not Found** एरर को ठीक करने के लिए है।

### Local Test Command (लोकल टेस्ट करने के लिए)
अगर आप अपने सिस्टम पर बिल्ड चेक करना चाहते हैं, तो टर्मिनल में यह कमांड चलाएं:
```bash
# Production build locally test karne ke liye
$env:NITRO_PRESET="netlify"  # Windows PowerShell
# ya cmd me: set NITRO_PRESET=netlify
npm run build
```

---

## 💻 Step 2: GitHub Repository Setup (गिटहब पर कोड डालना)

अगर आपका कोड पहले से GitHub पर नहीं है, तो अपने टर्मिनल में इन कमांड्स को एक-एक करके चलाएं:

```bash
# 1. Git Repository initialize karein
git init

# 2. Saare files ko staging area me add karein
git add .

# 3. Pehla commit karein
git commit -m "chore: configure Netlify deployment setup"

# 4. GitHub par nayi repository banayein aur uska URL copy karke remote add karein
# (Replace your-username & your-repo-name with original values)
git remote add origin https://github.com/your-username/your-repo-name.git

# 5. Branch ko main set karein
git branch -M main

# 6. Code ko GitHub par push karein
git push -u origin main
```

---

## 🌐 Step 3: Netlify Setup & Deployment (नेटलिफाई सेटअप)

1. **Netlify Dashboard में जाएं:** [app.netlify.com](https://app.netlify.com/) पर लॉग इन करें।
2. **New Site जोड़ें:** **"Add new site"** पर क्लिक करें और **"Import an existing project"** चुनें।
3. **GitHub चुनें:** GitHub प्रोवाइडर को ऑथराइज (Authorize) करें और अपनी Repository को सिलेक्ट करें।
4. **Build Settings कॉन्फ़िगर करें (यह स्वतः डिटेक्ट हो जाएगी):**
   * **Build Command:** `NITRO_PRESET=netlify npm run build`
   * **Publish Directory:** `.output/public`
5. **Environment Variables जोड़ें (अति महत्वपूर्ण ⚠️):**
   आपकी वेबसाइट Supabase डेटाबेस का उपयोग कर रही है, इसलिए आपको Netlify में एनवायरनमेंट वेरिएबल्स जोड़ने होंगे।
   * **Site configuration > Environment variables** में जाएं।
   * **"Add a variable"** पर क्लिक करें और अपने `.env` फाइल से निम्नलिखित वेरिएबल्स डालें:
     * `VITE_SUPABASE_URL` = *(आपका Supabase URL)*
     * `VITE_SUPABASE_ANON_KEY` = *(आपका Supabase Anon Key)*
6. **Deploy Site पर क्लिक करें! 🎉**

---

## 🔍 Step 4: Troubleshooting (समस्या निवारण / एरर फिक्स)

### 1. Build Failure: TypeScript compiler error (`tsc`)
अगर आपका कोड लोकल सर्वर पर चल रहा है लेकिन Netlify बिल्ड में TypeScript की वजह से फेल हो जाता है:
* **Fix**: आप अस्थायी रूप से बिल्ड के दौरान TypeScript एरर को इग्नोर करने के लिए `package.json` के बिल्ड कमांड को बदल सकते हैं या `tsconfig.json` में `"skipLibCheck": true` कर सकते हैं।
* **Netlify Build Settings** में जाकर बिल्ड कमांड को यह भी कर सकते हैं:
  `NITRO_PRESET=netlify npm run build -- --no-minify`

### 2. 404 Pages on Refresh / Reload
अगर वेबसाइट के होमपेज के अलावा किसी अन्य पेज (जैसे `/cart`) पर रिफ्रेश करने पर `404 Not Found` एरर आती है:
* **Fix**: हमने पहले ही `netlify.toml` और `public/_redirects` सेटअप कर दिया है। सुनिश्चित करें कि ये फाइलें गिटहब पर पुश हो गई हैं। यह नियम सभी रूट रिक्वेस्ट को `index.html` पर भेज देता है जिससे क्लाइंट-साइड राउटर इसे संभाल लेता है।

### 3. Database connection / Auth does not work on Netlify
अगर लॉगिन, रजिस्टर या डेटा लोड नहीं हो रहा है:
* **Fix**: इसका मतलब है कि आपने Netlify के डैशबोर्ड में `VITE_SUPABASE_URL` और `VITE_SUPABASE_ANON_KEY` नहीं डाला है। कृपया Step 3 का पॉइंट 5 दोबारा चेक करें।

### 4. Node Version Mismatch
अगर बिल्ड एनवायरनमेंट में पुराना Node.js वर्शन एरर देता है:
* **Fix**: हमने `netlify.toml` में `NODE_VERSION = "20"` पहले ही जोड़ दिया है ताकि Netlify हमेशा आधुनिक Node वर्शन का उपयोग करे।

---

## 📁 Deployment Directory Structure (डिप्लॉयमेंट स्ट्रक्चर)

सफल बिल्ड के बाद, आपका प्रोजेक्ट स्ट्रक्चर इस प्रकार काम करेगा:

```text
copy/
├── public/
│   └── _redirects              <-- SPA routing fallback redirects
├── netlify.toml                <-- Netlify Build configuration
├── vite.config.ts              <-- Disabled Cloudflare specific compilation
├── package.json                <-- Contains build command
└── .output/                    <-- Generated after Netlify Build
    └── public/                 <-- Static assets served by Netlify CDN
```

**Congratulations! Your React/Next.js/TanStack Start project is fully prepared for a robust and production-ready Netlify deployment!** 🚀
