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
        startScript = "npm run start:prod"
        nodeVersion = "18.x"
    }
    stages {
        stage('info') {
            steps {
                sh(script: """  whoami;pwd;ls -la  """, label: "first stage" )
            }
        }
        stage('build'){
            steps {
                 sh(script: """  ${buildScript}  """, label: "build with node" )
            }
        }
    }
}
