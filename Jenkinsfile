pipeline {
    agent {
        label 'quiz-server'
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['production'], description: 'Select deployment environment')
    }

    environment {
        apiUser = "nestdev"
        appName = "nest-shopping-api"
        folderDeploy = "/var/www/${appName}"
        buildScript = "npm install && npm run build"
        installProdScript = "cd ${folderDeploy} && sudo npm install --production"
        chownScript = "sudo chown -R ${apiUser}:${apiUser} ${folderDeploy}"
        killScript = "sudo pkill -f 'node.*main.js' || true"
        runScript = "sudo su ${apiUser} -c 'cd ${folderDeploy}; npm run start:prod > nohup.out 2>&1 &'"
    }

    tools {
        git 'Default' // tên Git installation trong Jenkins Global Tool Config
    }

    stages {

        stage('Load Environment & Credentials') {
            steps {
                // Load all credentials via Jenkins credentials plugin
                withCredentials([
                    string(credentialsId: "${params.DEPLOY_ENV}-database-url", variable: 'DATABASE_URL'),
                    string(credentialsId: "${params.DEPLOY_ENV}-redis-password", variable: 'REDIS_PASSWORD'),
                    string(credentialsId: "${params.DEPLOY_ENV}-jwt-secret", variable: 'JWT_SECRET'),
                    string(credentialsId: "${params.DEPLOY_ENV}-jwt-refresh-secret", variable: 'JWT_REFRESH_SECRET'),
                    string(credentialsId: "${params.DEPLOY_ENV}-cloudinary-secret", variable: 'CLOUDINARY_API_SECRET')
                ]) {
                    echo "✅ Loaded credentials for ${params.DEPLOY_ENV}"
                }
            }
        }

        stage('Build') {
            steps {
                sh """
                set -x
                npm config set loglevel verbose
                ${buildScript}
                """
            }
        }

        stage('Deploy') {
            steps {
                sh """
                set -x

                # Stop previous app
                ${killScript}

                # Prepare folder
                sudo rm -rf ${folderDeploy}
                sudo mkdir -p ${folderDeploy}
                sudo cp -r dist/* ${folderDeploy}/
                sudo cp package*.json ${folderDeploy}/

                # Create .env file
                sudo tee ${folderDeploy}/.env > /dev/null <<EOF
DATABASE_URL=${DATABASE_URL}
REDIS_PASSWORD=${REDIS_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
PORT=${env.PORT}
NODE_ENV=${env.NODE_ENV}
FRONTEND_URL=${env.FRONTEND_URL}
EOF

                # Install production dependencies
                ${installProdScript}

                # Fix permissions
                ${chownScript}
                sudo chmod 600 ${folderDeploy}/.env

                # Run application
                ${runScript}

                # Health check (pipeline fail if health check fail)
                curl -f http://localhost:${env.PORT}/api/v1/health
                """
            }
        }

    }

    post {
        success {
            echo "✅ Deployed ${params.DEPLOY_ENV} successfully!"
        }
        failure {
            echo "❌ Deploy failed for ${params.DEPLOY_ENV}"
        }
    }
}
