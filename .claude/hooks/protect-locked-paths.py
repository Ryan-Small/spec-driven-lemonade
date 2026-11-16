#!/usr/bin/env python3
"""PreToolUse hook: block changes to the locked paths.

Claude Code sends the tool call as JSON on stdin. Exit code 2 blocks the call
and shows stderr to Claude. Exit code 0 allows it.

The owner can lift the lock for an approved spec change by creating the file
.claude/spec-unlock in a terminal, and removes it afterwards. Claude may never
create that file.

The Bash check is a heuristic for obvious shell writes. It is not a sandbox.
The real gate is CI.
"""
import json
import os
import re
import sys

LOCKED_DIRS = ("spec/", "contracts/", ".github/workflows/", ".claude/hooks/")
LOCKED_FILES = (".claude/settings.json",)
UNLOCK_FILE = ".claude/spec-unlock"

LOCKED_PATTERN = (
    r"(?:spec/|contracts/|\.github/workflows/|\.claude/hooks/|\.claude/settings\.json)"
)
PATH_START = r"(?:^|[\s\"'=(]|\./)"
SHELL_WRITE_PATTERNS = (
    # redirect into a locked path:  > spec/x   >> contracts/y
    r">{1,2}\s*[\"']?(?:\./)?" + LOCKED_PATTERN,
    # write commands with a locked path as an argument
    r"\b(?:tee|rm|mv|cp|touch|truncate|sed\s+-\S*i\S*|perl\s+-\S*i\S*|git\s+(?:checkout|restore|apply|rm|mv))\b[^|;&]*"
    + PATH_START
    + LOCKED_PATTERN,
)


def block(target: str) -> None:
    sys.stderr.write(
        f"BLOCKED: {target} is a locked path.\n"
        "Locked: spec/, contracts/, .github/workflows/, .claude/hooks/, .claude/settings.json.\n"
        "If the task needs this change, stop and run the propose-spec-change skill. "
        "The owner decides. The owner lifts the lock by creating .claude/spec-unlock.\n"
    )
    sys.exit(2)


def is_locked(rel: str) -> bool:
    return rel in LOCKED_FILES or rel.startswith(LOCKED_DIRS)


def main() -> None:
    call = json.load(sys.stdin)
    cwd = call.get("cwd") or os.getcwd()
    project = os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or cwd)
    unlocked = os.path.exists(os.path.join(project, UNLOCK_FILE))
    tool = call.get("tool_name", "")
    tool_input = call.get("tool_input", {})

    if tool == "Bash":
        command = tool_input.get("command", "").replace(project + "/", "")
        if "spec-unlock" in command:
            block(UNLOCK_FILE)
        if not unlocked:
            for pattern in SHELL_WRITE_PATTERNS:
                if re.search(pattern, command):
                    block("a shell write to a locked path")
        return

    path = tool_input.get("file_path") or tool_input.get("notebook_path")
    if not path:
        return
    rel = os.path.relpath(os.path.realpath(os.path.join(cwd, path)), project)
    if rel == UNLOCK_FILE:
        block(UNLOCK_FILE)
    if is_locked(rel) and not unlocked:
        block(rel)


if __name__ == "__main__":
    main()
