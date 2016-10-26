package com.cliqz.jsengine.v8;

import android.util.Log;

import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Object;

import java.util.concurrent.ExecutionException;

/**
 * Created by sammacbeth on 29/09/2016.
 */

public class JSConsole {
    private static final String TAG = JSConsole.class.getSimpleName();
    private V8Object v8Console;

    public JSConsole(V8Engine engine) throws JSApiException {
        try {
            engine.asyncQuery(new V8Engine.Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    v8Console = new V8Object(runtime);
                    runtime.add("console", v8Console);
                    v8Console.registerJavaMethod(JSConsole.this, "log", "log", new Class<?>[] { Object.class });
                    v8Console.registerJavaMethod(JSConsole.this, "err", "err", new Class<?>[] { Object.class });
                    return null;
                }
            });
        } catch (InterruptedException | ExecutionException e) {
            throw new JSApiException(e);
        }
        engine.registerShutdownHook(new V8Engine.Query() {
            @Override
            public Object query(V8 runtime) {
                v8Console.release();
                return null;
            }
        });
    }

    public void log(final Object message) {
        Log.d(TAG, message.toString());
    }

    public void err(final Object message) {
        Log.e(TAG, message.toString());
    }
}
