import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3'
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { UserPool, UserPoolClient, AccountRecovery } from 'aws-cdk-lib/aws-cognito'
import { Vpc, SubnetType, SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import { DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from 'aws-cdk-lib/aws-rds'
import { DatabaseProxy } from 'aws-cdk-lib/aws-rds'
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda'
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'

export class CoreStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // VPC 생성
    const vpc = new Vpc(this, 'VPC', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    })

    // RDS PostgreSQL 인스턴스
    const dbInstance = new DatabaseInstance(this, 'Database', {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_15,
      }),
      instanceType: 't4g.micro',
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      databaseName: 'vk',
      credentials: {
        username: 'vk',
        password: 'vk123456',
      },
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
    })

    // RDS Proxy
    const dbProxy = new DatabaseProxy(this, 'DatabaseProxy', {
      proxyTarget: dbInstance,
      secrets: [dbInstance.secret!],
      vpc,
      securityGroups: [dbInstance.connections.securityGroups[0]],
      requireTLS: false,
    })

    // Cognito User Pool
    const userPool = new UserPool(this, 'UserPool', {
      userPoolName: 'visitkorea-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
    })

    // S3 Bucket for Frontend
    const siteBucket = new Bucket(this, 'FrontendBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    // CloudFront Distribution
    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity')
    siteBucket.grantRead(originAccessIdentity)

    const distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new S3Origin(siteBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: 'redirect-to-https',
      },
    })

    // Lambda Function
    const apiFunction = new Function(this, 'ApiFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      code: Code.fromAsset('../backend/dist'),
      environment: {
        NODE_ENV: 'production',
        RUN_TARGET: 'aws',
        AUTH_PROVIDER: 'cognito',
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        COGNITO_REGION: this.region,
        DATABASE_URL: `postgresql://vk:vk123456@${dbProxy.endpoint}:5432/vk?sslmode=require`,
      },
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: Duration.seconds(30),
    })

    // API Gateway
    const api = new RestApi(this, 'ApiGateway', {
      restApiName: 'VisitKorea API',
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowHeaders: ['*'],
      },
    })

    const apiIntegration = new LambdaIntegration(apiFunction)
    api.root.addProxy({
      defaultIntegration: apiIntegration,
    })

    // Google Places API Secret
    const googleSecret = new Secret(this, 'GooglePlacesApiKey', {
      secretName: 'GOOGLE_PLACES_API_KEY',
    })

    // Outputs
    new CfnOutput(this, 'RdsProxyEndpoint', { value: dbProxy.endpoint })
    new CfnOutput(this, 'CognitoUserPoolId', { value: userPool.userPoolId })
    new CfnOutput(this, 'CognitoClientId', { value: userPoolClient.userPoolClientId })
    new CfnOutput(this, 'Region', { value: this.region })
    new CfnOutput(this, 'CloudFrontURL', { value: distribution.distributionDomainName })
    new CfnOutput(this, 'ApiGatewayURL', { value: api.url })
  }
}






