package com.cliqz.jsengine;

import android.content.Context;

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

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;

public class Engine {

    private final static String TAG = Engine.class.getSimpleName();
    final V8Engine jsengine;
    private final Context context;
    private final Set<Object> jsApis = new HashSet<>();
    final SystemLoader system;
    public final WebRequest webRequest;
    private volatile boolean mIsRunning = false;
    private final ExecutorService service;

    private static final String BUILD_PATH = "build";

    private Future<Boolean> mIsStarted = null;

    public Engine(final Context context, final boolean mobileDataEnabled) throws JSApiException {
        this.context = context.getApplicationContext();
        this.service = Executors.newSingleThreadExecutor();
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

    public static Map<String, Object> getDebugPrefs() {
        Map<String, Object> prefs = new HashMap<>();
        prefs.put("showConsoleLogs", true);
        return prefs;
    }

    public void startup(final Map<String, Object> prefs) throws ExecutionException {
        synchronized (this) {
            if (mIsRunning) {
                return;
            }
            mIsRunning = true;
        }
        mIsStarted = service.submit(new Callable<Boolean>() {
            @Override
            public Boolean call() throws Exception {
                try {
                    // load config
                    String config = system.readSourceFile(BUILD_PATH + "/config/cliqz.json");
                    jsengine.executeScript("var __CONFIG__ = JSON.parse(\"" + config.replace("\"", "\\\"").replace("\n", "") + "\");");
                    jsengine.executeScript("var __DEFAULTPREFS__ = JSON.parse('" + new JSONObject(prefs).toString() + "');");
                    system.callVoidFunctionOnModule("platform/startup", "startup");
                    mIsRunning = true;
                    return true;
                } catch (Throwable e) {
                    throw new RuntimeException(e);
                }
            }
        });
    }

    public void startup() throws ExecutionException {
        startup(new HashMap<String, Object>());
    }

    public void shutdown() throws ExecutionException {
        shutdown(false);
    }

    public void shutdown(boolean strict) throws ExecutionException {
        synchronized (this) {
            if (!mIsRunning || mIsStarted == null) {
                return;
            }
            try {
                // check that startup has completed before calling shutdown
                if (mIsStarted.get()) {
                    system.callVoidFunctionOnModule("platform/startup", "shutdown");
                }
            } catch (InterruptedException e) {
                throw new ExecutionException(e);
            } finally {
                jsengine.shutdown(strict);
                service.shutdownNow();
                mIsRunning = false;
            }
        }
    }

    public void setPref(final String prefName, final Object value) {
        service.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    system.callVoidFunctionOnModuleAttribute("core/utils", new String[] {"default"}, "setPref", prefName, value);
                } catch (ExecutionException e) {
                    throw new RuntimeException(e);
                }
            }
        });
    }

    public Object getPref(final String prefName) {
        final Future<Object> future = service.submit(new Callable<Object>() {
            @Override
            public Object call() throws Exception {
                return system.callFunctionOnModuleDefault("core/utils", "getPref", prefName);
            }
        });
        try {
            return future.get();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public void setLoggingEnabled(boolean enabled) throws ExecutionException {
        setPref("showConsoleLogs", enabled);
    }

}
