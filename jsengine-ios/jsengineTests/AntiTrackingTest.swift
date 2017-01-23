//
//  AntiTrackingTest.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/19/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import jsengine

class AntiTrackingTest: XCTestCase {
    
    private var engine: Engine?
    private var attrack: AntiTracking?
    
    override func setUp() {
        super.setUp()
        self.engine = Engine(bundle: NSBundle(forClass: self.dynamicType))
        self.attrack = AntiTracking(engine: self.engine!)
        
        let defaultPrefsAttrack = AntiTracking.getDefaultPrefs(true)
        let defaultPrefsAdblocker = Adblocker.getDefaultPrefs(false)
        
        var defaultPrefs = [String: Bool]()
        defaultPrefsAttrack.forEach { (k,v) in defaultPrefs[k] = v }
        defaultPrefsAdblocker.forEach { (k,v) in defaultPrefs[k] = v as? Bool }
        
        self.engine?.startup(defaultPrefs)
    }
    
    override func tearDown() {
        super.tearDown()
    }
    
    func testWhitelisting() {
        let testUrl = "cliqz.com"
        
        while !(self.engine?.isRunning())! {
            sleep(1)
        }
        
        var isWhitelisted = self.attrack!.isWhitelisted(testUrl)
        XCTAssertFalse(isWhitelisted!)
        
        
        self.attrack?.addDomainToWhitelist(testUrl)
        isWhitelisted = self.attrack!.isWhitelisted(testUrl)
        XCTAssertTrue(isWhitelisted!)
        
        
        self.attrack?.removeDomainFromWhitelist(testUrl)
        isWhitelisted = self.attrack!.isWhitelisted(testUrl)
        XCTAssertFalse(isWhitelisted!)
        
    }
    
    
    func testLoading() {
        let maxTries = 20
        
        var attrackModule: JSValue?
        
        var isReady = false
        var tryCounter = 0
        
        do {
            
            while !isReady && tryCounter < maxTries {
                attrackModule = try self.engine?.systemLoader?.loadModule("antitracking/attrack")
                let module = attrackModule?.valueForProperty("default")
                let whitelist = module?.valueForProperty("qs_whitelist")
                let parameters = [AnyObject]()
                
                if let readyValue = whitelist?.invokeMethod("isReady", withArguments: parameters)?.toBool() {
                    isReady = readyValue
                    let isUpToDate = whitelist?.invokeMethod("isUpToDate", withArguments: parameters)?.toBool()
                    isReady = isReady && isUpToDate!
                } else {
                    isReady = false
                }
                if !isReady {
                    tryCounter += 1
                    sleep(2)
                }
            }
            
            if tryCounter == maxTries {
                XCTFail()
            }
        } catch _ {
            XCTFail()
        }
    }
}
