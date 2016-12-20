//
//  InterceptorURLProtocol.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 12/14/16.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//

import Foundation

class InterceptorURLProtocol: NSURLProtocol {
    
    static let customURLProtocolHandledKey = "customURLProtocolHandledKey"
    static let excludeUrlPrefixes = ["https://lookback.io/api", "http://localhost"]
    
    //MARK: - NSURLProtocol handling
    override class func canInitWithRequest(request: NSURLRequest) -> Bool {
        guard (
            NSURLProtocol.propertyForKey(customURLProtocolHandledKey, inRequest: request) == nil
                && request.mainDocumentURL != nil) else {
                    return false
        }
        guard isExcludedUrl(request.URL) == false else {
            return false
        }
        //TODO: exclude HTTPHandler Request from being intercepted
        if let webRequest = Engine.sharedInstance.webRequest {
            return webRequest.shouldBlockRequest(request)
        }
        
        return false
    }
    
    override class func canonicalRequestForRequest(request: NSURLRequest) -> NSURLRequest {
        return request
    }
    
    override func startLoading() {
        returnEmptyResponse()
    }
    override func stopLoading() {
        
    }
    
    
    //MARK: - private helper methods
    static func isExcludedUrl(url: NSURL?) -> Bool {
        if let scheme = url?.scheme where !startsWith(scheme, prefix: "http") {
            return true
        }
        
        if let urlString = url?.absoluteString {
            for prefix in excludeUrlPrefixes {
                if startsWith(urlString, prefix: prefix) {
                    return true
                }
            }
        }
        
        return false
    }
    static private func startsWith(string: String, prefix: String) -> Bool {
        // rangeOfString returns nil if other is empty, destroying the analogy with (ordered) sets.
        if prefix.isEmpty {
            return true
        }
        if let range = string.rangeOfString(prefix,
                                          options: NSStringCompareOptions.AnchoredSearch) {
            return range.startIndex == string.startIndex
        }
        return false
    }

    // MARK: Private helper methods
    private func returnEmptyResponse() {
        // To block the load nicely, return an empty result to the client.
        // Nice => UIWebView's isLoading property gets set to false
        // Not nice => isLoading stays true while page waits for blocked items that never arrive
        
        guard let url = request.URL else { return }
        let response = NSURLResponse(URL: url, MIMEType: "text/html", expectedContentLength: 1, textEncodingName: "utf-8")
        client?.URLProtocol(self, didReceiveResponse: response, cacheStoragePolicy: .NotAllowed)
        client?.URLProtocol(self, didLoadData: NSData())
        client?.URLProtocolDidFinishLoading(self)
    }
    
    
}
