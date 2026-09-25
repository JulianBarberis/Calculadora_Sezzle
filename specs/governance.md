# specs/governance.md: Repository Governance & Branch Protection Policy

This document defines the official governance rules, branch protection standards, and quality gating policies for the Sezzle FinTech Calculator repository.

---

## 1. Protected Branch Invariants (`main`)

The `main` branch represents the canonical, audit-ready production source of truth. To safeguard software integrity and audit compliance in accordance with Sezzle engineering standards, the following non-negotiable rules are enforced at the repository level:

| Policy Invariant | Enforcement Mechanism | Rationale |
| :--- | :--- | :--- |
| **Strict Prohibition of Direct Commits** | GitHub Ruleset: `pull_request` | No engineer or AI agent may commit or push directly to `main`. All changes must arrive via a reviewed Pull Request. |
| **Strict Prohibition of Force Pushes** | GitHub Ruleset: `non_fast_forward` | `git push --force` and `git push --force-with-lease` are permanently rejected by the remote Git hook to preserve an immutable commit timeline. |
| **Branch Deletion Protection** | GitHub Ruleset: `deletion` | Deletion of the `main` branch is permanently blocked. |
| **Linear Commit History** | GitHub Ruleset: `required_linear_history` | Merge commits must not create tangled graph topologies. Squash merges or fast-forward rebase merges are required. |
| **Mandatory CI Status Checks** | GitHub Ruleset: `required_status_checks` (Strict) | Pull Requests cannot be merged unless all required GitHub Actions CI jobs complete with 100% pass status. |
| **Zero Admin Bypass** | `bypass_actors: []`, `current_user_can_bypass: never` | Even repository administrators must adhere to the PR gate and status check verification. |

---

## 2. Mandatory Status Checks Pipeline

Before any Pull Request targeting `main` can be merged, the following automated verification checks defined in `.github/workflows/ci.yml` must succeed:

1. **`Go Backend Verification`**:
   - `go vet ./...` (zero lint warnings).
   - `go test -v -race -cover ./...` (zero data races, statement coverage $\ge 95\%$).
   - Static binary compilation (`go build -v ./...`).
2. **`React Frontend Verification`**:
   - `pnpm install --frozen-lockfile` (package integrity).
   - `pnpm type-check` (zero TypeScript errors under `strict: true`).
   - `pnpm lint` (zero `oxlint` warnings).
   - `pnpm test` (Vitest suite passing with zero `act(...)` warnings and 100-cycle StrictMode endurance).
   - `pnpm build` (production Vite bundle build).
3. **`Docker Build Verification`**:
   - `docker compose config` (configuration validation).
   - `docker compose build` (multi-stage Go Alpine static binary & Nginx Alpine frontend).

---

## 3. Active GitHub Ruleset Configuration

The repository is protected by GitHub Ruleset **ID `23977054`** (`Protect main branch`).

### Active JSON Definition:
```json
{
  "id": 23977054,
  "name": "Protect main branch",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "Go Backend Verification" },
          { "context": "React Frontend Verification" },
          { "context": "Docker Build Verification" }
        ]
      }
    }
  ],
  "bypass_actors": []
}
```

---

## 4. Operational Instructions for Managing Rulesets

### 4.1 Verification via GitHub CLI (`gh`)

To view the active ruleset status:
```bash
gh api /repos/JulianBarberis/Calculadora_Sezzle/rulesets/23977054
```

To update the ruleset (e.g., adding an approving review count requirement for team environments):
```bash
gh api --method PUT /repos/JulianBarberis/Calculadora_Sezzle/rulesets/23977054 \
  -H "Accept: application/vnd.github+json" \
  --input ruleset.json
```

### 4.2 Management via GitHub Web UI

1. Navigate to repository **Settings**:
   `https://github.com/JulianBarberis/Calculadora_Sezzle/settings`
2. Under the **Code and automation** section on the left sidebar, click **Rules** $\rightarrow$ **Rulesets**.
3. Select the active ruleset: **`Protect main branch`**.
4. Here you can inspect or adjust:
   - **Enforcement status**: `Active`, `Evaluate`, or `Disabled`.
   - **Target branches**: Default branch (`main`).
   - **Branch rules**:
     - *Restrict deletions*: Checked.
     - *Block force pushes*: Checked.
     - *Require linear history*: Checked.
     - *Require a pull request before merging*: Checked.
     - *Require status checks to pass*: Checked (`Go Backend Verification`, `React Frontend Verification`, `Docker Build Verification`).
5. Click **Save changes**.

---

## 5. Branch Naming Conventions & Contribution Flow

All contributors and AI agents must adhere to the standard branch naming taxonomy:
- Feature branches: `feature/<phase-number>-<descriptive-name>` (e.g., `feature/phase-3-frontend-ui`)
- Bug fix branches: `fix/<issue-number>-<descriptive-name>`
- Documentation branches: `docs/<descriptive-name>`
- Maintenance/tooling branches: `chore/<descriptive-name>`

Direct pushes to `main` will be rejected by GitHub with:
```
remote: Resolving deltas: 100%
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - Changes must be made through a pull request.
```
