package com.cliqz.jsengine.v8;

import org.json.JSONException;
import org.junit.Ignore;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;

import java.io.IOException;
import java.util.Collection;

/**
 * Created by sammacbeth on 29/09/2016.
 */

@RunWith(Parameterized.class) @Ignore
public class ES6CompatTest extends ESCompatTest {

    @Parameterized.Parameters (name = "{0} :: {1}")
    public static Collection<Object[]> getES5Tests() throws IOException, JSONException {
        return ESCompatTest.getTestsFromFile("es6tests.json");
    }

    public ES6CompatTest(String category, String testName, String testFn, Boolean skip) throws JSApiException {
        super(category, testName, testFn, skip);
    }
}
