# Guia de Deploy & CI/CD - RotaRDV Painel Web

Este documento contém as instruções para o fluxo de **Continuous Integration & Continuous Deployment (CI/CD)** automatizado pelo **GitHub Actions** para o cluster Kubernetes (K3s).

---

## 🚀 1. Como Funciona a Pipeline do GitHub Actions

O arquivo [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) é acionado automaticamente a cada `git push`:

| Branch Git | Ambiente | Namespace K8s | Tags Docker Geradas | Ação Automática |
| :--- | :--- | :--- | :--- | :--- |
| **`develop`** | **QA** | `rotardv-qa` | `rotardv-painel:qa`, `rotardv-painel:qa-<sha>` | Build Docker, Push e Rollout no cluster QA |
| **`main`** | **Produção** | `rotardv-prod` | `rotardv-painel:latest`, `rotardv-painel:<sha>` | Build Docker, Push e Rollout no cluster Prod |

---

## 🔑 2. Segredos (Secrets) Necessários no GitHub

No seu repositório do GitHub, vá em:  
👉 **Settings** > **Secrets and variables** > **Actions** > **New repository secret** e cadastre:

1. **`DOCKERHUB_USER`**: Seu nome de usuário do Docker Hub (ex: `luisfelipe` ou `luisdevux`).
2. **`DOCKERHUB_PASS`**: Seu Token de Acesso (ou senha) do Docker Hub.
3. **`KUBECONFIG`**: O conteúdo completo do seu arquivo `~/.kube/config` (ou `/etc/rancher/k3s/k3s.yaml`) do cluster Kubernetes com acesso ao cluster via IP público/VPN.

---

## 📦 3. Manifests Iniciais do Kubernetes

Antes do primeiro deploy automatizado, certifique-se de que os namespaces, secrets e configmaps estejam criados no cluster:

```bash
# 1. Criar namespaces
kubectl create namespace rotardv-qa
kubectl create namespace rotardv-prod

# 2. Configmaps e Secrets de QA
kubectl apply -f deploy/rotardv-painel-configmap.example.yaml -n rotardv-qa
kubectl apply -f deploy/rotardv-painel-secrets.example.yaml -n rotardv-qa

# 3. Configmaps e Secrets de Produção
kubectl apply -f deploy/rotardv-painel-configmap.example.yaml -n rotardv-prod
kubectl apply -f deploy/rotardv-painel-secrets.example.yaml -n rotardv-prod

# 4. Ingress e Deployment Base
kubectl apply -f deploy/rotardv-painel.yaml -n rotardv-prod
kubectl apply -f deploy/rotardv-painel-ingress.yaml -n rotardv-prod
```

---

## 🔍 4. Monitorando os Pods

```bash
# Verificar status dos pods
kubectl get pods -n rotardv-prod -l app=rotardv-painel
kubectl get pods -n rotardv-qa -l app=rotardv-painel

# Acompanhar logs em tempo real
kubectl logs -f deployment/rotardv-painel -n rotardv-prod
```
