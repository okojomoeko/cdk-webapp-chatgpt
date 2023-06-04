import { WebApplicationStack } from './web_application-stack';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class WebApplicationAppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const webApplicationStack = new WebApplicationStack(
      this,
      'WebApplicationStack'
    );
  }
}
