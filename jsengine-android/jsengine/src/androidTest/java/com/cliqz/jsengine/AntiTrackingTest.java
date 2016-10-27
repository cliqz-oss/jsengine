package com.cliqz.jsengine;

import android.content.Context;
import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;
import android.util.Log;

import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

/**
 * Created by sammacbeth on 25/10/2016.
 */

@RunWith(AndroidJUnit4.class)
public class AntiTrackingTest {
    @Test
    public void testBasicApi() throws Exception {
        Context appContext = InstrumentationRegistry.getTargetContext();
        Engine extension = new Engine(appContext);
        AntiTracking attrack = new AntiTracking(extension);
        extension.startup(attrack.getDefaultPrefs());
        attrack.setEnabled(true);
        final JSONObject tabInfo = attrack.getTabBlockingInfo(1);
        assertTrue(tabInfo.has("error"));
        extension.shutdown();
    }
}
