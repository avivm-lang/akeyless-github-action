# Akeyless Authentication and Secrets Fetch GitHub Action

Logs in to Akeyless and fetch secrets.

## Table of Contents
- [introduction](#introduction)
  - [Before Adding Akeyless GitHub Action](#before_adding_akeyless_github_action) 
    - [Inputs](#inputs)
    - [Outputs](#outputs)
        - [Default Outputs](#default-outputs)
        - [Parsed Outputs](#parsed-outputs)
    - [Debugging](#debugging)
    - [Job Permissions Requirement](#job-permissions-requirement)
    - [Examples](#examples)
        - [Live Demos](#live-demos)
        - [Static Secrets Demo](#static-secrets-demo)
        - [Dynamic Secrets Demos](#dynamic-secrets-demos)
            - [Default Output](#default-output)
            - [Parsed Output](#parsed-output)
                - [Using a Prefix](#using-a-prefix)
        - [Rotated Secrets Demo](#rotated-secrets-demo)
        - [SSH Certificates Demo](#ssh-certificates-demo)
        - [PKI Certificates Demo](#pki-certificates-demo)
    - [AKeyless Setup](#akeyless-setup)
        - [Authentication Methods](#authentication-methods)
          - [JWT Auth Method](#jwt_auth_method)
          - [AWS IAM Auth Method](#aws_iam_auth_method)
          - [AZURE AD Auth Method](#azure_ad_auth_method)
          - [GCP Auth Method](#gcp_auth_method)
          - [K8S Auth Method](#K8S_auth_method)
          - [Universal Identity Auth Method](#universal_identity_auth_method)
          - [Access Key Auth Method](#access_key_auth_method)
        - [TLS Certificate](#tls_certificate)
        - [Setting up JWT Auth](#setting-up-jwt-auth)
    - [Feature Requests \& Issues](#feature-requests--issues)

## introduction

Akeyless Authentication and Secrets Fetch GitHub Action is a versatile tool that simplifies the process of authenticating 
and securely fetching secrets from your Akeyless vault for your workflows.

## Before Adding Akeyless GitHub Action

> ⚠️ **Important**: Setting `ACTIONS_RUNNER_DEBUG` to `true` can expose sensitive information in your error logs. Use with caution.

### Inputs

| Name | Required | Type      | Value                                                                                                                                                                                                                               |
|------|----------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **access-id** | Yes | `string`  | The access id for your auth method.                                                                                                                                                                                                 |
| **access-type**  | No | `string`  | Default: `jwt`. The login method to use, must be `jwt`/`access_key`/`universal_identity`/`aws_iam`/`azure_ad`/`gcp`/`k8s`, .                                                                                                        |
| **api-url** | No | `string`  | Default: `https://api.akeyless.io`. The API endpoint to use.                                                                                                                                                                        |
| **static-secrets** | No | `string`  | A JSON object as a string, with a list of static secrets to fetch/export.  The key should be the path to the secret and the value should be the name of the environment variable/output to save it to.                              |
| **dynamic-secrets** | No | `string`  | A JSON object as a string, with a list of dynamic secrets to fetch/export.  The key should be the path to the secret and the value should be the name of the environment variable/output to save it to.                             |
| **rotated-secrets** | No | `string`  | A JSON object as a string, with a list of rotated secrets to fetch/export.  The key should be the path to the secret and the value should be the name of the environment variable/output to save it to.                             |
| **ssh-certificates** | No | `string`  | A JSON object as a string, with a list of ssh certificates params object. certificate issuer name and certificate username and public key data and output name should be the name of the environment variable/output to save it to. |
| **pki-certificates** | No | `string`  | A JSON object as a string, with a list of pki certificates params object. certificate issuer name and csr data and output name should be the name of the environment variable/output to save it to.                                 |
| **export-secrets-to-outputs** | No | `boolean` | Default: `true`. True/False to denote if secrets should be exported as environment variables.                                                                                                                                       |
| **export-secrets-to-environment** | No | `boolean` | Default: `true`. True/False to denote if secrets should be exported as action outputs.                                                                                                                                              |
| **generate-separate-output** | No | `boolean` | Default: `false`. True/False to denote if dynamic/rotated secrets will be broken up into individual outputs/env vars, see the [parsed dynamic or rotated secrets demos](#parsed-dynamic-rotated-secrets).                           |
| **access-key** | No | `string`  | Access key (relevant only for access-type=access_key).                                                                                                                                                                              |
| **gcp-audience** | No | `string`  | GCP audience to use in signed JWT (relevant only for access-type=gcp).                                                                                                                                                              |
| **gateway-url** | No | `string`  | Gateway URL for the K8S authenticated (relevant only for access-type=k8s/oauth2).                                                                                                                                                   |
| **k8s-auth-config-name** | No | `string`  | The K8S Auth config name (relevant only for access-type=k8s).                                                                                                                                                                       |
| **k8s-service-account-token** | No | `string`  | The K8S service account token (relevant only for access-type=k8s).                                                                                                                                                                                                     |
| **uid_token** | No | `string`  | The universal_identity token (relevant only for access-type=universal_identity).                                                                                                                                                    |

### Outputs

The job outputs are determined by the values set in your `static-secrets`/`dynamic-secrets`/`rotated-secrets`/`ssh-certificates`/`pki-certificates` inputs, as well as whether or not the `export-secrets-to-outputs` is set to true (which it is by default).

##### Default Outputs

The default behavior will create a single output/env variable that uses the name you set for the output.

| Name | Value |
|------|-------|
| outputs | use `${{ steps.JOB_NAME.outputs.SECRET_NAME }}` |
| environment variables | use `${{ env.SECRET_NAME }}` |

##### Parsed Outputs (relevant only for dynamic and rotated secrets)

If you enabled `generate-separate-output: true`, you'll get each of the values in their own output/env variable automatically. For example, if your dynamic secret is `{ "id": "", "username": "", "password": "" }`
the outputs will be:

| Name | Value |
|------|-------|
| job outputs | `${{ steps.job-name.outputs.id }}` |
|  | `${{ steps.job-name.outputs.username }}` |
|  | `${{ steps.job-name.outputs.password }}` |
| environment variables | `${{ env.id }}` |
|  | `${{ env.username }}` |
|  | `${{ env.password }}` |

See the [parsed dynamic or rotated secrets](#parsed-dynamic-rotated-secrets) example for a better explanation.

### Debugging
there is an option to get more informative logs from the Akeyless Github Action by setting the secret or variable in the repository that contains the workflow: ACTIONS_RUNNER_DEBUG to true.  
> ⚠️ **Important**: Setting `ACTIONS_RUNNER_DEBUG` to `true` can expose sensitive information in your error logs. Use with caution.


### Job Permissions Requirement

The default usage relies on using the GitHub JWT to login to AKeyless.  To make this available, you have to configure it in your job workflow:

```
jobs:
  my_job:
    #---------Required---------#
    permissions: 
      id-token: write
      contents: read
    #--------------------------#
```
> If this is not present, the akeyless-action step will fail with the following error `Failed to login to AKeyless: Error: Failed to fetch Github JWT: Error message: Unable to get ACTIONS\_ID\_TOKEN\_REQUEST\_URL env variable`

### Outputs

The job outputs are determined by the values set in your `static-secrets`/`dynamic-secrets`/`rotated-secrets`/`ssh-certificates`/`pki-certificates` inputs, as well as whether or not the `export-secrets-to-outputs` is set to true (which it is by default).


##### Default Outputs

The default behavior will create a single output/env variable that uses the name you set for the output.

| Name | Value |
|------|-------|
| outputs | use `${{ steps.JOB_NAME.outputs.SECRET_NAME }}` |
| environment variables | use `${{ env.SECRET_NAME }}` |

##### Parsed Outputs

If you enabled `generate-separate-output: true`, you'll get each of the values in their own output/env variable automatically. For example, if your dynamic secret is `{ "id": "", "username": "", "password": "" }`
the outputs will be:

| Name | Value |
|------|-------|
| job outputs | `${{ steps.job-name.outputs.id }}` |
|  | `${{ steps.job-name.outputs.username }}` |
|  | `${{ steps.job-name.outputs.password }}` |
| environment variables | `${{ env.id }}` |
|  | `${{ env.username }}` |
|  | `${{ env.password }}` |

See the [parsed dynamic or rotated secrets](#parsed-dynamic-rotated-secrets) example for a better explanation.


## Examples

### Live Demos

Although this repository's workflows use placeholder values, it is still a real AKeyless account and real providers. The approaches demonstrated are still valid as-is for real implementations. Use these to your advantage!

- **Static Secrets**
    - [Static secret (standard)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L8-L31)
- **Dynamic Secrets (AWS provider)**
    - [AWS dynamic secrets (default)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L33-L88)
    - [AWS dynamic secrets (auto-parsed)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L90-L128)
    - [AWS dynamic secrets (auto-parsed w/prefix)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L130-L168)
- **Dynamic Secrets (Database provider)**
    - [SQL dynamic secrets (default)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L170-L222)
    - [SQL dynamic secrets (auto-parsed)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L224-L262)
    - [SQL dynamic secrets (auto-parsed w/prefix)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L264-L296)

### Static Secrets Demo

Static secrets are the easiest to use. Just define the secret's path and the secret's output.

```yaml
jobs:
  fetch_secrets:
    runs-on: ubuntu-latest
    permissions:  # IMPORTANT - both of these are required
      id-token: write
      contents: read
    name: Fetch some static secrets
    steps:
    - name: Fetch secrets from AKeyless
      id: fetch-secrets
      uses: akeyless-github-action
      with:
        access-type: jwt
        access-id: auth-method-access-id     # (ex: 'p-iwt13fd19ajd') We recommend storing this as a GitHub Actions secret
        static-secrets: '{"/path/to/static/secret":"my_first_secret","/path/to/another/secret":"my_second_secret"}'
        
    - name: Use Outputs
      run: |
        echo "Step Outputs"
        echo "my_first_secret: ${{ steps.fetch-secrets.outputs.my_first_secret }}"
        echo "my_second_secret: ${{ steps.fetch-secrets.outputs.my_second_secret }}"
        echo "my_dynamic_secret: ${{ steps.fetch-secrets.outputs.my_dynamic_secret }}"
        
        echo "Environment Variables"
        echo "my_first_secret: ${{ env.my_first_secret }}"
        echo "my_second_secret: ${{ env.my_second_secret }}"
        echo "my_dynamic_secret: ${{ env.my_dynamic_secret }}"
```

### Dynamic Secrets Demos

The key difference with dynamic secrets is the output value is typically a JSON object. there are two ways you can handle this; *default* output or *parsed* outputs

#### Default Output

If you want those secrets as separate environment variables, there's one extra step to take. See the `KEY TAKEAWAY` section in the following example.

```yaml
  fetch_aws_dynamic_secrets:
    runs-on: ubuntu-latest
    name: Fetch AWS dynamic secrets
    
    permissions:
      id-token: write
      contents: read
      
    steps:
    - name: Fetch dynamic secrets from AKeyless
      id: fetch-dynamic-secrets
      uses: akeyless-github-action
      with:
        access-id: ${{ secrets.AKEYLESS_ACCESS_ID }} # Looks like p-fq3afjjxv839
        dynamic-secrets: '{"/path/to/dynamic/aws/secret":"aws_dynamic_secrets"}'
        access-type: jwt
        
# ********* KEY TAKEAWAY  ********* #
# STEP 1 - EXPORT DYNAMIC SECRET's KEYS TO ENV VARS
    - name: Export Secrets to Environment
      run: |
        echo '${{ steps.fetch-dynamic-secrets.outputs.aws_dynamic_secrets }}' | jq -r 'to_entries|map("AWS_\(.key|ascii_upcase)=\(.value|tostring)")|.[]' >> $GITHUB_ENV

# STEP 2 - You can now access each secret separately as environment variables
    - name: Verify Vars
      run: |
        echo "access_key_id: ${{ env.AWS_ACCESS_KEY_ID }}"
        echo "id: ${{ env.AWS_ID }}"
        echo "secret_access_key: ${{ env.AWS_SECRET_ACCESS_KEY }}"
        echo "security_token: ${{ env.AWS_SECURITY_TOKEN }}"
        echo "ttl_in_minutes: ${{ env.AWS_TTL_IN_MINUTES }}"
        echo "type: ${{ env.AWS_TYPE }}"
        echo "user: ${{ env.AWS_USER }}"
```

#### Parsed Output

If you set `generate-separate-output: true`, the job will automatically create a separate output for every key in the dynamic secret. This is extremely useful if you do not want to manually parse it, or if you need to immediately use an output's value in a subsequent step.

For example, a SQL server dynamic secret will provide **id**, **user**, **ttl_in_minutes** and **password** values.

```yaml
- name: Fetch dynamic secrets from AKeyless (NO PREFIX)
  id: get-secrets
  uses: akeyless-action
  with:
    access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
    access-type: jwt
    dynamic-secrets: '{"/DevTools/my-sqlsrv-secret":""}' # no prefix, use an empty string for output var
    generate-separate-output: true
```

Then the outputs/vars will be directly generated for each key: `id`, `user`, `ttl_in_minutes`, and `password` values.

Step Outputs:
```bash
echo ${{ steps.get-secrets.outputs.id }}
echo ${{ steps.get-secrets.outputs.user }}
echo ${{ steps.get-secrets.outputs.ttl_in_minutes }}
echo ${{ steps.get-secrets.outputs.password }}
```

Environment Variables:

```bash
echo ${{ env.id }}
echo ${{ env.user }}
echo ${{ env.ttl_in_minutes }}
echo ${{ env.password }}
```
##### Using a Prefix

Sometimes you might want to prefix the variable name. This is easily done by setting an output name, that value will be used to prefix all the output keys.

For example, using "SQL" for the output path:

```yaml
- name: Fetch dynamic secrets from AKeyless ('SQL' prefix)
  uses: akeyless-github-action
  id: job-name
  with:
    access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
    dynamic-secrets: '{"/DevTools/my-sqlsrv-secret":"SQL"}' # uses 'SQL' for prefix
    generate-separate-output: true
```
The action will prefix `SQL_` prefix to all the automatically parsed outputs:

```bash
# notice the extra "SQL_" prefix
echo ${{ env.SQL_user }}
echo ${{ steps.job-name.outputs.SQL_user }}
```

### Rotated Secrets Demos

The key difference with Rotated secrets is the output value is typically a JSON object. there are two ways you can handle this; *default* output or *parsed* outputs

#### Default Output

If you want those secrets as separate environment variables, there's one extra step to take. See the `KEY TAKEAWAY` section in the following example.

```yaml
  fetch_aws_rotated_secrets:
    runs-on: ubuntu-latest
    name: Fetch AWS rotated secrets
    
    permissions:
      id-token: write
      contents: read
      
    steps:
    - name: Fetch rotated secrets from AKeyless
      id: fetch-rotated-secrets
      uses: akeyless-github-action
      with:
        access-id: ${{ secrets.AKEYLESS_ACCESS_ID }} # Looks like p-fq3afjjxv839
        dynamic-secrets: '{"/path/to/rotated/aws/secret":"aws_rotated_secrets"}'
        access-type: jwt
        
# ********* KEY TAKEAWAY  ********* #
# STEP 1 - EXPORT ROTATED SECRET's KEYS TO ENV VARS
    - name: Export Secrets to Environment
      run: |
        echo '${{ steps.fetch-rotated-secrets.outputs.aws_rotated_secrets }}' | jq -r 'to_entries|map("AWS_\(.key|ascii_upcase)=\(.value|tostring)")|.[]' >> $GITHUB_ENV

# STEP 2 - You can now access each secret separately as environment variables
    - name: Verify Vars
      run: |
        echo "access_key_id: ${{ env.AWS_ACCESS_KEY_ID }}"
        echo "id: ${{ env.AWS_ID }}"
        echo "secret_access_key: ${{ env.AWS_SECRET_ACCESS_KEY }}"
        echo "security_token: ${{ env.AWS_SECURITY_TOKEN }}"
        echo "ttl_in_minutes: ${{ env.AWS_TTL_IN_MINUTES }}"
        echo "type: ${{ env.AWS_TYPE }}"
        echo "user: ${{ env.AWS_USER }}"
```

#### Parsed Output

If you set `generate-separate-output: true`, the job will automatically create a separate output for every key in the dynamic/rotated secret. This is extremely useful if you do not want to manually parse it, or if you need to immediately use an output's value in a subsequent step.

For example, a SQL server dynamic secret will provide **id**, **user**, **ttl_in_minutes** and **password** values.

```yaml
- name: Fetch dynamic secrets from AKeyless (NO PREFIX)
  id: get-secrets
  uses: akeyless-action
  with:
    access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
    dynamic-secrets: '{"/DevTools/my-sqlsrv-secret":""}' # no prefix, use an empty string for output var
    generate-separate-output: true
```

Then the outputs/vars will be directly generated for each key: `id`, `user`, `ttl_in_minutes`, and `password` values.

Step Outputs:
```bash
echo ${{ steps.get-secrets.outputs.id }}
echo ${{ steps.get-secrets.outputs.user }}
echo ${{ steps.get-secrets.outputs.ttl_in_minutes }}
echo ${{ steps.get-secrets.outputs.password }}
```

Environment Variables:

```bash
echo ${{ env.id }}
echo ${{ env.user }}
echo ${{ env.ttl_in_minutes }}
echo ${{ env.password }}
```


### ssh certificates Demos
```yaml
  fetch_aws_dynamic_secrets:
    runs-on: ubuntu-latest
    name: Fetch ssh certificate

    permissions:
      id-token: write
      contents: read

    steps:
      - name: Fetch rotated secrets from AKeyless
        id: fetch-ssh-certificate
        uses: akeyless-github-action
        with:
          access-type: jwt
          ssh-certificate-secrets: |
              [
                  {
                    "cert-issuer-name": "ssh_certificate",
                    "cert-username": "ubuntu",
                    "public-key-data": "public_key_data",
                    "output-name": "my_first_secret"
                  }
              ]
```

### pki certificates Demos

```yaml
  fetch_aws_dynamic_secrets:
    runs-on: ubuntu-latest
    name: Fetch pki certificate

    permissions:
      id-token: write
      contents: read

    steps:
      - name: Fetch pki certificates from AKeyless
        id: fetch-pki-certificates
        uses: akeyless-github-action
        with:
          access-type: jwt
          pki-certificate-secrets: |
            [
                {
                  "cert-issuer-name": "pki_certificate",
                  "csr-data-base64": "csr_data_base64",
                  "output-name": "my_first_secret"
                }
            ]
```

## AKeyless Setup

### Authentication Methods

This action supports the following authentication methods (pay attention, for some authentication method there are extra input needed beside the access type):

### JWT Auth Method
```yaml
        with:
          access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
          access-type: jwt
          static-secrets: '{"/akeyless-github-action/github-static-secret":"my_first_secret"}' 
```
### AWS IAM Auth Method
```yaml
        with:
          access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
          access-type: aws_iam
          static-secrets: '{"/akeyless-github-action/github-static-secret":"my_first_secret"}' 
```

### AZURE AD Auth Method
```yaml
        with:
          access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
          access-type: azure_ad
          static-secrets: '{"/akeyless-github-action/github-static-secret":"my_first_secret"}' 
```

### GCP Auth Method
```yaml
        with:
          access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
          access-type: gcp
          gcp-audience: "gcp-audience"
          static-secrets: '{"/akeyless-github-action/github-static-secret":"my_first_secret"}' 
```

### K8S Auth Method
```yaml
        with:
          access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
          access-type: k8s
          k8s-auth-config-name: "k8s-auth-config-name"
          k8s-service-account-token: "k8s-service-account-token"
          uid_token: "k8s-service-account-token"
          static-secrets: '{"/akeyless-github-action/github-static-secret":"my_first_secret"}' 
```

### Universal Identity Auth Method
```yaml
        with:
          access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
          access-type: universal_identity
          uid_token: "uid_token"
          static-secrets: '{"/akeyless-github-action/github-static-secret":"my_first_secret"}' 
```

### Access Key Auth Method
```yaml
        with:
          access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
          access-key: ${{ secrets.AKEYLESS_ACCESS_KEY }}
          access-type: access_key
          static-secrets: '{"/akeyless-github-action/github-static-secret":"my_first_secret"}' 
```

### TLS Certificate
When configured TLS on Akeyless Gateway you need to pass also the CA certificate (the CA certificate should be in PEM format):
```yaml
        with:
          access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
          access-type: universal_identity
          uid_token: "uid_token"
          ca-certificate: ${{ secrets.AKEYLESS_CA_CERTIFICATE }}
          static-secrets: '{"/akeyless-github-action/github-static-secret":"my_first_secret"}' 
```

### Setting up JWT Auth

To configure AKeyless and grant your repositories the necessary permissions to execute this action:

1. Create a GitHub JWT Auth method in AKeyless if you don't have one (you can safely share the auth method between repositories)
    1. In AKeyless go to "Auth Methods" -> "+ New" -> "OAuth 2.0/JWT".
    2. Specify a name (e.g. "GitHub JWT Auth") and location of your choice.
    3. For the JWKS Url, specify `https://token.actions.githubusercontent.com/.well-known/jwks`
    4. For the unique identifier use `repository`. See note (1) below for more details.
    5. You **MUST** click "Require Sub Claim on role association".  This will prevent you from attaching this to a role without any additional checks. If you accidentally forgot to set subclaim checks, then any GitHub runner owned by *anyone* would be able to authenticate to AKeyless and access your resources... **that make this a critical checkbox**.  See the [GitHub docs](https://docs.GitHub.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud) for more details.
2. Create an appropriate access role (if you don't already have one)
    1. In AKeyless go to "Access Roles" -> "+ New"
    2. Give it a name and location, and create it.
    3. Find your new access role and click on it to edit it.
    4. On the right side, under "Secrets & Keys", click the "Add" button to configure read access to any static or dynamic secrets you will fetch from your pipeline.
3. Attach your GitHub JWT Auth method to your role
    1. Once again, find the access role you created in step #2 above and click on it to edit it.
    2. Hit the "+ Associate" button to associate your "GitHub JWT Auth" method with the role.
    3. In the list, find the auth method you created in Step #1 above.
    4. Add an appropriate sub claim, based on [the claims available in the JWT](https://docs.GitHub.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token). See note (2) below for more details.
    5. Save!

After following these steps, you'll be ready to use JWT Auth from your GitHub runners!

**(1) Note:** The unique identifier is mainly used for auditing/billing purposes, so there isn't one correct answer here.  `repository` is a sensible default but if you are uncertain, talk to AKeyless for more details.

**(2) Note:** Subclaim checks allow AKeyless to grant access to specific workflows, based on the claims that GitHub provides in the JWT.  Using the example JWT from [the documentation](https://docs.GitHub.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token), you could set a subclaim check in AKeyless (using example below) to limit access to workflows that were triggered from the main branch in the `octo-org/octo-repo` repository.:

```
repository=octo-org/octo-repo
ref=refs/heads/main
```
