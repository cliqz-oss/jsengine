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
      sh 'echo "no" | android create avd -f -n test_a24_x86 -t android-24 --abi default/x86'
      sh '/bin/bash setup-kvm.sh'
      sh 'ANDROID_SDK_HOME=`pwd` emulator64-x86 -avd test_a24_x86 -noaudio -no-window -verbose -qemu -enable-kvm -vnc :0'
      sh './gradlew connectedDebugAndroidTest'

      step([
        $class: 'JUnitResultArchiver',
        allowEmptyResults: false,
        testResults: 'android-jsengine/build/test-results/debug/*.xml',
      ])
    }
  }
}