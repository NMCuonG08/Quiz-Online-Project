pipeline {
    agent {
        label 'quiz-server'
    }
    
    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['production', 'staging'], description: 'Select deployment environment')
    }
    
    environment {
        COMPOSE_FILE = "docker-compose.${params.DEPLOY_ENV}.yml"
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
                    docker compose -f ${COMPOSE_FILE} build --no-cache
                """
            }
        }
        
        stage('Deploy') {
            steps {
                echo "🚀 Deploying with Docker Compose..."
                sh """
                    # Stop old containers
                    docker compose -f ${COMPOSE_FILE} down || true
                    
                    # Start new containers in detached mode
                    docker compose -f ${COMPOSE_FILE} up -d
                """
            }
        }
        
        stage('Health Check') {
            steps {
                echo "🏥 Running health check..."
                sh """
                    sleep 5
                    docker compose -f ${COMPOSE_FILE} ps
                    
                    # Optional: Check if container is healthy
                    # curl -f http://localhost:3000/health || exit 1
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
