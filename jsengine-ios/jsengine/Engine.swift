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

    //MARK: - Singleton
    static let sharedInstance = Engine()
    
    let bridge : RCTBridge
    public let rootView : RCTRootView
    
    //MARK: - Init
    public init() {

        #if React_Debug
            let jsCodeLocation = NSURL(string: "http://localhost:8081/index.ios.bundle?platform=ios")
        #else
            let jsCodeLocation = NSBundle.mainBundle().URLForResource("main", withExtension: "jsbundle")
        #endif
        
        rootView = RCTRootView( bundleURL: jsCodeLocation, moduleName: "ExtensionApp", initialProperties: nil, launchOptions: nil )
        bridge = rootView.bridge
        webRequest = bridge.moduleForClass(WebRequest) as? WebRequest

    }
    
    //MARK: - Public APIs
    public func isRunning() -> Bool {
        return true
    }
    
    public func startup(defaultPrefs: [String: AnyObject]? = [String: AnyObject]()) {
        
    }
    
    public func shutdown(strict: Bool? = false) throws {
        
    }
    
    func setPref(prefName: String, prefValue: Any) {
//        self.jsengine?.evaluateScript("")
    }
    
    func getPref(prefName: String) {
//        self.jsengine?.evaluateScript("")
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
