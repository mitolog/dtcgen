import Foundation
import UIKit

struct Point: Codable {
    let x, y: CGFloat

    func cgPoint() -> CGPoint {
        return CGPoint(x: x, y: y)
    }
}

struct Size: Codable {
    let width, height: CGFloat

    func cgSize() -> CGSize {
        return CGSize(width: width, height: height)
    }
}
