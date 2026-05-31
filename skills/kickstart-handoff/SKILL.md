---
name: kickstart-handoff
description: "Handoff phase playbook — confirm deployment target and prerequisites."
disable-model-invocation: true
---

# Handoff Phase

Confirm the deployment target environment and verify all prerequisites before deploying.

## Pre-Deployment Checklist

### Azure Environment
- [ ] Subscription ID confirmed
- [ ] Resource group name and region confirmed
- [ ] AKS cluster name confirmed
- [ ] ACR name confirmed

### GitHub Repository
- [ ] Required secrets configured:
  - `AZURE_CLIENT_ID`
  - `AZURE_TENANT_ID`
  - `AZURE_SUBSCRIPTION_ID`
- [ ] Required variables configured:
  - `ACR_NAME`
  - `IMAGE_NAME`
  - `AKS_CLUSTER_NAME`
  - `AKS_RESOURCE_GROUP`

### Naming Conventions
- Invoke `/kickstart-resource-management` for Azure naming guidance.
- Resource group: `rg-<app>-<env>` (e.g., `rg-myapp-prod`)
- AKS cluster: `aks-<app>-<env>`
- ACR: `acr<app><env>` (no hyphens, globally unique)

## Deployment Summary

Generate a summary document listing:
- All Azure resources to be created
- All files that will be deployed
- GitHub Actions workflow trigger
- Estimated cost range (invoke `/kickstart-cost-estimation`)

## Exit Criteria
- User confirms all environment details.
- All prerequisites verified.
- Announce: "Handoff complete — ready for the Deploy phase."
