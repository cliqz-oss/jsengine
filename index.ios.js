'use strict';

import React from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
} from 'react-native';

import { startup, getApp } from './ext/modules/platform/startup';

import { NativeModules, NativeEventEmitter } from 'react-native';

class ExtensionApp extends React.Component {

  constructor(props) {
    super(props);
    this.webRequests = NativeModules.WebRequest;
    this.state = {
      modules: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
    }
  }

  componentDidMount() {
    startup().then(() => {
      this.app = getApp();
      setInterval(() => {
        const modules = this.app.modules().map((m) => {
            return {
              name: m.name,
              isEnabled: m.isEnabled,
              loadingTime: m.loadingTime,
            }
          });
        this.setState({ modules: this.state.modules.cloneWithRows(modules) })
      }, 1000)
    });
  }

  render() {
    // setPref('test', 'hi')
    // var contents = getPref('test', 'default');
    return (
      <View style={styles.container}>
        <Text stype={styles.scores}>
          Extension Modules
        </Text>
        <ListView
          dataSource={this.state.modules}
          renderRow={this._renderRow}
        />
      </View>
    );
  }

  _renderRow(mod) {
    const text = `${mod.name}, enabled: ${mod.isEnabled} (${mod.loadingTime})`
    return (
      <Text>{text}</Text>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
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
AppRegistry.registerComponent('ExtensionApp', () => ExtensionApp);
