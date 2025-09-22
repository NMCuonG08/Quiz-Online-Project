pipeline {
    agent {
        label 'quiz-server'
    }
    environment {
        apiUser = "nestdev"
        appName = "nest-shopping-api"
        appVersion = "1.0.0"
        appType = "node"  
        appContext = "api/v1"
        folderDeploy = "/var/www/${appName}"
        buildScript = "npm install && npm run build"
        installProdScript = "cd ${folderDeploy} && sudo npm install --production"
        chownScript = "sudo chown -R ${apiUser}:${apiUser} ${folderDeploy}"
        killScript = "sudo pkill -f 'node.*main.js' || true"
        runScript = "sudo su ${apiUser} -c 'cd ${folderDeploy}; npm run start:prod > nohup.out 2>&1 &'"
    }
    stages {
        stage('Info') {
            steps {
                sh(script: "whoami; pwd; ls -la", label: "Environment Info")
            }
        }
        
        stage('Build') {
            steps {
                sh(script: "${buildScript}", label: "Build NestJS App")
            }
        }
        
        stage('Stop Old Process') {
            steps {
                sh(script: "${killScript}", label: "Stop Old Node Process")
            }
        }
        
        stage('Prepare Deploy Directory') {
            steps {
                sh """
                    sudo rm -rf ${folderDeploy}
                    sudo mkdir -p ${folderDeploy}
                """
            }
        }
        
        stage('Deploy Files') {
            steps {
                sh """
                    sudo cp -r dist/* ${folderDeploy}/
                    sudo cp package*.json ${folderDeploy}/
                """
            }
        }
        
        stage('Install Production Dependencies') {
            steps {
                sh "${installProdScript}"
            }
        }
        
        stage('Set Permissions') {
            steps {
                sh "${chownScript}"
            }
        }
        
        stage('Start New Process') {
            steps {
                sh(script: "${runScript}", label: "Start NestJS App")
            }
        }
        
        stage('Health Check') {
            steps {
                sh """
                    sleep 5
                    curl -f http://localhost:3000/api/v1/health || echo "Health check failed"
                """
            }
        }
    }
    
    post {
        always {
            echo "Pipeline completed"
        }
        success {
            echo "Deployment successful!"
        }
        failure {
            echo "Deployment failed!"
            // Rollback logic có thể thêm ở đây
        }
    }
}
