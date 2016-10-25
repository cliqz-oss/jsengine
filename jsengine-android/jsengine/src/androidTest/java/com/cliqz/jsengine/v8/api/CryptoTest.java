package com.cliqz.jsengine.v8.api;

import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Created by sammacbeth on 04/10/2016.
 */

public class CryptoTest {

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
    public void testMd5() throws Exception {
        new Crypto(engine);

        String hashedString = engine.queryEngine(new V8Engine.Query<String>() {
            @Override
            public String query(V8 runtime) {
                return runtime.executeStringScript("crypto.md5('test')");
            }
        });

        assertEquals("098f6bcd4621d373cade4e832627b4f6", hashedString);
    }
}
