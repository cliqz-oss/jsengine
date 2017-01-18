package com.cliqz.jsengine.v8;

import android.util.Log;

import com.eclipsesource.v8.V8;

import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.FutureTask;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Contain for V8 Javascript runtime.
 * <p>
 * Manages interaction and threading
 */
public class V8Engine implements JSEngine {

    private static final String TAG = V8Engine.class.getSimpleName();

    private V8 v8;
    private final BlockingQueue<FutureTask<?>> queries = new LinkedBlockingQueue<>();
    private final Thread v8Thread;

    private final List<Query> shutdownHooks = new LinkedList<>();

    private boolean shutdown = false;
    boolean suppressShutdownCrash = true;

    final ExecutorService workerService;

    public V8Engine() {
        v8Thread = new Thread(new Runnable() {
            @Override
            public void run() {
                v8 = V8.createV8Runtime();

                // Executor loop: take and process queries offered to the queue
                while (!shutdown || !queries.isEmpty()) {
                    try {
                        FutureTask<?> task = queries.take();
                        task.run();
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Task timeout", e);
                    }
                }
                try {
                    v8.release();
                } catch(IllegalStateException e) {
                    // caused by memory leak on shutdown
                    if (!suppressShutdownCrash) {
                        throw e;
                    }
                }
            }
        });
        v8Thread.start();
        workerService = Executors.newFixedThreadPool(1);
    }

    public boolean isOnV8Thread() {
        return Thread.currentThread().equals(this.v8Thread);
    }

    public void shutdown() {
        shutdown(false);
    }

    public void shutdown(boolean strict) {
        // for a strict shutdown we crash if memory was leaked
        suppressShutdownCrash = !strict;

        workerService.shutdown();
        try {
            workerService.awaitTermination(10000, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            if (!suppressShutdownCrash) {
                throw new RuntimeException(e);
            } else {
                Log.e(TAG, "Could not shutdown worker", e);
            }
        }

        // release JS engine resources and shutdown executor thread.
        Log.w(TAG, "V8 shutdown");
        for(Query q : shutdownHooks) {
            try {
                queryEngine(q);
            } catch (InterruptedException | ExecutionException | TimeoutException e) {
                Log.e(TAG, "Exception in shutdown hook", e);
            }
        }
        shutdownHooks.clear();
        shutdown = true;
        try {
            // submit a task to force-wake v8 thread.
            asyncQuery(new Query<Object>() {
                public Object query(V8 runtime) {
                    return null;
                }
            });
            v8Thread.join();

        } catch (Exception e) {
        }
    }

    public void registerShutdownHook(Query onShutdown) {
        shutdownHooks.add(onShutdown);
    }

    /**
     * Asynchronous task to be run on the javascript engine.
     *
     * @param <V> Return type of the query
     */
    public interface Query<V> {
        /**
         * Query the javascript engine and return a result value
         *
         * @param runtime
         * @return
         */
        V query(V8 runtime);
    }

    public <V> V queryEngine(final Query<V> q) throws InterruptedException, ExecutionException, TimeoutException {
        return queryEngine(q, 0);
    }

    public <V> V queryEngine(final Query<V> q, final int msTimeout) throws InterruptedException, ExecutionException, TimeoutException {
        return queryEngine(q, msTimeout, false);
    }

    /**
     * Send a Query to the javascript engine.
     * <p/>
     * May be called from any thread. The task is safely submitted to the v8 thread, which processes
     * the query in turn, at which point this function will return the result.
     *
     * @param q         A Query containing calls to be run on the v8 thread, and a possible return value
     * @param msTimeout an integer timeout in MS for this query. If there is no result within this time at TimeoutException is thrown. If the timeout is 0, the query will never timeout
     * @param <V>       The return type of the query
     * @return The value returned from the query
     * @throws InterruptedException
     * @throws ExecutionException
     * @throws TimeoutException     if the query blocks for more than msTimeout ms.
     */
    public <V> V queryEngine(final Query<V> q, final int msTimeout, final boolean async) throws InterruptedException, ExecutionException, TimeoutException {
        FutureTask<V> future = new FutureTask<V>(new Callable<V>() {
            @Override
            public V call() throws Exception {
                return q.query(v8);
            }
        });
        queries.add(future);
        if (async) {
            return null;
        }
        if (msTimeout > 0) {
            try {
                return future.get(msTimeout, TimeUnit.MILLISECONDS);
            } catch (TimeoutException e) {
                future.cancel(true);
                throw e;
            }
        } else {
            return future.get();
        }
    }

    /**
     * Submit a Query to the javscript engine without blocking.
     *
     * @param q A Query containing calls to be run on the v8 thread
     * @throws InterruptedException
     * @throws ExecutionException
     */
    public void asyncQuery(final Query<?> q) throws InterruptedException, ExecutionException {
        try {
            queryEngine(q, 0, true);
        } catch (TimeoutException e) {
            // this shouldn't be possible
        }
    }

    public void executeScript(final String javascript) throws ExecutionException {
        try {
            asyncQuery(new Query<Object>() {
                @Override
                public Object query(V8 runtime) {
                    runtime.executeVoidScript(javascript);
                    return null;
                }
            });
        } catch (InterruptedException e) {
            Log.e(TAG, "Error executing Javascript", e);
        }
    }

    public ExecutorService getWorker() {
        return workerService;
    }
}
