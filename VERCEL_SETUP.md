# Vercel Production Branch Setup

## ✅ Current Status
- **Production URL**: https://www.lighthouseai.info
- **Successfully deployed from**: `v0/main-7f5df49f`
- **Build**: ✅ Passing
- **All APIs**: ✅ Working

## 🔧 Set v0/main-7f5df49f as Permanent Production Branch

To make future pushes to `v0/main-7f5df49f` automatically deploy to production:

### Option 1: Vercel Dashboard (Recommended)
1. Go to https://vercel.com/rendona39-jpgs-projects/lighthouse-sovereign/settings/git
2. Under **Production Branch**, change from `main` to `v0/main-7f5df49f`
3. Click **Save**

### Option 2: Vercel CLI
```bash
cd /Users/anjrew/Desktop/Lighthouse-sovereign
vercel git connect
# When prompted, set production branch to: v0/main-7f5df49f
```

## 📋 Environment Variables (Already Set ✅)
All production env vars are configured:
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY  
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ SUPABASE_SERVICE_KEY
- ✅ ANTHROPIC_API_KEY
- ✅ GEMINI_API_KEY
- ✅ AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
- ✅ AZURE_DOCUMENT_INTELLIGENCE_KEY

## 🚀 Next Deployments
Once the production branch is set:
```bash
git add .
git commit -m "Your changes"
git push origin v0/main-7f5df49f
```
→ Automatic production deployment to www.lighthouseai.info

## 🧪 Test Your APIs
Your backend is now live! Test with:

**Stats API**:
```bash
curl https://www.lighthouseai.info/api/stats?org_id=greenwich_final
```

**Query API**:
```bash
curl -X POST https://www.lighthouseai.info/api/query \
  -H "Content-Type: application/json" \
  -d '{"userId":"greenwich_final","message":"What is my revenue?"}'
```

**Ingest API**:
Upload via the UI at https://www.lighthouseai.info/files

---

## 🎯 What Got Fixed
1. ✅ Lazy initialization of Supabase clients (no build-time eval)
2. ✅ Standardized env var names (SUPABASE_URL, not NEXT_PUBLIC_*)
3. ✅ All APIs converted to App Router format
4. ✅ Theme selector SSR issue resolved
5. ✅ Production deployment from correct branch

**Commit**: 633d53d  
**Branch**: v0/main-7f5df49f  
**Live**: https://www.lighthouseai.info 🚢
