//
//  FileIO.swift
//  jsengine
//
//  Created by Sam Macbeth on 07/12/2016.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//

import Foundation
import JavaScriptCore


class FileIO {
    
    private let documentDirectory = NSSearchPathForDirectoriesInDomains(.DocumentDirectory, .UserDomainMask, true).first! as String
    let queue: dispatch_queue_t
    
    public init(queue: dispatch_queue_t) {
        self.queue = queue
    }
    
    public func extend(context: JSContext) {
        let fs = JSValue.init(newObjectInContext: context)
        let readFile : @convention(block) (String, JSValue) -> () = {[weak self] path, callback in
            if let queue = self?.queue {
                dispatch_async(queue) {[weak self] in
                    self?.readFile(path, callback: callback)
                }
            }
            
        }
        let writeFile : @convention(block) (String, String) -> () = {[weak self] path, data in
            if let queue = self?.queue {
                dispatch_async(queue) {[weak self] in
                    self?.writeFile(path, data: data)
                }
            }
        }
        let deleteFile : @convention(block) (String) -> () = {[weak self] path in
            if let queue = self?.queue {
                dispatch_async(queue) {[weak self] in
                    self?.deleteFile(path)
                }
            }
        }
        
        fs.setObject(unsafeBitCast(readFile, AnyObject.self), forKeyedSubscript: "readFile")
        fs.setObject(unsafeBitCast(writeFile, AnyObject.self), forKeyedSubscript: "writeFile")
        fs.setObject(unsafeBitCast(deleteFile, AnyObject.self), forKeyedSubscript: "deleteFile")
        
        context.setObject(fs, forKeyedSubscript: "fs")
    }
    
    func readFile(path: String, callback: JSValue) {
        var p = self.documentDirectory
        do {
            p.appendContentsOf("/\(path)")
            let content = try String(contentsOfFile: p, encoding: NSUTF8StringEncoding)
            if content == "undefined" {
                // files does not exist, do no thing
                callback.callWithArguments(nil)
            } else {
                callback.callWithArguments([content])
            }
        } catch _ as NSError {
            // files does not exist, do no thing
            callback.callWithArguments(nil)
        }
    }
    
    func writeFile(path: String, data: String) {
        let p = self.documentDirectory
        if let filePathURL = NSURL(fileURLWithPath: p).URLByAppendingPathComponent(path) {
            let containingDirectory = filePathURL.URLByDeletingLastPathComponent
            createDirectoryIfNotExist(containingDirectory)
            do {
                try data.writeToURL(filePathURL, atomically: true, encoding: NSUTF8StringEncoding)
            } catch let error as NSError {
                print("WriteFile Failed: ---- \(error)")
            }
        }
        
    }
    private func createDirectoryIfNotExist(directoryURL: NSURL?){
        let fileManager = NSFileManager.defaultManager()
        
        if let path = directoryURL?.path where fileManager.fileExistsAtPath(path) == false {
            do {
                try fileManager.createDirectoryAtPath(path, withIntermediateDirectories: true, attributes: nil)
            } catch let error as NSError {
                //TODO log error here
                NSLog("Could not create directory at path:\(path) because of the following error: \(error.debugDescription)")
            }
        }
    }
    
    func deleteFile(path: String) {
        
    }
    
}
