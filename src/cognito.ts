/*

This module contains Cognito and STS related code.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0

*/

// Load the required clients and packages
import { CognitoIdentityClient, GetIdCommand, GetOpenIdTokenCommand } from "@aws-sdk/client-cognito-identity";
import { STSClient, AssumeRoleWithWebIdentityCommand } from "@aws-sdk/client-sts";
import { AwsCredentialIdentity } from "@aws-sdk/types"

// Initialize the Amazon Cognito credentials provider
// This function manually retrieves credentials using Cognito OpenID Token and STS AssumeRoleWithWebIdentity
// this code assumes the IAM role used by Cognito UnAuth configuration.

// The traditional method of using unauthenticated identities obtained with fromCognitoIdentityPool(...) IS NOT WORKING with 
// AccessDeniedException: User: arn:aws:sts::0123456789:assumed-role/Cognito_evidentlydemoUnauth_Role/CognitoIdentityCredentials is not authorized to perform: evidently:EvaluateFeature on resource: arn:aws:evidently:us-west-2:0123456789:project/demo/feature/EditableGuestbook because no session policy allows the evidently:EvaluateFeature action
// This happens because Cognito Identity Pool scopes down permissions to selected list of services. Evidently is not part of it
// See the list of supported services here https://docs.aws.amazon.com/cognito/latest/developerguide/iam-roles.html

// The workaround to handle unauthenticated identities is to obtain credentials manually Cognito and STS
// This is required for unauth role. Be sure to enable Basic (classic) flow in Cognito to make this work.
const awsCredentialsForAnonymousUser = async (options: { region: string, identityPoolId: string, cognitoUnauthenticatedRole: string }): Promise<AwsCredentialIdentity> => {

    // 1. Obtain a Cognito Identity Pool OpenId token.
    const cognitoClient = new CognitoIdentityClient({ region: options.region });
    // TODO create one identity per client, typically use cookies to store and reuse the generate identity Id
    const identity = await cognitoClient.send(new GetIdCommand( { IdentityPoolId: options.identityPoolId }));
    const token    = await cognitoClient.send(new GetOpenIdTokenCommand( { IdentityId: identity.IdentityId }))

    // 2. exchange the Cognito OpenId token for an AWS access key and secret key.
    // This is done by assuming a role that defines the permission on these tokens
    const stsClient = new STSClient({ region:options.region });
    const credentials = await stsClient.send(new AssumeRoleWithWebIdentityCommand({
        RoleArn: options.cognitoUnauthenticatedRole,
        RoleSessionName: 'evidentlyDemo',
        WebIdentityToken: token.Token
    }));

    // the credential object returned by STS has not the same format as the one expected by downstream services 
    // (Evidently, AppConfig), format conversion happens below — notice the difference in capitalization :-(
    const result : AwsCredentialIdentity = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken,
        expiration: credentials.Credentials.Expiration
    };
    return result;
};

export { awsCredentialsForAnonymousUser };
