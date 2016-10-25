package com.cliqz.jsengine.v8.api;

import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.JavaVoidCallback;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Object;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 * Created by sammacbeth on 29/09/2016.
 */

public class HttpHandlerTest {

    private V8Engine engine;
    private BlockingQueue<String> asyncCallbacks = new LinkedBlockingQueue<>();

    @Before
    public void setUp() throws Exception {
        engine = new V8Engine();

        // async test helper
        asyncCallbacks.clear();
        engine.asyncQuery(new V8Engine.Query<Object>() {
            public Object query(V8 runtime) {
                runtime.registerJavaMethod(new JavaVoidCallback() {
                    @Override
                    public void invoke(V8Object v8Object, V8Array v8Array) {
                        String val = "";
                        if (v8Array != null && v8Array.length() > 0) {
                            val = v8Array.getString(0);
                        }
                        asyncCallbacks.offer(val);
                    }
                }, "testCallback");
                return null;
            }
        });
    }

    @After
    public void tearDown() throws Exception {
        engine.shutdown();
    }

    @Test
    public void testFunctionExists() throws Exception {
        new HttpHandler(engine);
        boolean fnExists = engine.queryEngine(new V8Engine.Query<Boolean>() {
            @Override
            public Boolean query(V8 runtime) {
                V8Object fn = runtime.getObject("httpHandler");
                final boolean exists = !fn.isUndefined();
                fn.release();
                return exists;
            }
        });
        assertTrue(fnExists);
    }

    @Test
    public void testRequestFailed() throws Exception {
        final HttpHandler handler = new HttpHandler(engine);
        boolean ret = engine.queryEngine(new V8Engine.Query<Boolean>() {
            @Override
            public Boolean query(V8 runtime) {
                return runtime.executeBooleanScript("httpHandler('GET', 'http://cliqz.com/favicon.ico', testCallback, testCallback, 10000, null);");
            }
        });
        assertTrue(ret);
        String data = asyncCallbacks.poll(1000, TimeUnit.MILLISECONDS);
        assertEquals("", data);
    }

    @Test
    public void testRejectedRequest() throws Exception {
        final HttpHandler handler = new HttpHandler(engine, HttpRequestPolicy.NEVER_ALLOWED);
        boolean ret = engine.queryEngine(new V8Engine.Query<Boolean>() {
            @Override
            public Boolean query(V8 runtime) {
                return runtime.executeBooleanScript("httpHandler('GET', 'http://cliqz.com/favicon.ico', testCallback, testCallback, 10000, null);");
            }
        });
        assertFalse(ret);
        String data = asyncCallbacks.poll(1000, TimeUnit.MILLISECONDS);
        assertEquals("", data);
    }
}
