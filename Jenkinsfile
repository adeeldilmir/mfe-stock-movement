/* groovylint-disable CompileStatic, CouldBeSwitchStatement, DuplicateMapLiteral, DuplicateStringLiteral, LineLength, NestedBlockDepth */
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                slackSend (color: '#FFFF00', message: "STARTED: Job '${env.JOB_NAME}'  (${env.GIT_BRANCH}) (${env.GIT_COMMIT}) (${env.GIT_COMMITTER_NAME})")
                script {
                        nodejs('NodeJs 16.13.1') {
                            sh '''

                     npm --version
                     node --version
                     npm i
                     npm run build
                 '''
                        }
                }
            }
        }
        stage('Upload to AWS') {
            environment {
                GIT_COMMIT = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
            }

            steps {
                script {
                        withAWS(region: 'ap-southeast-1') {
                            sh 'echo "Uploading content with AWS creds"'
                            sh "echo $GIT_COMMIT"
                            s3Upload acl: 'Private', bucket: "swyft-admin-mfe-dev/mfe-stock-movement/$GIT_COMMIT", file: 'public/', workingDir: ''
                            sh 'curl --version'
                            sh '''curl -d \'{ "service":"@swyft-logistics/stock-movement","url":"https://admin-dev.swyftlogistics.com/mfe-stock-movement/'$GIT_COMMIT'/build/bundle.js" }\' -X PATCH localhost:5000/services\\?env=admin-dev -H "Accept: application/json" -H "Content-Type: application/json"'''
                            sh 'aws s3 cp s3://swyft-admin-mfe-dev/mfe-stock-movement/$GIT_COMMIT s3://swyft-admin-mfe-dev/mfe-stock-movement/$GIT_COMMIT --exclude "*" --include "*.jpg" --include "*.png" --include "*.ico" --include "*.css" --include "*.js" --include "*.png" --recursive --metadata-directive REPLACE --cache-control max-age=31536000,public,immutable'
                        }
                }
            }
        }
    }
    post {
        success {
            slackSend (color: '#00FF00', message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'  (${env.GIT_COMMITTER_NAME}) (${env.GIT_COMMIT})")
        }
        failure {
            slackSend (color: '#FF0000', message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'  (${env.GIT_COMMITTER_NAME}) (${env.GIT_COMMIT})")
        }
    }
}
