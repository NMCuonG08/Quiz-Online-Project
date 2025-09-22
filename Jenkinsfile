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
        copyScript = "sudo cp -r dist/* ${folderDeploy}"
        copyPackageScript = "sudo cp package*.json ${folderDeploy}"
        installProdScript = "cd ${folderDeploy} && sudo npm install --production"
        chownScript = "sudo chown -R ${appUser}. ${folderDeploy}"
        killScript = "sudo pkill -f 'node.*main.js' || true"  // kill Node process
        runScript = "sudo su ${appUser} -c 'cd ${folderDeploy}; npm run start:prod > nohup.out 2>&1 &'"


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
        stage('Copy Files') {
        steps {
                sh "${copyScript}"        // copy dist/
                sh "${copyPackageScript}" // copy package.json
            }
        }
        stage('Install Production Dependencies') {
            steps {
                sh "${installProdScript}" // npm install --production
            }
        }
        stage('Set Permissions') {
            steps {
                sh "${chownScript}"
            }
        }
        stage('Stop Old Process') {
            steps {
                sh "${killScript}"  // kill node process
            }
        }
        stage('Start New Process') {
            steps {
                sh "${runScript}"   // npm run start:prod
            }
        }
    }
}
