const core = require('@actions/core');
const { akeylessLogin } = require('./auth')
const input = require('./input');
const { handleExportSecrets } = require('./secrets');

async function run() {
    core.debug(`Getting Input for Akeyless github action`);

    const {accessId,
        accessType,
        apiUrl,
        staticSecrets,
        dynamicSecrets,
        rotatedSecrets,
        sshCertificate,
        pkiCertificate,
        exportSecretsToOutputs,
        exportSecretsToEnvironment,
        generateSeparateOutput} =
        input.fetchAndValidateInput();

    core.debug(`access id: ${accessId}`);
    core.debug(`Fetch akeyless token with access type ${accessType}`);

    let akeylessToken;
    try {
        let akeylessLoginResponse = await akeylessLogin(accessId, accessType, apiUrl);
        akeylessToken = akeylessLoginResponse['token'];
    } catch (error) {
        core.error(`Failed to login to Akeyless: ${error}`);
        core.setFailed(`Failed to login to Akeyless: ${error}`);
        return;
    }

    core.debug(`Akeyless token length: ${akeylessToken.length}`);

    const args = {
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
    }
    await handleExportSecrets(args)

    core.debug(`done exporting secrets`);
}

if (require.main === module) {
    try {
        core.debug('Starting main run');
        run();
    } catch (error) {
        core.debug(error.stack);
        core.setFailed(error.message);
        core.debug(error.message);
    }
}
