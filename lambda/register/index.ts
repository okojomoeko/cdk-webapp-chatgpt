import { Context } from 'aws-lambda';
exports.handler = async function (event: string, context: Context) {
  console.log('event: \n' + JSON.stringify(event, null, 2));
  return context.logStreamName;
};
