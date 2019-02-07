import UIKit

protocol ViewConfig {
    var views: [UIView] { get }
    var constraints: [Constraint?] { get }
    func adopt(on onView: UIView)
    func layoutViews(_ onView: UIView)
    func configureViews()
    func getView(_ viewId: String)
}
