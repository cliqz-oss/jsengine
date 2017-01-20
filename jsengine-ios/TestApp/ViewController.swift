//
//  ViewController.swift
//  TestApp
//
//  Created by Sam Macbeth on 07/12/2016.
//  Copyright © 2016 Cliqz GmbH. All rights reserved.
//

import UIKit
import jsengine
import React

class ViewController: UIViewController {
    
    let jsengine : Engine = Engine()

    override func viewDidLoad() {
        super.viewDidLoad()
 
        // Do any additional setup after loading the view, typically from a nib.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

	@IBAction func showReactView() {
        
        var requestInfo = [String: AnyObject]()
        requestInfo["id"] = 1
        requestInfo["url"] = "https://cliqz.com"
        requestInfo["method"] = "GET"
        requestInfo["tabId"] = 1234231
        requestInfo["parentFrameId"] = -1
        // TODO: frameId how to calculate
        requestInfo["frameId"] = 1234231
        requestInfo["isPrivate"] = false
        requestInfo["source"] = "https://cliqz.com"
        requestInfo["type"] = 6;
        
//        let resp = self.jsengine.webRequest?.getBlockResponseForRequest(requestInfo)
//        print(resp)

        let vc = UIViewController()
        vc.view = self.jsengine.rootView
        self.presentViewController(vc, animated: true, completion: nil)
        
        
	}
    
    

}

