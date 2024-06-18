#!/bin/bash
#Use Bitbucket OIDC instead of Access key and Secret key.
export AWS_REGION='ap-southeast-1'
export AWS_ROLE_ARN=$BITBUCKET_OIDC_CICD_ROLE
export AWS_WEB_IDENTITY_TOKEN_FILE=$(pwd)/web-identity-token 
echo $BITBUCKET_STEP_OIDC_TOKEN > $(pwd)/web-identity-token 

#Assume deployer role in target account 
OUTPUT_PROFILE='serverless-deployer'
echo "Assuming role $DEPLOYER_ROLE"
sts=$(aws sts assume-role --role-arn "$DEPLOYER_ROLE" --role-session-name "$OUTPUT_PROFILE" --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' --output text)
sts=($sts)
aws configure set aws_access_key_id ${sts[0]} --profile $OUTPUT_PROFILE
aws configure set aws_secret_access_key ${sts[1]} --profile $OUTPUT_PROFILE
aws configure set aws_session_token ${sts[2]} --profile $OUTPUT_PROFILE