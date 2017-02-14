//
//  SystemLoader.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 12/19/16.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//

import Foundation

class SystemLoader {

    private weak var jsContext: JSContext? = nil
    private var assetsRoot: String
    private var buildRoot: String
    private var bundle: NSBundle
    private var moduleCache: [String:JSValue] = [String:JSValue]()
    
    init(context: JSContext, assetsRoot: String, buildRoot: String, bundle: NSBundle) {
        self.jsContext = context
        self.assetsRoot = assetsRoot
        self.buildRoot = buildRoot
        self.bundle = bundle
     
        let loadSubScript: @convention(block) (String) -> () = {[weak self] assetPath in
                self?.loadSubScript(assetPath)
        }
        context.setObject(unsafeBitCast(loadSubScript, AnyObject.self), forKeyedSubscript: "loadSubScript")
        
        // Load Module
        loadJavascriptSource("timers")
        if #available(iOS 10, *) {
        } else {
            loadJavascriptSource("/build/modules/bower_components/es6-promise/es6-promise")
            context.evaluateScript("Promise = ES6Promise")
        }

        // create dummy exports object for polyfill to be added
        context.evaluateScript("var exports = {}")
        self.loadJavascriptSource("system-polyfill.js")
        context.evaluateScript("var System = exports.System;");
        
        // some custom modules for the App: system and promise
        context.evaluateScript("System.set('system', { default: System });");
        context.evaluateScript("System.set('promise', { default: Promise });");
    }
    
    func loadModule(moduleName: String) throws -> JSValue {
        //check for cached modules
        if let module = self.moduleCache[moduleName] {
            return module
        }
        return try loadModuleInternal(moduleName)
    }
    
    func callVoidFunctionOnModule(modulePath: String, functionName: String, arguments: [AnyObject]? = nil) throws {
        let module = try loadModule(modulePath)
        module.invokeMethod(functionName, withArguments: arguments)
    }
    
    func callFunctionOnModule(modulePath: String, functionName: String, arguments: [AnyObject]? = nil) throws -> JSValue? {
        let module = try loadModule(modulePath)
        return try callFunctionOnObject(module, functionName: functionName, arguments: arguments)
    }
    
    func callFunctionOnModuleAttribute(modulePath: String, attribute: [String], functionName: String, arguments: [AnyObject]? = nil) throws -> JSValue? {
        let depth = attribute.count
        var attributeStack = [JSValue?](count:depth+1, repeatedValue: nil)
        
        let module = try loadModuleInternal(modulePath)
        
        attributeStack[0] = module
        for index in 0...depth-1 {
            attributeStack[index+1] = attributeStack[index]?.valueForProperty(attribute[index])
        }
        return try callFunctionOnObject(attributeStack[depth]!, functionName: functionName, arguments: arguments)
    }
    
    private func callFunctionOnObject(obj: AnyObject, functionName: String, arguments: [AnyObject]? = nil) throws -> JSValue? {
        let fnResult = obj.invokeMethod(functionName, withArguments: arguments)
        
        return fnResult
    }
    
    private func loadModuleInternal(moduleName: String) throws -> JSValue {
        let promise = jsContext?.evaluateScript("System.import(\"\(moduleName)\")")
        let promiseCallBack = PromiseCallback(promise:promise!)

        let module = try promiseCallBack.get()
        moduleCache[moduleName] = module
        return module!
    }
    
    func loadSubScript(assetPath: String) {
        if let content = Utils.readSourceFile(self.bundle, assetsRoot: self.assetsRoot, assetPath: assetPath, buildPath: self.buildRoot, fileExtension: "js") {
            self.jsContext?.evaluateScript(content)
        } else {
            DebugLogger.log("<< Could not load file: \(assetPath)")
        }
    }
    
    private func loadJavascriptSource(assetPath: String) {
        if let content = Utils.readSourceFile(self.bundle, assetsRoot: self.assetsRoot, assetPath: assetPath, buildPath: "", fileExtension: "js") {
            self.jsContext?.evaluateScript(content)
        } else {
            DebugLogger.log("<< Could not load file: \(assetPath)")
        }
    }

}
