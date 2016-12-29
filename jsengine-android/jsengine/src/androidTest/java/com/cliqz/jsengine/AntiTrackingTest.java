package com.cliqz.jsengine;

import android.content.Context;
import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;
import android.util.Log;

import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Object;
import com.eclipsesource.v8.V8ResultUndefined;
import com.eclipsesource.v8.utils.MemoryManager;

import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

/**
 * Created by sammacbeth on 25/10/2016.
 */

@RunWith(AndroidJUnit4.class)
public class AntiTrackingTest {

    private Context appContext;

    @Before
    public void setUp() throws Exception {
        appContext = InstrumentationRegistry.getTargetContext();
    }

    @After
    public void tearDown() throws Exception {
        // reset prefs
        appContext.deleteFile("cliqz.prefs.json");
    }

    @Test
    public void testBasicApi() throws Exception {
        Engine extension = new Engine(appContext, true);
        AntiTracking attrack = new AntiTracking(extension);
        extension.startup(attrack.getDefaultPrefs());
        attrack.setEnabled(true);
        final JSONObject tabInfo = attrack.getTabBlockingInfo(1);
        assertTrue(tabInfo.has("error"));
        extension.shutdown();
    }

    @Test
    public void testWhitelisting() throws Exception {
        Engine extension = new Engine(appContext, true);
        AntiTracking attrack = new AntiTracking(extension);
        extension.startup(attrack.getDefaultPrefs());
        attrack.setEnabled(true);

        final String testUrl = "cliqz.com";
        assertFalse(attrack.isWhitelisted(testUrl));
        attrack.addDomainToWhitelist(testUrl);
        assertTrue(attrack.isWhitelisted(testUrl));
        attrack.removeDomainFromWhitelist(testUrl);
        assertFalse(attrack.isWhitelisted(testUrl));

        extension.shutdown();
    }

    @Test
    public void testLoading() throws Exception {
        final int MAX_TRIES = 20;
        Engine extension = new Engine(appContext, true);
        AntiTracking attrack = new AntiTracking(extension);
        extension.startup(attrack.getDefaultPrefs());
        attrack.setEnabled(true);

        final V8Object at = extension.system.loadModule("antitracking/attrack");
        boolean isReady = false;
        int tryCtr = 0;

        do {
            isReady = extension.jsengine.queryEngine(new V8Engine.Query<Boolean>() {
                @Override
                public Boolean query(V8 runtime) {
                    MemoryManager scope = new MemoryManager(runtime);
                    try {
                        V8Object mod = at.getObject("default");
                        V8Object whitelist = mod.getObject("qs_whitelist");
                        V8Array parameters = new V8Array(runtime);
                        boolean isReady = whitelist.executeBooleanFunction("isReady", parameters);
                        boolean isUpToDate = whitelist.executeBooleanFunction("isUpToDate", parameters);
                        return isReady && isUpToDate;
                    } catch (V8ResultUndefined e) {
                        return false;
                    } finally {
                        scope.release();
                    }
                }
            });
            if (!isReady) {
                tryCtr++;
                Thread.sleep(200);
            }
        } while(!isReady && tryCtr < MAX_TRIES);

        extension.jsengine.queryEngine(new V8Engine.Query<Object>() {
            @Override
            public Object query(V8 runtime) {
                at.release();
                return null;
            }
        });

        extension.shutdown();

        if (tryCtr == MAX_TRIES) {
            fail();
        }
    }
}
