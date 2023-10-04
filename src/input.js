const core = require('@actions/core');
const auth = require('./auth');

const stringInputs = {
    accessId: 'access-id',
    accessType: 'access-type',
    apiUrl: 'api-url'
};

const boolInputs = {
    exportSecretsToOutputs: 'export-secrets-to-outputs',
    exportSecretsToEnvironment: 'export-secrets-to-environment',
    generateSeparateOutput: 'generate-separate-output'
};

const dictInputs = {
    staticSecrets: 'static-secrets',
    dynamicSecrets: 'dynamic-secrets',
    rotatedSecrets: 'rotated-secrets',
};

const arrJsonInput = {
    sshCertificate: 'ssh-certificate-secrets',
    pkiCertificate: 'pki-certificate-secrets',
}

const certificateRequiredFields = {
    'ssh-certificate-secrets': ["cert-issuer-name", "cert-username", "public-key-data"],
    'pki-certificate-secrets': ["cert-issuer-name", "csr-data-base64"]
}

const fetchAndValidateInput = () => {
    const params = {
        accessId: core.getInput('access-id', {required: true}).trim(),
        accessType: core.getInput('access-type'),
        apiUrl: core.getInput('api-url'),
        staticSecrets: core.getInput('static-secrets'),
        dynamicSecrets: core.getInput('dynamic-secrets'),
        rotatedSecrets: core.getInput('rotated-secrets'),
        sshCertificate: core.getInput('ssh-certificates'),
        pkiCertificate: core.getInput('pki-certificates'),
        exportSecretsToOutputs: core.getBooleanInput('export-secrets-to-outputs', {default: true}),
        exportSecretsToEnvironment: core.getBooleanInput('export-secrets-to-environment', {default: true}),
        generateSeparateOutput: core.getBooleanInput('generate-separate-output', {default: false})
    };
    // our only required parameter
    if (!params['accessId']) {
        throw new Error('You must provide the access id for your auth method via the access-id input');
    }

    validateStringTypes(params)

    validateBoolTypes(params)

    validateDictionaryTyps(params)

    validateJsonArrayTypes(params)

    // check access types
    if (!auth.allowedAccessTypes.includes(params['accessType'].toLowerCase())) {
        throw new Error(`access-type must be one of: ['${auth.allowedAccessTypes.join("', '")}']`);
    }
    params['accessType'] = params['accessType'].toLowerCase();

    return params;
};

function validateJsonArrayTypes(params) {
    // check for array json types (certificates)
    for (const [paramKey, inputId] of Object.entries(arrJsonInput)) {
        if (typeof params[paramKey] !== 'string') {
            throw new Error(`Input ${inputId} should be a serialized JSON with array of certificates params`);
        }
        if (!params[paramKey]) {
            continue;
        }
        try {
            let parsed = JSON.parse(params[paramKey]);
            validateCertificateInputJson(parsed, inputId)
            params[paramKey] = parsed
        } catch (e) {
            if (e instanceof SyntaxError) {
                throw new Error(`Input ${inputId} did not contain valid JSON`);
            } else {
                throw e;
            }
        }
    }
}

function validateDictionaryTyps(params) {
    // check for dict types
    for (const [paramKey, inputId] of Object.entries(dictInputs)) {
        if (typeof params[paramKey] !== 'string') {
            throw new Error(`Input ${inputId} should be a serialized JSON dictionary with the secret path as a key and the output name as the value`);
        }
        if (!params[paramKey]) {
            continue;
        }
        try {
            let parsed = JSON.parse(params[paramKey]);
            if (parsed.constructor !== Object) {
                throw new Error(`Input ${inputId} did not contain a valid JSON dictionary`);
            }
            params[paramKey] = parsed;
        } catch (e) {
            if (e instanceof SyntaxError) {
                throw new Error(`Input ${inputId} did not contain valid JSON`);
            } else {
                throw e;
            }
        }
    }
}

function validateStringTypes(params) {
    // check for string types
    for (const [paramKey, inputId] of Object.entries(stringInputs)) {
        if (typeof params[paramKey] !== 'string') {
            throw new Error(`Input ${inputId} should be a string`);
        }
    }
}

function validateBoolTypes(params) {
// check for bool types
    for (const [paramKey, inputId] of Object.entries(boolInputs)) {
        if (typeof params[paramKey] !== 'boolean') {
            throw new Error(`Input ${inputId} should be a boolean`);
        }
    }
}

function validateCertificateInputJson(params, certificateType) {
    // Ensure that input is an array
    if (!Array.isArray(params)) {
        throw new Error(`Input ${certificateType} must be an array of certificate objects.`);
    }
    // Ensure each param is object
    for (const paramKey in params) {
        if (params[paramKey].constructor !== Object) {
            throw new Error(`Input ${certificateType} did not contain a valid JSON with array of objects`);
        }
        validateCertificateRequiredFields(params[paramKey], certificateRequiredFields[certificateType])
    }
}

function validateCertificateRequiredFields(params, requiredFields) {
    // Loop through each certificate object in the array
    for (const field of requiredFields) {
        if (!(field in params)) {
            throw new Error(`Input ${certificateType} did not contain a valid JSON with array of objects with the required field ${field}`);
        }
    }
}


module.exports = {
    fetchAndValidateInput,
    dictInputs,
    arrJsonInput,
    stringInputs,
    boolInputs
}
