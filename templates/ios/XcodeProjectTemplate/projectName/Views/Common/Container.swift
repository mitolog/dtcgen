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

    private func commonInit() {
        isExclusiveTouch = true
        
        layer.cornerRadius = cornerRadius
        layer.shadowColor = shadowColor.cgColor
        layer.shadowOpacity = shadowOpacity
        layer.shadowOffset = shadowOffset
        layer.shadowRadius = shadowRadius
        backgroundColor = containerColor
    }
}
