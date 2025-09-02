# 🏗️ AWS Infra Architecture 설계도 & 프론트엔드/백엔드 설계

## 📋 **프로젝트 개요**
- **프로젝트명**: FFFF (VisitKorea 기반 여행 플랫폼)
- **아키텍처**: Monorepo + Microservices Architecture
- **클라우드**: AWS (Amazon Web Services)
- **배포**: CI/CD Pipeline + Container Orchestration

---

## 🏛️ **전체 시스템 아키텍처**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                      │
└─────────────────────┬─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS CLOUDFRONT                                     │
│                    (CDN + SSL Termination)                                │
└─────────────────────┬─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LOAD BALANCER                               │
│                         (ALB)                                             │
└─────────┬─────────────────────────────────────────────────────────┬───────┘
          │                                                         │
          ▼                                                         ▼
┌─────────────────────┐                               ┌─────────────────────┐
│   FRONTEND CLUSTER  │                               │   BACKEND CLUSTER   │
│                     │                               │                     │
│ ┌─────────────────┐ │                               │ ┌─────────────────┐ │
│ │   ECS Service   │ │                               │ │   ECS Service   │ │
│ │  (React App)    │ │                               │ │  (Fastify API)  │ │
│ │                 │ │                               │ │                 │ │
│ │ • Container     │ │                               │ │ • Container     │ │
│ │ • Auto Scaling  │ │                               │ │ • Auto Scaling  │ │
│ │ • Health Check  │ │                               │ │ • Health Check  │ │
│ └─────────────────┘ │                               │ └─────────────────┘ │
│                     │                               │                     │
│ ┌─────────────────┐ │                               │ ┌─────────────────┐ │
│ │   ECS Service   │ │                               │ │   ECS Service   │ │
│ │  (Static Files) │ │                               │ │  (Background)   │ │
│ └─────────────────┘ │                               │ └─────────────────┘ │
└─────────────────────┘                               └─────────────────────┘
          │                                                         │
          │                                                         │
          ▼                                                         ▼
┌─────────────────────┐                               ┌─────────────────────┐
│    S3 + CLOUDFRONT │                               │   RDS POSTGRESQL   │
│   (Static Assets)  │                               │   (Primary DB)     │
└─────────────────────┘                               └─────────────────────┘
                                                               │
                                                               ▼
                                              ┌─────────────────────────────────┐
                                              │        ELASTICACHE REDIS        │
                                              │      (Session + Cache)         │
                                              └─────────────────────────────────┘
```

---

## 🎨 **프론트엔드 아키텍처 설계**

### **1. 기술 스택**
```
Frontend Stack:
├── React 18 (TypeScript)
├── Vite (Build Tool)
├── Tailwind CSS + DaisyUI
├── React Router DOM
├── React Query (TanStack Query)
└── Axios (HTTP Client)
```

### **2. 컴포넌트 구조**
```
src/
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx          # 네비게이션 헤더
│   │   ├── Footer.tsx          # 푸터
│   │   └── FloatingActionButton.tsx  # 플로팅 액션 버튼
│   ├── home/
│   │   ├── Hero.tsx            # 메인 히어로 섹션
│   │   ├── PlaceGrid.tsx       # 장소 그리드
│   │   ├── RegionGrid.tsx      # 지역 그리드
│   │   └── ThemeChips.tsx      # 테마 칩
│   ├── calendar/
│   │   └── MonthCalendar.tsx   # 달력 컴포넌트
│   ├── schedule/
│   │   ├── CalendarSelector.tsx # 달력 선택기
│   │   ├── ScheduleDisplay.tsx  # 스케줄 표시
│   │   └── ScheduleEditModal.tsx # 스케줄 편집 모달
│   └── MapView.tsx             # 지도 뷰
├── pages/
│   ├── HomePage.tsx            # 메인 홈페이지
│   ├── DetailPage.tsx          # 장소 상세페이지
│   ├── MyPage.tsx              # 마이페이지
│   ├── SchedulePage.tsx        # 스케줄 페이지
│   └── LoginPage.tsx           # 로그인 페이지
├── hooks/
│   ├── useSchedule.ts          # 스케줄 관리 훅
│   └── useAuth.ts              # 인증 훅
├── api/
│   ├── auth.ts                 # 인증 API
│   ├── places.ts               # 장소 API
│   ├── users.ts                # 사용자 API
│   └── likes.ts                # 좋아요 API
└── lib/
    ├── fetchers.ts             # API 요청 유틸리티
    └── googleLoader.ts         # Google Maps 로더
