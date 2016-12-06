package com.cliqz.jsengine;

import android.content.Context;
import android.util.Log;

import com.cliqz.jsengine.v8.JSApiException;
import com.cliqz.jsengine.v8.JSConsole;
import com.cliqz.jsengine.v8.Timers;
import com.cliqz.jsengine.v8.V8Engine;
import com.cliqz.jsengine.v8.api.ChromeUrlHandler;
import com.cliqz.jsengine.v8.api.Crypto;
import com.cliqz.jsengine.v8.api.FileIO;
import com.cliqz.jsengine.v8.api.HttpRequestPolicy;
import com.cliqz.jsengine.v8.api.SystemLoader;
import com.cliqz.jsengine.v8.api.WebRequest;

import org.json.JSONObject;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

public class Engine {

    private final static String TAG = Engine.class.getSimpleName();
    final V8Engine jsengine;
    private final Context context;
    private final Set<Object> jsApis = new HashSet<>();
    final SystemLoader system;
    public final WebRequest webRequest;

    private static final String BUILD_PATH = "build";

    public Engine(final Context context, final boolean mobileDataEnabled) throws JSApiException {
        this.context = context.getApplicationContext();
        jsengine = new V8Engine();
        // load js APIs

        jsApis.add(new JSConsole(jsengine));
        jsApis.add(new Timers(jsengine));
        jsApis.add(new FileIO(jsengine, this.context));
        jsApis.add(new Crypto(jsengine));
        webRequest = new WebRequest(jsengine, this.context);
        system = new SystemLoader(jsengine, this.context, BUILD_PATH + "/modules");
        final HttpRequestPolicy policy = mobileDataEnabled ? HttpRequestPolicy.ALWAYS_ALLOWED : new HttpRequestPolicy.AllowOnWifi(this.context);
        jsApis.add(new ChromeUrlHandler(jsengine, policy, system));
    }

    public synchronized void startup(Map<String, Object> defaultPrefs) throws ExecutionException {
        try {
            // load config
            String config = system.readSourceFile(BUILD_PATH + "/config/cliqz.json");
            jsengine.executeScript("var __CONFIG__ = JSON.parse(\"" + config.replace("\"", "\\\"").replace("\n", "") + "\");");
            jsengine.executeScript("var __DEFAULTPREFS__ = JSON.parse(" + new JSONObject(defaultPrefs).toString() + ");");
            system.callVoidFunctionOnModule("platform/startup", "default");
        } catch(IOException e) {
            throw new ExecutionException(e);
        }
    }

    public void startup() throws ExecutionException {
        startup(new HashMap<String, Object>());
    }

    /**
     * Run the normal startup asynchronously on a different thread
     * @param defaultPrefs
     */
    public void startupAsync(final Map<String, Object> defaultPrefs) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Engine.this.startup(defaultPrefs);
                } catch (ExecutionException e) {
                    Log.e(Engine.TAG, "Problem with startup", e);
                }
            }
        }).start();
    }

    public void shutdown() {
        jsengine.shutdown();
    }

    public synchronized void setPref(String prefName, Object value) throws ExecutionException {
        system.callFunctionOnModuleDefault("core/utils", "setPref", prefName, value);
    }

    public synchronized Object getPref(String prefName) throws ExecutionException {
        return system.callFunctionOnModuleDefault("core/utils", "getPref");
    }


}
