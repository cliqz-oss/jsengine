package com.cliqz.jsengine.v8.api;

import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;

import com.cliqz.jsengine.v8.JSConsole;
import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Object;

import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.ExecutionException;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

/**
 * Created by sammacbeth on 04/10/2016.
 */

@RunWith(AndroidJUnit4.class)
public class SystemLoaderTest {

    private V8Engine engine;
    private SystemLoader system;

    @Before
    public void setUp() throws Exception {
        engine = new V8Engine();
        new JSConsole(engine);
        system = new SystemLoader(engine, InstrumentationRegistry.getTargetContext(), "system_test");
    }

    @After
    public void tearDown() throws Exception {
        engine.shutdown();
    }

    @Test
    public void testLoaderExists() throws Exception {

        boolean exists = engine.queryEngine(new V8Engine.Query<Boolean>() {
            @Override
            public Boolean query(V8 runtime) {
                V8Object system = null;
                V8Object importFn = null;
                try {
                    system = runtime.getObject("System");
                    if (system.isUndefined()) return false;

                    importFn = system.getObject("import");
                    if (importFn.isUndefined()) return false;

                    return true;
                } finally {
                    if (system != null) {
                        system.release();
                    }
                    if (importFn != null) {
                        importFn.release();
                    }
                }
            }
        });
        assertTrue(exists);
    }

    @Test
    public void testLoaderLoadModuleNotExists() throws Exception {
        new JSConsole(engine);
        SystemLoader system = new SystemLoader(engine, InstrumentationRegistry.getTargetContext(), null);

        try {
            V8Object module = system.loadModule("nonexistant_module");
            fail("load non-existant module should throw ExecutionException");
        } catch(ExecutionException e) {
        }
    }

    @Test
    public void testLoaderLoadModule() throws Exception {
        final V8Object module = system.loadModule("test");
        assertNotNull(module);
        engine.queryEngine(new V8Engine.Query<Object>() {
            @Override
            public Object query(V8 runtime) {
                module.release();
                return null;
            }
        });
    }

    @Test
    public void testLoaderCallMethod() throws Exception {
        Object result = system.callFunctionOnModule("test", "testfn");
        assertEquals("fnCalled", result.toString());
    }

    @Test
    public void testLoaderCallMethodNotExistant() throws Exception {
        try {
            Object result = system.callFunctionOnModule("test", "nonexistant");
            fail();
        } catch(ExecutionException e) {
        }
    }

    @Test
    public void testLoaderCallMethodNotAFunction() throws Exception {
        try {
            Object result = system.callFunctionOnModule("test", "default");
            fail();
        } catch(ExecutionException e) {
        }
    }

    @Test
    public void testLoaderCallMethodOnDefault() throws Exception {
        Object result = system.callFunctionOnModuleDefault("test", "test");
        assertEquals(result, "test");
    }

    @Test
    public void testLoaderCallMethodOnDefaultReturnJSON() throws Exception {
        Object result = system.callFunctionOnModuleDefault("test", "test_object");
        JSONObject jsonResult = new JSONObject(result.toString());
        assertTrue(jsonResult.has("test"));
        assertTrue(jsonResult.getBoolean("test"));
    }
}
