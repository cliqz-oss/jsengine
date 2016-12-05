package com.cliqz.jsengine.v8.api;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

/**
 * Created by sammacbeth on 30/09/2016.
 */

public abstract class HttpRequestPolicy {

    abstract boolean isHttpRequestPermitted(String url);

    public static HttpRequestPolicy ALWAYS_ALLOWED = new HttpRequestPolicy() {
        @Override
        boolean isHttpRequestPermitted(final String url) {
            return true;
        }
    };

    public static HttpRequestPolicy NEVER_ALLOWED = new HttpRequestPolicy() {
        @Override
        boolean isHttpRequestPermitted(final String url) {
            return false;
        }
    };

    public static class AllowOnWifi extends HttpRequestPolicy {

        final Context context;

        public AllowOnWifi(final Context context) {
            this.context = context.getApplicationContext();
        }

        @Override
        boolean isHttpRequestPermitted(final String url) {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) {
                // service wasn't available
                return false;
            }
            NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnectedOrConnecting() && activeNetwork.getType() == ConnectivityManager.TYPE_WIFI;
        }
    }
}
