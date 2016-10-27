package com.cliqz.jsengine.v8;

import android.util.Log;

import com.eclipsesource.v8.JavaVoidCallback;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
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
                    v8Console.registerJavaMethod(new JavaVoidCallback() {
                        @Override
                        public void invoke(V8Object v8Object, V8Array v8Array) {
                            //final StringBuilder parts = new StringBuilder();
                            log(v8Array.toString());
                        }
                    }, "log");
                    v8Console.registerJavaMethod(new JavaVoidCallback() {
                        @Override
                        public void invoke(V8Object v8Object, V8Array v8Array) {
                            //final StringBuilder parts = new StringBuilder();
                            error(v8Array.toString());
                        }
                    }, "error");
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

    public void log(final String message) {
        Log.d(TAG, message);
    }

    public void error(final String message) {
        Log.e(TAG, message);
    }
}
