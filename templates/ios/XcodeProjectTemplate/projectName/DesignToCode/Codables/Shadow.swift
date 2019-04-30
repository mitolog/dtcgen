import Foundation
import UIKit

struct Shadow: Codable {
    let isEnabled: Bool
    let opacity: CGFloat
    let color: Color
    let radius: CGFloat
    let offset: Size
}
