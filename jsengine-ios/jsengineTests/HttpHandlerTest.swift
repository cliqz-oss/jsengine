//
//  HttpHandlerTest.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/17/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import jsengine

class HttpHandlerTest: XCTestCase {
    
    private var jsengine: JSContext? = nil
    
    override func setUp() {
        super.setUp()
        self.jsengine = JSContext()
    }
    
    override func tearDown() {
        super.tearDown()
    }
    
    func testFunctionExists() {
        let httpHandler = HttpHandler()
        httpHandler.extend(self.jsengine!)
        
        let fn = self.jsengine?.objectForKeyedSubscript("httpHandler")
        XCTAssertNotNil(fn)
        XCTAssertFalse(fn!.isUndefined)
    }
    
    func testRequestInvokeCallback() {
        
        let expectation = expectationWithDescription("httpHandler should invoke the callback function.")

        let httpHandler = HttpHandler()
        httpHandler.extend(self.jsengine!)
        
        let testCallback: @convention(block) ([String: AnyObject]) -> () = {data in
            XCTAssertEqual(data["status"] as? Int, 200)
            XCTAssertEqual(data["responseText"] as? String, "")
            expectation.fulfill()
        }
        self.jsengine?.setObject(unsafeBitCast(testCallback, AnyObject.self), forKeyedSubscript: "testCallback")
        
        let testOnerror: @convention(block) () -> () = {
            expectation.fulfill()
            XCTFail()
        }
        self.jsengine?.setObject(unsafeBitCast(testOnerror, AnyObject.self), forKeyedSubscript: "testOnerror")
        
        self.jsengine?.evaluateScript("httpHandler('GET', 'http://cliqz.com/favicon.ico', testCallback, testOnerror, 10000, null);")
        
        waitForExpectationsWithTimeout(10, handler: nil)
        
    }
    
    func testRequestInvokeOnerror() {
        
        let expectation = expectationWithDescription("httpHandler should invoke the onerror function.")
        
        let httpHandler = HttpHandler()
        httpHandler.extend(self.jsengine!)
        
        let testCallback: @convention(block) ([String: AnyObject]) -> () = {data in
            expectation.fulfill()
            XCTFail()
        }
        self.jsengine?.setObject(unsafeBitCast(testCallback, AnyObject.self), forKeyedSubscript: "testCallback")
        
        let testOnerror: @convention(block) () -> () = {
            expectation.fulfill()
        }
        self.jsengine?.setObject(unsafeBitCast(testOnerror, AnyObject.self), forKeyedSubscript: "testOnerror")
        
        self.jsengine?.evaluateScript("httpHandler('GET', 'http://cliqz.com/test.ico', testCallback, testOnerror, 10000, null);")
        
        waitForExpectationsWithTimeout(10, handler: nil)
        
    }
    
    func testPerformanceExample() {
        // This is an example of a performance test case.
//        self.measure {
//            // Put the code you want to measure the time of here.
//        }
    }
    
}
