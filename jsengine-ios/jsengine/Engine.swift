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
    let dispatchQueue = dispatch_queue_create("com.cliqz.AntiTracking", DISPATCH_QUEUE_SERIAL)
    let timersDispatchQueue = dispatch_queue_create("com.cliqz.Timers", DISPATCH_QUEUE_SERIAL)
    
    //MARK: - Instant variables
//    var jsengine: JSContext? = nil
//    var buildPath = "build"
//    var fileIO: FileIO?
//    var http: HttpHandler?
    public var webRequest: WebRequest?

    //MARK: - Singltone
    static let sharedInstance = Engine(bundle: NSBundle.mainBundle())
    
    let bridgeDelegate = ReactBridgeDelegate()
    let bridge : RCTBridge
    public let rootView : RCTRootView
    
    //MARK: - Init
    public init() {
        let jsCodeLocation = NSURL(string: "http://localhost:8081/index.ios.bundle?platform=ios")
        //		let mockData:NSDictionary = ["scores": [ ["name":"Alex", "value":"42"], ["name":"Joel", "value":"10"] ] ]
        rootView = RCTRootView( bundleURL: jsCodeLocation, moduleName: "RNHighScores", initialProperties: nil, launchOptions: nil )
        bridge = rootView.bridge
        webRequest = bridge.moduleForClass(WebRequest) as? WebRequest
                
//        dispatch_async(dispatchQueue) {
//            self.jsengine = JSContext()
//            self.jsengine!.exceptionHandler = { context, exception in
//                print("JS Error: \(exception)")
//            }
//            let w = WTWindowTimers(self.dispatchQueue)
//            w.extend(self.jsengine)
//            
//            self.fileIO = FileIO(queue:self.dispatchQueue)
//            self.fileIO!.extend(self.jsengine!)
//            
//            let crypto = Crypto()
//            crypto.extend(self.jsengine!)
//            
//            self.http = ChromeUrlHandler(queue: self.dispatchQueue, basePath: self.buildPath)
//            self.http!.extend(self.jsengine!)
//            
//            self.webRequest = WebRequest(nil)
//            self.webRequest!.extend(self.jsengine!)
//        }
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
    
<<<<<<< HEAD
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
=======
    func setPref(prefName: String, prefValue: Any) {
//        self.jsengine?.evaluateScript("")
    }
    
    func getPref(prefName: String) {
//        self.jsengine?.evaluateScript("")
>>>>>>> 2d99d96... Test sending message from native to react.
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
