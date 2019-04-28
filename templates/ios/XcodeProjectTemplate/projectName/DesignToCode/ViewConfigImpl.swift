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

        // [uid: name]
        var viewIdMap: [String:String] = [:]
        let isBaseView = name == Dtc.config.baseViewComponentName
        self.configureViews()

        // ここでstaticなviewにpropsをアサインしていく
        if let treeElement = self.treeElement {
            self.assignProps(treeElement: treeElement)
        }

        // do not place code below upper than configureViews()
        if (isBaseView) {
            self.bindDummyData()
        }
        self.searchViewIds(for: name, treeElement: self.treeElement, outputs: &viewIdMap)
        self.adopt(on: onView, viewIdMap: viewIdMap, isExceptions: isBaseView)
        return viewIdMap;
    }

    func configureViews() {
        // shuold be filled within subclasses
    }

    func bindDummyData() {
        // shuold be filled within subclasses
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

    func trimClassPrefix(_ name: String, classPrefix: String) -> String {

        var targetName = name
        if let matchedRange = name.range(of: "^\(classPrefix)", options: .regularExpression) {
            let removed = targetName.replacingCharacters(in: matchedRange, with: "")
            targetName = removed.prefix(1) == "."
                ? String(removed[removed.index(after: removed.startIndex)..<removed.endIndex])
                : removed
        }
        return targetName
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

    private func assignProps(treeElement: TreeElement) {
        guard
            let uid = treeElement.uid,
            let props = treeElement.properties else { return }

        if let view = self.views[uid] {
            switch view {
            case is Container:
                guard let viewProps = props as? ViewProps else { break }
                (view as! Container).assign(props: viewProps)
            case is Button:
                guard let buttonProps = props as? ButtonProps else { break }
                (view as! Button).assign(props: buttonProps)
            case is Label:
                guard let textViewProps = props as? TextViewProps else { break }
                (view as! Label).assign(props: textViewProps)
            case is TextView:
                guard let textViewProps = props as? TextViewProps else { break }
                (view as! TextView).assign(props: textViewProps)
            case is TextField:
                guard let textInputProps = props as? TextInputProps else { break }
                (view as! TextField).assign(props: textInputProps)
            case is TextField:
                guard let textInputProps = props as? TextInputProps else { break }
                (view as! TextField).assign(props: textInputProps)
            case is CollectionView:
                guard let listProps = props as? ListProps else { break }
                (view as! CollectionView).assign(props: listProps)
            default:
                break
            }
        }

        guard let elements = treeElement.elements else { return }
        for element in elements {
            self.assignProps(treeElement: element)
        }
    }

    // If the `name` parameter is not base view's, only first matched treeElement is used.
    // Otherwise, search and collect all treeElements' uids(and names) that matches.
    private func searchViewIds(for name: String,
                               treeElement: TreeElement?,
                               outputs: inout [String: String]) {
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
    private func getAllUid(treeElement: TreeElement, uidMap: inout [String: String], parentName: String? = nil) {
        guard let uid = treeElement.uid, let name = treeElement.name else { abort() }
        let currentElementName: String = parentName != nil ? parentName! + "." + name : name
        uidMap[uid] = currentElementName

        guard let elements = treeElement.elements else { return }
        if elements.count <= 0 { return }

        for aElement in elements {
            self.getAllUid(treeElement: aElement, uidMap: &uidMap, parentName: currentElementName)
        }
    }

    private func adopt(on onView: UIView, viewIdMap: [String: String], isExceptions: Bool) {

        // add views onto super view BEFORE layouts, otherwise it crashes
        self.lookupViews(onView,
                         viewIdMap: viewIdMap,
                         isExceptions: isExceptions) { [weak self] (view, uid) in
            guard let weakSelf = self else { return }
            weakSelf.add(view, onView, viewIdMap)
        }

        // layout views
        var anchors: [NSLayoutConstraint] = []
        self.lookupViews(onView,
                         viewIdMap: viewIdMap,
                         isExceptions: isExceptions) { [weak self] (view, uid) in
            guard let weakSelf = self else { return }
            weakSelf.layoutViews(view, on: onView, uid: uid, anchors: &anchors)
        }
        NSLayoutConstraint.activate(anchors)
    }

    private func lookupViews(_ onView: UIView,
                             viewIdMap: [String: String],
                             isExceptions: Bool,
                             found: (_ view: UIView, _ uid: String) -> Void) {

        /* 
            Here we are aiming to retrieve view instances linked to each uid of viewIdMap.
            So, originally we shuold do like this:

            ```
            for (uid, _) in viewIdMap {
                if let view = self.views[uid] {
                    /* some process here */
                }
            }
            ```

            but the problem is `viewIdMap` iteration CANNOT BE IN ORDER because it's dictionary, not an array.
            So, we prepared uid array `uids` which is lined up in order, then do matching.
            But if you do that, complexity becomes O(n). So, potencially we shuold make Ordered hash map like:
            https://github.com/omochi/OrderedDictionary/tree/25c754ff4fd48942dbc43df90234eec8243b44b9
        */

        guard let treeElement = self.treeElement else { return }
        var uids: [String] = []
        treeElement.getUids(&uids)
        for uid in uids {
            let isMatched = viewIdMap[uid] != nil
            let isBase = isExceptions && !isMatched
            let isView = !isExceptions && isMatched
            if(!isBase && !isView) { continue }

            if let viewName = viewIdMap[uid],
                let dynamicClasses = self.dynamicClasses,
                dynamicClasses.contains(viewName) {
                continue
            }

            guard let view = self.views[uid] else { continue }

            found(view, uid)
        }
    }

    private func layoutViews(_ view: UIView,
                             on onView: UIView,
                             uid: String,
                             anchors: inout [NSLayoutConstraint]) {
        guard let constraint = self.constraints[uid] else { return }
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

    private func add(_ targetView: UIView,
                     _ onView: UIView,
                     _ viewIdNameMap: [String: String]) {
        // If there are no parent, just add to base `onView`
        guard
            let parentId = targetView.parentId,
            let parentView = self.views[parentId] else {
                onView.addSubview(targetView)
                return
        }

        /* here certified `parentView` exists */

        // If there are no entry of dynamicClasses on current adoptation,
        // just add onto `parentView` we attained above
        guard
            let parentName = viewIdNameMap[parentId],
            let dynamicClasses = self.dynamicClasses else {
                parentView.addSubview(targetView)
                return
        }

        // If there exist dynamicClasses on current adoptation,
        // add it onto base `onView`, not to `parentView`,
        // which is dynamicClass(i.e. "cell" class)
        if dynamicClasses.contains(parentName) {
            onView.addSubview(targetView)
            return
        }

        parentView.addSubview(targetView)
    }
}