```

### **3. 상태 관리**
```
State Management:
├── Local State (useState)
├── Global State (Context API)
├── Server State (React Query)
└── URL State (React Router)
```

### **4. 라우팅 구조**
```
Route Structure:
├── / (HomePage)
├── /places/:id (DetailPage)
├── /mypage (MyPage) - Protected
├── /schedule (SchedulePage) - Protected
├── /login (LoginPage)
└── /register (RegisterPage)
```

---

## ⚙️ **백엔드 아키텍처 설계**

### **1. 기술 스택**
```
Backend Stack:
├── Fastify (Web Framework)
├── Prisma (ORM)
├── PostgreSQL (Database)
├── Redis (Cache + Session)
├── JWT (Authentication)
├── bcrypt (Password Hashing)
└── Docker (Containerization)
```

### **2. 서비스 구조**
```
Backend Services:
├── User Service
│   ├── Authentication
│   ├── Profile Management
│   └── Password Management
├── Place Service
│   ├── Search & Discovery
│   ├── Place Details
│   └── Photo Management
├── Schedule Service
│   ├── Schedule CRUD
│   ├── Calendar Integration
│   └── Date Management
├── Like Service
│   ├── Like/Unlike
│   └── Like Status
└── External API Service
    ├── Google Places API
    └── Google Maps API
```

### **3. API 엔드포인트 구조**
```
API Endpoints:
├── /v1/auth
│   ├── POST /login
│   ├── POST /register
│   └── POST /logout
├── /v1/users
│   ├── GET /me
│   ├── PATCH /me
│   └── PATCH /me/password
├── /v1/places
│   ├── GET /search
│   ├── GET /:id
│   └── GET /:id/photos
├── /v1/schedules
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
└── /v1/likes
    ├── POST /:placeId
    ├── DELETE /:placeId
    └── GET /:placeId
```

### **4. 데이터베이스 스키마**
```
Database Schema:
├── users
│   ├── id (UUID)
│   ├── email (VARCHAR)
│   ├── password_hash (VARCHAR)
│   ├── display_name (VARCHAR)
│   ├── lang (ENUM)
│   └── created_at (TIMESTAMP)
├── places
│   ├── id (VARCHAR)
│   ├── name (JSONB)
│   ├── address (JSONB)
│   ├── rating (DECIMAL)
│   └── photos (JSONB)
├── schedules
│   ├── id (UUID)
│   ├── user_id (UUID)
│   ├── date (DATE)
│   ├── start_time (TIME)
│   ├── end_time (TIME)
│   └── place_name (VARCHAR)
└── likes
    ├── id (UUID)
    ├── user_id (UUID)
    ├── place_id (VARCHAR)
    └── created_at (TIMESTAMP)
```

---

## ☁️ **AWS 인프라 상세 설계**

### **1. 컴퓨팅 서비스 (ECS + Fargate)**
```
ECS Cluster Configuration:
├── Frontend Service
│   ├── Task Definition: React App
│   ├── CPU: 0.25 vCPU
│   ├── Memory: 0.5 GB
│   ├── Desired Count: 2
│   └── Auto Scaling: 1-5 instances
├── Backend Service
│   ├── Task Definition: Fastify API
│   ├── CPU: 0.5 vCPU
│   ├── Memory: 1 GB
│   ├── Desired Count: 2
│   └── Auto Scaling: 2-8 instances
└── Background Service
    ├── Task Definition: Background Jobs
    ├── CPU: 0.25 vCPU
    ├── Memory: 0.5 GB
    └── Desired Count: 1
