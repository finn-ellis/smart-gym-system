#!/bin/bash
# .github/scripts/format-backend.sh
# This script runs after every tool execution.
# It checks if the tool modified files and then runs an auto-formatter over the Python backend.

# Read the hook payload from stdin
PAYLOAD=$(cat)

# Extract toolName using a basic grep/sed fallback or jq
if command -v jq &> /dev/null; then
    TOOL_NAME=$(echo "$PAYLOAD" | jq -r '.toolCall.name // .toolName')
else
    # Fallback to simple matching if jq is missing
    TOOL_NAME=$(echo "$PAYLOAD" | grep -o '\"name\": *\"[^\"]*\"' | head -1 | cut -d'"' -f4)
fi

# Only format if the tool might have modified code
if [[ "$TOOL_NAME" == *"edit_file"* || "$TOOL_NAME" == *"create_file"* || "$TOOL_NAME" == *"replace_string_in_file"* ]]; then
    
    # Try to run ruff, fallback to black
    if command -v ruff &> /dev/null; then
        ruff format smart-gym-system/ > /dev/null 2>&1
    elif command -v black &> /dev/null; then
        black smart-gym-system/ > /dev/null 2>&1
    fi
    
    # Output JSON telling the agent the formatter ran
    echo '{"systemMessage": "Auto-formatting completed for smart-gym-system (if applicable).", "continue": true}'
    exit 0
fi

# If no formatting was needed, just continue silently
echo '{"continue": true}'
