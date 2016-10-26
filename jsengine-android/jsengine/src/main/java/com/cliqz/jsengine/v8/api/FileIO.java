package com.cliqz.jsengine.v8.api;

import android.content.Context;
import android.util.Log;

import com.cliqz.jsengine.v8.JSApiException;
import com.cliqz.jsengine.v8.V8Engine;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Function;
import com.eclipsesource.v8.V8Object;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.ExecutionException;

/**
 * Created by sammacbeth on 04/10/2016.
 */

public class FileIO {

    private static final String TAG = FileIO.class.getSimpleName();

    private final Context context;
    private V8Object v8Fs;

    public FileIO(V8Engine engine, final Context context) throws JSApiException {
        this.context = context.getApplicationContext();
        try {
            engine.asyncQuery(new V8Engine.Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    v8Fs = new V8Object(runtime);
                    runtime.add("fs", v8Fs);
                    v8Fs.registerJavaMethod(FileIO.this, "readFile", "readFile", new Class<?>[] { String.class, V8Function.class });
                    v8Fs.registerJavaMethod(FileIO.this, "writeFile", "writeFile", new Class<?>[] { String.class, String.class });
                    v8Fs.registerJavaMethod(FileIO.this, "deleteFile", "deleteFile", new Class<?>[] { String.class });
                    return null;
                }
            });
            // load fs polyfill
            engine.executeScript(Utils.readFileFromContext(context, "fs-polyfill.js"));
        } catch (InterruptedException | ExecutionException | IOException e) {
            throw new JSApiException(e);
        }
        engine.registerShutdownHook(new V8Engine.Query() {
            @Override
            public Object query(V8 runtime) {
                v8Fs.release();
                return null;
            }
        });
    }

    private static String safePath(String path) {
        return path.replace('/', '_');
    }

    public void readFile(final String path, final V8Function callback) {
        StringBuilder fileData = new StringBuilder();
        V8Array respArgs = new V8Array(callback.getRuntime());
        try {
            FileInputStream fin = context.openFileInput(safePath(path));
            BufferedReader lines = new BufferedReader(new InputStreamReader(fin));
            while (true) {
                String line = lines.readLine();
                if (line == null) {
                    break;
                } else {
                    fileData.append(line);
                    fileData.append("\n");
                }
            }
            fin.close();
            Log.d(TAG, "Read: " + path + ", " + fileData.length() + "b");
            callback.call(callback, respArgs.push(fileData.toString()));
        } catch (FileNotFoundException e) {
            callback.call(callback, respArgs);
        } catch (IOException e) {
            Log.e(TAG, Log.getStackTraceString(e));
            callback.call(callback, respArgs);
        } catch (Exception e) {
            Log.e(TAG, Log.getStackTraceString(e));
        } finally {
            respArgs.release();
        }
    }

    /**
     * Write to a file in app's file system
     *
     * @param path String path to write
     * @param data String data to file to file.
     */
    public void writeFile(final String path, final String data) {
        Log.d(TAG, "Write: " + path + ", " + data.length() + "b");
        try {
            FileOutputStream fos = context.openFileOutput(safePath(path), Context.MODE_PRIVATE);
            fos.write(data.getBytes());
            fos.close();
        } catch (IOException e) {
            Log.e(TAG, Log.getStackTraceString(e));
        }
    }

    public boolean deleteFile(final String path) {
        return context.deleteFile(safePath(path));
    }
}
