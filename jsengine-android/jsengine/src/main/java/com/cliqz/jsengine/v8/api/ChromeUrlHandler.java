package com.cliqz.jsengine.v8.api;

import android.content.Context;
import android.os.SystemClock;
import android.util.Log;

import com.cliqz.jsengine.v8.JSApiException;
import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Function;

import java.io.IOException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Created by sammacbeth on 25/10/2016.
 */

public class ChromeUrlHandler extends HttpHandler {

    private static final String TAG = HttpHandler.class.getSimpleName();
    private final SystemLoader system;

    public ChromeUrlHandler(final V8Engine engine, final HttpRequestPolicy policy, final SystemLoader system) throws JSApiException {
        super(engine, policy);
        this.system = system;

        try {
            this.engine.asyncQuery(new V8Engine.Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    runtime.registerJavaMethod(ChromeUrlHandler.this, "chromeHandler", "chromeUrlHandler", new Class<?>[]{String.class, V8Function.class, V8Function.class});
                    return null;
                }
            });
        } catch (InterruptedException | ExecutionException e) {
            throw new JSApiException(e);
        }
    }

    public boolean chromeHandler(final String requestedUrl,
                               final V8Function callback, final V8Function onerror) {
        if (!requestedUrl.startsWith("file://") && !requestedUrl.startsWith("chrome://")) {
            doErrorCallback(callback, onerror);
            return false;
        }

        // keep a handle on the callbacks
        final V8Function successCallback = (V8Function) callback.twin();
        final V8Function errorCallback = (V8Function) onerror.twin();

        engine.getWorker().submit(new Runnable() {
            @Override
            public void run() {
                try {
                    final String assetPath = requestedUrl.replace("file://", "").replace("chrome://cliqz/content", system.moduleRoot);
                    final String fileContents = system.readSourceFile(assetPath);
                    final HttpResponse resp = new HttpResponse(200, fileContents);
                    doHandlerCallback(resp, successCallback, errorCallback);
                } catch(IOException e) {
                    Log.e(TAG, "Could not load chrome url: "+ requestedUrl, e);
                    doErrorCallback(successCallback, errorCallback);
                }
            }
        });
        return true;
    }

}
