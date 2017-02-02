//
//  EngineTest.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/19/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import jsengine

class EngineTest: XCTestCase {
    
    private var engine: Engine?
    
    override func setUp() {
        super.setUp()
        self.engine = Engine(bundle: NSBundle(forClass: self.dynamicType))
        self.engine?.startup()
    }
    
    override func tearDown() {
        super.tearDown()
    }
    
    func testEngineStartup() {
    }
}
