package com.cliqz.jsengine.v8;

import com.eclipsesource.v8.JavaVoidCallback;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Object;
import com.eclipsesource.v8.V8ScriptExecutionException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collection;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertTrue;

/**
 * Created by sammacbeth on 27/09/2016.
 */

abstract public class ESCompatTest {

    private final String category;
    private final String testName;
    private final String testFn;
    private final boolean skip;

    private V8Engine engine;
    private final BlockingQueue<Boolean> asyncCallbacks = new LinkedBlockingQueue<>();

    private static String loadTestJson(final String filename) throws IOException {
        final BufferedReader br = new BufferedReader(new InputStreamReader(ESCompatTest.class.getClassLoader().getResourceAsStream(filename)));
        String tests = "";
        String line;
        while ((line = br.readLine()) != null) {
            tests += line + "\n";
        }
        return tests;
    }

    static Collection<Object[]> getTestsFromFile(final String filename) throws IOException, JSONException {
        Collection<Object[]> testParams = new ArrayList<>();
        final JSONArray specList = new JSONArray(loadTestJson(filename));
        for (int i = 0; i< specList.length(); i++) {
            final JSONObject category = specList.getJSONObject(i);
            for (int testNo = 0; testNo < category.getJSONArray("subtests").length(); testNo++) {
                final JSONObject testSpec = category.getJSONArray("subtests").getJSONObject(testNo);
                testParams.add(new Object[] { category.get("name"), testSpec.get("name"), testSpec.get("exec"), testSpec.optBoolean("skip") || category.optBoolean("skip") });
            }
        }
        return testParams;
     }

    ESCompatTest(String category, String testName, String testFn, Boolean skip) throws JSApiException {
        this.category = category;
        this.testName = testName;
        this.testFn = testFn;
        this.skip = skip;
    }

    @Before
    public void setUp() throws JSApiException {
        engine = new V8Engine();
        new Timers(engine);
    }

    @After
    public void tearDown() {
        engine.shutdown();
    }

    String testHelpers() {
        return "var __createIterableObject = function (arr, methods) {\n" +
                "    methods = methods || {};\n" +
                "    if (typeof Symbol !== 'function' || !Symbol.iterator)\n" +
                "      return {};\n" +
                "    arr.length++;\n" +
                "    var iterator = {\n" +
                "      next: function() {\n" +
                "        return { value: arr.shift(), done: arr.length <= 0 };\n" +
                "      },\n" +
                "      'return': methods['return'],\n" +
                "      'throw': methods['throw']\n" +
                "    };\n" +
                "    var iterable = {};\n" +
                "    iterable[Symbol.iterator] = function(){ return iterator; };\n" +
                "    return iterable;\n" +
                "  };" +
                "var global = {__createIterableObject: __createIterableObject}";
    }

    @Test
    public void test()  throws Exception {
        final boolean asyncTest = this.testFn.contains("asyncTestPassed");
        try {
            boolean pass = engine.queryEngine(new V8Engine.Query<Boolean>() {
                @Override
                public Boolean query(V8 runtime) {
                    // callback for async tests
                    runtime.registerJavaMethod(new JavaVoidCallback() {
                        @Override
                        public void invoke(V8Object v8Object, V8Array v8Array) {
                            asyncCallbacks.offer(true);
                        }
                    }, "asyncTestPassed");
                    runtime.executeVoidScript(testHelpers());
                    if (asyncTest) {
                        runtime.executeVoidScript("(" + testFn + ")()");
                        return false;
                    } else {
                        return runtime.executeBooleanScript("(" + testFn + ")()");
                    }
                }
            });
            if (skip) {
                org.junit.Assume.assumeTrue(this.category +" :: "+ testName, pass);
            } else if (asyncTest) {
                assertTrue(this.category + " :: " + testName, asyncCallbacks.poll(10000, TimeUnit.MILLISECONDS));
            } else {
                assertTrue(this.category + " :: " + testName, pass);
            }
        } catch(V8ScriptExecutionException | ExecutionException e) {
            if (skip) {
                org.junit.Assume.assumeNoException(e);
            } else {
                throw e;
            }
        }
    }
}
