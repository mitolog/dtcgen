import UIKit

@IBDesignable
final class IconButton: ContainedButton {

    @IBInspectable var iconImage: UIImage? = UIImage(named: "iconPlaceHolder") {
        didSet {
            setImage(iconImage, for: .normal)
        }
    }

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
        setImage(iconImage, for: .normal)
    }
}
