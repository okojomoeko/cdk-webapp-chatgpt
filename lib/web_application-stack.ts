import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';

export class WebApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // S3 Bucket for static hosting
    const webBucket = new s3.Bucket(this, 'WebBucket', {
      websiteIndexDocument: 'index.html',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // DynamoDB table for storing login information
    const loginTable = new dynamodb.Table(
      this,
      `${this.stackName}-LoginTable`,
      {
        partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    // Lambda function for registering login information
    const registerFunction = new lambda.Function(this, 'RegisterFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda/register'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: loginTable.tableName,
      },
    });

    // API Gateway for the register function
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      deployOptions: {
        stageName: 'prod',
      },
    });
    const registerIntegration = new apigateway.LambdaIntegration(
      registerFunction
    );
    api.root.addMethod('POST', registerIntegration);

    // IAM policy for accessing the DynamoDB table
    const dynamoDBPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: [loginTable.tableArn],
    });
    registerFunction.addToRolePolicy(dynamoDBPolicy);

    // Web application CloudFront distribution
    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      'CloudFrontOAI'
    );

    // Grant read access to CloudFront
    const bucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [webBucket.bucketArn + '/*'],
      principals: [
        new iam.CanonicalUserPrincipal(
          cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
    });
    webBucket.addToResourcePolicy(bucketPolicy);

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      'CloudFrontDistribution',
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: webBucket,
              originAccessIdentity: cloudFrontOAI,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        errorConfigurations: [
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: '/index.html',
          },
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: '/index.html',
          },
        ],
        // webACLId: なし
      }
    );

    // // WAFv2 WebACL for DDoS protection and IP blocking
    // const webACL = new wafv2.CfnWebACL(this, 'WebACL', {
    //   defaultAction: { allow: {} },
    //   scope: 'CLOUDFRONT',
    //   visibilityConfig: {
    //     cloudWatchMetricsEnabled: true,
    //     metricName: 'WebACL',
    //     sampledRequestsEnabled: true,
    //   },
    //   rules: [
    //     {
    //       name: 'BlockIPRule',
    //       priority: 0,
    //       action: { block: {} },
    //       statement: {
    //         ipSetReferenceStatement: {
    //           arn: '<ARN_OF_IP_SET>', // Replace with the ARN of the IP set to block
    //         },
    //       },
    //       visibilityConfig: {
    //         cloudWatchMetricsEnabled: true,
    //         metricName: 'BlockIPRule',
    //         sampledRequestsEnabled: true,
    //       },
    //     },
    //   ],
    // });
  }
}
