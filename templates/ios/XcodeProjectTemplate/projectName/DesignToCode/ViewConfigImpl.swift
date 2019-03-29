import Foundation
import UIKit

class ViewConfigImpl : NSObject, ViewConfig {

    /*
     * protocol properties below
     */

    var views: [String: UIView] = [:]
    var constraints: [String: Constraint] = [:]
    var treeElement: TreeElement? = nil
    var dynamicClasses: [String]? = nil

    /*
     * protocol methods below
     */

    func adopt(name: String, on onView: UIView) -> [String: String] {

        var viewIdMap: [String:String] = [:]
        let isBaseView = name == Dtc.config.baseViewComponentName
        self.configureViews()
        if (isBaseView) {
            self.bindDummyData()
        }
        self.searchViewIds(for: name, treeElement: self.treeElement, outputs: &viewIdMap)
        self.adopt(on: onView, targets: Array(viewIdMap.keys), isExceptions: isBaseView)    // <- should be after configureViews
        return viewIdMap;
    }

    func configureViews() {
        // shuold be filled within subclasses
    }

    func bindDummyData() {
        // shuold be filled within subclasses
    }

    /// recursively search and retrieve first matched view corresponding `name` on `treeElement`.
    /// but it can be multiple views which has same name. so need to be considered.
    func getView(name: String, treeElement: TreeElement?) -> UIView? {
        guard
            let treeElement = treeElement,
            let uid = treeElement.uid else { return nil }
        if treeElement.name == name {
            return getView(uid)
        }
        guard let elements = treeElement.elements else { return nil }
        var targetView: UIView?
        for element in elements {
            targetView = self.getView(name: name, treeElement: element)
        }
        return targetView
    }

    func getView(_ viewId: String) -> UIView? {
        return self.views[viewId]
    }

    /// retrieve `TreeElement` matching with name, but not ** recursive **
    func getTreeElement(for name: String) -> TreeElement? {
        let data = try! getJSONData("tree")
        let tree = try! Tree(data: data!)
        for aElement in tree {
            guard let elementName = aElement.name else { continue }
            if elementName == name { return aElement }
        }
        return nil
    }

    /*
     * instance methods
     */
    func getJSONData(_ name: String) throws -> Data? {
        guard let path = Bundle.main.path(forResource: name, ofType: "json") else { return nil }
        let url = URL(fileURLWithPath: path)

        return try Data(contentsOf: url)
    }

    /*
     * private methods below
     */

    // If the `name` parameter is not base view's, only first matched treeElement is used.
    // Otherwise, search and collect all treeElements' uids(and names) that matches.
    private func searchViewIds(for name: String, treeElement: TreeElement?, outputs: inout [String: String]) {

        guard
            let treeElement = treeElement,
            let treeElements = treeElement.elements else { return }
        let isBaseView = name == Dtc.config.baseViewComponentName
        for aElement in treeElements {
            guard let treeName = aElement.name else { continue }
            let dynamicClasses: [String] = self.dynamicClasses ?? []
            var isDynamicClass = false
            dynamicClasses.forEach { (className) in
                if treeName.contains(className) {
                    isDynamicClass = true
                    return
                }
            }
            let matched = (isBaseView && isDynamicClass) || (!isBaseView && treeName == name)
            if matched {
                // get all uids(and dot connected names) of sucseeding tree elements
                self.getAllUid(treeElement: aElement, uidMap: &outputs)
                if isBaseView { continue } else { return }
            }
            // if element name doesn't match, dig deeper
            self.searchViewIds(for: name, treeElement: aElement, outputs: &outputs)
        }
    }

    /// recursively get all uids that treeElement.elements includes
    private func getAllUid(treeElement: TreeElement, uidMap: inout [String: String]) {
        guard let uid = treeElement.uid, let name = treeElement.name else { abort() }
        uidMap[uid] = name

        guard let elements = treeElement.elements else { return }
        if elements.count <= 0 { return }

        for aElement in elements {
            self.getAllUid(treeElement: aElement, uidMap: &uidMap)
        }
    }

    private func adopt(on onView: UIView, targets: [String], isExceptions: Bool) {

        for (key, view) in self.views {
            let isMatched = targets.contains(key)
            let isBase = isExceptions && !isMatched
            let isView = !isExceptions && isMatched
            if(isBase || isView) {
                self.add(view, onView)
            }
        }
        self.layoutViews(onView, viewIds: targets, isExceptions: isExceptions)
    }

    private func layoutViews(_ onView: UIView, viewIds: [String], isExceptions: Bool) {
        var anchors: [NSLayoutConstraint] = []

        for (key, view) in self.views {
            let isMatched = viewIds.contains(key)
            let isBase = isExceptions && !isMatched
            let isView = !isExceptions && isMatched
            if(!isBase && !isView) { continue }

            let superview = view.superview ?? onView
            guard let constraint = constraints[key] else { continue }

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

    private func add(_ targetView: UIView, _ onView: UIView) {
        var hasParentView = false
        for (key, view) in self.views {
            guard let parentId = targetView.parentId else { continue }
            if parentId == key {
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
