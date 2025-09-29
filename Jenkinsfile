pipeline {
    agent {
        label 'quiz-server'
    }
    
    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['production', 'staging'], description: 'Select deployment environment')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip tests?')
    }
    
    environment {
        COMPOSE_FILE = "docker-compose.yml"
    }
    
    tools {
        git 'Default'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "📦 Checking out code..."
                checkout scm
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."
                sh """
                    docker-compose up -d --build --no-cache
                """
            }
        }
        
        stage('Deploy') {
            steps {
                echo "🚀 Deploying with Docker Compose..."
                sh """
                    docker-compose down || true
                    docker-compose up -d
                """
            }
        }
        
        stage('Health Check') {
            steps {
                echo "🏥 Running health check..."
                sh """
                    sleep 5
                    docker-compose -f ${COMPOSE_FILE} ps
                """
            }
        }
        
        stage('Cleanup') {
            steps {
                echo "🧹 Cleaning up unused images..."
                sh """
                    docker image prune -f
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
            sh """
                docker compose -f ${COMPOSE_FILE} logs --tail=50
            """
        }
        always {
            echo "📊 Final container status:"
            sh """
                docker compose -f ${COMPOSE_FILE} ps
            """
        }
    }
}
