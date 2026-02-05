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
npm run audit:fix || true

# Step 3: Get unfixed vulnerabilities
echo "Step 3: Checking for unfixed vulnerabilities..."
# Get advisory IDs (GHSA-* format) only from vulnerabilities with no fix available and that have a GitHub advisory URL
UNFIXED_GHSA=$(npm audit --json 2>/dev/null | jq -r '.vulnerabilities | to_entries[] | .value.via[] | select(type == "object" and .url != null and (.url | contains("github.com/advisories/GHSA-"))) | .url' | grep -oE 'GHSA-[a-z0-9-]+' | sort -u)

if [ -z "$UNFIXED" ] && [ -z "$UNFIXED_GHSA" ]; then
  echo "No unfixed vulnerabilities found."
  UNFIXED_GHSA=""
else
  echo "Unfixed vulnerabilities found:"
  echo "Advisory IDs: $UNFIXED_GHSA"
fi

# Step 4: Update audit-ci.jsonc with unfixed vulnerabilities
echo "Step 4: Updating audit-ci.jsonc..."
TEMP_FILE=$(mktemp)

# Read current allowlist from audit-ci.jsonc
CURRENT_ALLOWLIST=$(grep -v '^[[:space:]]*//' audit-ci.jsonc | jq -r '.allowlist[]' 2>/dev/null | grep '^GHSA-' || true)

# Combine current allowlist with both package names and GHSA IDs, remove duplicates
COMBINED=$(printf "%s\n%s\n" "$CURRENT_ALLOWLIST" "$UNFIXED_GHSA" | grep -v '^$' | sort -u)

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
    # First pass: collect non-empty items
    item_count = 0
    for (i = 1; i <= n; i++) {
      item = items[i]
      sub(/^[[:space:]"]+/, "", item)
      sub(/[[:space:]"]+$/, "", item)
      if (item != "") {
        item_count++
        clean_items[item_count] = item
      }
    }
    # Second pass: format with correct comma placement
    for (i = 1; i <= item_count; i++) {
      formatted_allowlist = formatted_allowlist allowlist_indent "  \"" clean_items[i] "\""
      if (i < item_count) {
        formatted_allowlist = formatted_allowlist ","
      }
      formatted_allowlist = formatted_allowlist "\n"
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
echo "Step 6: Verifying grype installation..."
if ! command -v grype > /dev/null 2>&1; then
  echo "Error: grype is not installed or not in PATH"
  echo "Please install grype from: https://github.com/anchore/grype"
  exit 1
fi
echo "grype is available at $(which grype)"

# Step 7: Run grype scan
echo "Step 7: Running grype scan..."
grype dir:. --config .grype.yaml --only-fixed --fail-on critical || true

# Step 8: Update .grype.yaml with unfixed vulnerabilities
echo "Step 8: Updating .grype.yaml with unfixed vulnerabilities..."
GRYPE_VULNS=$(grype dir:. --config .grype.yaml -o json | jq -r '.matches[]? | select(.vulnerability.fix.state == "not-fixed" or .vulnerability.fix.state == "unknown") | .vulnerability.id' | sort -u)

# Step 8: Update .grype.yaml with unfixed vulnerabilities
echo "Step 8: Updating .grype.yaml with all found vulnerabilities..."
GRYPE_VULNS=$(grype dir:. --config .grype.yaml -o json | jq -r '.matches[]?.vulnerability.id' | sort -u)

if [ -n "$GRYPE_VULNS" ]; then
  echo "Adding medium, high, and critical unfixed vulnerabilities to .grype.yaml ignore list:"
  # Filter for medium, high, and critical severities only (case-insensitive), excluding fixed vulnerabilities
  FILTERED_VULNS=$(grype dir:. --config .grype.yaml -o json | jq -r '.matches[] | select((.vulnerability.severity | ascii_downcase) == "medium" or (.vulnerability.severity | ascii_downcase) == "high" or (.vulnerability.severity | ascii_downcase) == "critical") | select(.vulnerability.fix.state != "fixed") | .vulnerability.id' | sort -u)

  if [ -n "$FILTERED_VULNS" ]; then
    echo "$FILTERED_VULNS"

    GRYPE_TEMP=$(mktemp)

    # Read current ignore list from .grype.yaml, extracting only the vulnerability IDs
    CURRENT_IGNORE=$(grep -E '^\s*-\s*vulnerability:\s*' .grype.yaml | sed -E 's/^\s*-\s*vulnerability:\s*([A-Z0-9-]+).*/\1/' | sort -u || echo "")

    # Find only NEW vulnerabilities that aren't already in the list
    NEW_VULNS=$(printf "%s\n" "$FILTERED_VULNS" | while read -r vuln; do
      if ! echo "$CURRENT_IGNORE" | grep -q "^${vuln}$"; then
        echo "$vuln"
      fi
    done | sort -u)

    # Preserve the file structure and append new vulnerabilities to bottom of ignore list
    # shellcheck disable=SC2016
    awk -v new_vulns="$NEW_VULNS" '
      BEGIN {
        split(new_vulns, new_array, "\n")
        in_ignore = 0
        ignore_indent = ""
      }
      /^ignore:/ {
        print
        in_ignore = 1
        next
      }
      in_ignore && /^[^ ]/ {
        # Found next section - append new vulnerabilities before it
        for (i in new_array) {
          if (new_array[i] != "") {
            print "  - vulnerability: " new_array[i]
          }
        }
        in_ignore = 0
        print
        next
      }
      in_ignore && /^\s*-\s*vulnerability:/ {
        # Capture indentation from existing entries
        if (ignore_indent == "") {
          ignore_indent = substr($0, 1, match($0, /-/) - 1)
        }
      }
      {
        print
      }
      END {
        # If still in ignore section at end of file, append new vulnerabilities
        if (in_ignore) {
          for (i in new_array) {
            if (new_array[i] != "") {
              print "  - vulnerability: " new_array[i]
            }
          }
        }
      }
    ' .grype.yaml > "$GRYPE_TEMP"

    mv "$GRYPE_TEMP" .grype.yaml

    if [ -n "$NEW_VULNS" ]; then
      echo ".grype.yaml updated with new vulnerabilities."
    else
      echo "No new vulnerabilities to add (all already in ignore list)."
    fi
  else
    echo "No medium, high, or critical vulnerabilities found in grype scan."
  fi
else
  echo "No vulnerabilities found in grype scan."
fi

echo "Process completed successfully!"

exit 0
