import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { WebApplicationAppStage } from './web_application_appstage-stack';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Deployment stages
    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      pipelineName: 'WebApplicationPipeline',
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.connection(
          'okojomoeko/cdk-webapp-chatgpt',
          'main',
          {
            connectionArn: '<YOURCONNETIONARN>',
          }
        ),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
    });

    pipeline.addStage(new WebApplicationAppStage(this, 'DEV', {}));
    pipeline.addStage(new WebApplicationAppStage(this, 'PROD', {}));
  }
}
