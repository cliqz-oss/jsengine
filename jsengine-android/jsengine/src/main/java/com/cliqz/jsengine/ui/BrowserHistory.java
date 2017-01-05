package com.cliqz.jsengine.ui;

import com.google.gson.JsonArray;

/**
 * Created by sammacbeth on 05/01/2017.
 */

public interface BrowserHistory {

    JsonArray getHistoryItems(final int start, final int end);
    
}
