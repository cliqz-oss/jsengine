package com.cliqz.jsengine.v8.api;

import android.content.Context;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

/**
 * Created by sammacbeth on 21/10/2016.
 */

class Utils {

    static String readFileFromContext(final Context context, final String assetPath) throws IOException {
        InputStream stream = null;
        try {
            stream = context.getAssets().open(assetPath);
            BufferedReader srcReader = new BufferedReader(new InputStreamReader(stream));
            String script = "";
            String line;
            while ((line = srcReader.readLine()) != null) {
                script += line + "\n";
            }
            return script;
        }  finally {
            try {
                if (stream != null) {
                    stream.close();
                }
            } catch (IOException e) {
            }
        }
    }
}
