enum BarButtonItemSide: String, Codable {
    case left = "LEFT"
    case right = "RIGHT"
}

struct BarButtonItem: Codable {
    let id: String
    let side: BarButtonItemSide
    let isBackButton: Bool = false

    let label: String?
    let textStyle: TextStyle?
    let iconPath: String?
    let iconColorFills: [ColorFill]?
    let backIconPath: String?
}
