---
name: land-branch
description: Land a worktree's feature branch into main — preflight, rebase, booth test, --no-ff merge. Use when the user says "land this", "merge the branch", "merge into main", or asks to finish a worktree session. Merges only; cleanup and pushing are separate asks.
---

# Land a worktree's branch into main

The prose version is `AGENTS.md` → *Landing a worktree's branch into main*. This is the executable
form. `$ARGUMENTS` is the branch (default: the branch checked out in the worktree you are in).

**Merging is a deliberate act — Rule 8.** Only run this when the user asks to land/merge, never on
your own initiative, and never because "the change is done". Do **not** push afterwards, and do
**not** clean up the worktree, unless separately asked. Both are their own decisions.

## 0. Preflight — establish the shape before touching anything

Every command here is read-only. Run them all, then report what you found.

```bash
git worktree list                     # where is the branch checked out?
git -C <main-clone> status --short    # is main clean? (empty = yes)
git log --oneline main..<branch>      # what is being landed
git log --oneline <branch>..main      # is the branch behind? (non-empty ⇒ rebase needed)
git merge-tree --write-tree main <branch> >/dev/null; echo $?   # 0 = clean, 1 = conflicts
```

`merge-tree` is a genuine dry run — it writes nothing to the index or working tree. Report its
verdict before proposing the merge; "this will conflict" is much cheaper said now.

**Check where the worktree actually lives.** It must be `<repo>/worktree/<name>` — a linked
worktree whose `.git` is a *file* containing `gitdir: …`. If an agent CLI put it somewhere else
(`.claude/worktrees/<name>`, `~/.grok/worktrees/<name>`), it is invisible to GitKraken and has no booth. Fix
it *before* landing, per `AGENTS.md` → *Session = linked worktree + branch*:

```bash
# from the main clone, with the work already committed on the branch
git worktree remove <stray-path>              # no --force; commit or remove scratch files first
mkdir -p worktree
git worktree add worktree/<name> <branch>     # same branch, documented location
test -f worktree/<name>/.git && echo OK       # a FILE, not a directory
```

## 1. Stash main only if it is dirty

Skip entirely when step 0 showed main clean — and say that you skipped it.

The stash stack is **shared across every worktree and every parallel session**, so a bare
`git stash` / `git stash pop` can swallow or discard someone else's work. Tag it and address it by
SHA:

```bash
git -C <main-clone> stash push -u -m "land-<branch>"
git -C <main-clone> stash list --format='%H %gs' | grep "land-<branch>"   # capture the SHA
```

## 2. Rebase the branch onto main

```bash
git -C worktree/<name> rebase main
```

Resolve conflicts as they come. Run **git on the host** — inside a worktree booth `git` reports
`fatal: not a git repository`, because the container doesn't mount the main repo's `.git`. That is
expected (Rule 6), not a problem to debug.

## 3. Re-verify in that worktree's own booth

Rule 6: tests go through booth, never host `pnpm`. A rebase that touched covered code invalidates
whatever you ran before it.

```bash
cd worktree/<name>
./booth list                                   # never reuse or kill someone else's booth
./booth exec --run -e CI=true -e npm_config_verify_deps_before_run=false \
  -- sh -c 'pnpm exec svelte-kit sync && pnpm test'
```

The `svelte-kit sync` + `verify_deps` pair is the one-time fresh-worktree fix (`tsconfig.json`
extends `./.svelte-kit/tsconfig.json`, and non-TTY `exec` aborts pnpm's deps check). Without
`--keep-alive` the booth is `--rm` and stops itself.

**Do not merge on a red suite.** Report the failures and stop.

## 4. Merge, from the main clone

```bash
cd <main-clone>
git merge --no-ff <branch>
```

Always a real merge commit. **Never** `--squash`, never `--ff-only` — the branch's history is the
point. Write the message to a file and pass `-F <file>`; `-F -` (heredoc on stdin) fails with
`could not read file '-'`.

## 5. Restore the stash, if step 1 took one

```bash
git -C <main-clone> stash apply <sha>    # apply, NOT pop
# eyeball the working tree, then:
git -C <main-clone> stash drop <sha>
```

`apply`-then-`drop` keeps the stash recoverable if restoring onto the just-merged main conflicts.
`pop` would already have discarded it.

## 6. Report, and stop

Show the graph and where main now sits:

```bash
git -C <main-clone> log --oneline --graph -5
git -C <main-clone> status --short --branch | head -1    # "ahead N" — nothing is pushed
```

Then **stop**. Say explicitly that nothing was pushed and the worktree still exists. Cleanup
(`git worktree remove` + `git branch -d`, both without `--force`, from the main clone) is the
separate ask described in `AGENTS.md` → *Cleaning up after a session*. If git refuses either one,
that refusal is the feature: report what is unmerged or uncommitted and let the user decide.
