import UIKit

protocol ViewConfig {
    var views: [String: UIView] { get }
    var constraints: [String: Constraint] { get }
    func adopt(on onView: UIView)
    func layoutViews(_ onView: UIView)
    func configureViews()
    func getView(_ viewId: String) -> UIView?
}
