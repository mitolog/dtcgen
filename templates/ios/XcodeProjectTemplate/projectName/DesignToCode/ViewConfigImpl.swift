import Foundation
import UIKit

class ViewConfigImpl : ViewConfig {

    // each element should be UIView or subclasses
    var views: [String: UIView] = [:]
    var constraints: [String: Constraint] = [:]

    func adopt(on onView: UIView) {

        self.configureViews()
        for (_, view) in self.views {
            self.add(view, onView)
        }
        self.layoutViews(onView)
    }

    func layoutViews(_ onView: UIView) {
        var anchors: [NSLayoutConstraint] = []

        for (key, view) in views {
            guard let constraint = constraints[key] else { continue }
            let superview = view.superview ?? onView

            if let top = constraint.top {
                anchors.append(view.topAnchor.constraint(equalTo: superview.safeAreaLayoutGuide.topAnchor, constant: top))
            }
            if let right = constraint.right {
                anchors.append(view.rightAnchor.constraint(equalTo: superview.safeAreaLayoutGuide.rightAnchor, constant: right))
            }
            if let bottom = constraint.bottom {
                anchors.append(view.bottomAnchor.constraint(equalTo: superview.safeAreaLayoutGuide.bottomAnchor, constant: bottom))
            }
            if let left = constraint.left {
                anchors.append(view.leftAnchor.constraint(equalTo: superview.safeAreaLayoutGuide.leftAnchor, constant: left))
            }
            if let width = constraint.width {
                anchors.append(view.widthAnchor.constraint(equalToConstant: width))
            }
            if let height = constraint.height {
                anchors.append(view.heightAnchor.constraint(equalToConstant: height))
            }
        }
        NSLayoutConstraint.activate(anchors)
    }

    func configureViews() {
    }

    func getView(_ viewId: String) -> UIView? {
        return self.views[viewId]
    }

    private func searchOrigin(_ targetView: UIView, originId: String) -> Bool {
        let parentId = targetView.parentId
        var hasOrigin = false
        for (_, view) in views.enumerated() {
            let isOrigin = (originId == view.restorationIdentifier)
            let isParent = (parentId == nil || parentId == view.restorationIdentifier)
            let hasParent = (view.parentId != nil) ? true : false

            if (isParent && hasParent && !hasOrigin) {
                hasOrigin = searchOrigin(view, originId: originId)
            } else if (isParent && !hasParent && isOrigin) {
                hasOrigin = true
                break
            }
        }
        return hasOrigin
    }

    private func add(_ targetView: UIView, _ onView: UIView) {
        var hasParentView = false
        for (_, view) in self.views {
            guard
                let viewId = view.restorationIdentifier,
                let parentId = targetView.parentId else { continue }

            if parentId == viewId {
                view.addSubview(targetView)
                hasParentView = true
                break
            }
        }
        if !hasParentView {
            onView.addSubview(targetView)
        }
    }
}
