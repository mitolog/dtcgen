import Foundation
import UIKit

/* same as Container of DesignToCode entity */
protocol DtcProperties: Codable {
    var type: PropertyType { get }
    var id: String { get }
    var name: String { get }
    var rect: Rect { get }
}

struct Rect: Codable {
    var x: CGFloat
    var y: CGFloat
    var width: CGFloat
    var height: CGFloat

    var rect: CGRect {
        return CGRect(x: x, y: y, width: width, height: height)
    }

    init(rect: CGRect) {
        x = rect.origin.x
        y = rect.origin.y
        width = rect.size.width
        height = rect.size.height
    }
}

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

enum TextAlignment: Int, Codable {
    case Right = 0, Center, Left, EqualWidth
}

/**
 * each attributes classes that is defined within DesignToCode
 */
class ContainerProps: DtcProperties {
    // Container Props
    var type: PropertyType
    var id: String
    var name: String
    var rect: Rect
}

class ViewProps: DtcProperties {
    // Container Props
    var type: PropertyType
    var id: String
    var name: String
    var rect: Rect

    // View props
    var isVisible: Bool
    var originalRect: Rect
}

class ButtonProps: DtcProperties {
    // Container Props
    var type: PropertyType
    var id: String
    var name: String
    var rect: Rect

    // View props
    var isVisible: Bool
    var originalRect: Rect

    // Button props
    var fontName: String?
    var fontSize: Int?
    var fontColor: Color?
    var hasIcon: Bool?
}

class TextViewProps: DtcProperties {
    // Container Props
    var type: PropertyType
    var id: String
    var name: String
    var rect: Rect

    // View props
    var isVisible: Bool
    var originalRect: Rect

    // TextView props
    var fontName: String
    var fontSize: Int
    var fontColor: Color
    var backgroundColor: Color?
    var text: String?
    var alignment: TextAlignment?
}

class TextInputProps: DtcProperties {
    // Container Props
    var type: PropertyType
    var id: String
    var name: String
    var rect: Rect

    // View props
    var isVisible: Bool
    var originalRect: Rect

    // TextInput props
    var fontName: String
    var fontSize: Int
    var fontColor: Color
    var backgroundColor: Color?
    var text: String?
    var placeHolder: String?
    var alignment: TextAlignment?
}

class ImageProps: DtcProperties {
    // Container Props
    var type: PropertyType
    var id: String
    var name: String
    var rect: Rect

    // View props
    var isVisible: Bool
    var originalRect: Rect

    // Image props
    var imageName: String?
}

class CardProps: DtcProperties {
    // Container Props
    var type: PropertyType
    var id: String
    var name: String
    var rect: Rect

    // View props
    var isVisible: Bool
    var originalRect: Rect

    // Card props
    var imageName: String?
    var title: String?
    var description: String?
}

class ListProps: DtcProperties {
    // Container Props
    var type: PropertyType
    var id: String
    var name: String
    var rect: Rect

    // View props
    var isVisible: Bool
    var originalRect: Rect
}

class CellProps: DtcProperties {
    // Container Props
    var type: PropertyType
    var id: String
    var name: String
    var rect: Rect

    // View props
    var isVisible: Bool
    var originalRect: Rect
}

/* same as ElementType of DesignToCode entity */
enum PropertyType: String, Codable {
    case Container, View, Button, TextView, TextInput, Image, Card, List, Cell

    var metatype: DtcProperties.Type {
        switch self {

        case .Container:
            return ContainerProps.self
        case .View:
            return ViewProps.self
        case .Button:
            return ButtonProps.self
        case .TextView:
            return TextViewProps.self
        case .TextInput:
            return TextInputProps.self
        case .Image:
            return ImageProps.self
        case .Card:
            return CardProps.self
        case .List:
            return ListProps.self
        case .Cell:
            return CellProps.self
        }
    }
}
