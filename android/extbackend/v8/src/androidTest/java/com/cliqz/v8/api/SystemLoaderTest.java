package com.cliqz.v8.api;

import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;

import com.cliqz.v8.V8Engine;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Object;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.assertTrue;

/**
 * Created by sammacbeth on 04/10/2016.
 */

@RunWith(AndroidJUnit4.class)
public class SystemLoaderTest {

    private V8Engine engine;

    @Before
    public void setUp() throws Exception {
        engine = new V8Engine();
    }

    @After
    public void tearDown() throws Exception {
        engine.shutdown();
    }

    @Test
    public void testLoaderExists() throws Exception {
        new SystemLoader(engine, InstrumentationRegistry.getTargetContext(), null);

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
}
