pipeline {
    agent {
        label 'quiz-server'
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['production'])
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

        stage('Load Environment') {
            steps {
                script {
                    def envPrefix = "${params.DEPLOY_ENV.toUpperCase()}_"
                    
                    System.getenv().each { key, value ->
                        if (key.startsWith(envPrefix)) {
                            def cleanKey = key.replace(envPrefix, '')
                            env[cleanKey] = value
                        }
                    }

                    withCredentials([
                        string(credentialsId: "${params.DEPLOY_ENV}-database-url", variable: 'DATABASE_URL'),
                        string(credentialsId: "${params.DEPLOY_ENV}-redis-password", variable: 'REDIS_PASSWORD'),
                        string(credentialsId: "${params.DEPLOY_ENV}-jwt-secret", variable: 'JWT_SECRET'),
                        string(credentialsId: "${params.DEPLOY_ENV}-jwt-refresh-secret", variable: 'JWT_REFRESH_SECRET'),
                        string(credentialsId: "${params.DEPLOY_ENV}-cloudinary-secret", variable: 'CLOUDINARY_API_SECRET')
                    ]) {
                        env.DATABASE_URL = DATABASE_URL
                        env.REDIS_PASSWORD = REDIS_PASSWORD
                        env.JWT_SECRET = JWT_SECRET
                        env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET
                        env.CLOUDINARY_API_SECRET = CLOUDINARY_API_SECRET
                    }

                    echo "✅ Loaded environment for: ${params.DEPLOY_ENV}"
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
                ${killScript}
                sudo rm -rf ${folderDeploy}
                sudo mkdir -p ${folderDeploy}
                sudo cp -r dist/* ${folderDeploy}/
                sudo cp package*.json ${folderDeploy}/

                # Tạo .env file
                sudo tee ${folderDeploy}/.env > /dev/null <<EOF
DATABASE_URL=${env.DATABASE_URL}
REDIS_URL=${env.REDIS_URL}
REDIS_SCHEME=${env.REDIS_SCHEME}
REDIS_HOST=${env.REDIS_HOST}
REDIS_PORT=${env.REDIS_PORT}
REDIS_USERNAME=${env.REDIS_USERNAME}
REDIS_PASSWORD=${env.REDIS_PASSWORD}
REDIS_DB=${env.REDIS_DB}
REDIS_KEY_PREFIX=${env.REDIS_KEY_PREFIX}
REDIS_TLS=${env.REDIS_TLS}
CLOUDINARY_CLOUD_NAME=${env.CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${env.CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${env.CLOUDINARY_API_SECRET}
CLOUDINARY_FOLDER=${env.CLOUDINARY_FOLDER}
PORT=${env.PORT}
NODE_ENV=${env.NODE_ENV}
FRONTEND_URL=${env.FRONTEND_URL}
JWT_SECRET=${env.JWT_SECRET}
JWT_REFRESH_SECRET=${env.JWT_REFRESH_SECRET}
EOF

                ${installProdScript}
                ${chownScript}
                sudo chmod 600 ${folderDeploy}/.env
                ${runScript}

                # Health check, fail pipeline nếu không thành công
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
