#!/bin/env groovy

node('ubuntu-docker-gpu') {
  def imageName = 'android-emulator'

  stage('Checkout') {
    checkout scm
  }

  stage('Build docker image') {
    docker.build(imageName)
  }

  docker.image(imageName).inside('--privileged -v /dev/kvm:/dev/kvm -e "EMULATOR=android-24" -e "ARCH=x86"') {
    stage('Compile') {
      sh './gradlew assembleDebug'
    }

    stage('Test') {
      sh 'pwd'
      sh 'ls -la `pwd`/.android/'
      sh './gradlew connectedDebugAndroidTest'

      step([
        $class: 'JUnitResultArchiver',
        allowEmptyResults: false,
        testResults: 'android-jsengine/build/test-results/debug/*.xml',
      ])
    }
  }
}