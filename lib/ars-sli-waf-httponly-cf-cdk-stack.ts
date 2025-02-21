import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as waf from 'aws-cdk-lib/aws-wafv2';

export class CloudFrontWafCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // WAF ACLs
    const webAclArn = 'arn:aws:wafv2:us-east-1:610092376560:global/webacl/WebACL/c3923d94-010d-4cd1-8c6c-2e72062190b3';

    // SSL Certificate (Same for both UK and US)
    const certificateArn = 'arn:aws:acm:us-east-1:610092376560:certificate/815d814a-facf-4fa8-8f21-52d27846b942';
    const existingCertificate = acm.Certificate.fromCertificateArn(this, 'ExistingCertificate', certificateArn);

    // UK Origin (HTTP Only)
    const ukOrigin = new origins.HttpOrigin('svip-awslon4.sli-systems.net', {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      originId: "ukOrigin"
    });

    // US Origin (HTTP Only)
    const usOrigin = new origins.HttpOrigin('svip-usa1.sli-systems.net', {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      originId: "usOrigin"
    });

    // UK CloudFront Distribution
    const httpOnlyWebCloudFrontUK = new cloudfront.Distribution(this, 'HttpOnlyWebCloudFrontUK', {
      defaultBehavior: {
        origin: ukOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.USE_ORIGIN_CACHE_CONTROL_HEADERS_QUERY_STRINGS,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER
      },
      domainNames: [], // Keeping it empty as per requirement
      certificate: existingCertificate,
      webAclId: webAclArn,
      comment: 'UK CloudFront Distribution',
    });

    // US CloudFront Distribution
    const httpOnlyWebCloudFrontUS = new cloudfront.Distribution(this, 'HttpOnlyWebCloudFrontUS', {
      defaultBehavior: {
        origin: usOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.USE_ORIGIN_CACHE_CONTROL_HEADERS_QUERY_STRINGS,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER
      },
      domainNames: [], // Keeping it empty as per requirement
      certificate: existingCertificate,
      webAclId: webAclArn,
      comment: 'US CloudFront Distribution',
    });

    // Outputs for UK CloudFront
    new cdk.CfnOutput(this, 'UKCloudFrontDistributionDomain', {
      value: httpOnlyWebCloudFrontUK.distributionDomainName,
      description: 'The domain name of the UK CloudFront distribution',
    });

    // Outputs for US CloudFront
    new cdk.CfnOutput(this, 'USCloudFrontDistributionDomain', {
      value: httpOnlyWebCloudFrontUS.distributionDomainName,
      description: 'The domain name of the US CloudFront distribution',
    });
  }
}

