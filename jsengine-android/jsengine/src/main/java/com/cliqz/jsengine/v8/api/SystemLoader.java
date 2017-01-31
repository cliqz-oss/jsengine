package com.cliqz.jsengine.v8.api;

import android.content.Context;
import android.util.Log;

import com.cliqz.jsengine.v8.JSApiException;
import com.cliqz.jsengine.v8.QueryException;
import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.JavaCallback;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Function;
import com.eclipsesource.v8.V8Object;
import com.eclipsesource.v8.V8ResultUndefined;
import com.eclipsesource.v8.V8ScriptExecutionException;

import java.io.IOException;
import java.sql.Time;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
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
    private final Map<String, V8Object> moduleCache = new HashMap<>();

    public SystemLoader(final V8Engine engine, final Context context, final String moduleRoot) throws JSApiException {
        this.engine = engine;
        this.context = context;
        this.moduleRoot = moduleRoot;

        try {
            // create dummy exports object for polyfill to be added
            engine.executeScript("var exports = {}");
            loadJavascriptSource("system-polyfill.js");
            engine.executeScript("var System = exports.System;");
            // some custom modules for the App: system and promise
            engine.executeScript("System.set('system', { default: System });");
            engine.executeScript("System.set('promise', { default: Promise });");

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

        this.engine.registerShutdownHook(new V8Engine.Query() {
            @Override
            public Object query(V8 runtime) {
                // release all cached modules
                for(V8Object mod : moduleCache.values()) {
                    mod.release();
                }
                moduleCache.clear();
                return null;
            }
        });
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
                   synchronized (PromiseCallback.this) {
                        PromiseCallback.this.thenResult = v8Array.getObject(0);
                        PromiseCallback.this.notifyAll();
                    }
                    return null;
                }
            });
        }

        V8Function catchCallback() {
            return new V8Function(runtime, new JavaCallback() {
                @Override
                public Object invoke(V8Object v8Object, V8Array v8Array) {
                    synchronized (PromiseCallback.this) {
                        PromiseCallback.this.catchResult = v8Array.getObject(0);
                        PromiseCallback.this.notifyAll();
                    }
                    return null;
                }
            });
        }

        void attachToPromise(V8Object promise) {
            final V8Function thenCb = thenCallback();
            final V8Function catchCb = catchCallback();
            final V8Array thenArgs = new V8Array(runtime).push(thenCb);
            final V8Array catchArgs = new V8Array(runtime).push(catchCb);
            try {
                promise.executeVoidFunction("then", thenArgs);
                promise.executeVoidFunction("catch", catchArgs);
            } finally {
                thenArgs.release();
                catchArgs.release();
                thenCb.release();
                catchCb.release();
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
        public synchronized boolean isDone() {
            return thenResult != null || catchResult != null;
        }

        @Override
        public V8Object get() throws InterruptedException, ExecutionException {
            synchronized (this) {
                while (!isDone()) {
                    wait();
                }
            }
            try {
                return getResult();
            } finally {
                if (catchResult != null) {
                    catchResult.release();
                }
            }
        }

        private V8Object getResult() throws ExecutionException {
            if (catchResult != null) {
                Log.e(TAG, catchResult.getObject("stack").toString());
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
            }
        }
    }

    public V8Object loadModule(final String moduleName) throws ExecutionException {
        // check for cached modules
        if (moduleCache.get(moduleName) != null) {
            return moduleCache.get(moduleName);
        }
        try {
            return engine.queryEngine(new V8Engine.Query<V8Object>() {
                @Override
                public V8Object query(V8 runtime) {
                    try {
                        return loadModuleInternal(moduleName);
                    } catch (ExecutionException e) {
                        throw new QueryException(e);
                    }
                }
            });
        } catch (QueryException | InterruptedException | TimeoutException e) {
            Log.e(TAG, "Error querying for module: "+ moduleName, e);
            throw new ExecutionException(e);
        }
    }

    private V8Object loadModuleInternal(final String moduleName) throws ExecutionException {
        // check for cached modules
        if (moduleCache.get(moduleName) != null) {
            return moduleCache.get(moduleName);
        }
        V8Array moduleArgs = new V8Array(runtime).push(moduleName);
        V8Object system = runtime.getObject("System");
        try {
            PromiseCallback callback = new PromiseCallback(runtime);
            V8Object importPromise = system.executeObjectFunction("import", moduleArgs);
            callback.attachToPromise(importPromise);

            final V8Object module = callback.get();
            moduleCache.put(moduleName, module);
            Log.d(TAG, "Loaded module "+ moduleName +" with "+ module.getKeys().length + " properties");
            return module;
        } catch (ExecutionException e) {
            Log.e(TAG, "Error loading module: " + moduleName, e);
            throw e;
        } catch(InterruptedException e) {
            throw new ExecutionException(e);
        } finally {
            system.release();
            moduleArgs.release();
        }
    }

    public Object callFunctionOnModule(final String modulePath, final String functionName, final Object... args) throws ExecutionException {
        try {
            return engine.queryEngine(new V8Engine.Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    try {
                        final V8Object module = loadModuleInternal(modulePath);
                        return callFunctionOnObject(module, functionName, args);
                    } catch (ExecutionException e) {
                        throw new QueryException(e);
                    }
                }
            });
        } catch (TimeoutException | InterruptedException e) {
            throw new ExecutionException(e);
        }
    }

    public void callVoidFunctionOnModule(final String modulePath, final String functionName, final Object... args) throws ExecutionException {
        try {
            final Object result = callFunctionOnModule(modulePath, functionName, args);
            if (result instanceof V8Object) {
                engine.asyncQuery(new V8Engine.Query<Object>() {
                    @Override
                    public Object query(V8 runtime) {
                        ((V8Object) result).release();
                        return null;
                    }
                });
            }
        } catch (InterruptedException e) {
            if (e.getCause() instanceof V8ResultUndefined) {
                return;
            }
            throw new ExecutionException(e);
        } catch (V8ResultUndefined e) {
        }
    }

    public void callVoidFunctionOnModuleAttribute(final String modulePath, final String[] attribute, final String functionName, final Object... args) throws ExecutionException {
        try {
            final Object result = callFunctionOnModuleAttribute(modulePath, attribute, functionName, args);
            if (result instanceof V8Object) {
                engine.asyncQuery(new V8Engine.Query<Object>() {
                    @Override
                    public Object query(V8 runtime) {
                        ((V8Object) result).release();
                        return null;
                    }
                });
            }
        } catch (InterruptedException e) {
            if (e.getCause() instanceof V8ResultUndefined) {
                return;
            }
            throw new ExecutionException(e);
        } catch (V8ResultUndefined e) {
        }
    }

    public Object callFunctionOnModuleAttribute(final String modulePath, final String[] attribute, final String functionName, final Object... args) throws ExecutionException {
        try {
            return callFunctionOnModuleAttribute(0, modulePath, attribute, functionName, args);
        } catch(TimeoutException e) {
            throw new ExecutionException(e);
        }
    }

    public Object callFunctionOnModuleAttribute(final int timeout, final String modulePath, final String[] attribute, final String functionName, final Object... args) throws ExecutionException, TimeoutException {
        try {
            return engine.queryEngine(new V8Engine.Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    try {
                        return makePrimitive(_callFunctionOnModuleAttribute(modulePath, attribute, functionName, args));
                    } catch (ExecutionException e) {
                        throw new QueryException(e);
                    }
                }
            }, timeout);
        } catch(InterruptedException e) {
            throw new ExecutionException(e);
        }
    }

    public Object callFunctionOnModuleDefault(final String modulePath, final String functionName, final Object... args) throws ExecutionException {
        try {
            return callFunctionOnModuleDefault(0, modulePath, functionName, args);
        } catch(TimeoutException e) {
            throw new ExecutionException(e);
        }
    }

    public Object callFunctionOnModuleDefault(int timeout, final String modulePath, final String functionName, final Object... args) throws ExecutionException, TimeoutException {
        return callFunctionOnModuleAttribute(timeout, modulePath, new String[] {"default"}, functionName, args);
    }

    private Object _callFunctionOnModuleAttribute(final String modulePath, final String[] attribute, final String functionName, final Object... args) throws ExecutionException {
        final int depth = attribute.length;
        V8Object[] objStack = new V8Object[depth + 1];
        try {
            final V8Object module = loadModuleInternal(modulePath);
            objStack[0] = module;
            for (int i=0; i<depth; i++) {
                objStack[i+1] = objStack[i].getObject(attribute[i]);
            }
            return objStack[depth].executeJSFunction(functionName, args);
        } catch (ExecutionException e) {
            throw new QueryException(e);
        } finally {
            // module release is handled by loadModuleInternal
            for (int i=1; i<depth + 1; i++) {
                if (objStack[i] != null) {
                    objStack[i].release();
                }
            }
        }
    }

    private Object _callFunctionOnModuleAttribute(final String modulePath, final String[] attribute, final String functionName, final Object... args) throws ExecutionException {
        final int depth = attribute.length;
        V8Object[] objStack = new V8Object[depth + 1];
        try {
            final V8Object module = loadModuleInternal(modulePath);
            objStack[0] = module;
            for (int i=0; i<depth; i++) {
                objStack[i+1] = objStack[i].getObject(attribute[i]);
            }
            return objStack[depth].executeJSFunction(functionName, args);
        } catch (ExecutionException e) {
            throw new QueryException(e);
        } finally {
            // module release is handled by loadModuleInternal
            for (int i=1; i<depth + 1; i++) {
                if (objStack[i] != null) {
                    objStack[i].release();
                }
            }
        }
    }

    private Object callFunctionOnObject(final V8Object obj, final String functionName, final Object... args) {
        // check if this is a valid function name
        final Object fnResult = obj.executeJSFunction(functionName, args);
        return makePrimitive(fnResult);
    }

    private Object makePrimitive(Object maybeV8Object) {
        if (maybeV8Object instanceof V8Object) {
            try {
                if (((V8Object) maybeV8Object).isUndefined())
                    return null;
                else
                    return jsonifyObject((V8Object) maybeV8Object);
            } finally {
                ((V8Object) maybeV8Object).release();
            }
        } else {
            return maybeV8Object;
        }
    }

    private String jsonifyObject(V8Object obj) {
        V8Object json = runtime.getObject("JSON");
        V8Array args = new V8Array(runtime);
        try {
            args.push(obj);
            return json.executeStringFunction("stringify", args);
        } finally {
            args.release();
            json.release();
        }
    }

    public String readSourceFile(final String assetPath) throws IOException {
        return Utils.readFileFromContext(context, assetPath);
    }

    void loadJavascriptSource(final String assetPath) throws ExecutionException, IOException {
            String script = readSourceFile(assetPath);
            engine.executeScript(script);
    }
}
