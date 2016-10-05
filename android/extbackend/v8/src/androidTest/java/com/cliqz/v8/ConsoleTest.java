package com.cliqz.v8;

import com.eclipsesource.v8.V8;

import org.junit.Test;

/**
 * Created by sammacbeth on 29/09/2016.
 */

public class ConsoleTest {

    @Test
    public void consoleTest() throws Exception {
        V8Engine engine = new V8Engine();
        new JSConsole(engine);
        // test that console log and err functions do not raise errors
        engine.queryEngine(new V8Engine.Query<Object>() {
            public Object query(V8 runtime) {
                runtime.executeVoidScript("console.log('test');");
                runtime.executeVoidScript("console.err('error test');");
                return null;
            }
        });
        engine.shutdown();
    }
}
