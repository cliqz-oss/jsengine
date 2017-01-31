//
//  SystemLoaderTest.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/18/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import jsengine

class SystemLoaderTest: XCTestCase {
    private var jsengine: JSContext? = nil
    private var systemLoader: SystemLoader?
    
    override func setUp() {
        super.setUp()
        self.jsengine = JSContext()
        self.systemLoader = SystemLoader(context: self.jsengine!, assetsRoot: "assets", buildRoot: "/system_test/", bundle: NSBundle(forClass: self.dynamicType))
    }
    
    override func tearDown() {
        super.tearDown()
    }
    
    func testLoaderExists() {
        let system = self.jsengine?.objectForKeyedSubscript("System")
        XCTAssertNotNil(system)
        XCTAssertFalse(system!.isUndefined)
        
        let importFn = system?.objectForKeyedSubscript("import")
        XCTAssertNotNil(importFn)
        XCTAssertFalse(importFn!.isUndefined)
    }
    
    func testLoaderLoadModule() {
        do {
            let module = try self.systemLoader?.loadModule("test")
            XCTAssertNotNil(module)
        } catch _ {
            XCTFail()
        }
    }
    
    func testLoaderLoadModuleNotExists() {
        do {
            try self.systemLoader?.loadModule("nonexistant_module")
            XCTFail()
        } catch _ {
            XCTAssertTrue(true)
        }
    }
    
    func testLoaderCallMethod() {
        do {
            let result = try self.systemLoader?.callFunctionOnModule("test", functionName: "testfn")
            XCTAssertEqual("fnCalled", result?.toString())
        } catch _ {
            XCTFail()
        }
    }
    
    func testLoaderCallMethodNotExistant() {
        do {
            let result = try self.systemLoader?.callFunctionOnModule("test", functionName: "nonexistant")
            XCTAssertTrue(result!.isUndefined)
        } catch _ {
            XCTFail()
        }
    }
    
    func testLoaderCallMethodNotAFunction() {
        do {
            let result = try self.systemLoader?.callFunctionOnModule("test", functionName: "default")
            XCTAssertNil(result)
        } catch _ {
            XCTFail()
        }
    }
    
    func testLoaderCallMethodOnDefault() {
        do {
            let result = try self.systemLoader?.callFunctionOnModuleAttribute("test", attribute: ["default"], functionName: "test")
            XCTAssertEqual("test", result?.toString())
        } catch _ {
            XCTFail()
        }
    }
    
    func testLoaderCallMethodOnDefaultReturnJSON() {
        do {
            let result = try self.systemLoader?.callFunctionOnModuleAttribute("test", attribute: ["default"], functionName: "test_object")
            let resultDictionary = result!.toDictionary()
            if let value = resultDictionary["test"] as? Bool {
                XCTAssertTrue(value)
            } else {
                XCTFail()
            }
        } catch _ {
            XCTFail()
        }
    }
    
}
