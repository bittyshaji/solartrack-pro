# SolarTrack Pro - Git Workflow

**How we use Git for development**

## Branching Model

We follow a simplified Git Flow model:

```
main (production)
├── releases (stable)
└── develop (integration)
    ├── feature/feature-name
    ├── fix/bug-name
    ├── docs/documentation
    └── refactor/refactoring
```

## Branch Naming

| Type | Prefix | Example |
|------|--------|---------|
| Feature | `feature/` | `feature/add-project-filters` |
| Bug fix | `fix/` | `fix/auth-token-refresh` |
| Documentation | `docs/` | `docs/update-api-reference` |
| Refactoring | `refactor/` | `refactor/simplify-auth-service` |
| Performance | `perf/` | `perf/optimize-bundle-size` |
| Testing | `test/` | `test/add-service-tests` |
| Chore | `chore/` | `chore/update-dependencies` |

## Workflow Steps

### 1. Create Feature Branch

```bash
# Pull latest
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Commit frequently with clear messages
- Write tests alongside code
- Follow coding standards

```bash
git add src/
git commit -m "feat: add filter component"

git add src/
git commit -m "feat: integrate filter with service"

git add src/
git commit -m "test: add filter tests"
```

### 3. Keep Branch Updated

Before submitting PR, rebase on latest main:

```bash
git fetch origin
git rebase origin/main
```

Resolve any conflicts if they occur:

```bash
# After resolving conflicts
git add .
git rebase --continue
```

### 4. Push to GitHub

```bash
git push origin feature/your-feature-name
```

Or with force-push (only if rebased):

```bash
git push --force-with-lease origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to GitHub repository
2. Click "Compare & pull request"
3. Fill in PR title and description
4. Request reviewers
5. Submit PR

### 6. Address Review Feedback

Read reviewer comments:

```bash
# Make requested changes
git add src/
git commit -m "Address review feedback"

git push origin feature/your-feature-name
```

### 7. Merge to Main

Once approved and CI passes:

**Option A: Squash and merge** (recommended for features)

```bash
git checkout main
git pull origin main
git merge --squash feature/your-feature-name
git commit -m "feat: add project filters"
git push origin main
```

**Option B: Regular merge** (keeps history)

```bash
git checkout main
git pull origin main
git merge feature/your-feature-name
git push origin main
```

### 8. Cleanup

```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name
```

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Example

```
feat(projects): add project status filters

Add ability to filter projects by status and date range.
Implements FilterPanel component and updates ProjectService.

- Creates FilterPanel component
- Adds filter method to ProjectService
- Updates ProjectList to use filters
- Adds tests for filtering

Fixes #123
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **style**: Code style (no logic change)
- **refactor**: Code refactoring
- **test**: Test additions/updates
- **chore**: Build, deps, tooling
- **perf**: Performance improvement

### Best Practices

- Use imperative mood ("add" not "added")
- Keep subject under 50 characters
- Reference issues: "Fixes #123"
- One logical change per commit
- Link related commits

## Merge Conflicts

When rebasing/merging creates conflicts:

```bash
# See conflicted files
git status

# Edit each file and resolve conflicts
# Look for <<<<<<, ======, >>>>>>

# After resolving
git add .

# Continue rebase
git rebase --continue

# Or abort
git rebase --abort
```

## Common Scenarios

### Update Branch with Latest Main

```bash
git fetch origin
git rebase origin/main

# If conflicts:
# 1. Resolve files
# 2. git add .
# 3. git rebase --continue
```

### Undo Last Commit

```bash
# Keep changes
git reset --soft HEAD~1

# Discard changes
git reset --hard HEAD~1
```

### Undo Pushed Commits

```bash
# View history
git log

# Revert specific commit
git revert commit-hash

# Push revert
git push origin main
```

### Squash Multiple Commits

```bash
# Interactive rebase of last 3 commits
git rebase -i HEAD~3

# In editor: change 'pick' to 'squash' for commits to combine
# Save and resolve any conflicts

# Force push (only if not merged)
git push --force-with-lease origin feature/branch
```

### Cherry-pick Commit

```bash
# Apply specific commit from another branch
git cherry-pick commit-hash

# Resolve conflicts if any
git cherry-pick --continue
```

## Reviewing Code

### As a Reviewer

1. Check out the branch:
```bash
git fetch origin feature/branch-name
git checkout feature/branch-name
```

2. Review code and run locally
3. Provide feedback in PR comments
4. Approve or request changes on GitHub

### As Author

1. Read all review comments
2. Respond with clarifications or fixes
3. Commit changes
4. Push changes
5. Re-request review

## Pull Request Guidelines

### PR Title Format

```
[TYPE]: Description of change

feat: add project filters
fix: correct token refresh timing
docs: update API documentation
```

### PR Description Template

```markdown
## Description
Brief explanation of what changed and why.

## Changes
- Changed X to improve Y
- Added Z for feature
- Fixed issue with A

## Testing
- [ ] Unit tests added
- [ ] Manual testing done
- [ ] No test coverage needed

## Checklist
- [ ] Follows coding standards
- [ ] No console errors
- [ ] Documentation updated
- [ ] Tests pass

## Related Issues
Fixes #123
Related to #456
```

### PR Review Checklist

Reviewers should verify:

- Code follows standards
- Tests cover changes
- No obvious bugs
- No security issues
- Performance acceptable
- Documentation clear
- No breaking changes

## Tags and Releases

For production releases:

```bash
# Create tag
git tag -a v0.2.0 -m "Version 0.2.0 - Add filters feature"

# Push tag
git push origin v0.2.0

# View all tags
git tag
```

## Helpful Git Config

```bash
# Configure name and email
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Set default editor for commits
git config --global core.editor "code --wait"

# Configure aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'restore --staged'
git config --global alias.last 'log -1 HEAD'
```

## Graph Visualization

View branch structure:

```bash
git log --graph --oneline --all

# Or with aliases in .gitconfig:
git lg
```

## Issues with Git

### Large File Commits

```bash
# Check file size before committing
git ls-files -s | awk '{print $4}' | sort -u | while read blob; do
  git cat-file -p $blob | wc -c | awk '{print $1}'; echo "$blob"
done | sort -rn | head -10
```

### Accidentally Committed Secret

```bash
# Remove from history
git filter-branch --tree-filter 'rm -f secrets.txt' HEAD

# Force push (only if not shared)
git push origin --force --all
```

## Resources

- [Pro Git Book](https://git-scm.com/book/)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://github.github.com/training-kit/downloads/github-git-cheat-sheet.pdf)

---

**Golden Rule:** Always test before pushing. Never force-push to main!
