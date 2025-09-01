import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CDKOutputs {
  RdsProxyEndpoint?: string;
  CognitoUserPoolId?: string;
  CognitoClientId?: string;
  Region?: string;
  CloudFrontURL?: string;
}

function syncAwsOutputs() {
  try {
    // CDK outputs 읽기
    const outputsPath = join(__dirname, '../dist/template.json');
    if (!existsSync(outputsPath)) {
      console.error('CDK template not found. Run "npm run infra:outputs" first.');
      return;
    }

    const template = JSON.parse(readFileSync(outputsPath, 'utf8'));
    const outputs: CDKOutputs = {};
    
    Object.keys(template.Outputs || {}).forEach(key => {
      outputs[key] = template.Outputs[key].Export?.Name || template.Outputs[key].Value;
    });

    // 기존 .env.aws 파일 읽기
    const envPath = join(__dirname, '../../backend/.env.aws');
    let envContent = '';
    
    if (existsSync(envPath)) {
      envContent = readFileSync(envPath, 'utf8');
    } else {
      // 기본 템플릿 사용
      envContent = `RUN_TARGET=aws
AUTH_PROVIDER=cognito
PORT=3002

# Google
GOOGLE_PLACES_BACKEND_KEY=YOUR_BACKEND_KEY

# RDS via Proxy (filled from CDK outputs)
DATABASE_URL=postgresql://<user>:<pass>@<rds-proxy-endpoint>:5432/<db>?sslmode=require

# Cognito (filled from CDK outputs)
COGNITO_USER_POOL_ID=<id>
COGNITO_CLIENT_ID=<id>
COGNITO_REGION=<region>

DETAIL_TTL_MS=604800000
`;
    }

    // 환경 변수 업데이트
    let updatedContent = envContent;
    
    if (outputs.RdsProxyEndpoint) {
      updatedContent = updatedContent.replace(
        /DATABASE_URL=.*/,
        `DATABASE_URL=postgresql://vk:vk@${outputs.RdsProxyEndpoint}:5432/vk?sslmode=require`
      );
    }
    
    if (outputs.CognitoUserPoolId) {
      updatedContent = updatedContent.replace(
        /COGNITO_USER_POOL_ID=.*/,
        `COGNITO_USER_POOL_ID=${outputs.CognitoUserPoolId}`
      );
    }
    
    if (outputs.CognitoClientId) {
      updatedContent = updatedContent.replace(
        /COGNITO_CLIENT_ID=.*/,
        `COGNITO_CLIENT_ID=${outputs.CognitoClientId}`
      );
    }
    
    if (outputs.Region) {
      updatedContent = updatedContent.replace(
        /COGNITO_REGION=.*/,
        `COGNITO_REGION=${outputs.Region}`
      );
    }

    // 파일 저장
    writeFileSync(envPath, updatedContent);
    console.log('✅ AWS outputs synced to apps/backend/.env.aws');
    
  } catch (error) {
    console.error('❌ Error syncing AWS outputs:', error);
    process.exit(1);
  }
}

syncAwsOutputs();


