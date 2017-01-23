   //
//  CryptoTest.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/17/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import jsengine

class CryptoTest: XCTestCase {
    
    var jsengine: JSContext? = nil
    
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
        self.jsengine = JSContext()
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
    
    func testMd5() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        let crypto = Crypto()
        crypto.extend(self.jsengine!)
        
        let hashedString = self.jsengine?.evaluateScript("crypto._md5Native('test')")
        XCTAssertNotNil(hashedString)
        XCTAssertEqual(hashedString?.toString(), "098f6bcd4621d373cade4e832627b4f6")
    }
    
    func testPerformanceExample() {
        // This is an example of a performance test case.
//        self.measure {
//            // Put the code you want to measure the time of here.
//        }
    }
    
}
