#!/bin/env groovy

node('ubuntu-docker-gpu') {
  def imageName = 'android-emulator'

  stage('Checkout') {
    checkout scm
  }

  stage('Build docker image') {
    docker.build(imageName)
  }

  docker.image(imageName).inside('--privileged') {
    stage('Compile') {
      // create signing key for build
      sh 'mkdir -p ./.android && cp /debug.keystore ./.android/'
      sh './gradlew assembleDebug'
    }

    stage('Test') {
      sh 'echo "no" | android create avd -f -n test_a24_armeabi-v7a -t android-24 --abi default/armeabi-v7a'
      sh 'ANDROID_SDK_HOME=`pwd` emulator64-arm -avd test_a24_armeabi-v7a -noaudio -no-window -verbose -qemu -vnc :0'
      sh './gradlew connectedDebugAndroidTest'

      step([
        $class: 'JUnitResultArchiver',
        allowEmptyResults: false,
        testResults: 'android-jsengine/build/test-results/debug/*.xml',
      ])
    }
  }
}