```

### **2. 데이터베이스 (RDS PostgreSQL)**
```
RDS Configuration:
├── Instance Type: db.t3.micro (Dev) / db.t3.small (Prod)
├── Storage: 20 GB (Auto-scaling)
├── Multi-AZ: false (Dev) / true (Prod)
├── Backup: Automated (7 days retention)
├── Maintenance Window: Sunday 03:00-04:00 UTC
└── Monitoring: Enhanced monitoring enabled
```

### **3. 캐싱 (ElastiCache Redis)**
```
Redis Configuration:
├── Node Type: cache.t3.micro
├── Port: 6379
├── Multi-AZ: false (Dev) / true (Prod)
├── Encryption: In-transit & At-rest
└── Use Cases:
    ├── Session Storage
    ├── API Response Cache
    ├── User Preferences
    └── Rate Limiting
```

### **4. 스토리지 (S3 + CloudFront)**
```
S3 Bucket Structure:
├── visitkorea-static
│   ├── /images/          # 정적 이미지
│   ├── /icons/           # 아이콘 파일
│   └── /documents/       # 문서 파일
├── visitkorea-uploads
│   ├── /user-avatars/    # 사용자 프로필 이미지
│   └── /place-photos/    # 장소 사진
└── visitkorea-backups
    └── /database/        # 데이터베이스 백업

CloudFront Distribution:
├── Origin: S3 + ALB
├── SSL Certificate: ACM
├── Edge Locations: Global
├── Caching: Optimized
└── Security: WAF + Shield
```

### **5. 네트워킹 (VPC + Security Groups)**
```
VPC Configuration:
├── CIDR: 10.0.0.0/16
├── Subnets:
│   ├── Public: 10.0.1.0/24 (ALB)
│   ├── Private: 10.0.2.0/24 (ECS)
│   └── Database: 10.0.3.0/24 (RDS)
├── Security Groups:
│   ├── ALB-SG: 80, 443 (HTTP/HTTPS)
│   ├── ECS-SG: 3000 (App Port)
│   ├── RDS-SG: 5432 (PostgreSQL)
│   └── Redis-SG: 6379 (Redis)
└── NAT Gateway: For private subnet internet access
```

### **6. 모니터링 & 로깅**
```
Monitoring Stack:
├── CloudWatch
│   ├── Metrics: CPU, Memory, Network
│   ├── Logs: Application logs
│   └── Alarms: Auto-scaling triggers
├── X-Ray
│   ├── Distributed tracing
│   └── Performance analysis
└── CloudTrail
    ├── API call logging
    └── Security auditing
```

---

## 🚀 **배포 파이프라인 (CI/CD)**

### **1. GitHub Actions Workflow**
```yaml
name: Deploy to AWS
on:
  push:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy-frontend:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to S3
        uses: aws-actions/configure-aws-credentials@v2
      - name: Sync to S3
        run: aws s3 sync dist/ s3://visitkorea-static
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation

  deploy-backend:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t visitkorea-backend .
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin
          docker tag visitkorea-backend:latest ${{ secrets.ECR_REGISTRY }}
          docker push ${{ secrets.ECR_REGISTRY }}
      - name: Update ECS service
        run: aws ecs update-service --cluster visitkorea --service backend
```

### **2. 배포 전략**
```
Deployment Strategy:
├── Blue-Green Deployment
│   ├── Zero-downtime deployment
│   ├── Easy rollback
│   └── Traffic switching
├── Canary Deployment
│   ├── Gradual rollout
│   ├── A/B testing
│   └── Risk mitigation
└── Rolling Deployment
    ├── Incremental updates
    ├── Health check validation
    └── Automatic rollback
```

---

## 🔒 **보안 아키텍처**

### **1. 인증 & 인가**
```
Security Layers:
├── Application Level
│   ├── JWT Token validation
│   ├── Password hashing (bcrypt)
│   └── Input validation & sanitization
├── Network Level
│   ├── VPC isolation
│   ├── Security groups
│   └── WAF protection
├── Infrastructure Level
│   ├── IAM roles & policies
│   ├── KMS encryption
│   └── CloudTrail logging
└── Data Level
    ├── TLS encryption (in-transit)
    ├── AES encryption (at-rest)
    └── Regular security updates
```

### **2. 데이터 보호**
```
Data Protection:
├── Encryption
│   ├── S3: Server-side encryption (SSE-S3)
│   ├── RDS: Encryption at rest
│   ├── ElastiCache: In-transit encryption
│   └── ALB: TLS 1.2+ termination
├── Access Control
│   ├── IAM policies (least privilege)
│   ├── Database user permissions
│   └── API rate limiting
└── Compliance
    ├── GDPR compliance
    ├── Data retention policies
    └── Regular security audits
