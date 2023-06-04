#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WebApplicationStack } from '../lib/web_application-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new WebApplicationStack(app, 'WebApplicationStack');
new PipelineStack(app, 'PipelineStack');
