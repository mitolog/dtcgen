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

    func adopt<T>(on: T, name: String? = nil) -> [String: String] {

        // [uid: element name with dot-delimiter]
        var dynamicViewIdNameMap: [String:String] = [:]
        let isOnViewControllerView = name == nil
        self.configureViews()

        // assign props to static views
        if let treeElement = self.treeElement {
            self.assignProps(on: on, treeElement: treeElement)
        }

        // do not place this code upper than configureViews()
        if (isOnViewControllerView) {
            self.bindDummyData()
        }
        self.fillInDynamicViews(for: name,
                                treeElement: self.treeElement,
                                outputs: &dynamicViewIdNameMap)
        self.adopt(on: on,
                   dynamicViewIdNameMap: dynamicViewIdNameMap,
                   isOnViewControllerView: isOnViewControllerView)
        return dynamicViewIdNameMap
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

    private func assignProps<T>(on: T, treeElement: TreeElement) {
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
            case is CollectionView:
                guard let listProps = props as? ListProps else { break }
                (view as! CollectionView).assign(props: listProps)
            case is UINavigationBar:
                guard
                    let navBarProps = props as? NavBarProps,
                    T.self == UIViewController.self,
                    let navCon = (on as! UIViewController).navigationController else { break }
                navCon.assign(props: navBarProps)
            default:
                break
            }
        }

        guard let elements = treeElement.elements else { return }
        for element in elements {
            self.assignProps(on: on, treeElement: element)
        }
    }

    /// これは、例えばhogeCellみたいな動的なviewをoutputsに格納するメソッド。
    /// ただnameパラメータの有無で挙動が変わる。
    /// `name`有：最初に`name`にマッチしたtreeElementだけを抽出 (例えばcell配下のviewを想定)
    /// `name`無：dynamicClassesに含まれているtreeElementをすべて抽出 (例えばviewController上を想定)
    private func fillInDynamicViews(for name: String?,
                                    treeElement: TreeElement?,
                                    outputs: inout [String: String]) {
        guard
            let treeElement = treeElement,
            let treeElements = treeElement.elements else { return }

        let isBaseView = name == nil
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
            let matched = (isBaseView && isDynamicClass) || (!isBaseView && treeName == name!)
            if matched {
                // get all uids(and dot connected names) of sucseeding tree elements
                self.getAllUid(treeElement: aElement, uidMap: &outputs)
                if isBaseView { continue } else { return }
            }
            // if element name doesn't match, dig deeper
            self.fillInDynamicViews(for: name, treeElement: aElement, outputs: &outputs)
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

    private func adopt<T>(on: T,
                          dynamicViewIdNameMap: [String: String],
                          isOnViewControllerView: Bool) {

        var view: UIView? = nil
        switch on.self {
            case is UIView:
                view = on as? UIView
            case is UIViewController:
                view = (on as! UIViewController).view
            default:
                break
        }

        guard let onView = view else { return }


        // add views onto super view BEFORE layouts, otherwise it crashes
        self.lookupViews(onView,
                         dynamicViewIdNameMap: dynamicViewIdNameMap,
                         isOnViewControllerView: isOnViewControllerView)
        { [weak self] (view, uid) in
            guard let weakSelf = self else { return }
            weakSelf.add(view, onView, dynamicViewIdNameMap)
        }

        // layout views AFTER `addSubView`, oterwise it crashes
        var anchors: [NSLayoutConstraint] = []
        self.lookupViews(onView,
                         dynamicViewIdNameMap: dynamicViewIdNameMap,
                         isOnViewControllerView: isOnViewControllerView)
        { [weak self] (view, uid) in
            guard let weakSelf = self else { return }
            weakSelf.layoutViews(view, on: onView, uid: uid, anchors: &anchors)
        }
        NSLayoutConstraint.activate(anchors)
    }

    private func lookupViews(_ onView: UIView,
                             dynamicViewIdNameMap: [String: String],
                             isOnViewControllerView: Bool,
                             found: (_ view: UIView, _ uid: String) -> Void) {

        guard let treeElement = self.treeElement else { return }
        var uids: [String] = []
        treeElement.getUids(&uids)

        for uid in uids {
            let isDynamicView = dynamicViewIdNameMap[uid] != nil
            guard let targetView = self.views[uid] else { continue }
            // 1) viewController.view上なら、dynamicViewじゃないやつを採用
            // 2) 任意のview上(例えばHogeCell)なら、dynamicViewを採用
            // 3) viewが除外対象じゃないものを採用
            if isOnViewControllerView && !isDynamicView
                ||
               !isOnViewControllerView && isDynamicView
            {
                found(targetView, uid)
            }
        }

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
                     _ dynamicViews: [String: String]) {
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
            let parentName = dynamicViews[parentId],
            let dynamicClasses = self.dynamicClasses else {
                parentView.addSubview(targetView)
                return
        }

        // If there exist dynamicClasses on current adoptation,
        // add it onto base `onView`, not to `parentView`,
        // which is dynamicClass(i.e. "UICollectionViewCell" class)
        if dynamicClasses.contains(parentName) {
            onView.addSubview(targetView)
            return
        }

        parentView.addSubview(targetView)
    }
}
