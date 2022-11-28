/*

This module contains Evidently related code.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/

// Load the required clients and packages
import {
  Evidently,
  EvaluateFeatureCommandOutput,
} from "@aws-sdk/client-evidently";

import { awsCredentialsForAnonymousUser } from "./cognito"

// Set the parameter
const REGION = "us-west-2";

/**
 * Call Evidently to evaluate a feature  
 */
const evaluateFeature = async (entityId: string): Promise<EvaluateFeatureCommandOutput> => {

  const credentials = await awsCredentialsForAnonymousUser({
    identityPoolId: 'us-west-2:3109c9f1-7857-4cbf-be91-c867a00768e0',
    cognitoUnauthenticatedRole: 'arn:aws:iam::486652066693:role/Cognito_evidentlydemoUnauth_Role'
  });

  // Initialize the Amazon CloudWatch Evidently client
  const evidently = new Evidently({
    region: REGION,
    credentials: credentials
  });
  
  const evaluateFeatureRequest = {
    // entityId for calling evaluate feature API
    entityId: entityId,
    // Name of your feature
    feature: "EditableGuestbook",
    // Name of your project
    project: "demo",
  };
  
  // Evaluate feature
  return evidently.evaluateFeature(evaluateFeatureRequest);
}

export { evaluateFeature };
