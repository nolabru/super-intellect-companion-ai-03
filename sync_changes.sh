
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

echo "Synchronization complete!"
