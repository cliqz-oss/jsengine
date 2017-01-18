package com.cliqz.jsengine.v8.api;

import android.util.Log;

import com.cliqz.jsengine.v8.JSApiException;
import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Function;
import com.eclipsesource.v8.V8Object;

import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Created by sammacbeth on 29/09/2016.
 */

public class HttpHandler {

    private static final String TAG = HttpHandler.class.getSimpleName();

    private static final String HEADER_CONTENT_TYPE = "Content-Type";
    private static final String TYPE_JSON = "application/json";

    final V8Engine engine;
    private final HttpRequestPolicy policy;
    private boolean shutdownRequested = false;

    public HttpHandler(final V8Engine engine, HttpRequestPolicy policy) throws JSApiException {
        this.engine = engine;
        this.policy = policy;

        try {
            this.engine.asyncQuery(new V8Engine.Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    runtime.registerJavaMethod(HttpHandler.this, "httpHandler", "httpHandler", new Class<?>[]{String.class, String.class, V8Function.class, V8Function.class, Integer.class, String.class});
                    return null;
                }
            });
        } catch (InterruptedException | ExecutionException e) {
            throw new JSApiException(e);
        }

        this.engine.registerShutdownHook(new V8Engine.Query() {
            @Override
            public Object query(V8 runtime) {
                shutdownRequested = true;
                return null;
            }
        });
    }

    public HttpHandler(final V8Engine engine) throws JSApiException {
        this(engine, HttpRequestPolicy.ALWAYS_ALLOWED);
    }

    private boolean isHttpRequestPermitted(final String url) {
        return !shutdownRequested && policy.isHttpRequestPermitted(url);
    }

    public boolean httpHandler(final String method, final String requestedUrl,
                               final V8Function callback, final V8Function onerror,
                               final Integer timeout, final String data) {
        Log.d(TAG, "Enter httpHandler: "+ requestedUrl);

        // keep a handle on the callbacks
        final V8Function successCallback = (V8Function) callback.twin();
        final V8Function errorCallback = (V8Function) onerror.twin();
        callback.release();
        onerror.release();

        if (!isHttpRequestPermitted(requestedUrl)) {
            doErrorCallback(successCallback, errorCallback);
            return false;
        }

        this.engine.getWorker().submit(new Runnable() {
            @Override
            public void run() {
                try {
                    final HttpResponse resp = makeHttpRequest(requestedUrl, method, timeout, data);
                    doHandlerCallback(resp, successCallback, errorCallback);
                } catch(Exception e) {
                    // catch all exceptions to make sure an error callback is made
                    // otherwise promise chains will be broken and memory can be leaked
                    doErrorCallback(successCallback, errorCallback);
                    Log.e(TAG, "Failed making Http request", e);
                } finally {
                    releaseObjects(successCallback, errorCallback);
                }
            }
        });

        return true;
    }

    class HttpResponse {
        final String response;
        final int code;

        HttpResponse(int code, String response) {
            this.code = code;
            this.response = response;
        }
    }

    void doHandlerCallback(final HttpResponse resp, final V8Function successCallback, final V8Function errorCallback) {
        try {
            engine.asyncQuery(new V8Engine.Query<Object>() {
                public Object query(V8 context) {
                    V8Object responseObject = new V8Object(context);
                    V8Array callbackArgs = new V8Array(context);
                    try {
                        responseObject.add("status", resp.code);
                        responseObject.add("responseText", resp.response);
                        responseObject.add("response", resp.response);
                        successCallback.call(successCallback, callbackArgs.push(responseObject));
                    } finally {
                        responseObject.release();
                        callbackArgs.release();
                    }
                    return null;
                }
            });
        } catch(InterruptedException | ExecutionException e) {
            Log.e(TAG, "Error making request callback", e);
        }
    }
    
    void doErrorCallback(final V8Function successCallback, final V8Function errorCallback) {
        try {
            engine.asyncQuery(new V8Engine.Query<Object>() {
                public Object query(V8 context) {
                    errorCallback.call(errorCallback, null);
                    return null;
                }
            });
        } catch(InterruptedException | ExecutionException e) {
            Log.e(TAG, "Error calling error callback", e);
        }
    }

    private HttpResponse makeHttpRequest(String requestedUrl, String method, int timeout, String data) throws IOException {
        final StringBuilder responseData = new StringBuilder();
        int responseCode = 0;
        HttpURLConnection httpURLConnection = null;
        URL url = new URL(requestedUrl);
        httpURLConnection = (HttpURLConnection) url.openConnection();
        httpURLConnection.setRequestMethod(method);
        httpURLConnection.setConnectTimeout(timeout);
        httpURLConnection.setReadTimeout(timeout);

        if (data != null && data.length() > 0) {
            httpURLConnection.setRequestProperty(HEADER_CONTENT_TYPE, TYPE_JSON);
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setUseCaches(false);
            DataOutputStream dataOutputStream = new DataOutputStream(httpURLConnection.getOutputStream());
            dataOutputStream.writeBytes(data);
            dataOutputStream.close();
        }

        try {
            httpURLConnection.connect();

            //Log.d(TAG, method + ": " + requestedUrl + " (" + httpURLConnection.getResponseCode() + ") ");
            DataInputStream in = new DataInputStream(httpURLConnection.getInputStream());
            BufferedReader lines = new BufferedReader(new InputStreamReader(in, "UTF-8"));
            while (true) {
                String line = lines.readLine();
                if (line == null) {
                    break;
                } else {
                    responseData.append(line);
                    responseData.append("\n");
                }
            }

        } finally {
            httpURLConnection.disconnect();
        }

        responseCode = httpURLConnection.getResponseCode();
        return new HttpResponse(responseCode, responseData.toString());
    }

    void releaseObjects(final V8Object... objects) {
        try {
            engine.asyncQuery(new V8Engine.Query<Void>() {
                @Override
                public Void query(V8 runtime) {
                    for (V8Object obj : objects) {
                        if (!obj.isReleased()) {
                            obj.release();
                        }
                    }
                    return null;
                }
            });
        } catch(InterruptedException | ExecutionException e) {
            Log.e(TAG, "Error releasing objects", e);
        }
    }

}
