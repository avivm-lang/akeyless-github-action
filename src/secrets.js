const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

async function handleExportSecrets(args) {
    const {
        akeylessToken,
        staticSecrets,
        dynamicSecrets,
        rotatedSecrets,
        apiUrl,
        exportSecretsToOutputs,
        exportSecretsToEnvironment,
        generateSeparateOutput,
        sshCertificate,
        pkiCertificate
    } = args;

    // Define a mapping of key-to-function
    const secretHandlers = {
        staticSecrets: exportStaticSecrets,
        dynamicSecrets: exportDynamicSecrets,
        rotatedSecrets: exportRotatedSecrets,
        sshCertificate: exportSshCertificateSecrets,
        pkiCertificate: exportPkiCertificateSecrets,
    };

    for (const [key, handler] of Object.entries(secretHandlers)) {
        const secrets = args[key];
        if (secrets) {
            core.debug(`${key}: Fetching!`);
            try {
                await handler(akeylessToken, secrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, generateSeparateOutput);
            } catch (error) {
                core.error(`Failed to fetch ${key}: ${typeof error === 'object' ? JSON.stringify(error) : error}`);
                core.setFailed(`Failed to fetch ${key}: ${typeof error === 'object' ? JSON.stringify(error) : error}`);
            }
        } else {
            core.debug(`${key}: Skipping step because no ${key} were specified`);
        }
    }
}

async function exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
    const api = akeylessApi.api(apiUrl);

    for (const [akeylessSecretPath, variableName] of Object.entries(staticSecrets)) {
        const param = akeyless.GetSecretValue.constructFromObject({
            token: akeylessToken,
            names: [akeylessSecretPath]
        });

        const staticSecret = await api.getSecretValue(param).catch(error => {
            core.error(`getSecretValue Failed: ${JSON.stringify(error)}`);
            core.setFailed(`getSecretValue Failed: ${JSON.stringify(error)}`);
        });

        if (staticSecret === undefined) {
            return;
        }

        setOutput(variableName, staticSecret[akeylessSecretPath], exportSecretsToOutputs, exportSecretsToEnvironment)
    }
}

async function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, generateSeparateOutputs) {
    const api = akeylessApi.api(apiUrl);
    try {
        for (const [akeylessSecretPath, variableName] of Object.entries(dynamicSecrets)) {

            const param = akeyless.GetDynamicSecretValue.constructFromObject({
                token: akeylessToken,
                name: akeylessSecretPath
            });

            const dynamicSecret = await api.getDynamicSecretValue(param);

            if (!dynamicSecret) {
                return;
            }

            handleOutput(dynamicSecret, variableName, generateSeparateOutputs, exportSecretsToOutputs, exportSecretsToEnvironment)
        }
    } catch (error) {
        const errorMessage = `Failed to export dynamic secrets: ${typeof error === 'object' ? JSON.stringify(error) : error}`;
        core.error(errorMessage);
        core.setFailed(errorMessage);
    }
}
async function exportRotatedSecrets(akeylessToken, rotatedSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, generateSeparateOutputs) {
    const api = akeylessApi.api(apiUrl);

    for (const [akeylessSecretPath, variableName] of Object.entries(rotatedSecrets)) {

        const param = akeyless.GetRotatedSecretValue.constructFromObject({
            token: akeylessToken,
            names: [akeylessSecretPath]
        });

        let rotatedSecret = await api.getRotatedSecretValue(param).catch(error => {
            core.error(`getRotatedSecret Failed: ${JSON.stringify(error)}`);
            core.setFailed(`getRotatedSecret Failed: ${JSON.stringify(error)}`);
        });

        if (!rotatedSecret) {
            return
        }
        handleOutput(rotatedSecret.value, variableName, generateSeparateOutputs, exportSecretsToOutputs, exportSecretsToEnvironment)
    }
}

async function exportSshCertificateSecrets(akeylessToken, sshCertificate, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
    const api = akeylessApi.api(apiUrl);
    for (const sshParams of sshCertificate) {
        const param = akeyless.GetSSHCertificate.constructFromObject({
            token: akeylessToken,
            'cert-issuer-name': sshParams['cert-issuer-name'],
            'cert-username': sshParams['cert-username'],
            'public-key-data': sshParams['public-key-data'],
        })
        const sshCertValue = await api.getSSHCertificate(param)

        setOutput(sshParams['output-name'], sshCertValue, exportSecretsToOutputs, exportSecretsToEnvironment)
    }
}

async function exportPkiCertificateSecrets(akeylessToken, pkiCertificate, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
    const api = akeylessApi.api(apiUrl);
    for (const pkiParams of pkiCertificate) {
        const param = akeyless.GetPKICertificate.constructFromObject({
            token: akeylessToken,
            'cert-issuer-name': pkiParams['cert-issuer-name'],
            'csr-data-base64': pkiParams['csr-data-base64'],
        })
        const pkiCertValue = await api.getPKICertificate(param)

        setOutput(pkiParams['output-name'], pkiCertValue, exportSecretsToOutputs, exportSecretsToOutputs)
    }
}

function handleOutput(secret, variableName, generateSeparateOutputs, exportSecretsToOutputs, exportSecretsToEnvironment) {
    // toggled by parse-dynamic-secrets
    if (generateSeparateOutputs === false) {
        // **** Option 1 (DEFAULT BEHAVIOR) ***** //
        // Exports the entire secret value as one object
        setOutput(variableName, secret, exportSecretsToOutputs, exportSecretsToEnvironment)
    } else {
        // **** Option 2 (parse-secrets =true) ***** //
        // Generate separate output/env vars for each value in the dynamic secret

        for (const key in secret) {
            // if the user set an output variable name, use it to prefix the output/env var's name
            let finalVarName = variableName;
            if (variableName === null || variableName.trim() === '') {
                finalVarName = `${key}`;
            } else {
                finalVarName = `${variableName}_${key}`;
            }
            setOutput(finalVarName, secret[key], exportSecretsToOutputs, exportSecretsToEnvironment)
        }
    }
}

function setOutput(variableName, secretValue, exportSecretsToOutputs, exportSecretsToEnvironment) {
    // obscure value in visible output and logs
    core.setSecret(secretValue)
    // Switch 1 - set outputs
    if (exportSecretsToOutputs) {
        core.setOutput(variableName, secretValue);
    }

    // Switch 2 - export env variables
    if (exportSecretsToEnvironment) {
        core.exportVariable(variableName, secretValue);
    }
}

exports.handleExportSecrets = handleExportSecrets
