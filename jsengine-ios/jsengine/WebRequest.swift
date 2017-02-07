//
//  WebRequest.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 12/12/16.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//
import UIKit
import WebKit
import JavaScriptCore

public class WebRequest {
    weak var jsContext: JSContext? = nil
    var tabs = NSMapTable.strongToWeakObjectsMapTable()
    var webRequest: JSValue?
    
    init() {
        
    }
    
    func extend(context: JSContext) {
        self.jsContext = context
        let nativeIsWindowActive: @convention(block) (Int) -> Bool = {[weak self] tabId in
            if let tabActive = self?.isTabActive(tabId) {
                return tabActive
            }
            return false
        }
        context.setObject(unsafeBitCast(nativeIsWindowActive, AnyObject.self), forKeyedSubscript: "_nativeIsWindowActive")
        
        self.webRequest = context.evaluateScript("webRequest")
    }
    
    func shouldBlockRequest(request: NSURLRequest) -> Bool {
        
        let requestInfo = getRequestInfo(request)
        if let blockResponse = getBlockResponseForRequest(requestInfo) where blockResponse.count > 0 {
            return true
        }
        
        return false
    }
    
    func newTabCreated(tabId: Int, webView: UIView) {
        tabs.setObject(webView, forKey: NSNumber(integer: tabId))
    }
    
    func getUrlForTab(tabId: Int) -> String? {
        if self.isTabActive(tabId) {
            if let webView = tabs.objectForKey(tabId) as? UIWebView {
                return webView.request?.URL?.absoluteString
            }
        }
        return nil
    }
    
    func isTabActive(tabId: Int) -> Bool {
        return tabs.objectForKey(tabId) != nil
    }
    
    //MARK: - Private Methods
    
    private func getBlockResponseForRequest(requestInfo: [String: AnyObject]) -> [NSObject : AnyObject]? {

        if let onBeforeRequest = self.webRequest?.valueForProperty("onBeforeRequest") {
            
            let blockResponse = onBeforeRequest.invokeMethod("_trigger", withArguments: [requestInfo])?.toDictionary()
            
            return blockResponse
        }
        return nil
    }
    
    private func getRequestInfo(request: NSURLRequest) -> [String: AnyObject] {
        let url = request.URL?.absoluteString
        let userAgent = request.allHTTPHeaderFields?["User-Agent"]
        
        let isMainDocument = request.URL == request.mainDocumentURL
        let tabId = getTabId(userAgent)
        let isPrivate = false
        let originUrl = request.mainDocumentURL?.absoluteString
        
        var requestInfo = [String: AnyObject]()
        requestInfo["url"] = url
        requestInfo["method"] = request.HTTPMethod
        requestInfo["tabId"] = tabId ?? -1
        requestInfo["parentFrameId"] = -1
        // TODO: frameId how to calculate
        requestInfo["frameId"] = tabId ?? -1
        requestInfo["isPrivate"] = isPrivate
        requestInfo["originUrl"] = originUrl
        let contentPolicyType = ContentPolicyDetector.sharedInstance.getContentPolicy(request, isMainDocument: isMainDocument)
        requestInfo["type"] = contentPolicyType;
        
        requestInfo["requestHeaders"] = request.allHTTPHeaderFields
        return requestInfo
    }
    
    public class func generateUniqueUserAgent(baseUserAgent: String, tabId: Int) -> String {
        let uniqueUserAgent = baseUserAgent + String(format:" _id/%06d", tabId)
        return uniqueUserAgent
    }
    
    private func getTabId(userAgent: String?) -> Int? {
        guard let userAgent = userAgent else { return nil }
        guard let loc = userAgent.rangeOfString("_id/") else {
            // the first created webview doesn't have the id, because at this point there is no way to get the user agent automatically
            return 1
        }
        let tabIdString = userAgent.substringWithRange(loc.endIndex..<loc.endIndex.advancedBy(6))
        guard let tabId = Int(tabIdString) else { return nil }
        return tabId
    }
    
    private func toJSONString(anyObject: AnyObject) -> String? {
        do {
            if NSJSONSerialization.isValidJSONObject(anyObject) {
                let jsonData = try NSJSONSerialization.dataWithJSONObject(anyObject, options: NSJSONWritingOptions(rawValue: 0))
                let jsonString = String(data:jsonData, encoding: NSUTF8StringEncoding)!
                return jsonString
            } else {
                print("[toJSONString] the following object is not valid JSON: \(anyObject)")
            }
        } catch let error as NSError {
            print("[toJSONString] JSON conversion of: \(anyObject) \n failed with error: \(error)")
        }
        return nil
    }

    
}
