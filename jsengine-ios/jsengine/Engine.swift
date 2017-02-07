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
    
    //MARK: - Constants
    let dispatchQueue = dispatch_queue_create("com.cliqz.AntiTracking", DISPATCH_QUEUE_SERIAL)
    let timersDispatchQueue = dispatch_queue_create("com.cliqz.Timers", DISPATCH_QUEUE_SERIAL)
    
    //MARK: - Instant variables
    var jsengine: JSContext? = nil
    var buildPath = "build"
    var fileIO: FileIO?
    var http: HttpHandler?
    var webRequest: WebRequest?
    var systemLoader: SystemLoader?
    var mIsRunning: Bool = false

    //MARK: - Singltone
    static let sharedInstance = Engine(bundle: NSBundle.mainBundle())
    
    //MARK: - Init
    public init(bundle: NSBundle) {
        self.fileIO = FileIO(queue:self.dispatchQueue)
        let crypto = Crypto()
        self.http = ChromeUrlHandler(queue: self.dispatchQueue, basePath: self.buildPath)
        self.webRequest = WebRequest()
        
        dispatch_async(dispatchQueue) {
            self.jsengine = JSContext()
            self.jsengine!.exceptionHandler = { context, exception in
                DebugLogger.log("<< JS Error: \(exception)")
            }
            let w = WTWindowTimers(self.timersDispatchQueue)
            w.extend(self.jsengine)
            
            self.fileIO!.extend(self.jsengine!)
            crypto.extend(self.jsengine!)
            self.http!.extend(self.jsengine!)
            
            
            self.systemLoader = SystemLoader(context: self.jsengine!, assetsRoot: "assets", buildRoot: "/build/modules/", bundle: bundle)
            self.webRequest!.extend(self.jsengine!)
            
        }
    }
    
    //MARK: - Public APIs
    public func isRunning() -> Bool {
        return self.mIsRunning
    }
    
    public func startup(defaultPrefs: [String: AnyObject]? = [String: AnyObject]()) {
        dispatch_async(dispatchQueue) {[weak self] in
            do {
                if let jsengine = self?.jsengine ,let systemLoader = self?.systemLoader {
                    let config = systemLoader.readSourceFile("cliqz", buildPath: "/build/config/", fileExtension: "json")
                    jsengine.evaluateScript("var __CONFIG__ = JSON.parse('\(config!)');")
                    let defaultJSON = self?.parseJSON(defaultPrefs!)
                    jsengine.evaluateScript("var __DEFAULTPREFS__ = \(defaultJSON!);")
                    try systemLoader.callFunctionOnModule("platform/startup", functionName: "startup")
                    self?.mIsRunning = true
                    
                    // Register the interceptor protocol after the engine finishing running
                    // TODO: this step should be called after the AdBlocker finish loading otherwise it will block loading of websites visiting before loading finished
                    NSURLProtocol.registerClass(InterceptorURLProtocol)
                }
            } catch let error as NSError {
                DebugLogger.log("<< Error while executing the startup function in the platform/startup module: \(error)")
            }
        }
    }
    
    public func shutdown(strict: Bool? = false) throws {
        try systemLoader?.callVoidFunctionOnModule("platform/startup", functionName: "shutdown")
        self.mIsRunning = false
    }
    
    public func setPref(prefName: String, prefValue: AnyObject) {
        dispatch_async(self.dispatchQueue) {
            do {
                try self.systemLoader?.callFunctionOnModuleAttribute("core/utils", attribute: ["default"], functionName: "setPref", arguments: [prefName, prefValue])
            } catch let error as NSError {
                DebugLogger.log("<< Error while executing Engine.setPref: \(error)")
            }
            
        }
    }
    
    public func getPref(prefName: String) throws -> AnyObject? {
        guard isRunning() else {
            return nil
        }
        
        return try systemLoader?.callFunctionOnModuleAttribute("core/utils", attribute: ["default"], functionName: "getPref", arguments: [prefName])
    }
    
    public func setLoggingEnabled(enabled: Bool) {
        dispatch_async(self.dispatchQueue) { 
            self.setPref("showConsoleLogs", prefValue: enabled)
        }
    }
    
    public func parseJSON(dictionary: [String: AnyObject]) -> String {
        if NSJSONSerialization.isValidJSONObject(dictionary) {
            do {
                let data = try NSJSONSerialization.dataWithJSONObject(dictionary, options: [])
                let jsonString = NSString(data: data, encoding: NSUTF8StringEncoding)! as String
                return jsonString
            } catch let error as NSError {
                DebugLogger.log("<< Error while parsing the dictionary into JSON: \(error)")
            }
        }
        return "{}"
    }
}
