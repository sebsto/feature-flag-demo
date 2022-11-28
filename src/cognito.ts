/*

This module contains Cognito and STS related code.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0

*/

// Load the required clients and packages
import { CognitoIdentityClient, GetIdCommand, GetOpenIdTokenCommand } from "@aws-sdk/client-cognito-identity";
import { STSClient, AssumeRoleWithWebIdentityCommand } from "@aws-sdk/client-sts";
import { Credentials } from "@aws-sdk/types"

const REGION = "us-west-2";


// Initialize the Amazon Cognito credentials provider
// Manually retrieve credentials using Cognito OpenID Token and STS AssumeRoleWithWebIdentity
// this code assumes the IAM role used by Cognito UnAuth configuration.

// NOT WORKING with unauthenticated identities obtained with fromCognitoIdentityPool(...)
// AccessDeniedException: User: arn:aws:sts::0123456789:assumed-role/Cognito_evidentlydemoUnauth_Role/CognitoIdentityCredentials is not authorized to perform: evidently:EvaluateFeature on resource: arn:aws:evidently:us-west-2:0123456789:project/demo/feature/EditableGuestbook because no session policy allows the evidently:EvaluateFeature action
// because Cognito scopes down permission to selected list of services. Evidently is not part of it
// https://docs.aws.amazon.com/cognito/latest/developerguide/iam-roles.html

// WORKING with unauthenticated identities :  Credentials manually obtained from Cognito and STS
// This is required for unauth role. Be sure to enable Basic (classic) flow in Cognito
const awsCredentialsForAnonymousUser = async (options: { identityPoolId: string, cognitoUnauthenticatedRole: string }): Promise<Credentials> => {

    const cognitoClient = new CognitoIdentityClient({ region: REGION });
    const identity = await cognitoClient.send(new GetIdCommand( { IdentityPoolId: options.identityPoolId }));
    const token    = await cognitoClient.send(new GetOpenIdTokenCommand( { IdentityId: identity.IdentityId }))

    const stsClient = new STSClient({ region: REGION });

    const credentials = await stsClient.send(new AssumeRoleWithWebIdentityCommand({
        RoleArn: options.cognitoUnauthenticatedRole,
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

export { awsCredentialsForAnonymousUser };
