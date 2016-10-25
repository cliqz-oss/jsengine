package com.cliqz.jsengine;

import android.content.Context;
import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class EngineTest {
    @Test
    public void testEngineStartup() throws Exception {
        Context appContext = InstrumentationRegistry.getTargetContext();
        Engine extension = new Engine(appContext);
        extension.startup();
        extension.setPref("antiTrackTest", true);
    }
}
