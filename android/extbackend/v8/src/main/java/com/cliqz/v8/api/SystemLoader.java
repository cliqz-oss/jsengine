package com.cliqz.v8.api;

import android.content.Context;
import android.util.Log;

import com.cliqz.v8.JSApiException;
import com.cliqz.v8.V8Engine;
import com.eclipsesource.v8.V8;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

/**
 * Created by sammacbeth on 04/10/2016.
 */

public class SystemLoader {

    private static final String TAG = SystemLoader.class.getSimpleName();

    final V8Engine engine;
    final Context context;
    final String moduleRoot;

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
                    runtime.registerJavaMethod(SystemLoader.this, "loadSubScript", "loadSubScript", new Class<?>[] { String.class });
                    return null;
                }
            });
        } catch (InterruptedException | ExecutionException e) {
            throw new JSApiException(e);
        }
    }

    public boolean loadSubScript(final String scriptPath) {
        try {
            loadJavascriptSource(this.moduleRoot + "/" + scriptPath);
            return true;
        } catch(ExecutionException e) {
            Log.d(TAG, "Error loading script: ", e);
            return false;
        }
    }

    void loadJavascriptSource(final String assetPath) throws ExecutionException {
        try {
            engine.queryEngine(new V8Engine.Query<Boolean>() {
                @Override
                public Boolean query(V8 runtime) {
                    InputStream stream = null;
                    Log.d(TAG, "Load script " + assetPath);
                    try {
                        stream = context.getAssets().open(assetPath);
                        BufferedReader srcReader = new BufferedReader(new InputStreamReader(stream));
                        String script = "";
                        String line;
                        while ((line = srcReader.readLine()) != null) {
                            script += line + "\n";
                        }
                        runtime.executeScript(script, assetPath, 0);
                        return true;
                    } catch (IOException e) {
                        Log.e(TAG, Log.getStackTraceString(e));
                        return false;
                    } finally {
                        try {
                            if (stream != null) {
                                stream.close();
                            }
                        } catch (IOException e) {
                        }
                    }
                }
            });
        } catch(InterruptedException | TimeoutException e) {
            Log.e(TAG, "Failed to load JS source", e);
        }
    }
}
