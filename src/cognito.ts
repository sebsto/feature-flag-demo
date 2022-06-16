/*

This module contains Cognito and STS related code.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/

// Load the required clients and packages
import { fromCognitoIdentityPool, CognitoIdentityCredentialProvider } from "@aws-sdk/credential-providers"; 
import { CognitoIdentityClient, GetIdCommand, GetOpenIdTokenCommand } from "@aws-sdk/client-cognito-identity";
import { STSClient, AssumeRoleWithWebIdentityCommand } from "@aws-sdk/client-sts";
import { Credentials } from "@aws-sdk/types"

// Set the parameters
const IDENTITY_POOL_ID = 'us-west-2:3109c9f1-7857-4cbf-be91-c867a00768e0';
const COGNITO_UNAUTHENTICATED_ROLE = 'arn:aws:iam::486652066693:role/Cognito_evidentlydemoUnauth_Role';
const REGION = "us-west-2";

// Retrieve the Cognito ID (not required by Evidently, just used to display the cognito ID in the web page)
// this is an unauthenticated call, no credentials required
const showId = async (): Promise<string> => {
    let result = 'undefined';
    try {
        const client = new CognitoIdentityClient({ region: REGION });
        const data = await client.send(new GetIdCommand( { IdentityPoolId: IDENTITY_POOL_ID }));
        result = data.IdentityId;
    } catch (err) {
        result = "Error " + err;
    }
    return result;
};

// TESTING
// console.log('Calling Cognito GetIdCommand')
// const id = await showId();
// console.log(id);

// Initialize the Amazon Cognito credentials provider
// Manually retrieve credentials using Cognito OpenID Token and STS AssumeRoleWithWebIdentity
// this code assumes the IAM role used by Cognito UnAuth configuration.
const awsCredentialsForAnonymousUser  = async (): Promise<Credentials> => {
    const cognitoClient = new CognitoIdentityClient({ region: REGION });
    const identity = await cognitoClient.send(new GetIdCommand( { IdentityPoolId: IDENTITY_POOL_ID }));
    const token    = await cognitoClient.send(new GetOpenIdTokenCommand( { IdentityId: identity.IdentityId }))

    const stsClient = new STSClient({ region: REGION });
    const credentials = await stsClient.send(new AssumeRoleWithWebIdentityCommand({
        RoleArn: COGNITO_UNAUTHENTICATED_ROLE,
        RoleSessionName: 'evidently',
        WebIdentityToken: token.Token
    }));
    const result : Credentials = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken,
        expiration: credentials.Credentials.Expiration
    };
    return result;
};

// Initialize the Amazon Cognito credentials provider
// this provider will provide AWS SDK clients with a temporray access key and secret key
// WITH EVIDENTLY and APPCONFIG THIS ONLY WORKS FOR AUTHENTICATED ACCESS (when you trade an authentication token for AWS credentials)
// see why at https://docs.aws.amazon.com/cognito/latest/developerguide/iam-roles.html

const awsCredentialsForAuthenticatedUser = async (token: string) : Promise<CognitoIdentityCredentialProvider> => {
  return fromCognitoIdentityPool({
    identityPoolId: IDENTITY_POOL_ID,
    
    // Overwrite default Cognito Identity client configuration
    clientConfig: { region: REGION },

    // pass the authentication token obtained from another provider 
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_credential_providers.html
    logins: {
       'www.amazon.com' : token
    }
  });
}

// TESTING 
// console.log('Calling credentials provider');
// const credentials = await getAWSCredentials('amazon_token acquired with Login With Amazon');
// console.log(credentials);


export { showId, awsCredentialsForAnonymousUser, awsCredentialsForAuthenticatedUser };
