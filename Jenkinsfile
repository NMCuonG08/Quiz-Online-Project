pipeline {
    agent {
      label 'quiz-server'
    }
    stages {
        stage('info') {
            steps {
                sh(script: """  whoami;pwd;ls -la  """, label: "first stage" )
            }
        }
    }
}
