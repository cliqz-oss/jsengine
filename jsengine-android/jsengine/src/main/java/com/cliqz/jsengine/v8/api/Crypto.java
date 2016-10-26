package com.cliqz.jsengine.v8.api;

import android.util.Log;

import com.cliqz.jsengine.v8.JSApiException;
import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Object;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.ExecutionException;

/**
 * Created by sammacbeth on 04/10/2016.
 */

public class Crypto {

    private static final String TAG = Crypto.class.getSimpleName();

    private V8Object v8Crypto;

    public Crypto(V8Engine engine) throws JSApiException {
        try {
            engine.asyncQuery(new V8Engine.Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    v8Crypto = new V8Object(runtime);
                    runtime.add("crypto", v8Crypto);
                    v8Crypto.registerJavaMethod(Crypto.this, "md5", "md5", new Class<?>[] { Object.class });
                    return null;
                }
            });
        } catch (InterruptedException | ExecutionException e) {
            throw new JSApiException(e);
        }
        engine.registerShutdownHook(new V8Engine.Query() {
            @Override
            public Object query(V8 runtime) {
                v8Crypto.release();
                return null;
            }
        });
    }

    public String md5(final Object input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(input.toString().getBytes());
            StringBuffer hexString = new StringBuffer();

            for (byte bMd5 : messageDigest) {
                String h = Integer.toHexString(0xFF & bMd5);
                while (h.length() < 2)
                    h = "0" + h;
                hexString.append(h);
            }

            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            Log.e(TAG, "no md5", e);
        }
        return "";
    }
}
