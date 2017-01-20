'use strict';

import React from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { startup } from './ext/modules/platform/startup';
import attrack from './ext/modules/antitracking/attrack';

import { NativeModules, NativeEventEmitter } from 'react-native';

startup();

const myModuleEvt = new NativeEventEmitter(NativeModules.WebRequest)
myModuleEvt.addListener('webRequest', (data) => console.log(data))
console.log(myModuleEvt);

class RNHighScores extends React.Component {

  constructor(props) {
    super(props);
    this.webRequests = NativeModules.WebRequest;
    this.state = {
      'active': 'n/a',
    }

  }

  componentDidMount() {
    // startup().then(() => {
    //   this.setState({'attrack':attrack.getTabBlockingInfo(1)});
    // });
    NativeModules.WebRequest.isWindowActive(2).then((active) => {
      this.setState({'active': String(active)});
    });
  }

  render() {
    // setPref('test', 'hi')
    // var contents = getPref('test', 'default');
    return (
      <View style={styles.container}>
        <Text stype={styles.scores}>
          {this.state.active}
        </Text>
        <Text style={styles.scores}>
          {JSON.stringify(this.state.attrack)}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
  },
  highScoresTitle: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  scores: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

// Module name
AppRegistry.registerComponent('RNHighScores', () => RNHighScores);
