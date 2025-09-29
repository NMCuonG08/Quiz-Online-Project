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
        stage('Deploy') {
            steps {
                sh """
                set -x
                # Prepare folder
                sudo mkdir -p ${folderDeploy}
                
                # Copy necessary files
                sudo cp -r . ${folderDeploy}/
                
                # Deploy
                cd ${folderDeploy}
                sudo docker-compose up --build -d
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
