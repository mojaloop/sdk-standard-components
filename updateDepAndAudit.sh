#!/bin/sh
set -e

# Check for required dependencies
echo "Checking for required dependencies..."
MISSING_DEPS=""

# Check for jq
if ! command -v jq > /dev/null 2>&1; then
  MISSING_DEPS="$MISSING_DEPS jq"
fi

# Check for awk (should be present on most systems, but verify)
if ! command -v awk > /dev/null 2>&1; then
  MISSING_DEPS="$MISSING_DEPS awk"
fi

# Check for npm
if ! command -v npm > /dev/null 2>&1; then
  MISSING_DEPS="$MISSING_DEPS npm"
fi

# Check for curl (needed for grype installation)
if ! command -v curl > /dev/null 2>&1; then
  MISSING_DEPS="$MISSING_DEPS curl"
fi

# If any dependencies are missing, report and exit
if [ -n "$MISSING_DEPS" ]; then
  echo "Error: The following required tools are not installed:"
  for dep in $MISSING_DEPS; do
    echo "  - $dep"
  done
  echo ""
  echo "Please install the missing dependencies before running this script."
  echo "Installation suggestions:"
  echo "  - jq: https://stedolan.github.io/jq/download/"
  echo "  - yq: https://github.com/mikefarah/yq#install"
  echo "  - curl: Usually available via package manager (apt, yum, brew, etc.)"
  exit 1
fi

echo "All required dependencies are available."
echo ""

echo "Starting dependency update and audit process..."

# Step 1: Update dependencies
echo "Step 1: Updating dependencies..."
npm run dep:update
npm install

# Step 2: Run npm audit fix
echo "Step 2: Running npm audit fix..."
npm audit fix || true

# Step 3: Get unfixed vulnerabilities
echo "Step 3: Checking for unfixed vulnerabilities..."
UNFIXED=$(npm audit --json | jq -r '.vulnerabilities | to_entries[] | select(.value.fixAvailable == false or (.value.fixAvailable | type == "object" and .isSemVerMajor == true)) | .value.via[] | select(type == "object") | .url' | sed 's|https://github.com/advisories/||' | sort -u)

if [ -z "$UNFIXED" ]; then
  echo "No unfixed vulnerabilities found."
else
  echo "Unfixed vulnerabilities found:"
  echo "$UNFIXED"
fi
# Step 4: Update audit-ci.jsonc with unfixed vulnerabilities
echo "Step 4: Updating audit-ci.jsonc..."
TEMP_FILE=$(mktemp)

# Read current allowlist from audit-ci.jsonc - strip comments first for jq parsing
CURRENT_ALLOWLIST=$(grep -v '^\s*//' audit-ci.jsonc | jq -r '.allowlist[]' 2>/dev/null | grep '^GHSA-' || true)

# Combine current and new vulnerabilities, remove duplicates
COMBINED=$(echo -e "$CURRENT_ALLOWLIST\n$UNFIXED" | sort -u | grep '^GHSA-' || true)

# Build new allowlist array
if [ -n "$COMBINED" ]; then
  ALLOWLIST_JSON=$(echo "$COMBINED" | jq -R . | jq -s .)
else
  ALLOWLIST_JSON='[]'
fi

