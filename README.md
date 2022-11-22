This is a very simple project to demonstrate Feature Flags with Amazon CloudWatch Evidently 
https://aws.amazon.com/blogs/aws/cloudwatch-evidently/

This demo how to use feature flags in your code for two use cases : launch control and experiment (A/B Testing).

## Tenets 

This demo is frugal, modern and inclusive.

- Frugal : it uses a minimal web app. This is not shiny nor functional. It allows to focus on the demo code and only teh demo code. There is no extra dependencies and it keep code to minimal, only the code required to run teh demo itself.

- Modern : it uses the latest version of AWS SDK for Javascript v3 

- Inclusive : it is built using plain HTML/CSS and Javascript.  This demo intentionally does not use higher-level frameworks such as React or Angular. It can be adapted to any of these.


## How to deploy on your account

To run this code on your own account, you must create 
- a cloudwatch evidentlty project, with two features, a launch and an experiment ([as described in the blog post](https://aws.amazon.com/blogs/aws/cloudwatch-evidently/))
- create a cognito identity pool 

The Evidently features must be named `EditableGuestbook` (boolean) and `GuestBookCardColor` (boolean).

Then you need to change the following lines of code to point to your values.

src/cognito.ts
```typescript
// Set the parameters
const IDENTITY_POOL_ID = 'us-west-2:3109c9f1-7857-4cbf-be91-c867a00768e0';
const COGNITO_UNAUTHENTICATED_ROLE = 'arn:aws:iam::0123456789:role/Cognito_evidentlydemoUnauth_Role';
const REGION = "us-west-2";
```

src/evidently.ts
```typescript
// Set the parameter
const REGION = "us-west-2";
const EVIDENTLY_PROJECT = "demo";
```

The permissions associated to the Cognito unauthenticated role are available in `src/policy.json` (adjust the resource section with the ARN of your feature)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EvidentlyDemoEvaluateFeature",
            "Effect": "Allow",
            "Action": "evidently:EvaluateFeature",
            "Resource": "arn:aws:evidently:us-west-2:0123456789:project/demo/feature/*"
        },
        {
            "Sid": "EvidentlyDemoPutProjectsEvent",
            "Effect": "Allow",
            "Action": "evidently:PutProjectEvents",
            "Resource": "arn:aws:evidently:us-west-2:0123456789:project/demo"
        }
    ]
}
```
## Todo

- add a CDK script to create the cognito and evidently configuration automatically

## Additional code sample

Cognito Code Sample 
https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javascriptv3/example_code/cognito

AWS JS SDK v3 
https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html

Building Application with WebPack 
https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/webpack.html
