pipeline {
    agent any

    triggers {
        githubPush()
    }

	tools {
        jdk 'JAVA'
        maven 'MAVEN'   // Name of Maven installation configured in Jenkins global tools
    }

    environment {
        JAVA_HOME = tool 'JAVA'
        PATH = "${JAVA_HOME}/bin:${env.PATH}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/master']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/stamp-web/stamp-imageparsing.git',
                        credentialsId: 'github'
                    ]]
                ])
            }
        }
        
        stage('Clean') {
            steps {
                sh 'mvn clean'
            }
        }

        stage('Build') {
            steps {
                sh 'mvn clean install'
            }
        }
        
        //stage('Test JavaScript') {
 		//	steps {
        		// Install dependencies in web-app
        //		dir('web-app') {
        //    		sh 'npm install'
        //		}
		        // Run unit tests from web-app/test/unit
        //		dir('web-app/test/unit') {
        //    		sh 'au test --coverage'
        //		}
    	//	}
		//}
		
    }

    post {
    	always {
        	junit allowEmptyResults: true, testResults: 'target/surefire-reports/*.xml,web-app/test/junit/*.xml'
    	}
        success {
            archiveArtifacts artifacts: 'target/stamp-imageparsing-*-SNAPSHOT.jar', fingerprint: true
        }
        failure {
            echo 'Build failed'
        }
    }
}