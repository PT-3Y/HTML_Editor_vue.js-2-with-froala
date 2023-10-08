#!/usr/bin/env bash

# Steps
    # Identify the build agent. Check whether build agent is same as deployment server
    # Login to build server and build, run, check the new changes.
    # --force-recreate for docker-compose
    # --no-cache for docker build
    # -f for npm install
    # -v --rmi all for docker compose down

if [ "${TRAVIS_PULL_REQUEST}" != "false" ];  then echo "Not deploying on a pull request !!!" && exit 0; fi

# Define the global variables
BRANCH_NAME=$(echo "${TRAVIS_BRANCH}" | tr '[:upper:]' '[:lower:]')
PACKAGE_VERSION="$(jq '.version' version.json | tr -d '"')"
IMAGE_NAME="$(echo "froala-${BUILD_REPO_NAME}_${TRAVIS_BRANCH}:${PACKAGE_VERSION}" | tr '[:upper:]' '[:lower:]')"
BASE_DOMAIN="froala-infra.com"
AO_IDENTIFIER="${TRAVIS_BRANCH}"
BRANCH_LENGHT=$(echo "${TRAVIS_BRANCH}" |awk '{print length}')
LW_REPO_NAME=$(echo "${BUILD_REPO_NAME}" | tr '[:upper:]' '[:lower:]' | sed -e 's/-//g' -e 's/\.//g' -e 's/_//g')
CT_INDEX=0
MAX_DEPLOYMENTS_NR=0
SDK_ENVIRONMENT=""
DEPLOYMENT_SERVER=""
SERVICE_NAME=""
CONTAINER_NAME=""
OLDEST_CONTAINER=""

# Copy the ssh key
echo "${SSH_KEY}"  | base64 --decode > /tmp/sshkey.pem
chmod 400 /tmp/sshkey.pem

# Select the deployment server based on the branch.
case "${BRANCH_NAME}" in
    dev*) SDK_ENVIRONMENT="dev" && DEPLOYMENT_SERVER="${FROALA_SRV_DEV}";;
    ao-dev*) SDK_ENVIRONMENT="dev" && DEPLOYMENT_SERVER="${FROALA_SRV_DEV}";;
    qa*) SDK_ENVIRONMENT="qa" && DEPLOYMENT_SERVER="${FROALA_SRV_QA}";;
    qe*) SDK_ENVIRONMENT="qe" && DEPLOYMENT_SERVER="${FROALA_SRV_QE}";;
    rc*) SDK_ENVIRONMENT="stg" && DEPLOYMENT_SERVER="${FROALA_SRV_STAGING}";;
    release-master*) SDK_ENVIRONMENT="stg" && DEPLOYMENT_SERVER=${FROALA_SRV_STAGING};;
    ft*) echo "Building only on feature branch ${TRAVIS_BRANCH}... will not deploy..." && exit 0;;
    bf*) echo "Building only on bugfix branch ${TRAVIS_BRANCH}... will not deploy..." && exit 0;;
    *) echo "Not a deployment branch" && exit 1;;
esac

# Set the short branch name
if [ "${BRANCH_LENGHT}" -lt 18 ]; then 
    SHORT_TRAVIS_BRANCH="${TRAVIS_BRANCH}"
else
    SHORT_TRAVIS_BRANCH="${TRAVIS_BRANCH:0:8}${TRAVIS_BRANCH: -8}"
fi
LW_SHORT_TRAVIS_BRANCH="$(echo "${SHORT_TRAVIS_BRANCH}" | sed -e 's/-//g' -e 's/\.//g' -e 's/_//g' | tr '[:upper:]' '[:lower:]')"

# Get the maximum allowed deployment for given environment
function max_allowed_deployment(){
    echo "getting max deployments for environment ${SDK_ENVIRONMENT}"
    MAX_DEPLOYMENTS_NR=$(jq --arg sdkenvironment "${SDK_ENVIRONMENT}"  '.[$sdkenvironment]' version.json | tr -d '"')
    echo "Max allowed deployments: ${MAX_DEPLOYMENTS_NR}"
}
max_allowed_deployment

# Get the total numbers of deployed container for given environment
function existing_deployments(){
    echo "Checking the existing number of running container(s)"
    EXISTING_DEPLOYMENTS_NR=$(ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem "${SSH_USER}"@"${DEPLOYMENT_SERVER}" "sudo docker ps | grep -i ${LW_REPO_NAME}-${AO_IDENTIFIER}" | wc -l)
    echo "Number of existing deployment: ${EXISTING_DEPLOYMENTS_NR}"
}
existing_deployments

# Get the old container name, no of deployments, and generate the new index and container name
function generate_container_name(){

    DEPL=$(ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem "${SSH_USER}"@"${DEPLOYMENT_SERVER}" sudo docker ps | grep -i "${LW_REPO_NAME}"-"${AO_IDENTIFIER}")
    echo "Containers running for ${AO_IDENTIFIER}:  ${DEPL}"
    echo "${DEPL}" > file.txt

    echo "Getting indexes of oldest and latest deployed containers for ${AO_IDENTIFIER}"
    CT_LOWER_INDEX=$(awk -F'-' '{print $NF }' < file.txt | sort -nk1 | head -1)
    CT_HIGHER_INDEX=$(awk -F'-' '{print $NF }' < file.txt | sort -nk1 | tail -1)
    echo "Lowest index : ${CT_LOWER_INDEX} ; and Highest index : ${CT_HIGHER_INDEX}"	

    if [ -z "${DEPL}" ]; then
        echo "First deployment. Setting the container name."
        CT_INDEX=1
        CONTAINER_NAME="${LW_REPO_NAME}-${AO_IDENTIFIER}-${CT_INDEX}"
        SERVICE_NAME="${LW_REPO_NAME}-${LW_SHORT_TRAVIS_BRANCH}" 
    else
        echo "Multiple deployments detected. Setting the container name (old and new)"
        CT_INDEX=${CT_HIGHER_INDEX} && CT_INDEX=$((CT_INDEX+1))
        OLDEST_CONTAINER="${LW_REPO_NAME}-${AO_IDENTIFIER}-${CT_LOWER_INDEX}"
        CONTAINER_NAME="${LW_REPO_NAME}-${AO_IDENTIFIER}-${CT_INDEX}"
        SERVICE_NAME="${LW_REPO_NAME}-${LW_SHORT_TRAVIS_BRANCH}-${CT_INDEX}"
        echo "New index: ${CT_INDEX}"
    fi
}
generate_container_name

