import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const schema = process.env.SUPABASE_SCHEMA ?? "sie2028";

if (!url || !key) {
  throw new Error("Missing Supabase read-only environment variables.");
}

export function createSupabaseReadOnlyClient() {
  const supabaseUrl = url!;
  const supabaseKey = key!;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema
    }
  });
}
