//
//  Engine.swift
//  jsengine
//
//  Created by Sam Macbeth on 07/12/2016.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//

import Foundation
import JavaScriptCore
import React

public class Engine {
    
    //MARK: - Constants
    private let dispatchQueue = dispatch_queue_create("com.cliqz.AntiTracking", DISPATCH_QUEUE_SERIAL)
    
    //MARK: - Instant variables
    var jsengine: JSContext? = nil
    var buildPath = "build"
    var fileIO: FileIO?
    var http: HttpHandler?
    var webRequest: WebRequest?

    //MARK: - Singltone
    static let sharedInstance = Engine()
    
    //MARK: - Init
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
            
            self.http = ChromeUrlHandler(queue: self.dispatchQueue, basePath: self.buildPath)
            self.http!.extend(self.jsengine!)
            
            self.webRequest = WebRequest()
            self.webRequest!.extend(self.jsengine!)
        }
    }
    
    //MARK: - Public APIs
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
