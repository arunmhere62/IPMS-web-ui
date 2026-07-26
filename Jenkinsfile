pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '5'))
    }

    parameters {
        booleanParam(
            name: 'ROLLBACK',
            defaultValue: false,
            description: 'Check this to roll back to the previous image instead of deploying a new one'
        )
        string(
            name: 'NOTIFICATION_EMAIL',
            defaultValue: 'arunmhere62@gmail.com',
            description: 'Recipient for deployment notifications'
        )
    }

    environment {
        APP_IMAGE = 'ipgm-web-ui'
        COMPOSE_FILE = 'docker-compose.yml'
        COMPOSE_PROJECT = 'ipgm-web-ui'
        CONTAINER_NAME = 'ipgm-web-ui'
        NETWORK_NAME = 'ipgm-mobapi-prod-network'
        BACKEND_HOST = 'ipgm-web-ui'
        APP_PORT = '80'

        DOCKER_BUILDKIT = '1'
        BUILDKIT_PROGRESS = 'plain'
        COMPOSE_DOCKER_CLI_BUILD = '1'
    }

    stages {
        stage('Rollback') {
            when { expression { params.ROLLBACK } }
            steps {
                script {
                    rollbackDeployment()
                }
            }
        }

        stage('Checkout') {
            when { expression { !params.ROLLBACK } }
            steps {
                script {
                    checkout scm
                    env.GIT_COMMIT_SHORT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    env.GIT_BRANCH_NAME = normalizeBranchName(env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'unknown')
                    env.IMAGE_FQN = "${env.APP_IMAGE}:${env.GIT_COMMIT_SHORT}"

                    echo '============================================'
                    echo "Branch: ${env.GIT_BRANCH_NAME}"
                    echo "Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Image: ${env.IMAGE_FQN}"
                    echo '============================================'
                }
            }
        }

        stage('Install Dependencies') {
            when { expression { !params.ROLLBACK } }
            steps {
                sh 'npm ci'
            }
        }

        stage('Build Docker Image') {
            when { expression { !params.ROLLBACK } }
            steps {
                sh """
                    docker build \
                        -t ${env.IMAGE_FQN} \
                        -f Dockerfile \
                        .
                """
            }
        }

        stage('Deploy') {
            when { expression { !params.ROLLBACK } }
            steps {
                script {
                    deployApplication(env.IMAGE_FQN)
                }
            }
        }

        stage('Health Check') {
            when { expression { !params.ROLLBACK } }
            steps {
                script {
                    waitForHealthyApplication()
                    env.DEPLOY_SUCCESSFUL = 'true'
                }
            }
        }

        stage('Deployment Summary') {
            when {
                allOf {
                    expression { !params.ROLLBACK }
                    expression { env.DEPLOY_HAPPENED == 'true' }
                }
            }
            steps {
                script {
                    printDeploymentSummary()
                }
            }
        }
    }

    post {
        always {
            script {
                if (!params.ROLLBACK) {
                    sh 'docker image prune -f'
                }
            }
        }
        success {
            script {
                echo '============================================'
                echo 'RESULT: SUCCESS'
                echo "Image: ${env.IMAGE_FQN ?: 'Rollback mode'}"
                echo '============================================'
                sendDeploymentEmail('SUCCEEDED', 'Web UI deployment completed and passed the health check.')
            }
        }
        failure {
            script {
                echo '============================================'
                echo 'RESULT: FAILURE'
                echo "Image: ${env.IMAGE_FQN ?: 'unknown'}"
                echo '============================================'
                if (!params.ROLLBACK && env.DEPLOY_HAPPENED == 'true' && env.DEPLOY_SUCCESSFUL != 'true') {
                    echo 'Deployment did not reach healthy state. Attempting automatic rollback...'
                    rollbackDeployment()
                }
                sendDeploymentEmail('FAILED', 'Web UI deployment failed. Review the Jenkins build log for details.')
            }
        }
        aborted {
            script {
                echo '============================================'
                echo 'RESULT: ABORTED'
                echo '============================================'
            }
        }
    }
}

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

def sendDeploymentEmail(String status, String message) {
    def subject = "[IPMS Web UI] ${status} | Build #${env.BUILD_NUMBER}"
    def body = """Web UI deployment ${status.toLowerCase()}.

${message}

Branch: ${env.GIT_BRANCH_NAME ?: 'main'}
Commit: ${env.GIT_COMMIT_SHORT ?: 'unknown'}
Image: ${env.IMAGE_FQN ?: 'unknown'}
Build: ${env.BUILD_URL ?: 'unavailable'}
""".stripIndent()

    try {
        mail to: params.NOTIFICATION_EMAIL, subject: subject, body: body
    } catch (Exception e) {
        echo "WARNING: Could not send deployment email: ${e.message}"
    }
}

