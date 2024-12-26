#!/bin/bash
# export ACTIVE_BRANCH=$BITBUCKET_BRANCH

# deployerRoleArn=''
# vpcSettings=''

# #Init Vars from Jenkins
# deploymentBucket=''
# securityGroupId=''
# subnetIdA=''
# subnetIdB=''
# deployerRoleArn=''
# deploymentRoleArn=''
# executionRoleArn=''
# apiGatewayId=''
# rootResourceId=''
# nodeEnvironment=''
# secretStore=''
# secretRegion=''
# secretTimeOut=''

# if [[ $ACTIVE_BRANCH == "main" ]]; then
#     slsStage='dev'
#     slsRegion='ap-southeast-1'
#     vpcSettings='nonprod'
    
#     deploymentBucket='ud-dev-idaas-iam-deployment-bucket'
#     securityGroupId='sg-01fca2b05e9cf804a'
#     subnetIdA='subnet-071d773e13a8fffb5'
#     subnetIdB='subnet-09cf826969486c056'
#     deployerRoleArn='arn:aws:iam::304062277670:role/idaas-iam-dev-deployer'
#     deploymentRoleArn='arn:aws:iam::304062277670:role/idaas-iam-dev-deployment'
#     executionRoleArn='arn:aws:iam::304062277670:role/idaas-iam-dev-execution'
#     apiGatewayId='ur86o1vma5'
#     rootResourceId='uai09713e5'
#     environmentName='development'

# elif [[ $ACTIVE_BRANCH == "staging" ]]; then
#     slsStage='uat'
#     slsRegion='ap-southeast-1'
#     vpcSettings='nonprod'

#     deploymentBucket='ud-uat-idaas-iam-deployment-bucket'
#     securityGroupId='sg-0f320394177a9f34a'
#     subnetIdA='subnet-088e921d1935359c0'
#     subnetIdB='subnet-0d0bc836fce916d52'
#     deployerRoleArn='arn:aws:iam::229510487219:role/idaas-iam-uat-deployer'
#     deploymentRoleArn='arn:aws:iam::229510487219:role/idaas-iam-uat-deployment'
#     executionRoleArn='arn:aws:iam::229510487219:role/idaas-iam-uat-execution'
#     apiGatewayId='iebmn4yw37'
#     rootResourceId='sh8w9mugz0'
#     environmentName='staging'
    
# elif [[ $ACTIVE_BRANCH == "prod" ]]; then
#     slsStage='prod'
#     slsRegion='ap-southeast-1'
#     vpcSettings='prod'

#     deploymentBucket='ud-prod-idaas-iam-deployment-bucket'
#     securityGroupId='sg-05b4a4c4abb0b767d'
#     subnetIdA='subnet-0f790eb87a4699a53'
#     subnetIdB='subnet-0e954813726abcd46'
#     subnetIdC='subnet-07d02194b229c79cc'
#     deployerRoleArn='arn:aws:iam::823056061745:role/idaas-iam-prod-deployer'
#     deploymentRoleArn='arn:aws:iam::823056061745:role/idaas-iam-prod-deployment'
#     executionRoleArn='arn:aws:iam::823056061745:role/idaas-iam-prod-execution'
#     apiGatewayId='ywm4z18vol'
#     rootResourceId='jjogr3gkwc'
#     environmentName='production'

# fi

# export SLS_STAGE=$slsStage
# export SLS_REGION=$slsRegion

# echo "setting up env variables for $BITBUCKET_BRANCH branch : $SLS_STAGE environment"

# export VPC_SETTINGS=$vpcSettings
export DEPLOYER_ROLE='arn:aws:iam::153326081486:role/xplor-deployer'
# export DEPLOYMENT_ROLE=$deploymentRoleArn
export DEPLOYMENT_BUCKET='xplor-dev-iam-deployment-bucket'
# export SUBNET_ID_A=$subnetIdA
# export SUBNET_ID_B=$subnetIdB
# export SECURITY_GROUP_ID=$securityGroupId
# export EXECUTION_ROLE=$executionRoleArn
export API_GATEWAY_ID='2bsvo6b74l'
export ROOT_RESOURCE_ID='n8gag72sl7'
# export NODE_ENV=$environmentName

