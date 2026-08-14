#!/usr/bin/env bash
set -e

# Record initial branch to return to it later
INITIAL_BRANCH=$(git branch --show-current)
TARGET_BRANCH="gh-pages"
SOURCE_BRANCH="master"

# Ensure script is invoked from master branch
if [ "${INITIAL_BRANCH}" != "${SOURCE_BRANCH}" ]; then
  echo "Error: Deployment can only be invoked from the '${SOURCE_BRANCH}' branch (currently on '${INITIAL_BRANCH}')."
  exit 1
fi

echo "==> Starting deployment to ${TARGET_BRANCH}..."

# Ensure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory has uncommitted changes. Please commit or stash them first."
  exit 1
fi

# Ensure gh-pages branch exists locally
if ! git show-ref --verify --quiet refs/heads/${TARGET_BRANCH}; then
  echo "==> Creating local ${TARGET_BRANCH} branch tracking origin/${TARGET_BRANCH}..."
  git checkout -b ${TARGET_BRANCH} origin/${TARGET_BRANCH}
else
  echo "==> Checking out ${TARGET_BRANCH}..."
  git checkout ${TARGET_BRANCH}
fi

# Pull latest changes from remote gh-pages if available
echo "==> Pulling latest ${TARGET_BRANCH} from origin..."
git pull origin ${TARGET_BRANCH} || true

# Merge latest source branch (master)
echo "==> Merging ${SOURCE_BRANCH} into ${TARGET_BRANCH}..."
git merge ${SOURCE_BRANCH} --no-edit

# Build TypeScript to JavaScript
echo "==> Building JavaScript assets..."
npm run build

# Run tests to ensure build integrity
echo "==> Running test suite..."
npm test

# Minify JavaScript assets
echo "==> Minifying JavaScript assets..."
npm run minify

# Stage all assets including compiled JS files, minified bundles, and sourcemaps
echo "==> Staging assets..."
git add -A
git add -f js/*.js js/*.min.js js/*.js.map 2>/dev/null || true

# Commit changes if any exist
if ! git diff --cached --quiet; then
  echo "==> Committing build assets..."
  git commit -m "Deploy latest master build to gh-pages"
else
  echo "==> No changes to commit."
fi

# Push to origin gh-pages
echo "==> Pushing ${TARGET_BRANCH} to origin..."
git push origin ${TARGET_BRANCH}

# Switch back to the original branch
echo "==> Returning to ${INITIAL_BRANCH}..."
git checkout "${INITIAL_BRANCH}"

echo "==> Deployment to ${TARGET_BRANCH} completed successfully!"
