import Foundation
import UIKit

// TBD: it's not robust way.. taken from
// https://medium.com/@valv0/computed-properties-and-extensions-a-pure-swift-approach-64733768112c
extension UIView {
    private static var _parentId = [String:String?]()

    var parentId:String? {
        get {
            let tmpAddress = String(format: "%p", unsafeBitCast(self, to: Int.self))
            return UIView._parentId[tmpAddress] ?? nil
        }
        set(newValue) {
            let tmpAddress = String(format: "%p", unsafeBitCast(self, to: Int.self))
            UIView._parentId[tmpAddress] = newValue
        }
    }

    func adoptFillsIfNeeded(_ fills: [ColorFill]? = nil) {
        guard let fills = fills else { return }
        var subLayers: [CALayer]? = []
        for fill in fills {
            if !fill.isEnabled { continue }
            // ここでCALayerでfillを設定していく
            let layer = self.layerFor(fill)
            layer.frame = self.frame
            subLayers?.append(layer)
        }
        // update subLayers
        self.layer.sublayers = nil
        self.layer.sublayers = subLayers
    }

    func layerFor(_ fill: ColorFill) -> CALayer {
        var layer = CALayer()
        // fillタイプを見る
        switch fill.fillType {
        case .fill:
            layer.backgroundColor = fill.color.uiColor.cgColor
            layer.opacity = Float(fill.opacity)
        case .gradient:
            layer = self.gradientLayer(for: fill.gradient)
            layer.opacity = Float(fill.opacity)
        default:
            break
        }
        return layer
    }

    func gradientLayer(for gradient: Gradient) -> CAGradientLayer {
        let gradientLayer = CAGradientLayer()

        switch gradient.type {
        case .linear:
            let colors = gradient.stops.map { $0.color.uiColor.cgColor }
            let locations = gradient.stops.map { NSNumber(value: Float($0.position)) }
            gradientLayer.colors = colors
            gradientLayer.locations = locations
            gradientLayer.startPoint = gradient.from.cgPoint()
            gradientLayer.endPoint = gradient.to.cgPoint()
        //case .radial, .angular:
        default:
            break
        }

        return gradientLayer
    }
}
