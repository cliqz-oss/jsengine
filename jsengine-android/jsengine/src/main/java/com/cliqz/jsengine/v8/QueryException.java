package com.cliqz.jsengine.v8;

/**
 * Created by sammacbeth on 21/10/2016.
 */

public class QueryException extends RuntimeException {
    public QueryException() {
    }

    public QueryException(String message) {
        super(message);
    }

    public QueryException(String message, Throwable cause) {
        super(message, cause);
    }

    public QueryException(Throwable cause) {
        super(cause);
    }
}
