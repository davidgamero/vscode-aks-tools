---
name: kickstart-review
description: "Review phase playbook — validate all generated deployment artifacts."
disable-model-invocation: true
---

# Review Phase

Validate every generated artifact against security, correctness, and AKS Automatic compliance standards.

## Review Checklist

### Dockerfile
- [ ] Multi-stage build
- [ ] Base image pinned to specific version
- [ ] Non-root user
- [ ] `.dockerignore` present

### Kubernetes Manifests
- [ ] `runAsNonRoot: true`
- [ ] No privileged containers (`allowPrivilegeEscalation: false`)
- [ ] Resource requests AND limits set
- [ ] Liveness and readiness probes defined
- [ ] Gateway API HTTPRoute used (not Ingress)
- [ ] Workload Identity configured (labels + service account)
- [ ] Namespace specified

### Bicep Templates
- [ ] API versions pinned
- [ ] Parameters for environment-specific values
- [ ] Secure defaults (TLS 1.2+, private endpoints)
- [ ] Outputs for downstream use

### GitHub Actions
- [ ] OIDC auth (no long-lived secrets)
- [ ] `permissions` block minimal
- [ ] Environment protection for prod

## Process
1. Invoke `/kickstart-safeguard-checklist` to run the full safeguard rule set (13 rules including DS008-DS013 for production).
2. Invoke `/kickstart-security-hardening` for security checks.
3. Run automated validation using `runCommands`:
   ```bash
   # Validate K8s manifests against schemas
   kubectl apply --dry-run=client -f k8s/
   
   # Validate Bicep templates
   az bicep build --file infra/main.bicep
   
   # Lint Dockerfile (if hadolint available)
   hadolint Dockerfile
   ```
4. Present results as PASS ✓ / FAIL ✗ / WARN ⚠ for each item.
5. If any FAIL: fix before proceeding. If WARN only: note and proceed.

## Exit Criteria
- All checks pass (no FAIL items remaining).
- Announce: "Review complete — moving to the Handoff phase."
