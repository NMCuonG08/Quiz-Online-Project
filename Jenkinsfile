pipeline {
    agent {
        label 'quiz-server'
    }
    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['production'], description: 'Select deployment environment')
    }
    environment {
        appName = "nest-shopping-api"
        folderDeploy = "/var/www/${appName}"
    }
    tools {
        git 'Default'
    }
    stages {
        stage('Build Image') {
            steps {
                sh """
                set -x
                # Prepare folder
                sudo mkdir -p ${folderDeploy}
                
                # Backup current deployment
                if [ -d "${folderDeploy}.backup" ]; then
                    sudo rm -rf ${folderDeploy}.backup
                fi
                if [ -d "${folderDeploy}" ]; then
                    sudo cp -r ${folderDeploy} ${folderDeploy}.backup
                fi
                
                # Copy new code
                sudo cp -r . ${folderDeploy}/
                
                # Build docker image
                cd ${folderDeploy}
                sudo docker-compose build
                """
            }
        }
        stage('Approval') {
            steps {
                script {
                    timeout(time: 30, unit: 'MINUTES') {
                        input message: 'Deploy to Production?', 
                              ok: 'Deploy Now',
                              submitter: 'admin'
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                sh """
                set -x
                cd ${folderDeploy}
                sudo docker-compose up -d
                """
            }
        }
        stage('Health Check') {
            steps {
                script {
                    def maxRetries = 12
                    def retryInterval = 5
                    def healthy = false
                    
                    for (int i = 0; i < maxRetries; i++) {
                        try {
                            sh "curl -f http://localhost:3000/api/v1/health"
                            healthy = true
                            break
                        } catch (Exception e) {
                            echo "Health check failed, retrying in ${retryInterval}s... (${i+1}/${maxRetries})"
                            sleep(retryInterval)
                        }
                    }
                    
                    if (!healthy) {
                        error("Health check failed after ${maxRetries} attempts")
                    }
                }
            }
        }
    }
    post {
        success {
            echo "✅ Deployed ${params.DEPLOY_ENV} successfully!"
            sh "sudo rm -rf ${folderDeploy}.backup || true"
        }
        failure {
            echo "❌ Deploy failed for ${params.DEPLOY_ENV}, rolling back..."
            sh """
                if [ -d "${folderDeploy}.backup" ]; then
                    cd ${folderDeploy}
                    sudo docker-compose down || true
                    sudo rm -rf ${folderDeploy}
                    sudo mv ${folderDeploy}.backup ${folderDeploy}
                    cd ${folderDeploy}
                    sudo docker-compose up -d
                    echo "Rollback completed"
                fi
            """
        }
        aborted {
            echo "⚠️ Deployment aborted by user"
            sh "sudo rm -rf ${folderDeploy}.backup || true"
        }
    }
}
