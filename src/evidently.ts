/*

This module contains Evidently related code.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/

// Load the required clients and packages
import { EvidentlyClient,
         EvaluateFeatureCommand, 
         EvaluateFeatureRequest, 
         EvaluateFeatureCommandOutput, 
         PutProjectEventsRequest,
         PutProjectEventsCommand} from "@aws-sdk/client-evidently";

import { awsCredentialsForAnonymousUser  }  from "./cognito"         

// Set the parameter
const REGION = "us-west-2";
const EVIDENTLY_PROJECT = "demo";

/**
 * Create an Evidently Client and a Cognito Credentials provider 
 */
const evidentlyClient = async () : Promise<EvidentlyClient> => {

    // Automatically retrieve Cognito credentials when using Auth identities
    // const credentials = await awsCredentialsForAuthenticatedUser('amazon_token acquired with Login With Amazon');

    // manually retrieve credentials with Cognito and STS
    const credentials = await awsCredentialsForAnonymousUser();

    //console.log(credentials);

    // Initialize the Amazon CloudWatch Evidently client
    const evidently = new EvidentlyClient({
        region: REGION,

        // NOT WORKING with unauthenticated identities obtained with fromCognitoIdentityPool(...)
        // AccessDeniedException: User: arn:aws:sts::0123456789:assumed-role/Cognito_evidentlydemoUnauth_Role/CognitoIdentityCredentials is not authorized to perform: evidently:EvaluateFeature on resource: arn:aws:evidently:us-west-2:0123456789:project/demo/feature/EditableGuestbook because no session policy allows the evidently:EvaluateFeature action
        // because Cognito scopes down permission to selected list of services. Evidently is not part of it
        // https://docs.aws.amazon.com/cognito/latest/developerguide/iam-roles.html


        // WORKING with unauthenticated identities :  Credentials manually obtained from Cognito and STS
        // This is required for unauth role. Be sure to enable Basic (classic) flow in Cognito
        credentials: credentials
    });

    return evidently
}

/**
 * Call Evidently to evaluate a feature  
 */
const evaluateFeature = async(entityId : string, feature : string) : Promise<EvaluateFeatureCommandOutput> => {
    
    // API request structure
    const evaluateFeatureRequest : EvaluateFeatureRequest = {
        // entityId for calling evaluate feature API
        entityId: entityId,
        // Name of your feature
        feature: feature,
        // Name of your project
        project: EVIDENTLY_PROJECT,
    };
    const command = new EvaluateFeatureCommand(evaluateFeatureRequest);

    // Evaluate feature
    console.log(`Evaluate feature for entityId: ${evaluateFeatureRequest.entityId} and feature: ${evaluateFeatureRequest.feature}`);
    const client = await evidentlyClient();
    const response = await client.send(command);
    console.log(response);
    return response;
}

/**
 * Put a custom metric on Evidently
 */
const addCard = async (entityId : string, sessionId : string) => {

    const addedCardData = `{
      "details": {
        "addedCard": 1
      },
      "userDetails": { "entityId": "${entityId}", "sessionId": "${sessionId}"}
    }`;
    const putProjectEventsRequest : PutProjectEventsRequest = {
      project: EVIDENTLY_PROJECT,
      events: [
        {
          timestamp: new Date(),
          type: 'aws.evidently.custom',
          data: JSON.parse(addedCardData)
        },
      ],
    };
    const command = new PutProjectEventsCommand(putProjectEventsRequest);
    const client = await evidentlyClient();
    const response = await client.send(command);
    console.log(response);
  }

export { evaluateFeature, addCard };
