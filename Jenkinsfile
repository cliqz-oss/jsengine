#!/bin/env groovy

node('ubuntu-docker-gpu') {
  def imageName = 'android-emulator'

  stage('Checkout') {
    checkout scm
  }

  stage('Build docker image') {
    docker.build(imageName, '--build-arg UID=1000 --build-arg GID=1000 .')
  }

  docker.image(imageName).inside('--privileged') {
    stage('Compile') {
      // create signing key for build
      sh 'mkdir -p ./.android && cp /debug.keystore ./.android/'
      sh './gradlew assembleDebug'
    }

    stage('Test') {
      sh 'echo "no" | android create avd -f -n test_a24_armeabi-v7a -t android-24 --abi default/armeabi-v7a'
      sh 'ANDROID_SDK_HOME=`pwd` emulator64-arm -avd test_a24_armeabi-v7a -noaudio -no-window -qemu &'
      sh '/bin/bash android-wait-for-emulator.sh'
      sh './gradlew connectedDebugAndroidTest'

      step([
        $class: 'JUnitResultArchiver',
        allowEmptyResults: false,
        testResults: 'android-jsengine/build/test-results/debug/*.xml',
      ])
    }
  }
}