# Print useful details.
echo -e "\n"
echo "----------------------------------------------------------------------"
echo "  Selected environment:                   ${SDK_ENVIRONMENT}.         "
echo "  Deployment server:                      ${DEPLOYMENT_SERVER}.       "
echo "  Max allowed deployments:                ${MAX_DEPLOYMENTS_NR}.      "
echo "  Number of existing deployment:          ${EXISTING_DEPLOYMENTS_NR}  "
echo "  Oldest container name:                  ${OLDEST_CONTAINER}         "
echo "  Container name for this deployment:     ${CONTAINER_NAME}           "
echo "----------------------------------------------------------------------"
echo -e "\n"

# Set the deployment URL
DEPLOYMENT_URL="${CONTAINER_NAME}.${SDK_ENVIRONMENT}.${BASE_DOMAIN}"

# Modify the compose file and run the docker-compose.
function deploy(){

    # Copy the docker-compose template to docker-compose.yml
    cp docker-compose.yml.template docker-compose.yml

    # Replace the sample values
    sed -i "s/ImageName/${NEXUS_CR_TOOLS_URL}\/${IMAGE_NAME}/g" docker-compose.yml
    sed -i "s/UrlName/${DEPLOYMENT_URL}/g" docker-compose.yml
    sed -i "s/ServiceName/${SERVICE_NAME}/g" docker-compose.yml
    sed -i "s/PortNum/${CONTAINER_SERVICE_PORTNO}/g" docker-compose.yml
    sed -i "s/ContainerName/${CONTAINER_NAME}/g" docker-compose.yml

    echo -e "\n"
    echo "Below is the content of docker-compose.yml"
    echo "-------------------------------------------------"
    cat docker-compose.yml
    echo "-------------------------------------------------"
    echo -e "\n"
    
    # Remove the old docker-compose from deployment_server
    ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem "${SSH_USER}"@"${DEPLOYMENT_SERVER}" "if [ -d /services/${SERVICE_NAME} ];  then rm -rf /services/${SERVICE_NAME}; fi && mkdir /services/${SERVICE_NAME}"
    
    # Copy the latest docker-compose file to deployment_server
    scp  -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem docker-compose.yml "${SSH_USER}"@"${DEPLOYMENT_SERVER}":/services/"${SERVICE_NAME}"/docker-compose.yml

    # Run docker-compose pull on deployment_server
    ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem "${SSH_USER}"@"${DEPLOYMENT_SERVER}" "cd /services/${SERVICE_NAME}/ && sudo docker-compose pull"
    sleep 10
    
    # Run docker-compose up on deployment_server
    ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem "${SSH_USER}"@"${DEPLOYMENT_SERVER}" "cd /services/${SERVICE_NAME}/ && sudo docker-compose up -d --force-recreate"
    sleep 60

    RET_CODE=$(curl -k -s -o /tmp/notimportant.txt -w "%{http_code}" https://"${DEPLOYMENT_URL}")
    echo "validation code: $RET_CODE for  https://${DEPLOYMENT_URL}"
    if [ "${RET_CODE}" -ne 200 ]; then 
        echo "Deployment validation failed!!! Please check pipeline logs." 
        exit 1 
    else 
        echo -e "\n\tService available at URL: https://${DEPLOYMENT_URL}\n"
    fi
}

# If existing deployment less than max deployment then just deploy don't remove old container.
if [ "${EXISTING_DEPLOYMENTS_NR}" -lt "${MAX_DEPLOYMENTS_NR}" ]; then
    deploy
fi

# If existing deployment equals max deployment then delete oldest container.
if [ "${EXISTING_DEPLOYMENTS_NR}" -ge "${MAX_DEPLOYMENTS_NR}" ]; then
    
    echo "Maximum deployments reached  on ${SDK_ENVIRONMENT} environment for ${BUILD_REPO_NAME}."
    echo "Stopping container  ${OLDEST_CONTAINER} ..."
  
    if ! ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem "${SSH_USER}"@"${DEPLOYMENT_SERVER}" sudo docker stop "${OLDEST_CONTAINER}"; then
        echo "Failed to stop the ${OLDEST_CONTAINER} container"
    fi
    echo "Successfully stopped the ${OLDEST_CONTAINER} container."

    if ! ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem "${SSH_USER}"@"${DEPLOYMENT_SERVER}" sudo docker rm -f "${OLDEST_CONTAINER}"; then
        echo "Failed to remove the ${OLDEST_CONTAINER} container"
    fi
    echo "Successfully removed the ${OLDEST_CONTAINER} container."

    echo "Deploying the service: ${SERVICE_NAME}"
    deploy && sleep 30
    echo "Deployment completed."
fi

