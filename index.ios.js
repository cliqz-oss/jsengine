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

class RNHighScores extends React.Component {

  constructor(props) {
    super(props);

    this.state = {}
  }

  componentDidMount() {
    startup().then(() => {
      this.setState(attrack.getTabBlockingInfo(1));
    });
  }

  render() {
    // setPref('test', 'hi')
    // var contents = getPref('test', 'default');
    return (
      <View style={styles.container}>
        <Text style={styles.scores}>
          {JSON.stringify(this.state)}
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
