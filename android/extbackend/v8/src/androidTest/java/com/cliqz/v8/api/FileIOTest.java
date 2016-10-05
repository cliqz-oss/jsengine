package com.cliqz.v8.api;

import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;

import com.cliqz.v8.V8Engine;
import com.eclipsesource.v8.JavaVoidCallback;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Object;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertEquals;


/**
 * Created by sammacbeth on 04/10/2016.
 */

@RunWith(AndroidJUnit4.class)
public class FileIOTest {

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
    public void testWriteThenReadIsIdentity() throws Exception {
        final String testData = "some data to write to the file.\n With line breaks\n";
        new FileIO(engine, InstrumentationRegistry.getTargetContext());

        // write some data
        engine.queryEngine(new V8Engine.Query<Object>() {
            @Override
            public Object query(V8 runtime) {
                runtime.executeVoidScript("fs.writeFile('test.txt', '" + testData.replace("\n", "\\n") + "');");
                return null;
            }
        });

        // now read it back
        engine.queryEngine(new V8Engine.Query<Object>() {
            @Override
            public Object query(V8 runtime) {
                runtime.executeVoidScript("fs.readFile('test.txt', testCallback);");
                return null;
            }
        });

        String data = asyncCallbacks.poll(100, TimeUnit.MILLISECONDS);
        assertEquals(testData, data);
    }
}
