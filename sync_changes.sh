
#!/bin/bash
# Script to synchronize external changes

# Fetch the latest changes from the remote repository
git fetch origin

# Pull the latest changes, merging them with the current branch
git pull origin main

# If there are any conflicts, they will be shown here
# You may need to resolve them manually

# Optional: Ensure all dependencies are up to date
bun install

# Deploy any updated Supabase Edge Functions
echo "Checking for Edge Function updates..."
supabase functions deploy apiframe-generate-image
supabase functions deploy apiframe-generate-video
supabase functions deploy apiframe-generate-audio
supabase functions deploy apiframe-task-status
supabase functions deploy apiframe-task-cancel
supabase functions deploy apiframe-media-webhook

echo "Synchronization complete!"

