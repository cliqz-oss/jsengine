//
//  Utils.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 2/14/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import Foundation

class Utils {
    
    static func readSourceFile(bundle: NSBundle, assetsRoot: String, assetPath: String, buildPath: String, fileExtension: String) -> String? {
        var content: String? = nil
        let (sourceName, directory) = getSourceMetaData(assetsRoot, assetPath: assetPath, buildPath: buildPath)
        if let path = bundle.pathForResource(sourceName, ofType: fileExtension, inDirectory: directory){
            content = try? NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) as String
        } else {
            DebugLogger.log("<< Script not found: \(assetPath)")
            
        }
        return content
    }
    
    static func getSourceMetaData(assetsRoot: String, assetPath: String, buildPath: String) -> (String, String) {
        var sourceName: String
        var directory: String
        // seperate the folder path and the file name of the asset
        if assetPath.rangeOfString("/") != nil {
            var pathComponents = assetPath.componentsSeparatedByString("/")
            sourceName = pathComponents.last!
            pathComponents.removeLast()
            directory = assetsRoot + buildPath + pathComponents.joinWithSeparator("/")
        } else {
            sourceName = assetPath
            directory = assetsRoot + buildPath
        }
        
        // remove file extension
        if endsWith(sourceName, suffix:".js") {
            sourceName = sourceName.stringByReplacingOccurrencesOfString(".js", withString: "", options: NSStringCompareOptions.LiteralSearch, range: nil)
        }
        
        return (sourceName, directory)
    }
    
    static func endsWith(string: String, suffix: String) -> Bool {
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
