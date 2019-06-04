struct NavigationItem: Codable {
    let leftItems: [BarButtonItem]?
    let rightItems: [BarButtonItem]?

    let titleText: String?
    let subTitleText: String?
    let titleTextStyle: TextStyle?
}
