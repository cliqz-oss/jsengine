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
        
        // load webrequest
        self.loadJavascriptSource("webrequest")
    }
    
    func readSourceFile(assetPath: String, buildPath: String, fileExtension: String) -> String? {
        var content: String? = nil
        let (sourceName, directory) = getSourceMetaData(assetPath, buildPath: buildPath)
        if let path = self.bundle.pathForResource(sourceName, ofType: fileExtension, inDirectory: directory){
            content = try? NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) as String
        } else {
            DebugLogger.log("<< Script not found: \(assetPath)")
            
        }
        return content
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
        if let content = readSourceFile(assetPath, buildPath: self.buildRoot, fileExtension: "js") {
            self.jsContext?.evaluateScript(content)
        } else {
            DebugLogger.log("<< Could not load file: \(assetPath)")
        }
    }
    
    private func loadJavascriptSource(assetPath: String) {
        if let content = readSourceFile(assetPath, buildPath: "", fileExtension: "js") {
            self.jsContext?.evaluateScript(content)
        } else {
            DebugLogger.log("<< Could not load file: \(assetPath)")
        }
    }
    
    private func getSourceMetaData(assetPath: String, buildPath: String) -> (String, String) {
        var sourceName: String
        var directory: String
        // seperate the folder path and the file name of the asset
        if assetPath.rangeOfString("/") != nil {
            var pathComponents = assetPath.componentsSeparatedByString("/")
            sourceName = pathComponents.last!
            pathComponents.removeLast()
            directory = self.assetsRoot + buildPath + pathComponents.joinWithSeparator("/")
        } else {
            sourceName = assetPath
            directory = self.assetsRoot + buildPath
        }
        
        // remove file extension
        if SystemLoader.endsWith(sourceName, suffix:".js") {
            sourceName = sourceName.stringByReplacingOccurrencesOfString(".js", withString: "", options: NSStringCompareOptions.LiteralSearch, range: nil)
        }
        
        return (sourceName, directory)
    }
    
    private static func endsWith(string: String, suffix: String) -> Bool {
        // rangeOfString returns nil if other is empty, destroying the analogy with (ordered) sets.
        if suffix.isEmpty {
            return true
        }
        if let range = string.rangeOfString(suffix,
                                          options: [NSStringCompareOptions.AnchoredSearch, NSStringCompareOptions.BackwardsSearch]) {
            return range.endIndex == string.endIndex
        }
        return false
    }

}