def normalizeBranchName(String rawBranch) {
    if (!rawBranch) return 'unknown'
    def branch = rawBranch.replaceAll(/^origin\//, '')
    return branch.replaceAll(/[^a-zA-Z0-9_-]/, '-')
}

def composeCommand() {
    return 'docker compose'
}

def ensureNetworkExists(String networkName) {
    def exists = sh(returnStatus: true, script: "docker network inspect ${networkName} >/dev/null 2>&1")
    if (exists == 0) {
        echo "Network ${networkName} already exists."
    } else {
        sh "docker network create ${networkName}"
        echo "Created network ${networkName}."
    }
}

def tagPreviousImage() {
    def runningContainer = sh(
        returnStdout: true,
        script: "docker ps -q --filter name=^/${env.CONTAINER_NAME}\$ || true"
    ).trim()

    if (!runningContainer) {
        echo 'No running container found; skipping previous-image tag.'
        return
    }

    def currentImage = sh(
        returnStdout: true,
        script: "docker inspect --format='{{.Config.Image}}' ${runningContainer} || true"
    ).trim()

    if (currentImage) {
        sh "docker tag ${currentImage} ${env.APP_IMAGE}:previous"
        echo "Tagged previous image: ${currentImage} -> ${env.APP_IMAGE}:previous"
    } else {
        echo "WARNING: Could not determine image of running container ${runningContainer}."
    }
}

def deployApplication(String imageTag) {
    ensureNetworkExists(env.NETWORK_NAME)
    tagPreviousImage()

    env.DEPLOY_HAPPENED = 'true'

    sh """
        export APP_IMAGE=${env.APP_IMAGE}
        export APP_TAG=${env.GIT_COMMIT_SHORT}
        ${composeCommand()} -f ${env.COMPOSE_FILE} -p ${env.COMPOSE_PROJECT} down --remove-orphans
        ${composeCommand()} -f ${env.COMPOSE_FILE} -p ${env.COMPOSE_PROJECT} up -d --force-recreate
    """

    echo "Deployed ${imageTag} to web-ui"
}

def rollbackDeployment() {
    def previousImage = "${env.APP_IMAGE}:previous"
    def imageExists = sh(returnStatus: true, script: "docker image inspect ${previousImage} >/dev/null 2>&1")

    if (imageExists != 0) {
        echo "WARNING: Rollback image ${previousImage} not found. Skipping rollback."
        return
    }

    ensureNetworkExists(env.NETWORK_NAME)

    sh """
        export APP_IMAGE=${env.APP_IMAGE}
        export APP_TAG=previous
        ${composeCommand()} -f ${env.COMPOSE_FILE} -p ${env.COMPOSE_PROJECT} down --remove-orphans
        ${composeCommand()} -f ${env.COMPOSE_FILE} -p ${env.COMPOSE_PROJECT} up -d --force-recreate
    """

    echo "Rolled back to ${previousImage}"
}

def waitForHealthyApplication() {
    def healthy = false
    def maxAttempts = 10

    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
        sleep 3

        def exitCode = sh(
            returnStatus: true,
            script: """
                docker run --rm --network ${env.NETWORK_NAME} curlimages/curl:latest \
                    -fsS --max-time 10 http://${env.BACKEND_HOST}:${env.APP_PORT}/
            """
        )

        if (exitCode == 0) {
            healthy = true
            echo "Health check passed on attempt ${attempt}/${maxAttempts}"
            break
        }

        echo "Health check attempt ${attempt}/${maxAttempts} failed, retrying..."
    }

    if (!healthy) {
        error("Application health check failed after ${maxAttempts} attempts")
    }
}

def printDeploymentSummary() {
    def timestamp = sh(returnStdout: true, script: 'date "+%Y-%m-%d %H:%M"').trim()
    echo """
==================================
Web UI Deployment Successful
==================================

Branch    : ${env.GIT_BRANCH_NAME}
Commit    : ${env.GIT_COMMIT_SHORT}
Image     : ${env.IMAGE_FQN}

Container : ${env.CONTAINER_NAME}
Network   : ${env.NETWORK_NAME}

Time      : ${timestamp}

==================================
    """.stripIndent()
}