# Update the allowlist in audit-ci.jsonc while preserving comments
awk -v allowlist="$ALLOWLIST_JSON" '
  # Detect the allowlist property line
  /^[[:space:]]*"allowlist"[[:space:]]*:/ {
    # Capture indentation before the opening quote of "allowlist"
    allowlist_indent = substr($0, 1, match($0, /"/) - 1)

    # Handle case where the entire array is on a single line
    if ($0 ~ /\[/ && $0 ~ /\]/) {
      has_comma = ($0 ~ /\],/)
      print allowlist_indent "\"allowlist\": " allowlist (has_comma ? "," : "")
      in_allowlist = 0
    } else {
      # Multi-line array: skip lines until closing bracket is found
      in_allowlist = 1
    }
    next
  }

  # While inside the original allowlist array, look for the closing bracket line
  in_allowlist && $0 ~ /^[[:space:]]*\][[:space:]]*,?[[:space:]]*(\/\/.*)?$/ {
    has_comma = ($0 ~ /\],/)
    # Format allowlist with proper indentation for array items
    formatted_allowlist = ""
    n = split(allowlist, items, /[,\[\]]/)
    for (i = 1; i <= n; i++) {
      # Remove whitespace and quotes
      item = items[i]
      sub(/^[[:space:]"]+/, "", item)
      sub(/[[:space:]"]+$/, "", item)
      if (item != "") {
        formatted_allowlist = formatted_allowlist allowlist_indent "  \"" item "\""
        if (i < n) {
          # Add comma only if not last item
          formatted_allowlist = formatted_allowlist ","
        }
        formatted_allowlist = formatted_allowlist "\n"
      }
    }
    print allowlist_indent "\"allowlist\": ["
    printf "%s", formatted_allowlist
    print allowlist_indent "]" (has_comma ? "," : "")
    in_allowlist = 0
    next
  }

  # Skip all other lines that are part of the original allowlist array
  in_allowlist {
    next
  }

  # Print all other lines unchanged
  {
    print
  }
' audit-ci.jsonc > "$TEMP_FILE"
mv "$TEMP_FILE" audit-ci.jsonc

echo "audit-ci.jsonc updated successfully."

# Step 5: Run audit check
echo "Step 5: Running audit check..."
npm run audit:check || true

# Step 6: Install grype if not present
echo "Step 6: Checking for grype installation..."
# Check common installation paths
if command -v grype &> /dev/null; then
  echo "grype is already installed at $(which grype)"
elif [ -x "$HOME/.local/bin/grype" ]; then
  echo "grype found at $HOME/.local/bin/grype, adding to PATH"
  export PATH="$HOME/.local/bin:$PATH"
elif [ -x "/usr/local/bin/grype" ]; then
  echo "grype found at /usr/local/bin/grype, adding to PATH"
  export PATH="/usr/local/bin:$PATH"
else
  echo "grype not found. Installing grype..."
  GRYPE_VERSION="v0.65.1"
  GRYPE_CHECKSUM="4591f422e11a37c0f5f848f2af8e51a2d67562095940428d0526019623e14674"  # Replace with actual checksum from release
  curl -sSfL "https://github.com/anchore/grype/releases/download/${GRYPE_VERSION}/grype_${GRYPE_VERSION}_linux_amd64.tar.gz" -o /tmp/grype.tar.gz
  echo "${GRYPE_CHECKSUM}  /tmp/grype.tar.gz" | sha256sum -c - || { echo "Checksum verification failed"; exit 1; }
  tar -xzf /tmp/grype.tar.gz -C "$HOME/.local/bin" grype
  rm /tmp/grype.tar.gz
  export PATH="$HOME/.local/bin:$PATH"
fi

# Step 7: Run grype scan
echo "Step 7: Running grype scan..."
grype dir:. --config .grype.yaml --only-fixed --fail-on critical || true

# Step 8: Update .grype.yaml with unfixed vulnerabilities
echo "Step 8: Updating .grype.yaml with unfixed vulnerabilities..."
GRYPE_VULNS=$(grype dir:. --config .grype.yaml --only-fixed -o json | jq -r '.matches[]? | select(.vulnerability.fix.state == "not-fixed" or .vulnerability.fix.state == "unknown") | .vulnerability.id' | sort -u)

if [ -n "$GRYPE_VULNS" ]; then
  echo "Adding unfixed vulnerabilities to .grype.yaml ignore list:"
  echo "$GRYPE_VULNS"

  GRYPE_TEMP=$(mktemp)

  # Read current ignore list
  CURRENT_IGNORE=$(yq e '.ignore[]?.vulnerability' .grype.yaml 2>/dev/null || echo "")

  # Combine and deduplicate
  COMBINED_IGNORE=$(echo -e "$CURRENT_IGNORE\n$GRYPE_VULNS" | grep -v '^$' | sort -u)

  # Build yq expression to reset and populate ignore list in one pass
  GRYPE_EXPR='.ignore = []'
  echo "$COMBINED_IGNORE" | while IFS= read -r vuln; do
    [ -n "$vuln" ] || continue
    GRYPE_EXPR="$GRYPE_EXPR | .ignore += [{\"vulnerability\": \"$vuln\"}]"
  done

  # Update .grype.yaml using the constructed expression
  yq e "$GRYPE_EXPR" .grype.yaml > "$GRYPE_TEMP"
  mv "$GRYPE_TEMP" .grype.yaml
  echo ".grype.yaml updated successfully."
else
  echo "No unfixed vulnerabilities found in grype scan."
fi

echo "Process completed successfully!"

exit 0
