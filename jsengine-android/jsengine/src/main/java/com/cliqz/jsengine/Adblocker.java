package com.cliqz.jsengine;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * Created by sammacbeth on 27/10/2016.
 */

public class Adblocker {

    private final Engine engine;

    private final static String MODULE_NAME = "adblocker";
    private final static String ENABLE_PREF = "cliqz-adb";
    private final static String ABTEST_PREF = "cliqz-adb-abtest";

    public Adblocker(Engine engine) {
        this.engine = engine;
    }

    public Map<String, Object> getDefaultPrefs() {
        final Map<String, Object> prefs = new HashMap<>();
        prefs.put(ABTEST_PREF, true);
        prefs.put(ENABLE_PREF, 1);
        return prefs;
    }

    public void setEnabled(final boolean enabled) throws ExecutionException {
        engine.setPref(ABTEST_PREF, true);
        engine.setPref(ENABLE_PREF, 1);
        engine.setPref("modules."+ MODULE_NAME + ".enabled", enabled);
    }
}
