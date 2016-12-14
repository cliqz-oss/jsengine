package com.cliqz.jsengine;

import android.content.Context;
import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;

import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;

import org.json.JSONObject;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 * Created by sammacbeth on 05/12/2016.
 */

@RunWith(AndroidJUnit4.class)
public class AdblockerTest {

    @Test
    public void testBasicApi() throws Exception {
        Context appContext = InstrumentationRegistry.getTargetContext();
        Engine extension = new Engine(appContext, true);
        Adblocker adb = new Adblocker(extension);
        extension.startup(adb.getDefaultPrefs());
        adb.setEnabled(true);
        extension.shutdown();
    }

    @Test
    public void testBlackListing() throws Exception {
        Context appContext = InstrumentationRegistry.getTargetContext();
        Engine extension = new Engine(appContext, true);
        Adblocker adb = new Adblocker(extension);
        extension.startup(adb.getDefaultPrefs());
        extension.setLoggingEnabled(true);
        adb.setEnabled(true);

        extension.jsengine.queryEngine(new V8Engine.Query<Object>() {
            @Override
            public Object query(V8 runtime) {
                runtime.executeVoidScript("console.log(JSON.stringify(Object.keys(System.get('adblocker/adblocker').default)))");
                return null;
            }
        });

        final String testUrl = "https://cliqz.com";
        assertFalse(adb.isBlacklisted(testUrl));
        adb.toggleUrl(testUrl, true);
        assertTrue(adb.isBlacklisted(testUrl));
        adb.toggleUrl(testUrl, true);
        assertFalse(adb.isBlacklisted(testUrl));

        extension.shutdown();
    }
}
