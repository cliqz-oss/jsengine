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
    let x = Engine()
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Do any additional setup after loading the view, typically from a nib.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

	@IBAction func showReactView() {
		let jsCodeLocation = NSURL(string: "http://localhost:8081/index.ios.bundle?platform=ios")
		let mockData:NSDictionary = ["scores": [ ["name":"Alex", "value":"42"], ["name":"Joel", "value":"10"] ] ]
		let rootView = RCTRootView( bundleURL: jsCodeLocation, moduleName: "RNHighScores", initialProperties: mockData as [NSObject : AnyObject], launchOptions: nil )
		let vc = UIViewController()
		vc.view = rootView
		self.presentViewController(vc, animated: true, completion: nil)
	}

}

