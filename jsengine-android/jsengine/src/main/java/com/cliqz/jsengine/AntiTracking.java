package com.cliqz.jsengine;

import android.util.Log;

import com.cliqz.jsengine.v8.api.WebRequest;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

/**
 * Created by sammacbeth on 21/10/2016.
 */

public class AntiTracking {

    private final static String TAG = AntiTracking.class.getSimpleName();

    private final static String MODULE_NAME = "antitracking";
    private final static String ENABLE_PREF = "antiTrackTest";
    private final static String QSBLOCKING_PREF = "attrackRemoveQueryStringTracking";
    private final static String BLOOM_FILTER_PREF = "attrackBloomFilter";
    private final static String FORCE_BLOCK_PREF = "attrackForceBlock";

    private final Engine engine;
    private final WebRequest webRequest;

    public AntiTracking(Engine engine) {
        this.engine = engine;
        this.webRequest = engine.webRequest;
    }

    /**
     * Get the default prefs to initialise the antitracking module in enabled state
     * @return
     */
    public static Map<String, Object> getDefaultPrefs() {
        return getDefaultPrefs(true);
    }

    /**
     * Get the default prefs to initialise the antitracking module
     * @param enabled
     * @return
     */
    public static Map<String, Object> getDefaultPrefs(final boolean enabled) {
        final Map<String, Object> prefs = new HashMap<>();
        prefs.put(BLOOM_FILTER_PREF, true);
        prefs.put(ENABLE_PREF, enabled);
        prefs.put(QSBLOCKING_PREF, true);
        prefs.put(FORCE_BLOCK_PREF, true);
        return prefs;
    }

    public void setEnabled(final boolean enabled) throws ExecutionException {
        engine.setPref(BLOOM_FILTER_PREF, true);
        engine.setPref(QSBLOCKING_PREF, true);
        engine.setPref(ENABLE_PREF, true);
        engine.setPref("modules."+ MODULE_NAME + ".enabled", enabled);
    }

    public void setForceBlockEnabled(final boolean enabled) throws ExecutionException {
        engine.setPref(FORCE_BLOCK_PREF, enabled);
    }

    public JSONObject getTabBlockingInfo(final int tabId) {
        try {
            final Object blockingInfo = engine.system.callFunctionOnModuleDefault(MODULE_NAME + "/attrack", "getTabBlockingInfo", tabId, webRequest.getUrlForTab(tabId));
            return new JSONObject(blockingInfo.toString());
        } catch (ExecutionException e) {
            Log.e(TAG, "getTabBlockingInfo", e);
        } catch (JSONException e) {
            // shouldn't happen - the parsed json comes directly from JSON.stringify in JS
            throw new RuntimeException(e);
        }
        // on failure return empty object
        return new JSONObject();
    }

    public boolean isWhitelisted(final String url) {
        try {
            final Object whitelisted = engine.system.callFunctionOnModuleDefault(50, MODULE_NAME + "/attrack", "isSourceWhitelisted", url);
            return whitelisted.equals(Boolean.TRUE);
        } catch (ExecutionException e) {
            Log.e(TAG, "isWhitelisted", e);
        } catch (TimeoutException e) {
            return true;
        }
        return false;
    }

    public void addDomainToWhitelist(final String url) {
        try {
            engine.system.callVoidFunctionOnModuleAttribute(MODULE_NAME + "/attrack", new String[]{"default"}, "addSourceDomainToWhitelist", url);
        } catch (ExecutionException e) {
            Log.e(TAG, "addDomainToWhitelist", e);
        }
    }

    public void removeDomainFromWhitelist(final String url) {
        try {
            engine.system.callVoidFunctionOnModuleAttribute(MODULE_NAME + "/attrack", new String[]{"default"}, "removeSourceDomainFromWhitelist", url);
        } catch (ExecutionException e) {
            Log.e(TAG, "removeDomainFromWhitelist", e);
        }
    }

}
