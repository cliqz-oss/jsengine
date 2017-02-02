//
//  Adblocker.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/16/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import Foundation

public class Adblocker {
    
    //MARK: - Constants
    private static let moduleName = "adblocker"
    private static let enablePref = "cliqz-adb"
    private static let abTestPref = "cliqz-adb-abtest"
    
    //MARK: - Instant variables
    var engine: Engine
    
    //MARK: - Init
    public init(engine: Engine) {
        self.engine = engine
    }
    
    //MARK: - Public APIs
    public class func getDefaultPrefs(enabled: Bool? = true) -> [String: AnyObject] {
        var prefs: [String:AnyObject] = [String:AnyObject]()
        prefs[Adblocker.enablePref] = 1
        prefs[Adblocker.abTestPref] = true
        prefs["modules." + Adblocker.moduleName + ".enabled"] = enabled
        
        return prefs
    }
    
    public func setEnabled(enabled: Bool) {
        dispatch_async(self.engine.dispatchQueue) {
            self.engine.setPref(Adblocker.abTestPref, prefValue: true)
            self.engine.setPref(Adblocker.enablePref, prefValue: enabled ? 1 : 0)
            self.engine.setPref("modules." + Adblocker.moduleName + ".enabled", prefValue: enabled)
        }
    }
    
    public func getAdsCounter(url: String) -> Int? {
        guard self.engine.isRunning() else {
            return nil
        }
        
        let blockingInfo = getAdBlockingInfo(url)
        return blockingInfo!["totalCount"] as? Int
    }
    
    public func getAdBlockingInfo(url: String) -> [NSObject : AnyObject]? {
        guard self.engine.isRunning() else {
            return nil
        }
        
        do {
            let stats = try engine.systemLoader?.callFunctionOnModuleAttribute(Adblocker.moduleName + "/adblocker", attribute: ["default", "adbStats"], functionName: "report", arguments: [url])
            return stats?.toDictionary()
        } catch let error as NSError {
            DebugLogger.log("<< Error in Adblocker.getAdBlockingInfo: \(error)")
        }
        return nil
    }
    
    public func isBlacklisted(url: String) -> Bool? {
        guard self.engine.isRunning() else {
            return nil
        }
        
        do {
            let blacklisted = try engine.systemLoader?.callFunctionOnModuleAttribute(Adblocker.moduleName + "/adblocker", attribute: ["default", "adBlocker"], functionName: "isDomainInBlacklist", arguments: [url])
            if let blacklisted =  blacklisted {
                return blacklisted.toBool()
            }
        } catch let error as NSError {
            DebugLogger.log("<< Error in Adblocker.isBlacklisted: \(error)")
        }
        return false
    }
    
    public func toggleUrl(url: String, domain: Bool) {
        do {
            try self.engine.systemLoader?.callFunctionOnModuleAttribute(Adblocker.moduleName + "/adblocker", attribute: ["default", "adBlocker"], functionName: "toggleUrl", arguments: [url, domain])
        } catch let error as NSError {
            DebugLogger.log("<< Error in Adblocker.toggleUrl: \(error)")
        }
    }
}
