#!/bin/env groovy

node('ubuntu-docker-gpu') {
  def imageName = 'monostream/android-sdk'

  stage('Checkout') {
    checkout scm
  }

  stage('Build docker image') {
    docker.build('.')
  }

  docker.image('.').inside('--privileged -v /dev/kvm:/dev/kvm -e "EMULATOR=android-24" -e "ARCH=x86"') {
    stage('Compile') {
      sh './gradlew assembleDebug'
    }

    stage('Test') {
      sh './gradlew connectedAndroidTest'

      step([
        $class: 'JUnitResultArchiver',
        allowEmptyResults: false,
        testResults: 'android-jsengine/build/test-results/debug/*.xml',
      ])
    }
  }
}