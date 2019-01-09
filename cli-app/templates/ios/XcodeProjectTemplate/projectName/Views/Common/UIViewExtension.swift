import Foundation
import UIKit

// TBD: it's not robust way.. taken from
// https://medium.com/@valv0/computed-properties-and-extensions-a-pure-swift-approach-64733768112c
extension UIView {
    private static var _parentId = [String:String]()
    var parentId:String {
        get {
            let tmpAddress = String(format: "%p", unsafeBitCast(self, to: Int.self))
            return UIView._parentId[tmpAddress] ?? ""
        }
        set(newValue) {
            let tmpAddress = String(format: "%p", unsafeBitCast(self, to: Int.self))
            UIView._parentId[tmpAddress] = newValue
        }
    }

    func layout() {
        
    }
}
