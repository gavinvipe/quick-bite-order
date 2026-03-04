

## Analysis

There are four separate tasks in this request:

### 1. My Orders page stuck on "Loading orders..."

**Root cause:** The `useEffect` in `MyOrdersPage.tsx` depends on `[user, authLoading]`. When `authLoading` transitions from `true` to `false` with `user = null` (guest), the effect runs, fetches guest orders, and sets `fetched = true`. But if `onAuthStateChange` fires again (which it does on session restore), `user` changes to the same `null`, re-triggering the effect. The `fetched && !user` guard then skips the fetch, but `loading` stays `true` because it was never reset.

**Fix:** Initialize `loading` based on whether there's anything to load. More importantly, if the effect returns early due to the `fetched && !user` guard, set `loading = false`. Also add `fetched` to the dependency array or restructure the logic.

**Changes:**
- `src/pages/MyOrdersPage.tsx`: When the effect skips due to `fetched && !user`, immediately set `loading = false`. This ensures the page doesn't stay stuck.

### 2. Admin login / setup-admin edge function bug

**Root cause:** The auth logs show `"500: Database error checking email"` with `"FATAL: terminating connection due to administrator command (SQLSTATE 57P01)"`. This is a transient DB connection issue during a migration/restart. However, the edge function also uses `https://esm.sh/@supabase/supabase-js@2` which can cause version drift issues.

**Fix:** Update the edge function to use the more reliable CORS headers (include all required headers) and add error handling around the admin.createUser call. The 500 error was transient (DB restart during migration), but we should ensure proper error propagation.

**Changes:**
- `supabase/functions/setup-admin/index.ts`: Update CORS headers to include all required headers (`x-supabase-client-platform`, etc.). Add better error handling.

### 3. Brand name change to "Frankies Fast Food"

**Files to update:**
- `src/components/Navbar.tsx` line 49: "Fast Food" -> "Frankies Fast Food"
- `src/components/Footer.tsx` lines 9, 12: "FlameKitchen" -> "Frankies Fast Food"
- `index.html` lines 7, 12: title and og:title
- `src/hooks/use-cart.tsx` line 18: localStorage key (cosmetic, keep backward compat)

### 4. "Give me a prompt to use a new Supabase"

This project uses Lovable Cloud, which provides the backend automatically. It cannot be disconnected or swapped for a different project. The transient DB error was caused by a migration restart, not a fundamental issue with the backend. I'll explain this in the plan.

---

## Plan

### Task 1: Fix My Orders loading state
Edit `src/pages/MyOrdersPage.tsx`:
- When the effect returns early (`fetched && !user`), set `loading = false` before returning
- This prevents the infinite "Loading orders..." state for guest users

### Task 2: Fix setup-admin edge function
Edit `supabase/functions/setup-admin/index.ts`:
- Expand CORS `Access-Control-Allow-Headers` to include all required Supabase client headers
- The "Database error checking email" was a transient issue (DB connection terminated during migration). Retrying should work now. No code logic change needed beyond CORS.

### Task 3: Rename brand to "Frankies Fast Food"
- `src/components/Navbar.tsx`: Change "Fast Food" to "Frankies Fast Food"
- `src/components/Footer.tsx`: Change "FlameKitchen" to "Frankies Fast Food" (2 places)
- `index.html`: Update `<title>` and `og:title` to "Frankies Fast Food"

### Task 4: About using a new backend
This project runs on Lovable Cloud, which provides the backend automatically. It cannot be swapped for a separate project. The error you saw was a transient database restart during migration -- retrying the admin setup should work now. No action needed.

