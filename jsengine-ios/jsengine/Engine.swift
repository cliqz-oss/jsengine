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
    private let dispatchQueue = dispatch_queue_create("com.cliqz.AntiTracking", DISPATCH_QUEUE_SERIAL)
    private let timersDispatchQueue = dispatch_queue_create("com.cliqz.Timers", DISPATCH_QUEUE_SERIAL)
    
    //MARK: - Instant variables
    var jsengine: JSContext? = nil
    var buildPath = "build"
    var fileIO: FileIO?
    var http: HttpHandler?
    var webRequest: WebRequest?
    var systemLoader: SystemLoader?
    var mIsRunning: Bool = false

    //MARK: - Singltone
    static let sharedInstance = Engine()
    
    //MARK: - Init
    public init() {
        dispatch_async(dispatchQueue) {
            self.jsengine = JSContext()
            self.jsengine!.exceptionHandler = { context, exception in
                DebugLogger.log("<< JS Error: \(exception)")
            }
            let w = WTWindowTimers(self.timersDispatchQueue)
            w.extend(self.jsengine)
            
            self.fileIO = FileIO(queue:self.dispatchQueue)
            self.fileIO!.extend(self.jsengine!)
            
            let crypto = Crypto()
            crypto.extend(self.jsengine!)
            
            self.http = ChromeUrlHandler(queue: self.dispatchQueue, basePath: self.buildPath)
            self.http!.extend(self.jsengine!)
            
            self.webRequest = WebRequest()
            self.webRequest!.extend(self.jsengine!)
            
            self.systemLoader = SystemLoader(context: self.jsengine!, buildRoot: "assets", bundle: NSBundle.mainBundle())
            
            self.startup()
        }
    }
    
    //MARK: - Public APIs
    func isRunning() -> Bool {
        return self.mIsRunning
    }
    
    func startup(defaultPrefs: [String: AnyObject]? = [String: AnyObject]()) {
        dispatch_async(dispatchQueue) {[weak self] in
            do {
                if let jsengine = self?.jsengine ,let systemLoader = self?.systemLoader {
                    let config = systemLoader.readSourceFile("/build/config/cliqz", fileExtension: "json")
                    jsengine.evaluateScript("var __CONFIG__ = JSON.parse('\(config!)');")
                    let defaultJSON = self?.parseJSON(defaultPrefs!)
                    jsengine.evaluateScript("var __DEFAULTPREFS__ = \(defaultJSON!);")
                    try systemLoader.callFunctionOnModule("platform/startup", functionName: "startup")
                    self?.mIsRunning = true
                }
            } catch let error as NSError {
                DebugLogger.log("<< Error while executing the startup function in the platform/startup module: \(error)")
            }
        }
    }
    
    func shutdown(strict: Bool? = false) throws {
        try systemLoader?.callVoidFunctionOnModule("platform/startup", functionName: "shutdown")
        self.mIsRunning = false
    }
    
    func setPref(prefName: String, prefValue: AnyObject) throws {
        try systemLoader?.callFunctionOnModuleAttribute("core/utils", attribute: ["default"], functionName: "setPref", arguments: [prefName, prefValue])
    }
    
    func getPref(prefName: String) throws -> AnyObject? {
        return try systemLoader?.callFunctionOnModuleAttribute("core/utils", attribute: ["default"], functionName: "getPref", arguments: [prefName])
    }
    
    func setLoggingEnabled(enabled: Bool) throws {
        try self.setPref("showConsoleLogs", prefValue: enabled)
    }
    
    func parseJSON(dictionary: [String: AnyObject]) -> String {
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
