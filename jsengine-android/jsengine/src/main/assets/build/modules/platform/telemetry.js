System.register('platform/telemetry', ['core/cliqz'], function (_export) {
  'use strict';

  var utils, VERSION, _telemetry_req, trk, _telemetry_sending, telemetry_MAX_SIZE, trkTimer;

  // subset of CliqzHumanWeb.msgSanitize, excluding cases for messages we won't see
  function msgSanitize(msg) {
    // quick & dirty implementation of the ts_config which would usually come from HW config url.
    msg.ts = new Date().toISOString().substring(0, 10).replace(/-/g, "");

    console.log(JSON.stringify(msg));

    if (!msg.ts || msg.ts == '') {
      return null;
    }

    // Adding anti-duplicate key, so to detect duplicate messages on the backend.
    msg['anti-duplicates'] = Math.floor(Math.random() * 10000000);

    return msg;
  }

  // from CliqzHumanWeb.telemetry with unneeded parts removed
  function hwTelemetry(msg, instantPush) {
    msg.ver = VERSION;
    msg.platform = "mobile";
    msg = msgSanitize(msg);
    if (msg) trk.push(msg);
    utils.clearTimeout(trkTimer);
    if (instantPush || trk.length % 100 == 0) {
      pushTelemetry();
    } else {
      trkTimer = utils.setTimeout(pushTelemetry, 60000);
    }
  }

  function pushTelemetry() {
    if (_telemetry_req) return; // request already underway
    if (trk.length === 0) return; // nothing to send

    // put current data aside in case of failure
    _telemetry_sending = trk.splice(0);
    var data = JSON.stringify(_telemetry_sending);
    _telemetry_req = utils.promiseHttpHandler('POST', utils.SAFE_BROWSING, data, 60000, true);
    _telemetry_req.then(function () {
      try {
        var response = JSON.parse(req.response);
        _telemetry_sending = [];
        _telemetry_req = null;
      } catch (e) {}
    });
    _telemetry_req['catch'](pushTelemetryError);
  }

  function pushTelemetryError(req) {
    // pushTelemetry failed, put data back in queue to be sent again later
    trk = _telemetry_sending.concat(trk);

    // Remove some old entries if too many are stored, to prevent unbounded growth when problems with network.
    var slice_pos = trk.length - telemetry_MAX_SIZE + 100;
    if (slice_pos > 0) {
      trk = trk.slice(slice_pos);
    }

    _telemetry_sending = [];
    _telemetry_req = null;
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      VERSION = '2.2';
      _telemetry_req = null;
      trk = [];
      _telemetry_sending = [];
      telemetry_MAX_SIZE = 500;
      trkTimer = null;
      ;
      _export('default', {
        telemetry: function telemetry(payload) {
          utils.log("Sending telemetry", "xxx");
          hwTelemetry(payload);
        },
        msgType: 'humanweb'
      });
    }
  };
});