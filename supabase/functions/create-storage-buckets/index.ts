
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    console.log("[create-storage-buckets] Ensuring required storage buckets exist");
    
    // Array of buckets to be created
    const requiredBuckets = [
      {
        name: "media_gallery",
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
        allowedMimeTypes: ['image/*', 'video/*', 'audio/*']
      },
      {
        name: "ai-generated-media",
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB limit
        allowedMimeTypes: ['image/*', 'video/*', 'audio/*']
      }
    ];
    
    // Get existing buckets
    const { data: existingBuckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      throw new Error(`Failed to list existing buckets: ${bucketsError.message}`);
    }
    
    const existingBucketNames = existingBuckets?.map(b => b.name) || [];
    const results = [];
    
    // Create buckets that don't exist
    for (const bucket of requiredBuckets) {
      if (!existingBucketNames.includes(bucket.name)) {
        console.log(`[create-storage-buckets] Creating bucket: ${bucket.name}`);
        
        const { error: createError } = await supabase
          .storage
          .createBucket(bucket.name, {
            public: bucket.public,
            fileSizeLimit: bucket.fileSizeLimit,
            allowedMimeTypes: bucket.allowedMimeTypes
          });
          
        if (createError) {
          results.push({
            bucket: bucket.name,
            success: false,
            error: createError.message
          });
          console.error(`[create-storage-buckets] Failed to create bucket ${bucket.name}:`, createError);
        } else {
          results.push({
            bucket: bucket.name,
            success: true
          });
          console.log(`[create-storage-buckets] Successfully created bucket: ${bucket.name}`);
        }
      } else {
        results.push({
          bucket: bucket.name,
          success: true,
          existed: true
        });
        console.log(`[create-storage-buckets] Bucket already exists: ${bucket.name}`);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("[create-storage-buckets] Error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500 
      }
    );
  }
});
