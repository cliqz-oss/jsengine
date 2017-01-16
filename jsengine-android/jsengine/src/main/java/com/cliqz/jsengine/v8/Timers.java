package com.cliqz.jsengine.v8;

import android.text.TextUtils;
import android.util.Log;
import android.util.Pair;

import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Function;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Created by sammacbeth on 26/09/2016.
 */

public class Timers {

    private static final String TAG = Timers.class.getSimpleName();

    private final V8Engine runtime;
    private final ScheduledExecutorService deferredFnExecutor = Executors.newScheduledThreadPool(1);
    private final Map<Integer, Pair<V8Function, ScheduledFuture>> intervals = new HashMap<>();
    private final Map<Integer, Pair<V8Function, ScheduledFuture>> timeouts = new HashMap<>();
    private int mTimerCtr = 0;

    public Timers(V8Engine runtime) throws JSApiException {
        this.runtime = runtime;

        // add methods to the engine
        try {
            this.runtime.queryEngine(new V8Engine.Query<Void>() {
                public Void query(V8 runtime) {
                    runtime.registerJavaMethod(Timers.this, "setTimeout", "setTimeout", new Class<?>[]{V8Function.class, Integer.class});
                    runtime.registerJavaMethod(Timers.this, "clearTimeout", "clearTimeout", new Class<?>[]{Integer.class});
                    runtime.registerJavaMethod(Timers.this, "setInterval", "setInterval", new Class<?>[]{V8Function.class, Integer.class});
                    runtime.registerJavaMethod(Timers.this, "clearInterval", "clearInterval", new Class<?>[]{Integer.class});
                    // polyfill for extra arguments to timer functions
                    // source: https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval#Callback_arguments
                    runtime.executeVoidScript("" +
                            "  var __nativeST__ = setTimeout;\n" +
                            "  setTimeout = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {\n" +
                            "    var aArgs = Array.prototype.slice.call(arguments, 2);\n" +
                            "    return __nativeST__(vCallback instanceof Function ? function () {\n" +
                            "      try {\n" +
                            "      vCallback.apply(null, aArgs);\n" +
                            "       } catch (e) { console.error('Timer error', e, vCallback.name); }\n" +
                            "    } : vCallback, nDelay);\n" +
                            "  };\n" +
                            "  var __nativeSI__ = setInterval;\n" +
                            "  setInterval = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {\n" +
                            "    var aArgs = Array.prototype.slice.call(arguments, 2);\n" +
                            "    return __nativeSI__(vCallback instanceof Function ? function () {\n" +
                            "      try {\n" +
                            "      vCallback.apply(null, aArgs);\n" +
                            "       } catch (e) { console.error('Timer error', e, vCallback.name); }\n" +
                            "    } : vCallback, nDelay);\n" +
                            "  };\n");
                    return null;
                }
            });
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            throw new JSApiException(e);
        }

        // specify how to cleanup on shutdown
        this.runtime.registerShutdownHook(new V8Engine.Query() {
            @Override
            public Object query(V8 runtime) {
                Log.d(TAG, "Timers shutdown");
                deferredFnExecutor.shutdown();

                // clear intervals
                for(int id : new HashSet<Integer>(intervals.keySet())) {
                    clearInterval(id);
                }
                intervals.clear();
                // clear timeouts
                for(int id : new HashSet<Integer>(timeouts.keySet())) {
                    clearTimeout(id);
                }
                timeouts.clear();
                return null;
            }
        });
    }

    /**
     * Run javascript function after specified interval.
     *
     * @param func        Callback function
     * @param timeoutMsec Milliseconds to wait
     */
    public Integer setTimeout(V8Function func, Integer timeoutMsec) {
        final V8Function callback = (V8Function) func.twin();
        final int timerId = mTimerCtr++;
        ScheduledFuture future = deferredFnExecutor.schedule(new Runnable() {
            @Override
            public void run() {
                try {
                    runtime.queryEngine(new V8Engine.Query<Object>() {
                        public Object query(V8 runtime) {
                            callback.call(callback, null);
                            callback.release();
                            timeouts.remove(timerId);
                            return null;
                        }
                    });
                } catch (InterruptedException e) {
                    // if interupted, maybe sure the callback is released
                    try {
                        runtime.queryEngine(new V8Engine.Query<Object>() {
                            @Override
                            public Object query(V8 runtime) {
                                if (!callback.isReleased())
                                    callback.release();
                                return null;
                            }
                        });
                    } catch(InterruptedException | ExecutionException | TimeoutException e2) {}
                } catch (ExecutionException | TimeoutException e) {
                    Log.e(TAG, "Exception in setTimeout", e);
                }
            }
        }, timeoutMsec, TimeUnit.MILLISECONDS);
        timeouts.put(timerId, Pair.create(callback, future));
        return timerId;
    }

    /**
     * Stop the callback for timeout generated with setTimeout
     *
     * @param timerId Integer id returned from setTimeout
     */
    public void clearTimeout(Integer timerId) {
        Pair<V8Function, ScheduledFuture> timer = timeouts.get(timerId);
        if (timer != null) {
            V8Function callback = timer.first;
            ScheduledFuture future = timer.second;

            future.cancel(true);

            timeouts.remove(timerId);
            if (!callback.isReleased())
                callback.release();
        }
    }

    /**
     * Run javascript function periodically at the specified period
     *
     * @param func     Callback function
     * @param interval Milliseconds between each call
     * @return Integer timerId which can be used to cancel this interval.
     */
    public Integer setInterval(V8Function func, Integer interval) {
        final V8Function callback = (V8Function) func.twin();
        final int timerId = mTimerCtr++;
        ScheduledFuture future = deferredFnExecutor.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                try {
                    runtime.queryEngine(new V8Engine.Query<Object>() {
                        public Object query(V8 runtime) {
                            callback.call(callback, null);
                            return null;
                        }
                    });
                } catch (InterruptedException e) {
                    // if interupted, maybe sure the callback is released
                    try {
                        runtime.queryEngine(new V8Engine.Query<Object>() {
                            @Override
                            public Object query(V8 runtime) {
                                if (!callback.isReleased())
                                    callback.release();
                                return null;
                            }
                        });
                    } catch(InterruptedException | ExecutionException | TimeoutException e2) {}
                }
                catch (ExecutionException | TimeoutException e) {
                    Log.e(TAG, "Exception in setInterval", e);
                }
            }
        }, interval, interval, TimeUnit.MILLISECONDS);
        intervals.put(timerId, Pair.create(callback, future));
        return timerId;
    }

    /**
     * Stop running callbacks for the specified interval created with setInterval
     *
     * @param timerId Integer id returned from setInterval
     */
    public void clearInterval(Integer timerId) {
        Pair<V8Function, ScheduledFuture> timer = intervals.get(timerId);
        if (timer != null) {
            V8Function callback = timer.first;
            ScheduledFuture future = timer.second;

            future.cancel(true);

            intervals.remove(timerId);
            if (!callback.isReleased())
                callback.release();
        }
    }

}
