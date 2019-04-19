import Foundation
import UIKit

enum TextAlignment: Int, Codable {
    case Right = 0, Center, Left, EqualWidth
}

enum VerticalTextAlignment: Int, Codable {
    case up = 0, middle, bottom
}

struct TextStyle: Codable {
    var fontName: String?;
    var fontSize: CGFloat?;
    var fontColor: Color?;
    var alignment: TextAlignment?;
    var verticalAlignment: VerticalTextAlignment?;

    let defaultFontName = "HiraKakuProN-W3"
    let defaultFontSize:CGFloat = 17
    static var defaultFont = UIFont.systemFont(ofSize: 17)

    var uiFont: UIFont {
        return UIFont(name: fontName ?? defaultFontName,
                      size: fontSize ?? defaultFontSize) ?? TextStyle.defaultFont
    }
}
