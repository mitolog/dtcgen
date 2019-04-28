import Foundation
import UIKit

@IBDesignable
class CollectionView: UICollectionView, DtcViewProtocol {
    typealias PropType = ListProps
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

    var props: PropType?

    override init(frame: CGRect, collectionViewLayout layout: UICollectionViewLayout) {
        super.init(frame: frame, collectionViewLayout: layout)
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

        // if there are layer processing, you need to redraw here
        // with new frames of subviews
        self.adoptBackground(props)
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

    private func adoptBackground(_ props: PropType?) {
        guard let props = self.props else { return }

        self.containerColor = props.backgroundColor?.uiColor ?? UIColor.clear
        if props.backgroundColor == nil, let fills = props.fills {
            let fill = fills[0]
            if fill.isEnabled && fill.fillType == FillType.fill {
                self.containerColor = fill.color.uiColor
                self.layer.opacity = Float(fill.opacity)
            }
        }
    }

    func assign(props: PropType?) {
        self.props = props
        guard let props = self.props else { return }

        self.isHidden = !props.isVisible
        self.cornerRadius = props.radius ?? 0

        self.adoptBackground(props)
    }
}
