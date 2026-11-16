#!/usr/bin/env python3
"""PreToolUse hook for the conformance-reviewer subagent.

Allows Bash only for read-only git commands, so the reviewer can read a diff
and cannot change a file. Exit code 2 blocks the call.
"""
import json
import re
import sys

ALLOWED = re.compile(r"^git\s+(diff|log|show|status|merge-base|rev-parse|ls-files)\b")
SHELL_OPERATORS = re.compile(r"[;&|><`]|\$\(")

command = json.load(sys.stdin).get("tool_input", {}).get("command", "").strip()
if not ALLOWED.match(command) or SHELL_OPERATORS.search(command):
    sys.stderr.write(
        "BLOCKED: the conformance reviewer is read-only. Allowed Bash commands: "
        "a single git diff, log, show, status, merge-base, rev-parse or ls-files "
        "command with no pipes or redirects.\n"
    )
    sys.exit(2)
