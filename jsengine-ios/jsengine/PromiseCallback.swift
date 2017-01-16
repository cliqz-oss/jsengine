//
//  PromiseCallback.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/2/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import Foundation

enum JSError: ErrorType {
    case RuntimeError(String?)
}

class PromiseCallback {
    private var promise: JSValue
    private var lockSemaphore: dispatch_semaphore_t?
    private var thenResult: JSValue? = nil
    private var catchResult: JSValue? = nil
    

    init(promise: JSValue) {
        self.promise = promise
        self.lockSemaphore = dispatch_semaphore_create(0);
        
        let thenCallback: @convention(block) (JSValue) -> () = {[weak self] result in
            self?.thenResult = result
            dispatch_semaphore_signal((self?.lockSemaphore)!);
        }
        
        let catchCallback: @convention(block) (JSValue) -> () = {[weak self] result in
            self?.catchResult = result
            dispatch_semaphore_signal((self?.lockSemaphore)!);
        }
        promise.setObject(unsafeBitCast(thenCallback, AnyObject.self), forKeyedSubscript: "thenCallback")
        promise.setObject(unsafeBitCast(catchCallback, AnyObject.self), forKeyedSubscript: "catchCallback")
        
        promise.invokeMethod("then", withArguments: [promise.objectForKeyedSubscript("thenCallback")!])
        promise.invokeMethod("catch", withArguments: [promise.objectForKeyedSubscript("catchCallback")!])
        
    }
    
    func cancel(mayInterruptIfRunning: Bool) -> Bool {
        return false
    }
    
    func isCancelled() -> Bool {
        return false
    }
    
    func get() throws -> JSValue? {
        dispatch_semaphore_wait(self.lockSemaphore!, DISPATCH_TIME_FOREVER);
        
        if self.catchResult != nil {
            throw JSError.RuntimeError(self.catchResult?.toString())
        }
        
        if self.thenResult != nil {
            return self.thenResult
        }
        
        return nil
    }
    
    func get(numSeconds: Double) throws -> JSValue? {
        let dispatchTime: dispatch_time_t = dispatch_time(DISPATCH_TIME_NOW, Int64(numSeconds * Double(NSEC_PER_SEC)))
        dispatch_semaphore_wait(self.lockSemaphore!, dispatchTime);
        
        if self.catchResult != nil {
            throw JSError.RuntimeError(self.catchResult?.toString())
        }
        
        if self.thenResult != nil {
            return self.thenResult
        }
        
        return nil
    }
}
