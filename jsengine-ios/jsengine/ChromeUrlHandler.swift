//
//  ChromeUrlHandler.swift
//  jsengine
//
//  Created by Sam Macbeth on 14/12/2016.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//

import Foundation
import JavaScriptCore

class ChromeUrlHandler : HttpHandler {
    
    let queue: dispatch_queue_t
    let basePath: String
    
    public init(queue: dispatch_queue_t, basePath: String) {
        self.queue = queue
        self.basePath = basePath
        super.init()
    }
    
    override func extend(context: JSContext) {
        super.extend(context)
        let chromeHandlerFn: @convention(block) (String, JSValue, JSValue) -> () = {[weak self] requestedUrl, callback, onerror in
            self?.chromeHttpHandler(requestedUrl, callback: callback, onerror: onerror)
        }
        context.setObject(unsafeBitCast(chromeHandlerFn, AnyObject.self), forKeyedSubscript: "chromeUrlHandler")
    }
    
    private func getFileMetaData(requestedUrl: String) -> (String, String, String) {
        var fileName: String
        var fileExtension: String = "js" // default is js
        var directory: String
        // string.replace with the elegance of swift...
        var sourcePath = requestedUrl.stringByReplacingOccurrencesOfString("chrome://cliqz/content", withString: "/modules")
        sourcePath = sourcePath.stringByReplacingOccurrencesOfString("/v8", withString: "")
        
        // string.contains
        if sourcePath.rangeOfString("/") != nil {
            var pathComponents = sourcePath.componentsSeparatedByString("/")
            fileName = pathComponents.last!
            pathComponents.removeLast()
            directory = self.basePath + pathComponents.joinWithSeparator("/")
        } else {
            fileName = sourcePath
            directory = self.basePath
        }
        
        if fileName.rangeOfString(".") != nil {
            let nameComponents = fileName.componentsSeparatedByString(".")
            fileName = nameComponents[0]
            fileExtension = nameComponents[1]
        }
        return (fileName, fileExtension, directory)
    }
    
    func chromeHttpHandler(requestedUrl: String, callback: JSValue, onerror: JSValue) {
        if !requestedUrl.hasPrefix("chrome://") && !requestedUrl.hasPrefix("file://") {
            onerror.callWithArguments(["Invalid protocol"])
            return
        }
        
        dispatch_async(self.queue, {
            let (fileName, fileExtension, directory) = self.getFileMetaData(requestedUrl)
            if let path = NSBundle.mainBundle().pathForResource(fileName, ofType: fileExtension, inDirectory: directory),
                content = try? NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) as String {
                if content == "undefined" {
                    onerror.callWithArguments(["Not Found"])
                } else {
                    callback.callWithArguments([["status": 200, "responseText": content, "response": content]])
                }
            } else {
                onerror.callWithArguments(["Not Found"])
            }
        })
    }
    
}
