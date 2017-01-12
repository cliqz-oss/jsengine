//
//  Crypto.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 12/9/16.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//

import Foundation
import JavaScriptCore


class Crypto {
    
    init() {
        
    }
    
    func extend(context: JSContext) {
        let crypto = JSValue.init(newObjectInContext: context)
        
        
        let md5Native: @convention(block) (String) -> String = {data in
            return Crypto.md5(data)
        }
        crypto.setObject(unsafeBitCast(md5Native, AnyObject.self), forKeyedSubscript: "_md5Native")
        context.setObject(crypto, forKeyedSubscript: "crypto")
    }
    
    static func md5(data: String) -> String {
        var digest = [UInt8](count: Int(CC_MD5_DIGEST_LENGTH), repeatedValue: 0)
        if let encodedData = data.dataUsingEncoding(NSUTF8StringEncoding) {
            CC_MD5(encodedData.bytes, CC_LONG(encodedData.length), &digest)
        }
        
        var digestHex = ""
        for index in 0..<Int(CC_MD5_DIGEST_LENGTH) {
            digestHex += String(format: "%02x", digest[index])
        }
        
        return digestHex
    }
    
}
