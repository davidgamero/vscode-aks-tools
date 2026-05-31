---
name: kickstart-deploy
description: "Deploy phase playbook — provide deployment commands. Never auto-deploy."
disable-model-invocation: true
---

# Deploy Phase

Provide deployment commands for the user to execute. **Never run deployment commands automatically.**

## Pre-Deployment: What-If Preview

Before deploying, run a What-If to preview changes:
```bash
az deployment group what-if \
  --resource-group <rg> \
  --template-file infra/main.bicep \
  --parameters clusterName=<cluster> acrName=<acr> location=<region>
```
Review the output with the user. Only proceed to deployment after they confirm the changes look correct.

## Deployment Steps

Present these steps with the user's actual resource names filled in:

### Step 1: Deploy Azure Infrastructure
```bash
az deployment group create \
  --resource-group <rg> \
  --template-file infra/main.bicep \
  --parameters clusterName=<cluster> acrName=<acr> location=<region>
```

### Step 2: Attach ACR to AKS
```bash
az aks update \
  --resource-group <rg> \
  --name <cluster> \
  --attach-acr <acr>
```

### Step 3: Build and Push Image
```bash
az acr build \
  --registry <acr> \
  --image <image>:<tag> .
```

### Step 4: Deploy to AKS
```bash
az aks get-credentials --resource-group <rg> --name <cluster>
kubectl apply -f k8s/
```

### Step 5: Verify Deployment
```bash
kubectl get pods -n <namespace>
kubectl get httproute -n <namespace>
```

## Alternative: GitHub Actions
Push to the main branch (or create a PR) to trigger the GitHub Actions workflow. The workflow handles build, push, and deploy automatically.

## Post-Deployment
- Verify the app is accessible via the gateway URL.
- Check monitoring dashboards — invoke `/kickstart-monitoring`.
- Set up alerts for CPU, memory, and pod restarts.
- Review cost — invoke `/kickstart-cost-estimation`.

## Important
- **NEVER** execute deployment commands on behalf of the user.
- Always present commands and let the user run them.
- If something fails, help debug but don't auto-retry deployments.
