package com.cliqz.jsengine;

import android.content.Context;
import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;

import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Object;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.ExecutionException;

import static junit.framework.Assert.fail;
import static org.junit.Assert.assertTrue;

@RunWith(AndroidJUnit4.class)
public class EngineTest {

    @Test
    public void testEngineStartup() throws Exception {
        Context appContext = InstrumentationRegistry.getTargetContext();
        Engine extension = new Engine(appContext);
        extension.startup();

        extension.shutdown();
    }
    @Test
    public void testEngineStartupThenException() throws Exception {
        Context appContext = InstrumentationRegistry.getTargetContext();
        Engine extension = new Engine(appContext);
        extension.startup();
        try {
            V8Object result = extension.jsengine.queryEngine(new V8Engine.Query<V8Object>() {
                @Override
                public V8Object query(V8 runtime) {
                    V8Object test = runtime.getObject("test");
                    V8Array args =  new V8Array(runtime);
                    try {
                        runtime.executeScript("var test = {test: function() { return fnDoesNotExist() }};");

                        return test.executeObjectFunction("test", args);
                    } finally {
                        test.release();
                        args.release();
                    }
                }
            });
            fail();
        } catch(ExecutionException e) {}

        extension.shutdown();
    }
}
