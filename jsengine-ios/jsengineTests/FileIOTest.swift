//
//  FileIOTest.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/17/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import jsengine

class FileIOTest: XCTestCase {
    
    private let dispatchQueue = dispatch_queue_create("unitTests", DISPATCH_QUEUE_SERIAL)
    
    private var jsengine: JSContext? = nil
    
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
        self.jsengine = JSContext()
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
    
    func testWriteThenReadIsIdentity() {
        let testData = "some data to write to the file.\n With line breaks\n"
        let expectation = expectationWithDescription("ReadFile should return same content given to Writefile")

        let fileIO = FileIO(queue:self.dispatchQueue)
        fileIO.extend(self.jsengine!)
        
        let quotedData = testData.stringByReplacingOccurrencesOfString("\n", withString: "\\n")
        self.jsengine?.evaluateScript("fs.writeFile('test.txt', '\(quotedData)');")
        let testCallback: @convention(block) (String) -> () = {data in
            XCTAssertEqual(data, testData)
            expectation.fulfill()
        }
        self.jsengine?.setObject(unsafeBitCast(testCallback, AnyObject.self), forKeyedSubscript: "testCallback")
        self.jsengine?.evaluateScript("fs.readFile('test.txt', testCallback);")
        
        waitForExpectationsWithTimeout(10, handler: nil)
        
        
    }
    
    func testPerformanceExample() {
        // This is an example of a performance test case.
//        self.measure {
//            // Put the code you want to measure the time of here.
//        }
    }
    
}
