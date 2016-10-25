package com.cliqz.jsengine.v8;

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
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;


/**
 * Created by sammacbeth on 26/09/2016.
 */

public class JSTimerTest {

    private V8Engine engine;
    private Timers timers;
    private BlockingQueue<String> asyncCallbacks = new LinkedBlockingQueue<>();

    @Before
    public void setUp() throws Exception {
        engine = new V8Engine();
        timers = new Timers(engine);

        // async test helper
        asyncCallbacks.clear();
        engine.asyncQuery(new V8Engine.Query<Object>() {
            public Object query(V8 runtime) {
                runtime.registerJavaMethod(new JavaVoidCallback() {
                    @Override
                    public void invoke(V8Object v8Object, V8Array v8Array) {
                        asyncCallbacks.offer(v8Array.getString(0));
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

    public void testFunctionExists(final String functionName) throws Exception {
        Boolean funcIsUndefined = engine.queryEngine(new V8Engine.Query<Boolean>() {
            public Boolean query(V8 runtime) {
                V8Object fn = runtime.getObject(functionName);
                final boolean isUndefined = fn.isUndefined();
                fn.release();
                return isUndefined;
            }
        });
        assertFalse(funcIsUndefined);
    }

    @Test
    public void setTimeoutExists() throws Exception {
        testFunctionExists("setTimeout");
    }

    @Test
    public void setIntervalExists() throws Exception {
        testFunctionExists("setInterval");
    }

    @Test
    public void clearIntervalExists() throws Exception {
        testFunctionExists("clearInterval");
    }

    @Test
    public void clearTimeoutExists() throws Exception {
        testFunctionExists("clearTimeout");
    }

    @Test
    public void setTimeoutTest() throws Exception {
        Integer id = engine.queryEngine(new V8Engine.Query<Integer>() {
            public Integer query(V8 runtime) {
                return runtime.executeIntegerScript("setTimeout(function() { testCallback('cb') }, 1)");
            }
        });
        // it returns a timer id
        assertNotNull(id);
        // call is not immediate
        assertTrue(asyncCallbacks.isEmpty());

        // wait for callback and test expected value
        String cb = asyncCallbacks.poll(100, TimeUnit.MILLISECONDS);
        assertEquals("cb", cb);

        // test that callback is only called once
        cb = asyncCallbacks.poll(20, TimeUnit.MILLISECONDS);
        assertNull(cb);
    }

    @Test
    public void clearTimeoutTest() throws Exception {
        final Integer id = engine.queryEngine(new V8Engine.Query<Integer>() {
            public Integer query(V8 runtime) {
                return runtime.executeIntegerScript("setTimeout(function() { testCallback('cb') }, 50)");
            }
        });
        engine.queryEngine(new V8Engine.Query<Object>() {
            public Object query(V8 runtime) {
                runtime.executeVoidScript("clearTimeout(" + id + ");");
                return null;
            }
        });
        // callback has not been made
        assertTrue(asyncCallbacks.isEmpty());
        // test that callback is never made
        String cb = asyncCallbacks.poll(50, TimeUnit.MILLISECONDS);
        assertNull(cb);
    }

    @Test
    public void setIntervalTest() throws Exception {
        Integer id = engine.queryEngine(new V8Engine.Query<Integer>() {
            public Integer query(V8 runtime) {
                return runtime.executeIntegerScript("setInterval(function() { testCallback('cb') }, 1)");
            }
        });
        // it returns a timer id
        assertNotNull(id);
        // call is not immediate
        assertTrue(asyncCallbacks.isEmpty());

        // wait for callback and test expected value
        String cb = asyncCallbacks.poll(100, TimeUnit.MILLISECONDS);
        assertEquals("cb", cb);

        // test that callback is called a second time
        cb = asyncCallbacks.poll(20, TimeUnit.MILLISECONDS);
        assertEquals("cb", cb);
    }

    @Test
    public void clearIntervalTest() throws Exception {
        final Integer id = engine.queryEngine(new V8Engine.Query<Integer>() {
            public Integer query(V8 runtime) {
                return runtime.executeIntegerScript("setInterval(function() { testCallback('cb') }, 10)");
            }
        });
        // callback has not been made
        assertTrue(asyncCallbacks.isEmpty());

        // check for first callback
        String cb = asyncCallbacks.poll(100, TimeUnit.MILLISECONDS);
        assertEquals("cb", cb);

        // now cancel timeout
        engine.queryEngine(new V8Engine.Query<Object>() {
            public Object query(V8 runtime) {
                runtime.executeVoidScript("clearInterval(" + id + ");");
                return null;
            }
        });
        // test that callback is never made again
        cb = asyncCallbacks.poll(50, TimeUnit.MILLISECONDS);
        assertNull(cb);
    }

    @Test
    public void setTimeoutArgsTest() throws Exception {
        final Integer id = engine.queryEngine(new V8Engine.Query<Integer>() {
            public Integer query(V8 runtime) {
                return runtime.executeIntegerScript("setTimeout(function(x) { testCallback(x) }, 10, 'optionalArg')");
            }
        });
        // callback has not been made
        assertTrue(asyncCallbacks.isEmpty());

        // check for first callback
        String cb = asyncCallbacks.poll(100, TimeUnit.MILLISECONDS);
        assertEquals("optionalArg", cb);
    }
}
