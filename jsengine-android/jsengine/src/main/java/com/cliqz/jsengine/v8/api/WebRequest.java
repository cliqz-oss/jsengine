package com.cliqz.jsengine.v8.api;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import android.util.Pair;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import com.cliqz.jsengine.v8.JSApiException;
import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.JavaCallback;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Object;
import com.eclipsesource.v8.V8ResultUndefined;
import com.eclipsesource.v8.V8ScriptExecutionException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;
import java.util.regex.Pattern;

/**
 * Created by sammacbeth on 19/10/2016.
 */

public class WebRequest {

    private final static String TAG = WebRequest.class.getSimpleName();

    private static final Pattern RE_JS = Pattern.compile("\\.js($|\\|?)",   Pattern.CASE_INSENSITIVE);
    private static final Pattern RE_CSS = Pattern.compile("\\.css($|\\|?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RE_IMAGE = Pattern.compile("\\.(?:gif|png|jpe?g|bmp|ico)($|\\|?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RE_FONT = Pattern.compile("\\.(?:ttf|woff)($|\\|?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RE_HTML = Pattern.compile("\\.html?", Pattern.CASE_INSENSITIVE);
    private static final Pattern RE_JSON = Pattern.compile("\\.json($|\\|?)",   Pattern.CASE_INSENSITIVE);

    private static final int NUM_OTHER = 1;
    private static final int NUM_SCRIPT = 2;
    private static final int NUM_IMAGE = 3;
    private static final int NUM_STYLESHEET = 4;
    private static final int NUM_DOCUMENT = 6;
    private static final int NUM_SUBDOCUMENT = 7;
    private static final int NUM_XMLHTTPREQUEST = 11;
    private static final int NUM_FONT = 14;

    private static final int QUERY_TIMEOUT = 200;

    private final V8Engine engine;
    private final Map<Integer, Pair<Uri, WeakReference<WebView>>> tabs = new HashMap<>();
    private final V8Object webRequest;

    public WebRequest(final V8Engine engine, final Context context) throws JSApiException {
        this.engine = engine;
        try {
            this.engine.executeScript(Utils.readFileFromContext(context, "webrequest.js"));
            webRequest = this.engine.queryEngine(new V8Engine.Query<V8Object>() {
                @Override
                public V8Object query(V8 runtime) {
                    return runtime.getObject("webRequest");
                }
            });
            this.engine.asyncQuery(new V8Engine.Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    runtime.registerJavaMethod(new JavaCallback() {
                        @Override
                        public Object invoke(V8Object v8Object, V8Array v8Array) {
                            int windowId = Integer.parseInt(v8Array.get(0).toString());
                            return isTabActive(windowId);
                        }
                    }, "_nativeIsWindowActive");
                    return null;
                }
            });
        } catch (IOException | ExecutionException | TimeoutException | InterruptedException e) {
            throw new JSApiException(e);
        }

        this.engine.registerShutdownHook(new V8Engine.Query() {
            @Override
            public Object query(V8 runtime) {
                webRequest.release();
                return null;
            }
        });
    }

    public boolean isTabActive(final int tabId) {
        Pair<Uri, WeakReference<WebView>> tuple = tabs.get(tabId);
        return tuple != null && tuple.second.get() != null;
    }

    public String getUrlForTab(final int tabId) {
        if (isTabActive(tabId)) {
            return tabs.get(tabId).first.toString();
        } else {
            return null;
        }
    }

    public WebResourceResponse shouldInterceptRequest(final WebView view, final WebResourceRequest request) {
        final boolean isMainDocument = request.isForMainFrame();
        final Uri requestUrl = request.getUrl();

        // save urls for tab - no action for main document requests
        if ( isMainDocument ) {
            final int tabId = view.hashCode();
            tabs.put(tabId, Pair.create(requestUrl, new WeakReference<>(view)));

            // clean up dead tabs
            for (Iterator<Map.Entry<Integer, Pair<Uri, WeakReference<WebView>>>> it = tabs.entrySet().iterator(); it.hasNext();) {
                Map.Entry<Integer, Pair<Uri, WeakReference<WebView>>> e = it.next();
                if (e.getValue().second.get() == null) {
                    it.remove();
                }
            }
        }

        final String headersAccept = request.getRequestHeaders().get("Accept");
        final int contentPolicyType;
        if (isMainDocument) {
            contentPolicyType = NUM_DOCUMENT;
        } else if (headersAccept != null) {
            if (headersAccept.contains("text/css")) {
                contentPolicyType = NUM_STYLESHEET;
            } else if (headersAccept.contains("image/*") || headersAccept.contains("image/webp")) {
                contentPolicyType = NUM_IMAGE;
            } else if (headersAccept.contains("text/html")) {
                contentPolicyType = NUM_SUBDOCUMENT;
            } else {
                contentPolicyType = guessContentPolicyTypeFromUrl(requestUrl.toString());
            }
        } else {
            contentPolicyType = guessContentPolicyTypeFromUrl(requestUrl.toString());
        }

        String block = "{}";
        try {
            block = engine.queryEngine(new V8Engine.Query<String>() {
                @Override
                public String query(V8 runtime) {
                    // build request metadata object
                    final JSONObject requestInfo = new JSONObject();
                    try {
                        requestInfo.put("url", requestUrl.toString());
                        requestInfo.put("method", request.getMethod());
                        requestInfo.put("tabId", view.hashCode());
                        requestInfo.put("parentFrameId", -1);
                        requestInfo.put("frameId", view.hashCode());
                        requestInfo.put("isPrivate", false);
                        requestInfo.put("originUrl", isMainDocument ? requestUrl.toString() : tabs.get(view.hashCode()).first.toString());
                        requestInfo.put("source", requestInfo.getString("originUrl"));
                        requestInfo.put("type", contentPolicyType);

                        JSONObject requestHeaders = new JSONObject();
                        for (Map.Entry<String, String> e : request.getRequestHeaders().entrySet()) {
                            requestHeaders.put(e.getKey(), e.getValue());
                        }
                        requestInfo.put("requestHeaders", requestHeaders);
                    } catch(JSONException e) {

                    }

                    V8Array webRequestArgs = new V8Array(runtime);
                    V8Object webRequestEntry = webRequest.getObject("onBeforeRequest");

                    try {
                        // query engine for action
                        return webRequestEntry.executeStringFunction("_triggerJson", webRequestArgs.push(requestInfo.toString()));
                        // stringify response object
                    } catch(V8ResultUndefined e) {
                        return "{}";
                    } catch(V8ScriptExecutionException e) {
                        Log.e(TAG, "error in webrequests", e);
                        return "{}";
                    } finally {
                        // release handles for V8 objects we created
                        webRequestArgs.release();
                        webRequestEntry.release();
                    }
                }
            }, QUERY_TIMEOUT);
        } catch(InterruptedException | ExecutionException e) {
            Log.e(TAG, Log.getStackTraceString(e));
        } catch(TimeoutException e) {
            Log.e(TAG, "Query timeout: "+ requestUrl.toString());
            block = "{}";
        }

        try {
            JSONObject blockResponse = new JSONObject(block);
            if (blockResponse.has("cancel") && blockResponse.getBoolean("cancel")) {
                Log.d(TAG, "Block request: " + requestUrl.toString());
                return blockRequest();
            } else if(blockResponse.has("redirectUrl") || blockResponse.has("requestHeaders")) {
                String newUrl;
                if (blockResponse.has("redirectUrl")) {
                    newUrl = blockResponse.getString("redirectUrl");
                } else {
                    newUrl = requestUrl.toString();
                }
                Map<String, String> modifiedHeaders = new HashMap<>();
                if (blockResponse.has("requestHeaders")) {
                    JSONArray headers = blockResponse.getJSONArray("requestHeaders");
                    for (int i=0; i<headers.length(); i++ ) {
                        JSONObject header = headers.getJSONObject(i);
                        modifiedHeaders.put(header.getString("name"), header.getString("value"));
                    }
                }
                Log.d(TAG, "Modify request from: " + requestUrl.toString());
                //Log.d(TAG, "                 to: " + newUrl);
                return modifyRequest(request, newUrl, modifiedHeaders);
            }
        } catch(JSONException e) {
            Log.e(TAG, "Bad data from JS: " + block, e);
        }

        return null;
    }

    private static int guessContentPolicyTypeFromUrl(final String url) {
        if (RE_JSON.matcher(url).find()) {
            return NUM_OTHER;
        } else if (RE_JS.matcher(url).find()) {
            return NUM_SCRIPT;
        } else if (RE_CSS.matcher(url).find()) {
            return NUM_STYLESHEET;
        } else if (RE_IMAGE.matcher(url).find()) {
            return NUM_IMAGE;
        } else if (RE_FONT.matcher(url).find()) {
            return NUM_FONT;
        } else if (RE_HTML.matcher(url).find()) {
            return NUM_SUBDOCUMENT;
        } else {
            return NUM_XMLHTTPREQUEST;
        }
    }

    private WebResourceResponse modifyRequest(WebResourceRequest request, String newUrlString, Map<String, String> modifyHeaders) {
        HttpURLConnection connection;
        try {
            URL newUrl = new URL(newUrlString);
            connection = (HttpURLConnection) newUrl.openConnection();
            // set up attributes request to match original
            for (Map.Entry<String, String> e : request.getRequestHeaders().entrySet()) {
                connection.setRequestProperty(e.getKey(), e.getValue());
            }
            // headers from args
            for (Map.Entry<String, String> e : modifyHeaders.entrySet()) {
                connection.setRequestProperty(e.getKey(), e.getValue());
            }
            connection.setRequestMethod(request.getMethod());


            Log.d(TAG, "Redirect to: "+ newUrlString);
            connection.connect();
            final WebResourceResponse response = new WebResourceResponse(connection.getContentType(), connection.getContentEncoding(), connection.getInputStream());
            response.setStatusCodeAndReasonPhrase(connection.getResponseCode(), connection.getResponseMessage());
            // parse response headers
            final Map<String, String> responseHeaders = new HashMap<>();
            for (Map.Entry<String, List<String>> e : connection.getHeaderFields().entrySet()) {
                for (String value : e.getValue()) {
                    responseHeaders.put(e.getKey(), value);
                }
            }
            response.setResponseHeaders(responseHeaders);
            return response;
        } catch (MalformedURLException e) {
            Log.e(TAG, "Bad redirect url: " + e.getMessage());
            return blockRequest();
        } catch (IllegalArgumentException | IOException e) {
            Log.e(TAG, "Could not redirect: " + e.getMessage());
            return blockRequest();
        }
    }

    private WebResourceResponse blockRequest() {
        return new WebResourceResponse("text/html", "UTF-8", new ByteArrayInputStream("".getBytes()));
    }
}
