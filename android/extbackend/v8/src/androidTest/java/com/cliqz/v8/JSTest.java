package com.cliqz.v8;

import com.eclipsesource.v8.V8;

import org.junit.Test;

import static org.junit.Assert.assertEquals;


/**
 * Created by sammacbeth on 26/09/2016.
 */

public class JSTest {

    @Test
    public void v8EngineQueryTest() throws Exception {
        V8Engine engine = new V8Engine();
        int engineResponse = engine.queryEngine(new V8Engine.Query<Integer>() {
            public Integer query(V8 runtime) {
                return runtime.executeIntegerScript("5+3");
            }
        });
        assertEquals(8, engineResponse);
        engine.shutdown();
    }

    @Test
    public void timerModuleMemoryLeakTest() throws Exception {
        V8Engine engine = new V8Engine();
        new Timers(engine);
        engine.shutdown();
    }
}
