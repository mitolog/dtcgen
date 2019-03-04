import UIKit

protocol ViewConfig {
    var views: [String: UIView] { get }
    var constraints: [String: Constraint] { get }
    var treeElement: TreeElement? { get }
    func adopt(name: String, on onView: UIView)
    func configureViews()
    func getView(_ viewId: String) -> UIView?
    func getTreeElement(for name: String) -> TreeElement?
}
