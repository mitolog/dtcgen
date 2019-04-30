import Foundation
import UIKit

struct Color: Codable {
    var red : CGFloat = 0.0, green: CGFloat = 0.0, blue: CGFloat = 0.0, alpha: CGFloat = 0.0
    var name: String?

    // retrieve UIColor from `Color`
    var uiColor : UIColor {
        return UIColor(red: red, green: green, blue: blue, alpha: alpha)
    }

    private enum CodingKeys: String, CodingKey {
        case red, green, blue, alpha, fill, name
    }

    private enum FillInfoKeys: String, CodingKey {
        case red, green, blue, alpha
    }

    // assign red, green, blue, alpha from UIColor. name leave it nil
    init(uiColor : UIColor) {
        uiColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decodeIfPresent(String.self, forKey: .name)

        let fillInfo = try container.nestedContainer(keyedBy: FillInfoKeys.self, forKey: .fill)
        red = try fillInfo.decode(CGFloat.self, forKey: .red)
        green = try fillInfo.decode(CGFloat.self, forKey: .green)
        blue = try fillInfo.decode(CGFloat.self, forKey: .blue)
        alpha = try fillInfo.decode(CGFloat.self, forKey: .alpha)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(name, forKey: .name)

        var fillInfo = container.nestedContainer(keyedBy: FillInfoKeys.self, forKey: .fill)
        try fillInfo.encode(red, forKey: .red)
        try fillInfo.encode(green, forKey: .green)
        try fillInfo.encode(blue, forKey: .blue)
        try fillInfo.encode(alpha, forKey: .alpha)
    }
}
