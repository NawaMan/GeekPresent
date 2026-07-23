---
name: land-branch
description: Land a worktree's feature branch into main — preflight, rebase, booth test, --no-ff merge, then delete the worktree/branch. Use when the user says "land this", "merge the branch", "merge into main", or asks to finish a worktree session. Never pushes.
---

# Land a worktree's branch into main

The prose version is `AGENTS.md` → *Landing a worktree's branch into main*. This is the executable
form. `$ARGUMENTS` is the branch (default: the branch checked out in the worktree you are in).

**Merging is a deliberate act — Rule 8.** Only run this when the user asks to land/merge, never on
your own initiative, and never because "the change is done". **Never push** — `git merge --no-ff`
only ever touches the local `main`; pushing is its own explicit ask. Cleanup (worktree + branch) is
different: it now runs automatically as the final step, once the merge itself has made the work
safe — see step 7.

**This skill's own Proposal before code gate** (replaces the generic `AGENTS.md` form — do not
stack both): after the read-only preflight below, report as **Problem · Diagnostic · Approach**
(what is being landed, clean/behind/conflict verdict, the exact rebase→test→`--no-ff` plan) and
**wait** before stash / rebase / merge. The user's original "land this" is not enough once
preflight can change the plan (conflicts, dirty main, branch behind).

## 0. Preflight — establish the shape before touching anything

Every command here is read-only. Run them all, then report what you found.

```bash
git worktree list                     # where is the branch checked out?
git -C <main-clone> status --short    # is main clean? (empty = yes)
git log --oneline main..<branch>      # what is being landed
git log --oneline <branch>..main      # is the branch behind? (non-empty ⇒ rebase needed)
git merge-tree --write-tree main <branch> >/dev/null; echo $?   # 0 = clean, 1 = conflicts
```

`merge-tree` is a genuine dry run — it writes nothing to the index or working tree. Fold the
verdict into the **Problem · Diagnostic · Approach** report and **wait** before step 1; "this will
conflict" is much cheaper said now than mid-rebase.

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

## 6. Report the merge

Show the graph and where main now sits:

```bash
git -C <main-clone> log --oneline --graph -5
git -C <main-clone> status --short --branch | head -1    # "ahead N" — nothing is pushed
```

Confirm the "ahead N" line out loud — that is the proof nothing was pushed.

## 7. Clean up the worktree and branch

The merge already made the work safe in `main`, so this is no longer a separate ask — it's the
last step. Stop any booth you started for this worktree first (skip if you never started one; per
Rule 6 never stop one you did not start):

```bash
./booth list                          # confirm it's yours before stopping it
./booth stop --name <name>            # skip if you never started this worktree's booth
```

Then, **from the main clone** (never from inside the worktree being removed):

```bash
git worktree remove worktree/<name>   # NO --force — refuses on any uncommitted change
git branch -d <name>                  # NO --force/-D — refuses to drop unmerged work
git worktree list                     # confirm it is gone
```

**A refusal here is the feature, not a bug to route around.** `-d` (lowercase) only ever drops a
branch git can already see is fully merged; `worktree remove` only ever refuses when there is
something uncommitted it would otherwise discard. If either refuses, **stop** — report exactly
what is unmerged or uncommitted and let the user decide. Never reach for `--force` / `-D` to push
past that refusal.

Then **stop**. Say explicitly that nothing was pushed, and that the worktree/branch are gone.
