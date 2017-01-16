//
//  AntiTracking.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/13/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import Foundation

class AntiTracking {
    
    //MARK: - Constants
    private static let moduleName = "antitracking"
    private static let enablePref = "antiTrackingTest"
    private static let qsBlockingPref = "attrackRemoveQueryStringTracking"
    private static let bloomFilterPref = "attrackBloomFilter"
    private static let forceBlockPref = "attrackForceBlock"
    
    //MARK: - Instant variables
    var engine: Engine
    var webReuest: WebRequest
    
    //MARK: - Init
    public init(engine: Engine) {
        self.engine = engine
        self.webReuest = engine.webRequest!
    }
    
    //MARK: - Public APIs
    class func getDefaultPrefs(enabled: Bool? = true) -> [String: Bool] {
        var prefs: [String:Bool] = [String:Bool]()
        prefs[AntiTracking.enablePref] = enabled
        prefs[AntiTracking.bloomFilterPref] = true
        prefs[AntiTracking.qsBlockingPref] = true
        prefs[AntiTracking.forceBlockPref] = true
        
        return prefs
    }
    
    func setEnabled(enabled: Bool) throws {
        try self.engine.setPref(AntiTracking.bloomFilterPref, prefValue: true)
        try self.engine.setPref(AntiTracking.qsBlockingPref, prefValue: true)
        try self.engine.setPref(AntiTracking.enablePref, prefValue: true)
        try self.engine.setPref("modules." + AntiTracking.moduleName + ".enabled", prefValue: enabled)
    }
    
    func setForceBlockEnabled(enabled: Bool) throws {
        try self.engine.setPref(AntiTracking.forceBlockPref, prefValue: enabled)
    }
    
    func getTabBlockingInfo(tabId: Int) -> [NSObject : AnyObject]? {
        do {
            var argument = [AnyObject]()
            argument.append(tabId)
            if let tabUrl = webReuest.getUrlForTab(tabId) {
                argument.append(tabUrl)
            }
            let blockingInfo = try engine.systemLoader?.callFunctionOnModuleAttribute(AntiTracking.moduleName + "/attrack", attribute: ["default"], functionName: "getTabBlockingInfo", arguments: argument)
            return blockingInfo?.toDictionary()
        } catch let error as NSError {
            DebugLogger.log("<< Error in AntiTracking.getTabBlockingInfo: \(error)")
        }
        return nil
    }
    
    func isWhitelisted(url: String) -> Bool {
        do {
            let whitelisted = try engine.systemLoader?.callFunctionOnModuleAttribute(AntiTracking.moduleName + "/attrack", attribute: ["default"], functionName: "isSourceWhitelisted", arguments: [url])
            if let whitelisted =  whitelisted {
                return whitelisted.toBool()
            }
        } catch let error as NSError {
            DebugLogger.log("<< Error in AntiTracking.isWhitelisted: \(error)")
        }
        return false
    }
    
    func addDomainToWhitelist(url: String) {
        do {
            try engine.systemLoader?.callFunctionOnModuleAttribute(AntiTracking.moduleName + "/attrack", attribute: ["default"], functionName: "addSourceDomainToWhitelist", arguments: [url])
        } catch let error as NSError {
            DebugLogger.log("<< Error in AntiTracking.addDomainToWhitelist: \(error)")
        }
    }
    
    func removeDomainFromWhitelist(url: String) {
        do {
            try engine.systemLoader?.callFunctionOnModuleAttribute(AntiTracking.moduleName + "/attrack", attribute: ["default"], functionName: "removeSourceDomainFromWhitelist", arguments: [url])
        } catch let error as NSError {
            DebugLogger.log("<< Error in AntiTracking.removeDomainFromWhitelist: \(error)")
        }
    }
    
    
}
