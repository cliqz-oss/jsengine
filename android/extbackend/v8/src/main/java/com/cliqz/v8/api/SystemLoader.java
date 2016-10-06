package com.cliqz.v8.api;

import android.content.Context;
import android.util.Log;

import com.cliqz.v8.JSApiException;
import com.cliqz.v8.V8Engine;
import com.eclipsesource.v8.JavaCallback;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Function;
import com.eclipsesource.v8.V8Object;
import com.eclipsesource.v8.V8ScriptException;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Created by sammacbeth on 04/10/2016.
 */

public class SystemLoader {

    private static final String TAG = SystemLoader.class.getSimpleName();

    final V8Engine engine;
    final Context context;
    final String moduleRoot;
    V8 runtime = null;

    public SystemLoader(final V8Engine engine, final Context context, final String moduleRoot) throws JSApiException {
        this.engine = engine;
        this.context = context;
        this.moduleRoot = moduleRoot;

        try {
            // create dummy exports object for polyfill to be added
            engine.executeScript("var exports = {}");
            loadJavascriptSource("system-polyfill.js");
            engine.executeScript("var System = exports.System;");
            engine.asyncQuery(new V8Engine.Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    SystemLoader.this.runtime = runtime;
                    runtime.registerJavaMethod(SystemLoader.this, "loadSubScript", "loadSubScript", new Class<?>[] { String.class });
                    return null;
                }
            });
        } catch (IOException | InterruptedException | ExecutionException e) {
            throw new JSApiException(e);
        }
    }

    public boolean loadSubScript(final String scriptPath) throws IOException {
        Log.d(TAG, "loadSubScript: "+ scriptPath);
            String script = readSourceFile(this.moduleRoot + scriptPath);
            runtime.executeVoidScript(script);
            return true;
    }

    class PromiseCallback implements Future<V8Object> {

        private final V8 runtime;
        private V8Object thenResult = null;
        private V8Object catchResult = null;

        PromiseCallback(V8 runtime) {
            this.runtime = runtime;
        }

        V8Function thenCallback() {
            return new V8Function(runtime, new JavaCallback() {
                @Override
                public Object invoke(V8Object v8Object, V8Array v8Array) {
                    PromiseCallback.this.thenResult = v8Array.getObject(0);
                    notifyAll();
                    return null;
                }
            });
        }

        V8Function catchCallback() {
            return new V8Function(runtime, new JavaCallback() {
                @Override
                public Object invoke(V8Object v8Object, V8Array v8Array) {
                    PromiseCallback.this.catchResult = v8Array.getObject(0);
                    notifyAll();
                    return null;
                }
            });
        }

        V8Object attachToPromise(V8Object promise) {
            final V8Function thenCb = thenCallback();
            final V8Function catchCb = catchCallback();
            final V8Array thenArgs = new V8Array(runtime).push(thenCb);
            final V8Array catchArgs = new V8Array(runtime).push(catchCb);
            V8Object intermediatePromise = null;
            try {
                intermediatePromise = promise.executeObjectFunction("then", thenArgs);
                return intermediatePromise.executeObjectFunction("catch", catchArgs);
            } finally {
                thenArgs.release();
                catchArgs.release();
                thenCb.release();
                catchCb.release();
                if (intermediatePromise != null) {
                    intermediatePromise.release();
                }
                promise.release();
            }
        }

        @Override
        public boolean cancel(boolean mayInterruptIfRunning) {
            return false;
        }

        @Override
        public boolean isCancelled() {
            return false;
        }

        @Override
        public boolean isDone() {
            return thenResult != null || catchResult != null;
        }

        @Override
        public V8Object get() throws InterruptedException, ExecutionException {
            while (!isDone()) {
                wait();
            }
            try {
                return getResult();
            } finally {
                if (catchResult != null) {
                    catchResult.release();
                }
                if (thenResult != null) {
                    thenResult.release();
                }
            }
        }

        private V8Object getResult() throws ExecutionException {
            if (catchResult != null) {
                throw new ExecutionException("Promise.catch: " + catchResult.toString(), new RuntimeException());
            }
            if (thenResult != null) {
                return thenResult;
            }
            return null;
        }

        @Override
        public V8Object get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
            while (!isDone()) {
                wait(unit.toMillis(timeout));
            }
            try {
                return getResult();
            } finally {
                if (catchResult != null) {
                    catchResult.release();
                }
                if (thenResult != null) {
                    thenResult.release();
                }
            }
        }
    }

    public V8Object loadModule(final String moduleName) throws ExecutionException {
        try {
            return engine.queryEngine(new V8Engine.Query<V8Object>() {
                @Override
                public V8Object query(V8 runtime) {
                    V8Array moduleArgs = new V8Array(runtime).push(moduleName);
                    V8Object system = runtime.getObject("System");
                    try {
                        PromiseCallback callback = new PromiseCallback(runtime);
                        callback.attachToPromise(system.executeObjectFunction("import", moduleArgs)).release();
                        return callback.get();
                    } catch (InterruptedException | ExecutionException e) {
                        Log.e(TAG, "Error loading module: " + moduleName, e);
                        return null;
                    } finally {
                        moduleArgs.release();
                        system.release();
                    }
                }
            });
        } catch (InterruptedException | TimeoutException e) {
            Log.e(TAG, "Error querying for module: "+ moduleName, e);
            throw new ExecutionException(e);
        }
    }

    String readSourceFile(final String assetPath) throws IOException {
        InputStream stream = null;
        try {
            stream = context.getAssets().open(assetPath);
            BufferedReader srcReader = new BufferedReader(new InputStreamReader(stream));
            String script = "";
            String line;
            while ((line = srcReader.readLine()) != null) {
                script += line + "\n";
            }
            return script;
        }  finally {
            try {
                if (stream != null) {
                    stream.close();
                }
            } catch (IOException e) {
            }
        }
    }

    void loadJavascriptSource(final String assetPath) throws ExecutionException, IOException {
            String script = readSourceFile(assetPath);
            engine.executeScript(script);
    }
}