```

---

## 📊 **성능 최적화**

### **1. 프론트엔드 최적화**
```
Frontend Optimization:
├── Code Splitting
│   ├── Route-based splitting
│   ├── Component lazy loading
│   └── Dynamic imports
├── Asset Optimization
│   ├── Image compression
│   ├── CSS/JS minification
│   └── Gzip compression
├── Caching Strategy
│   ├── Browser caching
│   ├── Service worker
│   └── CDN caching
└── Bundle Optimization
    ├── Tree shaking
    ├── Dead code elimination
    └── Vendor chunk splitting
```

### **2. 백엔드 최적화**
```
Backend Optimization:
├── Database
│   ├── Query optimization
│   ├── Indexing strategy
│   ├── Connection pooling
│   └── Read replicas
├── Caching
│   ├── Redis caching
│   ├── Response caching
│   └── Database query cache
├── Load Balancing
│   ├── Health checks
│   ├── Auto-scaling
│   └── Traffic distribution
└── API Optimization
    ├── Pagination
    ├── Field selection
    ├── Batch operations
    └── Async processing
```

---

## 🔮 **확장성 & 유지보수성**

### **1. 수평 확장**
```
Scalability Features:
├── Auto Scaling
│   ├── CPU-based scaling
│   ├── Memory-based scaling
│   └── Custom metrics
├── Load Distribution
│   ├── ALB health checks
│   ├── Target group routing
│   └── Sticky sessions
└── Database Scaling
    ├── Read replicas
    ├── Connection pooling
    └── Sharding strategy
```

### **2. 모니터링 & 알림**
```
Monitoring & Alerting:
├── Infrastructure Metrics
│   ├── CPU utilization
│   ├── Memory usage
│   ├── Network I/O
│   └── Disk I/O
├── Application Metrics
│   ├── Response time
│   ├── Error rate
│   ├── Throughput
│   └── User experience
└── Business Metrics
    ├── Active users
    ├── API usage
    ├── Feature adoption
    └── Performance trends
```

---

## 💰 **비용 최적화**

### **1. 리소스 최적화**
```
Cost Optimization:
├── Instance Sizing
│   ├── Right-sizing instances
│   ├── Spot instances (non-critical)
│   └── Reserved instances (long-term)
├── Storage Optimization
│   ├── S3 lifecycle policies
│   ├── Data compression
│   └── Intelligent tiering
├── Network Optimization
│   ├── CloudFront caching
│   ├── VPC endpoints
│   └── Data transfer optimization
└── Development Environment
    ├── Auto-shutdown (dev)
    ├── Resource scheduling
    └── Cost alerts & budgets
```

---

## 🎯 **결론**

이 AWS 인프라 아키텍처는 **확장 가능하고 안전하며 비용 효율적인** 여행 플랫폼을 구축하기 위해 설계되었습니다.

### **주요 특징:**
- ✅ **Microservices Architecture**: 독립적인 서비스 배포 및 확장
- ✅ **Container Orchestration**: ECS를 통한 효율적인 리소스 관리
- ✅ **Auto Scaling**: 트래픽에 따른 자동 확장/축소
- ✅ **Multi-layer Security**: 애플리케이션부터 인프라까지 보안 강화
- ✅ **High Availability**: 다중 AZ 및 로드 밸런싱을 통한 가용성 확보
- ✅ **Cost Optimization**: 리소스 사용량에 따른 비용 최적화

### **기대 효과:**
- 🚀 **빠른 배포**: CI/CD 파이프라인으로 자동화된 배포
- 🔒 **보안 강화**: 다층 보안 아키텍처로 데이터 보호
- 📈 **확장성**: 트래픽 증가에 따른 자동 확장
- 💰 **비용 효율**: 사용량 기반 과금 및 리소스 최적화
- 🛠️ **유지보수**: 모니터링 및 로깅을 통한 효율적인 운영

이 아키텍처를 통해 **안정적이고 성능이 우수한 여행 플랫폼**을 구축할 수 있습니다! 🎉✨
