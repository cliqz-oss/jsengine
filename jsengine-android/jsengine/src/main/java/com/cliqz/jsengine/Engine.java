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
import com.eclipsesource.v8.utils.MemoryManager;

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
    private boolean mIsRunning = false;
    boolean debugMode = false;

    private static final String BUILD_PATH = "build";

    public Engine(final Context context, final boolean mobileDataEnabled) throws JSApiException {
        this.context = context.getApplicationContext();
        jsengine = new V8Engine();
        // load js APIs
        jsApis.add(new Timers(jsengine));
        jsApis.add(new JSConsole(jsengine));
        jsApis.add(new FileIO(jsengine, this.context));
        jsApis.add(new Crypto(jsengine));
        webRequest = new WebRequest(jsengine, this.context);
        system = new SystemLoader(jsengine, this.context, BUILD_PATH + "/modules");
        final HttpRequestPolicy policy = mobileDataEnabled ? HttpRequestPolicy.ALWAYS_ALLOWED : new HttpRequestPolicy.AllowOnWifi(this.context);
        jsApis.add(new ChromeUrlHandler(jsengine, policy, system));
    }

    public boolean isRunning() {
        return mIsRunning;
    }

    public synchronized void startup(Map<String, Object> defaultPrefs) throws ExecutionException {
        if (!isRunning()) {
            try {
                // load config
                String config = system.readSourceFile(BUILD_PATH + "/config/cliqz.json");
                jsengine.executeScript("var __CONFIG__ = JSON.parse(\"" + config.replace("\"", "\\\"").replace("\n", "") + "\");");
                jsengine.executeScript("var __DEFAULTPREFS__ = JSON.parse('" + new JSONObject(defaultPrefs).toString() + "');");
                system.callVoidFunctionOnModule("platform/startup", "startup");
                mIsRunning = true;
            } catch (IOException e) {
                throw new ExecutionException(e);
            }
        }
    }

    public void startup() throws ExecutionException {
        startup(new HashMap<String, Object>());
    }

    public void shutdown() throws ExecutionException {
        shutdown(false);
    }

    public void shutdown(boolean strict) throws ExecutionException {
        try {
            system.callVoidFunctionOnModule("platform/startup", "shutdown");
        } finally {
            jsengine.shutdown(strict);
            mIsRunning = false;
        }
    }

    public synchronized void setPref(final String prefName, final Object value) throws ExecutionException {
        system.callVoidFunctionOnModuleAttribute("core/utils", new String[] {"default"}, "setPref", prefName, value);
    }

    public synchronized Object getPref(String prefName) throws ExecutionException {
        return system.callFunctionOnModuleDefault("core/utils", "getPref");
    }

    public void setLoggingEnabled(boolean enabled) throws ExecutionException {
        setPref("showConsoleLogs", enabled);
    }

}
