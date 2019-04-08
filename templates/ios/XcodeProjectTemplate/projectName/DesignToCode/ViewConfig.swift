import UIKit

protocol ViewConfig {
    var views: [String: UIView] { get }
    var constraints: [String: Constraint] { get }
    var treeElement: TreeElement? { get }
    var dynamicClasses: [String]? { get }
    
    /// bind dummy data(like UICollectionView's cell data) which is taken from metadata of each design tools
    func bindDummyData()

    /// addSubView and layout views that matches to name on specific view
    ///
    /// - Parameters:
    ///   - name: shuold be same as `Dtc.config.baseViewComponentName` or a `name` of treeElement.
    ///   - onView: the view where all views matching `name` are added
    /// - Returns: adopted view ids
    func adopt(name: String, on onView: UIView) -> [String: String]
    func configureViews()
    func getView(_ viewId: String) -> UIView?
    func getTreeElement(for name: String) -> TreeElement?
}
