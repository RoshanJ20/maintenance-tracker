#!/bin/bash

# Vercel Deployment Helper Script
# Run this before deploying to Vercel

echo "🚀 Maintenance Tracker - Vercel Deployment Prep"
echo "================================================"
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

echo "✅ Step 1: Checking git status..."
if [ -d ".git" ]; then
    echo "   Git repository found"
else
    echo "❌ No git repository. Initialize with: git init"
    exit 1
fi

echo ""
echo "✅ Step 2: Installing dependencies..."
npm install

echo ""
echo "✅ Step 3: Running TypeScript check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Fix them before deploying."
    exit 1
fi

echo ""
echo "✅ Step 4: Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Fix errors before deploying."
    exit 1
fi

echo ""
echo "✅ Step 5: Checking environment variables..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "   Make sure to set environment variables in Vercel Dashboard:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - NEXT_PUBLIC_APP_URL"
else
    echo "   .env.local found (remember to add these to Vercel)"
fi

echo ""
echo "✅ Step 6: Committing changes..."
git add .
echo "   Please enter commit message (or press Enter for default):"
read -r commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="feat: Ready for Vercel deployment"
fi
git commit -m "$commit_msg"

echo ""
echo "================================================"
echo "✅ PRE-DEPLOYMENT CHECKS COMPLETE!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Push to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Deploy on Vercel:"
echo "   Option A: Visit https://vercel.com and import your repo"
echo "   Option B: Run 'vercel' (if CLI installed)"
echo ""
echo "3. Set environment variables in Vercel Dashboard"
echo ""
echo "4. Update Supabase redirect URLs with your Vercel URL"
echo ""
echo "📖 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
