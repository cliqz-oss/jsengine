//
//  AdblockerTest.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/20/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import jsengine

class AdblockerTest: XCTestCase {
    
    private var engine: Engine?
    private var adb: Adblocker?
    
    override func setUp() {
        super.setUp()
        
        self.engine = Engine(bundle: NSBundle(forClass: self.dynamicType))
        self.adb = Adblocker(engine: self.engine!)
        
        let defaultPrefsAdblocker = Adblocker.getDefaultPrefs(true)
        let defaultPrefsAttrack = AntiTracking.getDefaultPrefs(false)
        
        var defaultPrefs = [String: Bool]()
        defaultPrefsAttrack.forEach { (k,v) in defaultPrefs[k] = v }
        defaultPrefsAdblocker.forEach { (k,v) in defaultPrefs[k] = v as? Bool }
        
        self.engine?.startup(defaultPrefs)
        
    }
    
    override func tearDown() {
        super.tearDown()
    }
    
    func testBlackListing() {
        
        while !(self.engine?.isRunning())! {
            sleep(1)
        }
        let testUrl = "https://cliqz.com"
        
        var isBlackListed = self.adb!.isBlacklisted(testUrl)
        XCTAssertFalse(isBlackListed!)
        
        adb?.toggleUrl(testUrl, domain: true)
        isBlackListed = self.adb!.isBlacklisted(testUrl)
        XCTAssertTrue(isBlackListed!)
        
        adb?.toggleUrl(testUrl, domain: true)
        isBlackListed = self.adb!.isBlacklisted(testUrl)
        XCTAssertFalse(isBlackListed!)
    }
    
    func testLoading() {
        let maxTries = 20
        
        var adbModule: JSValue?
        
        var requestDetails = [String: AnyObject]()
        requestDetails["type"] = 2
        requestDetails["method"] = "GET"
        requestDetails["source"] = "http://www.bbc.com/"
        requestDetails["url"] = "http://me-cdn.effectivemeasure.net/em.js"
        
        var isBlocked = false
        var tryCounter = 0
        
        while !(self.engine?.isRunning())! {
            sleep(1)
        }
        do {
            
            while !isBlocked && tryCounter < maxTries {
                adbModule = try self.engine?.systemLoader?.loadModule("adblocker/adblocker")
                let module = adbModule?.valueForProperty("default")
                let observer = module?.valueForProperty("httpopenObserver")
                let parameters = [requestDetails]
                
                let response = observer?.invokeMethod("observe", withArguments: parameters)
                
                
                if let responseDictionary = response?.toDictionary(), value = responseDictionary["cancel"] as? Bool {
                    isBlocked = value
                }

                if !isBlocked {
                    tryCounter += 1
                    sleep(1)
                }
            }
        
            if tryCounter == maxTries  {
                XCTFail()
            }
            
            let adbInfo = self.adb?.getAdBlockingInfo("http://www.bbc.com/")
            let advertisersList = adbInfo!["advertisersList"]
            XCTAssertNotNil(advertisersList!["Effective Measure"])
                
        } catch _ {
            XCTFail()
        }
        
        
    }
    
}
