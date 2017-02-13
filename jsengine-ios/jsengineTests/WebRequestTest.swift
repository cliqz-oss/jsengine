//
//  WebRequestTest.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 2/8/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import jsengine

class WebRequestTest: XCTestCase {
    
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
        
        var adbModule: JSValue?
        
        while !(self.engine?.isRunning())! {
            sleep(1)
        }
        do {
        
            adbModule = try self.engine?.systemLoader?.loadModule("adblocker/adblocker")
            sleep(10)
    
        } catch _ {
            print("Exception while Loading the Adblocker Module")
        }
    }
    
    override func tearDown() {
        super.tearDown()
    }
    
    func testGetBlockResponseForRequest() {
        
        var requestDetails = [String: AnyObject]()
        requestDetails["type"] = 2
        requestDetails["method"] = "GET"
        requestDetails["source"] = "http://www.bbc.com/"
        requestDetails["url"] = "http://me-cdn.effectivemeasure.net/em.js"
        
        let blockResponse = self.engine?.webRequest!.getBlockResponseForRequest(requestDetails)
        XCTAssertTrue(blockResponse!.count > 0)
    }
    
}
