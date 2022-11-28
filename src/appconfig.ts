import {
    AppConfigData,
    StartConfigurationSessionCommandInput,
    GetLatestConfigurationCommandInput,
    StartConfigurationSessionCommandOutput,
    GetLatestConfigurationCommandOutput
} from '@aws-sdk/client-appconfigdata';
import NodeCache from 'node-cache';
import { Buffer } from 'buffer';

import { awsCredentialsForAnonymousUser } from "./cognito"

class AppConfigRetriever {
    configurationCache: NodeCache;
    sessionTokenCache: NodeCache;
    appConfigClient: AppConfigData;
    constructor() {
        this.configurationCache = new NodeCache({ stdTTL: 30 });
        this.sessionTokenCache = new NodeCache({ stdTTL: 3600 });
    }

    async refreshConfig(application: string, environment: string, configuration: string) {
        const featureFlagKey: string = `${application}:${environment}:${configuration}`;
        let sessionToken: string | undefined = this.sessionTokenCache.get(featureFlagKey);
        if (sessionToken === undefined) {
            const startConfigurationSessionInput: StartConfigurationSessionCommandInput = {
                ApplicationIdentifier: application,
                EnvironmentIdentifier: environment,
                ConfigurationProfileIdentifier: configuration
            };


            const startConfigurationSessionResponse: StartConfigurationSessionCommandOutput = await this.appConfigClient.startConfigurationSession(startConfigurationSessionInput);
            sessionToken = startConfigurationSessionResponse.InitialConfigurationToken;
        }
        const getLatestConfigurationInput: GetLatestConfigurationCommandInput = {
            ConfigurationToken: sessionToken
        }
        const getLatestConfigurationSessionResponse: GetLatestConfigurationCommandOutput = await this.appConfigClient.getLatestConfiguration(getLatestConfigurationInput);
        this.sessionTokenCache.set(featureFlagKey, getLatestConfigurationSessionResponse.NextPollConfigurationToken);
        return getLatestConfigurationSessionResponse.Configuration;
    }

    async getFeatureFlagConfig(application: string, environment: string, configuration: string): Promise<any> {

        const credentials = await awsCredentialsForAnonymousUser({
            identityPoolId: 'eu-west-1:15a24313-b58a-4815-b78f-b1ad3691a6f3',
            cognitoUnauthenticatedRole: 'arn:aws:iam::419072201833:role/Cognito_reInventdemoUnauth_Role'
        });

        this.appConfigClient = new AppConfigData({credentials: credentials, region: 'eu-west-1'});

        const featureFlagKey: string = `${application}:${environment}:${configuration}`;
        let featureFlag: Uint8Array | undefined = this.configurationCache.get(featureFlagKey);

        if (featureFlag === undefined) {
            featureFlag = await this.refreshConfig(application, environment, configuration);
            this.configurationCache.set(featureFlagKey, featureFlag);
        }
        return JSON.parse(Buffer.from(featureFlag!).toString('utf8'))
    }

    async getFeature(application: string, environment: string, configuration: string, flagName: string): Promise<boolean> {
        const featureFlagConfig: any = await this.getFeatureFlagConfig(application, environment, configuration);
        return featureFlagConfig[`${flagName}`]['enabled'];
    }
}

export { AppConfigRetriever }