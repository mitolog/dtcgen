import Foundation
import UIKit

/* same as Container of DesignToCode entity */
protocol DtcProperties: Codable {
    var type: PropertyType { get }
    var id: String { get }
    var name: String { get }
    var rect: Rect { get }
    func assign(to view: UIView)
}

protocol DtcViewProtocol {
    associatedtype PropType
    var props: PropType? { get }
    func assign(props: PropType?)
}

/**
 * each attributes classes that is defined within DesignToCode
 */
class ContainerProps: DtcProperties {

    func assign(to view: UIView) {
    }

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
    var backgroundColor: Color?
    var radius: CGFloat?
    var fills: [ColorFill]?

    func assign(to view: UIView) {
    }
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
    var backgroundColor: Color?
    var radius: CGFloat?
    var fills: [ColorFill]?

    enum ButtonType: Int, Codable {
        case text, icon, iconAndText, toggle, unknown
    }

    // Button props
    var buttonType: ButtonType
    var hasIcon: Bool?
    var textStyle: TextStyle?
    var text: String?

    func assign(to view: UIView) {
    }
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
    var backgroundColor: Color?
    var radius: CGFloat?
    var fills: [ColorFill]?
    var isEditable: Bool?
    
    enum TextViewType: Int, Codable {
        case label, input, textView
    }

    // TextView props
    var textViewType: TextViewType
    var text: String?
    var placeHolder: String?
    var textStyle: TextStyle?

    func assign(to view: UIView) {
    }

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
    var backgroundColor: Color?
    var radius: CGFloat?
    var fills: [ColorFill]?

    // TextInput props
    var isEditable: Bool
    var showsLabel: Bool
    var showsUnderline: Bool

    var text: String?
    var placeHolder: String?
    var assistiveText: String?
    var errorText: String?

    var textStyle: TextStyle?

    func assign(to view: UIView) {
    }
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
    var backgroundColor: Color?
    var radius: CGFloat?
    var fills: [ColorFill]?

    // Image props
    var imageName: String?

    func getAssetPath() -> String? {
        guard var imageName = imageName else { return nil }

        if let pngRng = imageName.range(of: ".(png|jpg|jpeg|pdf|PNG|JPG|JPEG|PDF)$", options: .regularExpression) {
            imageName.replaceSubrange(pngRng, with: "")
        }
        if imageName.range(of: "^DtcGenerated/", options: .regularExpression) == nil {
            imageName = "DtcGenerated/" + imageName
        }
        return imageName
    }

    func assign(to view: UIView) {
    }
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
    var fills: [ColorFill]?

    // Card props
    var imageName: String?
    var title: String?
    var description: String?

    func assign(to view: UIView) {
    }
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
    var fills: [ColorFill]?

    func assign(to view: UIView) {
    }
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
    var fills: [ColorFill]?

    func assign(to view: UIView) {
    }
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
