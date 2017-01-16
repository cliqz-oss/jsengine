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

import java.util.Map;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

/**
 * Created by sammacbeth on 05/12/2016.
 */

@RunWith(AndroidJUnit4.class)
public class AdblockerTest {

    private Context appContext;
    private Engine extension;
    private Adblocker adb;

    @Before
    public void setUp() throws Exception {
        appContext = InstrumentationRegistry.getTargetContext();
        extension = new Engine(appContext, true);
        adb = new Adblocker(extension);
        Map<String, Object> defaultPrefs = Adblocker.getDefaultPrefs(true);
        defaultPrefs.putAll(AntiTracking.getDefaultPrefs(false));
        defaultPrefs.putAll(Engine.getDebugPrefs());
        extension.startup(defaultPrefs);
        extension.getPref("test");
    }

    @After
    public void tearDown() throws Exception {
        // non strict shutdown because of adblocker memory leaks.
        extension.shutdown(false);
        // reset prefs
        appContext.deleteFile("cliqz.prefs.json");
    }

    @Test
    public void testBasicApi() throws Exception {

    }

    @Test
    public void testBlackListing() throws Exception {

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

    }

    @Test
    public void testListLoading() throws Exception {
        final int MAX_TRIES = 20;

        final V8Object requestDetails = extension.jsengine.queryEngine(new V8Engine.Query<V8Object>() {
            @Override
            public V8Object query(V8 runtime) {
                V8Object details = new V8Object(runtime);
                details.add("type", 2);
                details.add("method", "GET");
                details.add("source", "http://www.bbc.com/");
                details.add("url", "http://me-cdn.effectivemeasure.net/em.js");
                return details;
            }
        });

        final V8Object adblocker = extension.system.loadModule("adblocker/adblocker");
        boolean isBlocked = false;
        int tryCtr = 0;
        do {
            isBlocked = extension.jsengine.queryEngine(new V8Engine.Query<Boolean>() {
                @Override
                public Boolean query(V8 runtime) {
                    MemoryManager scope = new MemoryManager(runtime);
                    try {
                        V8Object mod = adblocker.getObject("default");
                        V8Object observer = mod.getObject("httpopenObserver");
                        V8Array parameters = new V8Array(runtime).push(requestDetails);
                        V8Object response = observer.executeObjectFunction("observe", parameters);
                        return response.getBoolean("cancel");
                    } catch(V8ResultUndefined e) {
                        return false;
                    } finally {
                        scope.release();
                    }
                }
            });
            if (!isBlocked) {
                tryCtr++;
                Thread.sleep(200);
            }
        } while(!isBlocked && tryCtr < MAX_TRIES);

        // check adblock info is available
        JSONObject adbInfo = adb.getAdBlockingInfo("http://www.bbc.com/");
        assertTrue(adbInfo.getJSONObject("advertisersList").has("Effective Measure"));

        extension.jsengine.queryEngine(new V8Engine.Query<Object>() {
            @Override
            public Object query(V8 runtime) {
                adblocker.release();
                requestDetails.release();
                return null;
            }
        });

        if (tryCtr == MAX_TRIES) {
            fail();
        }
    }
}
