// To parse the JSON, add this file to your project and do:
//
//   let colorFill = try? newJSONDecoder().decode(ColorFill.self, from: jsonData)

import Foundation
import UIKit

enum FillType: Int, Codable {
    case fill = 0
    case gradient = 1
    case image = 4
    case noise = 5
}

enum GradientType: Int, Codable {
    case linear = 0, radial, angular
}

struct ColorFill: Codable {
    let isEnabled: Bool
    let fillType: FillType
    let opacity: CGFloat
    let color: Color
    let gradient: Gradient?
}

struct Gradient: Codable {
    let elipseLength: CGFloat
    let from, to: Point
    let type: GradientType
    let stops: [Stop]
}

struct Stop: Codable {
    let position: CGFloat
    let color: Color
}
