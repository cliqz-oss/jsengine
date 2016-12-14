//
//  Engine.swift
//  jsengine
//
//  Created by Sam Macbeth on 07/12/2016.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//

import Foundation
import JavaScriptCore

public class Engine {
    
    var jsengine: JSContext? = nil
    private let dispatchQueue = dispatch_queue_create("com.cliqz.AntiTracking", DISPATCH_QUEUE_SERIAL)
    
    var fileIO: FileIO?
    var http: HttpHandler?
    
    public init() {
        dispatch_async(dispatchQueue) {
            self.jsengine = JSContext()
            self.jsengine!.exceptionHandler = { context, exception in
                print("JS Error: \(exception)")
            }
            let w = WTWindowTimers(self.dispatchQueue)
            w.extend(self.jsengine)
            self.fileIO = FileIO(queue:self.dispatchQueue)
            self.fileIO!.extend(self.jsengine!)
                
            let crypto = Crypto()
            crypto.extend(self.jsengine!)

            self.http = HttpHandler()
            self.http!.extend(self.jsengine!)
        }
    }
    
    func startup() {
        
    }
    
    func shutdown() {
        
    }
    
    func setPref(prefName: String, prefValue: Any) {
        self.jsengine?.evaluateScript("")
    }
    
    func getPref(prefName: String) {
        self.jsengine?.evaluateScript("")
    }
    
    func setLoggingEnabled(enabled: Bool) {
        self.setPref("showConsoleLogs", prefValue: enabled)
    }
}
