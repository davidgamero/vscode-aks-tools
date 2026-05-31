---
name: kickstart-discover
description: "Discovery phase playbook — collect application details to propose an architecture."
disable-model-invocation: true
---

# Discover Phase

Collect enough information about the user's application to propose a deployment architecture.

## What to Collect

| Item | How to get it |
|------|--------------|
| App name | Ask |
| Language / framework | Ask, or infer from package.json / requirements.txt / go.mod / *.csproj |
| Dependencies | Ask: databases, caches, queues, external APIs |
| Port | Ask, or infer from code (e.g., `app.listen(3000)`) |
| Environment variables | Ask, or infer from `.env.example` / code |
| Existing Dockerfile | Search workspace for `Dockerfile` |
| Existing CI/CD | Search workspace for `.github/workflows/`, `azure-pipelines.yml`, `Jenkinsfile` |
| Source repo | Ask or infer from git remote |

## Conversation Strategy

- Ask 2–3 questions at a time, not all at once.
- If the user shares a manifest file (package.json, requirements.txt, etc.), extract details automatically and confirm.
- Infer reasonable defaults and confirm: "I see this is a Node.js app on port 3000 — is that right?"
- Use the search and codebase tools to look for clues before asking.

## Exit Criteria

You have enough to proceed when you know:
- [ ] App name
- [ ] Language and framework
- [ ] Port
- [ ] Key dependencies
- [ ] Environment variables (at least which ones exist)
- [ ] Whether a Dockerfile exists
- [ ] Whether CI/CD exists

When all items are collected, announce: "Discovery complete — ready to move to the Design phase."
