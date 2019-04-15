import UIKit

@IBDesignable
class Container: UIView {
    @IBInspectable var containerColor: UIColor = UIColor(red: 255/255, green: 255/255, blue: 255/255, alpha: 1) {
        didSet {
            backgroundColor = containerColor
        }
    }
    @IBInspectable var name: String = ""
    @IBInspectable var cornerRadius: CGFloat = 0
    @IBInspectable var shadowRadius: CGFloat = 0
    @IBInspectable var shadowColor: UIColor = .clear
    @IBInspectable var shadowOffset: CGSize = .zero
    @IBInspectable var shadowOpacity: Float = 0

    var props: ViewProps?

    override init(frame: CGRect) {
        super.init(frame: frame)
        commonInit()
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }

    override func awakeFromNib() {
        super.awakeFromNib()
        commonInit()
    }

    override func prepareForInterfaceBuilder() {
        super.prepareForInterfaceBuilder()
        commonInit()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // need to redraw after subviews are autoresized
        self.adoptFillsIfNeeded()
    }

    private func commonInit() {
        isExclusiveTouch = true
        
        layer.cornerRadius = cornerRadius
        layer.shadowColor = shadowColor.cgColor
        layer.shadowOpacity = shadowOpacity
        layer.shadowOffset = shadowOffset
        layer.shadowRadius = shadowRadius
        backgroundColor = containerColor
    }

    func adoptFillsIfNeeded() {
        guard let fills = self.props?.fills else { return }
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

    func assign(props: ViewProps?) {
        self.props = props
        guard let props = self.props else { return }

        self.isHidden = !props.isVisible
        self.containerColor = props.backgroundColor?.uiColor ?? UIColor.clear
        self.cornerRadius = props.radius ?? 0

        self.adoptFillsIfNeeded()
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
