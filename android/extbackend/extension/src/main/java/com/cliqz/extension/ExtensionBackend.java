package com.cliqz.extension;

import android.content.Context;

import com.cliqz.v8.JSApiException;
import com.cliqz.v8.JSConsole;
import com.cliqz.v8.Timers;
import com.cliqz.v8.V8Engine;
import com.cliqz.v8.api.Crypto;
import com.cliqz.v8.api.FileIO;
import com.cliqz.v8.api.HttpHandler;
import com.cliqz.v8.api.HttpRequestPolicy;
import com.cliqz.v8.api.SystemLoader;
import com.cliqz.v8.api.WebRequest;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutionException;

/**
 * Created by sammacbeth on 06/10/2016.
 */

public class ExtensionBackend {

    final V8Engine engine;
    private final Context context;
    private final Set<Object> jsApis = new HashSet<>();
    final SystemLoader system;
    private final WebRequest webRequest;

    private static final String BUILD_PATH = "build";

    public ExtensionBackend(final Context context) throws JSApiException {
        this.context = context.getApplicationContext();
        engine = new V8Engine();
        // load js APIs

        jsApis.add(new JSConsole(engine));
        jsApis.add(new Timers(engine));
        jsApis.add(new FileIO(engine, this.context));
        jsApis.add(new HttpHandler(engine, HttpRequestPolicy.ALWAYS_ALLOWED));
        jsApis.add(new Crypto(engine));
        webRequest = new WebRequest(engine, this.context);
        system = new SystemLoader(engine, this.context, BUILD_PATH);
    }

    public void startup() {
        try {
            // load config
            String config = system.readSourceFile(BUILD_PATH + "/config/cliqz.json");
            engine.executeScript("var __CONFIG__ = JSON.parse(\"" + config.replace("\"", "\\\"").replace("\n", "") + "\");");
            system.callFunctionOnModule("platform/startup", "default");
        } catch(ExecutionException | IOException e) {

        }
    }
}
