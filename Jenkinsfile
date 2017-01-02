#!/bin/env groovy

node('ubuntu-docker-gpu') {
  def imageName = 'android-emulator'

  stage('Checkout') {
    checkout scm
  }

  stage('Build docker image') {
    docker.build(imageName)
  }

  docker.image(imageName).inside('--privileged -v /dev/kvm:/dev/kvm -e "ANDROID_SDK_HOME=."') {
    stage('Compile') {
      // create signing key for build
      sh 'mkdir -p ./.android && cp /debug.keystore ./.android/'
      sh './gradlew assembleDebug'
    }

    stage('Test') {
      sh 'ls -la /usr/local/android-sdk/tools/'
      sh 'echo "no" | android create avd -f -n test -t android-24 --abi default/x86'
      sh 'android list avd'
      sh 'emulator64-x86 -sysdir /.android/ -avd test -noaudio -no-window -verbose -qemu -enable-kvm -vnc :0'
      sh './gradlew connectedDebugAndroidTest'

      step([
        $class: 'JUnitResultArchiver',
        allowEmptyResults: false,
        testResults: 'android-jsengine/build/test-results/debug/*.xml',
      ])
    }
  }
}