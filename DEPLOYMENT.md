# Banking Platform - Deployment Guide

Production-ready deployment instructions for the banking microservices platform.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Monitoring & Logging](#monitoring--logging)

---

## Local Development

### Prerequisites

- **PHP 8.2** with Composer
- **Java 21** (Eclipse Temurin)
- **Maven 3.9+**
- **PostgreSQL 16+**
- **Redis 7+**

### Setup Steps

**1. Initialize Laravel**
```bash
cd laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate

# Start Laravel development server
php artisan serve  # Port 8000
```

**2. Initialize Account Service**
```bash
cd account-service
mvn clean install
mvn spring-boot:run  # Port 8081
```

**3. Initialize Transaction Service**
```bash
cd transaction-service
mvn clean install
mvn spring-boot:run  # Port 8082
```

**4. Initialize Blockchain Service**
```bash
cd blockchain-service
mvn clean install
mvn spring-boot:run  # Port 8083
```

**5. Start Nginx (optional, for gateway testing)**
```bash
docker run -p 80:80 -v $(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf nginx:1.27-alpine
```

**6. Run Tests**
```powershell
.\test-banking-platform.ps1
```

---

## Docker Deployment

### Single-Machine Deployment

**1. Prerequisites**
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB disk space

**2. Clone/Prepare Repository**
```bash
cd /banking
```

**3. Create Environment File**
```bash
cat > .env << 'EOF'
# Security
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

# Docker Compose
COMPOSE_PROJECT_NAME=banking
EOF

# Load environment
source .env
```

**4. Start All Services**
```bash
# Build all images
docker compose build

# Start services (detached)
docker compose up -d

# Wait for readiness (30 seconds)
sleep 30

# Verify health
docker compose ps
```

**5. Run Tests**
```bash
docker compose exec laravel php artisan route:list
./test-banking-platform.ps1
```

**6. Monitor Logs**
```bash
# Follow all logs
docker compose logs -f

# Follow specific service
docker compose logs -f laravel
docker compose logs -f account-service

# View specific time range
docker compose logs --since 10m
```

### Scaling Services

**Scale Transaction Service to 3 Replicas**
```bash
# Using docker compose
docker compose up -d --scale transaction-service=3

# Load balancing configured in Nginx (update nginx.conf)
```

---

## Production Deployment

### High-Availability Setup

**Architecture:**
```
┌─────────────────────────────────────────────┐
│       AWS ECS / Kubernetes Cluster          │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  Nginx Ingress (2 replicas)         │   │
│  │  - Rate limiting                    │   │
│  │  - Load balancing                   │   │
│  └─────────────────────────────────────┘   │
│           ↓                              │
│  ┌──────────────────────┬─────────────┐   │
│  Lab. (2)  Account (3) │ Trans (3)   │   │
│  │           │         │ Blockchain│Kafka │
│  │  Redis    │ Redis   │ DBPool  (2)│   │
│  └──────────────────────┴─────────────┘   │
└─────────────────────────────────────────────┘
       ↓              ↓           ↓
   ┌─────────┐  ┌────────┐  ┌──────────┐
   │RDS-Prim │  │RDS-Rep │  │ElastiCache
   │(Multi-AZ)│ │(Replica)   │(Redis)
   └─────────┘  └────────┘  └──────────┘
```

### AWS ECS Deployment

**1. Create ECR Repositories**
```bash
aws ecr create-repository --repository-name banking-laravel
aws ecr create-repository --repository-name banking-account-service
aws ecr create-repository --repository-name banking-transaction-service
aws ecr create-repository --repository-name banking-blockchain-service
aws ecr create-repository --repository-name banking-nginx
```

**2. Build and Push Images**
```bash
# Build images
docker compose build

# Tag and push each image
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Push each service
docker tag banking-laravel:latest $ECR_REGISTRY/banking-laravel:latest
docker push $ECR_REGISTRY/banking-laravel:latest

# Repeat for other services...
```

**3. Create RDS Database**
```bash
# Create Multi-AZ PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier banking-postgres \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username postgres \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --multi-az \
  --publicly-accessible false
```

**4. Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name banking-prod

# Create task definitions (see ecs-task-definition.json)
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create services
aws ecs create-service \
  --cluster banking-prod \
  --service-name laravel-gateway \
  --task-definition laravel-gateway:1 \
  --desired-count 2 \
  --load-balancers targetGroupArn=arn:aws:...,containerName=laravel,containerPort=8000
```

**5. Configure Application Load Balancer**
```bash
aws elbv2 create-load-balancer \
  --name banking-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target groups and register services
aws elbv2 create-target-group \
  --name banking-api \
  --protocol HTTP \
  --port 80
```

### SSL/TLS Configuration

**Using AWS Certificate Manager:**
```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.banking.example.com \
  --validation-method DNS

# Attach to ALB listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:...
```

**Or using Let's Encrypt:**
```bash
# In Nginx container
certbot certonly --webroot -w /var/www/html \
  -d api.banking.example.com \
  --email admin@example.com \
  -n --agree-tos

# Renew automatically
docker exec nginx certbot renew --quiet
```

### Environment Configuration

**Production .env**
```bash
# Security
JWT_SECRET=<256-bit-hex-secret>
APP_ENV=production
APP_DEBUG=false

# Database
DB_HOST=banking-postgres.xxx.rds.amazonaws.com
DB_PORT=5432
DB_DATABASE=banking_laravel
DB_USERNAME=postgres
DB_PASSWORD=<STRONG_PASSWORD>

# Redis
REDIS_HOST=banking-cache.xxx.ng.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
CACHE_STORE=redis
SESSION_DRIVER=redis

# Service Discovery
SPRING_ACCOUNT_URL=http://account-service-nlb.xxx.elb.amazonaws.com
SPRING_TRANSACTION_URL=http://transaction-service-nlb.xxx.elb.amazonaws.com
SPRING_BLOCKCHAIN_URL=http://blockchain-service-nlb.xxx.elb.amazonaws.com

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=warning
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes 1.24+
- kubectl configured
- Docker images in registry
- Helm 3+ (optional)

### Create Kubernetes Manifests

**1. Namespaces**
```yaml
# banking-namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: banking
---
apiVersion: v1
kind: Secret
metadata:
  name: banking-secrets
  namespace: banking
type: Opaque
stringData:
  jwt-secret: "<256-bit-hex-secret>"
  db-password: "<strong-password>"
  db-user: postgres
```

**2. ConfigMap**
```yaml
# banking-configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: banking-config
  namespace: banking
data:
  app.env: production
  db-host: postgres.banking.svc.cluster.local
  db-port: "5432"
  redis-host: redis.banking.svc.cluster.local
  redis-port: "6379"
```

**3. PostgreSQL StatefulSet**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: banking
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: banking-secrets
              key: db-password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 100Gi
```

**4. Redis Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: banking
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
```

**5. Laravel Gateway Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: laravel-gateway
  namespace: banking
spec:
  replicas: 2
  selector:
    matchLabels:
      app: laravel-gateway
  template:
    metadata:
      labels:
        app: laravel-gateway
    spec:
      containers:
      - name: laravel
        image: <registry>/banking-laravel:latest
        ports:
        - containerPort: 8000
        env:
        - name: APP_KEY
          value: #generated-app-key
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: banking-config
              key: db-host
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/user
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: laravel-gateway
  namespace: banking
spec:
  selector:
    app: laravel-gateway
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

**6. Account Service Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: account-service
  namespace: banking
spec:
  replicas: 3
  selector:
    matchLabels:
      app: account-service
  template:
    metadata:
      labels:
        app: account-service
    spec:
      containers:
      - name: account-service
        image: <registry>/banking-account-service:latest
        ports:
        - containerPort: 8081
        env:
        - name: SPRING_DATASOURCE_URL
          value: jdbc:postgresql://postgres:5432/account_db
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: banking-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /accounts/health
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /accounts
            port: 8081
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          limits:
            memory: "1Gi"
            cpu: "1000m"
          requests:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: account-service
  namespace: banking
spec:
  selector:
    app: account-service
  ports:
  - port: 8081
    targetPort: 8081
  type: ClusterIP
```

### Deploy to Kubernetes

```bash
# Apply manifests in order
kubectl apply -f banking-namespace.yml
kubectl apply -f banking-configmap.yml
kubectl apply -f postgres-statefulset.yml
kubectl apply -f redis-deployment.yml
kubectl apply -f laravel-deployment.yml
kubectl apply -f account-service-deployment.yml
kubectl apply -f transaction-service-deployment.yml
kubectl apply -f blockchain-service-deployment.yml

# Verify deployments
kubectl get deployments -n banking
kubectl get pods -n banking

# Check logs
kubectl logs -n banking -f deployment/laravel-gateway
```

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: account-service-hpa
  namespace: banking
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: account-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Monitoring & Logging

### Cloud-Based Monitoring

**AWS CloudWatch**
```bash
# Create log groups
aws logs create-log-group --log-group-name /banking/laravel
aws logs create-log-group --log-group-name /banking/account-service

# Stream logs
aws logs tail /banking/laravel --follow
```

**Datadog Integration**
```yaml
# docker-compose.yml
environment:
  DD_AGENT_HOST: datadog-agent
  DD_AGENT_PORT: 8126
  DD_SERVICE: banking-laravel
  DD_VERSION: 1.0.0
```

### Local Monitoring (ELK Stack)

**docker-compose.monitoring.yml**
```yaml
version: '3.9'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

**Start monitoring stack**
```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

Access Kibana: http://localhost:5601

### Health Checks

**Add to services**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8081/accounts"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## Backup & Recovery

### Database Backups

**Automated Daily Backup**
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

docker compose exec -T postgres pg_dump \
  -U postgres banking_laravel \
  > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Keep only 30 days of backups
find $BACKUP_DIR -mtime +30 -delete
```

Schedule with cron:
```
0 2 * * * /path/to/backup.sh
```

**Restore from Backup**
```bash
cat backup_20260328_000000.sql | \
  docker compose exec -T postgres psql -U postgres banking_laravel
```

### Amazon S3 Backups

```bash
# Upload to S3
aws s3 cp backup_20260328_000000.sql \
  s3://banking-backups/postgres/

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket banking-backups \
  --versioning-configuration Status=Enabled
```

---

## Disaster Recovery Plan

| Scenario | RTO | RPO | Solution |
|----------|-----|-----|----------|
| Single pod crash | <2min | 0 | K8s auto-restart |
| Node failure | <5min | 0 | Pod migration |
| Database failure | <1hr | 5min | RDS multi-AZ failover |
| Region outage | <4hr | 1hr | Cross-region backup restore |

---

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] TLS certificates installed
- [ ] Database backups automated
- [ ] Monitoring/logging configured
- [ ] Health checks defined
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] API documentation accessible
- [ ] Test suite passes
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] Disaster recovery tested