package com.cliqz.jsengine;

import android.util.Log;

import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Object;
import com.eclipsesource.v8.debug.mirror.StringMirror;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

/**
 * Created by sammacbeth on 27/10/2016.
 */

public class Adblocker {

    private final static String TAG = Adblocker.class.getSimpleName();

    private final Engine engine;

    private final static String MODULE_NAME = "adblocker";
    private final static String ENABLE_PREF = "cliqz-adb";
    private final static String ABTEST_PREF = "cliqz-adb-abtest";

    public Adblocker(Engine engine) {
        this.engine = engine;
    }

    /**
     * Get default prefences to load the adblock module in a disabled state
     * @return
     */
    public static Map<String, Object> getDefaultPrefs() {
        return getDefaultPrefs(false);
    }

    /**
     * Get the default preferences to load the adblock module in the state given by enabled
     * @param enabled
     * @return
     */
    public static Map<String, Object> getDefaultPrefs(final boolean enabled) {
        final Map<String, Object> prefs = new HashMap<>();
        prefs.put(ABTEST_PREF, true);
        prefs.put(ENABLE_PREF, 1);
        prefs.put("modules."+ MODULE_NAME + ".enabled", enabled);
        return prefs;
    }

    public void setEnabled(final boolean enabled) throws ExecutionException {
        engine.setPref(ABTEST_PREF, true);
        engine.setPref(ENABLE_PREF, enabled ? 1 : 0);
        engine.setPref("modules."+ MODULE_NAME + ".enabled", enabled);
    }

    public JSONObject getAdBlockingInfo(final String url) {
        try {
            final Object stats = engine.system.callFunctionOnModuleAttribute(MODULE_NAME + "/adblocker", new String[]{"default", "adbStats"}, "report", url);
            return new JSONObject(stats.toString());
        } catch(ExecutionException | JSONException e) {
//            Log.e(TAG, "getAdBlockingInfo", e);
        }
        return new JSONObject();
    }

    public boolean isBlacklisted(final String url) {
        try {
            final Object blacklisted = engine.system.callFunctionOnModuleAttribute(50, MODULE_NAME +"/adblocker", new String[]{"default", "adBlocker"}, "isDomainInBlacklist", url);
            return blacklisted.equals(Boolean.TRUE);
        } catch(ExecutionException e) {
//            Log.e(TAG, "isBlacklisted", e);
        } catch(TimeoutException e) {
            return false;
        }
        return false;
    }

    public void toggleUrl(final String url, final boolean domain) {
        try {
            engine.system.callFunctionOnModuleAttribute(MODULE_NAME +"/adblocker", new String[]{"default", "adBlocker"}, "toggleUrl", url, domain);
        } catch(ExecutionException e) {
//            Log.e(TAG, "toggleUrl", e);
        }
    }

}
