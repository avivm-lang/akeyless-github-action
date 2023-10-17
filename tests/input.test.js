const {stringInputs, boolInputs, dictInputs, arrJsonInput} = require("../src/input");
jest.mock('@actions/core');

core = require('@actions/core');
input = require('../src/input');

const stringFailCases = Object.values(stringInputs)

const boolFailCases = Object.values(boolInputs)

const secretsFailCases = Object.values(dictInputs)

const certificatesFailCases = Object.values(arrJsonInput)

let inputToOutputMap

describe('testing input', () => {
    beforeEach(() => {
        inputToOutputMap = {
            'access-id': 'p-12345',
            'access-type': 'gcp',
            'api-url': 'https://api.akeyless.io',
            'static-secrets': '{"/some/static/secret":"my_first_secret"}',
            'dynamic-secrets': '{"/some/dynamic/secret":"my_first_secret"}',
            'rotated-secrets': '{"/some/rotated/secret":"my_first_secret"}',
            'ssh-certificates': '[{ "cert-issuer-name": "sshCert", "cert-username": "ubuntu", "public-key-data": "ssh-rsa AAAAB", "output-name": "my_first_secret"}]',
            'pki-certificates': '[{ "cert-issuer-name": "pkiCert", "csr-data-base64": "LS0tL", "output-name": "my_first_secret"}]',
            'export-secrets-to-outputs': true,
            'export-secrets-to-environment': true,
            'generate-separate-output': false,
        };
    })
  it('Input is all good', () => {
    const expectedOutput = {
      'accessId': 'p-12345',
      'accessType': 'gcp',
      'apiUrl': 'https://api.akeyless.io',
      'staticSecrets': JSON.parse(inputToOutputMap['static-secrets']),
      'dynamicSecrets': JSON.parse(inputToOutputMap['dynamic-secrets']),
      'rotatedSecrets': JSON.parse(inputToOutputMap['rotated-secrets']),
      'sshCertificate': JSON.parse(inputToOutputMap['ssh-certificates']),
      'pkiCertificate': JSON.parse(inputToOutputMap['pki-certificates']),
      'exportSecretsToOutputs': true,
      'exportSecretsToEnvironment': true,
      'generateSeparateOutput': false,
    };
    core.getInput = jest.fn((inputName) => {
      return inputToOutputMap[inputName]
    });
    core.getBooleanInput = jest.fn((inputName) => {
      return inputToOutputMap[inputName]
    });

    params = input.fetchAndValidateInput();

    expect(params).toEqual(expectedOutput)
  });

  it.each(stringFailCases)(
      "given %p as int argument and should fail",
      (keyToFail) => {
        inputToOutputMap[keyToFail] = 123
        core.getInput = jest.fn((inputName) => {
          return inputToOutputMap[inputName]
        })
        expect(() => {
          input.fetchAndValidateInput();
        }).toThrow(`Input ${keyToFail} should be a string`);
      }
  )

  it.each(boolFailCases)(
      "given %p as string argument and should fail",
      (keyToFail) => {
        inputToOutputMap[keyToFail] = "str"
        core.getInput = jest.fn((inputName) => {
          return inputToOutputMap[inputName]
        });
        core.getBooleanInput = jest.fn((inputName) => {
          return inputToOutputMap[inputName]
        });
        expect(() => {
          input.fetchAndValidateInput();
        }).toThrow(`Input ${keyToFail} should be a bool`);
      }
  )

  it.each(secretsFailCases)(
      "given %p as int argument and should fail",
      (keyToFail) => {
        inputToOutputMap[keyToFail] = 123
        core.getInput = jest.fn((inputName) => {
          return inputToOutputMap[inputName]
        });
        core.getBooleanInput = jest.fn((inputName) => {
          return inputToOutputMap[inputName]
        });
        expect(() => {
          input.fetchAndValidateInput();
        }).toThrow(`Input ${keyToFail} should be a serialized JSON dictionary with the secret path as a key and the output name as the value`);
      }
  )

    it.each(secretsFailCases)(
        "given %p as invalid json argument and should fail",
        (keyToFail) => {
            inputToOutputMap[keyToFail] = '"This is a string"'
            core.getInput = jest.fn((inputName) => {
                return inputToOutputMap[inputName]
            });
            core.getBooleanInput = jest.fn((inputName) => {
                return inputToOutputMap[inputName]
            });
            expect(() => {
                input.fetchAndValidateInput();
            }).toThrow(`Input ${keyToFail} did not contain a valid JSON dictionary`);
        }
    )

  it.each(certificatesFailCases)(
      "given %p as int argument and should fail",
      (keyToFail) => {
        inputToOutputMap[keyToFail] = 123
        core.getInput = jest.fn((inputName) => {
          return inputToOutputMap[inputName]
        });
        core.getBooleanInput = jest.fn((inputName) => {
          return inputToOutputMap[inputName]
        });
        expect(() => {
          input.fetchAndValidateInput();
        }).toThrow(`Input ${keyToFail} should be a serialized JSON with array of certificates params`);
      }
  )

    it.each(certificatesFailCases)(
        "given %p not as invalid json argument and should fail",
        (keyToFail) => {
            inputToOutputMap[keyToFail] = '["This is a string"]'
            core.getInput = jest.fn((inputName) => {
                return inputToOutputMap[inputName]
            });
            core.getBooleanInput = jest.fn((inputName) => {
                return inputToOutputMap[inputName]
            });
            expect(() => {
                input.fetchAndValidateInput();
            }).toThrow(`Input ${keyToFail} did not contain a valid JSON with array of objects`);
        }
    )
})
