import Foundation
import UIKit

/* same as Container of DesignToCode entity */
protocol DtcProperties: Codable {
    var type: PropertyType { get }
    var id: String { get }
    var name: String { get }
    var rect: CGRect { get }
}

/**
 * each attributes classes that is defined within DesignToCode
 */
class ContainerProps: DtcProperties {
    var type: PropertyType
    var id: String
    var name: String
    var rect: CGRect
}

class ViewProps: DtcProperties {
    var type: PropertyType
    var id: String
    var name: String
    var rect: CGRect

    var isVisible: Bool
    var originalRect: CGRect
}

class ButtonProps: DtcProperties {
    var type: PropertyType
    var id: String
    var name: String
    var rect: CGRect
}

class TextViewProps: DtcProperties {
    var type: PropertyType
    var id: String
    var name: String
    var rect: CGRect
}

class TextInputProps: DtcProperties {
    var type: PropertyType
    var id: String
    var name: String
    var rect: CGRect
}

class ImageProps: DtcProperties {
    var type: PropertyType
    var id: String
    var name: String
    var rect: CGRect
}

class CardProps: DtcProperties {
    var type: PropertyType
    var id: String
    var name: String
    var rect: CGRect
}

class ListProps: DtcProperties {
    var type: PropertyType
    var id: String
    var name: String
    var rect: CGRect
}

class CellProps: DtcProperties {
    var type: PropertyType
    var id: String
    var name: String
    var rect: CGRect
}

/* same as ElementType of DesignToCode entity */
enum PropertyType: String, Codable {
    case container, view, button, textView, textInput, image, card, list, cell

    var metatype: DtcProperties.Type {
        switch self {

        case .container:
            return ContainerProps.self
        case .view:
            return ViewProps.self
        case .button:
            return ButtonProps.self
        case .textView:
            return TextViewProps.self
        case .textInput:
            return TextInputProps.self
        case .image:
            return ImageProps.self
        case .card:
            return CardProps.self
        case .list:
            return ListProps.self
        case .cell:
            return CellProps.self
        }
    }
}

struct PropertiesWrapper {
    var properties: DtcProperties
}

extension PropertiesWrapper: Codable {
    private enum CodingKeys: CodingKey {
        case properties
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let properties = try ContainerProps.init(from: container.superDecoder(forKey: .properties))
        self.properties = try properties.type.metatype.init(from: container.superDecoder(forKey: .properties))
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try properties.encode(to: container.superEncoder(forKey: .properties))
    }
}
