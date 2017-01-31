//
//  Http.swift
//  jsengine
//
//  Created by Sam Macbeth on 12/12/2016.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//

import Foundation

class HttpHandler {
    
    let session: NSURLSession
    
    let HEADER_CONTENT_TYPE: String = "Content-Type"
    let TYPE_JSON: String = "application/json"
    
    public init() {
        // TODO: Restrict network usage in config
        let sessionConfig = NSURLSessionConfiguration.defaultSessionConfiguration()
        self.session = NSURLSession(configuration: sessionConfig)
    }
    
    func extend(context: JSContext) {
        let httpHandlerFn: @convention(block) (String, String, JSValue, JSValue, Int, JSValue) -> () = {[weak self] method, requestedUrl, callback, onerror, timeout, data in
            self?.httpHandler(method, requestedUrl: requestedUrl, callback: callback, onerror: onerror, timeout: timeout, data: data, context: context)
        }
        context.setObject(unsafeBitCast(httpHandlerFn, AnyObject.self), forKeyedSubscript: "httpHandler")
    }
    
    func httpHandler(method: String, requestedUrl: String, callback: JSValue, onerror: JSValue, timeout: Int, data: JSValue, context: JSContext?) {
        let url: NSURL = NSURL(string: requestedUrl)!
        let request: NSMutableURLRequest = NSMutableURLRequest(URL: url)
        request.HTTPMethod = method
        
        if !data.isUndefined && !data.isNull {
            request.setValue(self.TYPE_JSON, forHTTPHeaderField: self.HEADER_CONTENT_TYPE)
            if !data.isString {
                context?.exception = JSValue(object: "httpHandler: non String data is not supported", inContext: context!)
                return;
            }
            request.HTTPBody = data.toString().dataUsingEncoding(NSUTF8StringEncoding)
        }
        
        self.session.dataTaskWithRequest(request) { (responseData, response, error) -> Void in
            if let response = response as? NSHTTPURLResponse {
                if 200...299 ~= response.statusCode {
                    var encoding = NSUTF8StringEncoding
                    
                    if let encodingName = response.textEncodingName where encodingName != "utf-8" {
                        // other encoding
                        onerror.callWithArguments(["unsupported response encoding: \(encodingName)"])
                        return
                    }
                    
                    let responseString : String = String(data: responseData!, encoding: encoding)!
                    let responseObject = ["status": response.statusCode, "responseText": responseString, "response": responseString]
                    
                    callback.callWithArguments([responseObject])
                } else {
                    onerror.callWithArguments(nil)
                }
            } else {
                onerror.callWithArguments(nil)
            }
        }.resume()
    }
}
