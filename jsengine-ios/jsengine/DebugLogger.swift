//
//  DebugLogger.swift
//  jsengine
//
//  Created by Ghadir Eraisha on 1/11/17.
//  Copyright © 2017 Cliqz GmbH. All rights reserved.
//

import Foundation

class DebugLogger {
    class func log<T>(@autoclosure object: () -> T) {
        #if DEBUG
            let value = object()
            let stringRepresentation: String
            
            if let value = value as? CustomDebugStringConvertible {
                stringRepresentation = value.debugDescription
            } else if let value = value as? CustomStringConvertible {
                stringRepresentation = value.description
            } else {
                stringRepresentation = ""
                fatalError("printLog only works for values that conform to CustomDebugStringConvertible or CustomStringConvertible")
            }
            
            NSLog("[DEBUG] \(stringRepresentation)")
        #endif
    }
}
