import UIKit

@IBDesignable
class Button: UIButton, DtcViewProtocol {
    typealias PropType = ButtonProps
    var props: PropType?
    
    @IBInspectable var containerColor: UIColor = UIColor(red: 242/255, green: 97/255, blue: 97/255, alpha: 1) {
        didSet {
            setBackgroundImage(containerColor.image(), for: .normal)
        }
    }
    @IBInspectable var highlightedContainerColor: UIColor = UIColor(red: 242/255, green: 97/255, blue: 97/255, alpha: 0.9) {
        didSet {
            setBackgroundImage(highlightedContainerColor.image(), for: .highlighted)
        }
    }
    @IBInspectable var selectedContainerColor: UIColor = UIColor(red: 242/255, green: 97/255, blue: 97/255, alpha: 1) {
        didSet {
            setBackgroundImage(selectedContainerColor.image(), for: .selected)
        }
    }
    @IBInspectable var disabledContainerColor: UIColor = UIColor(red: 218/255, green: 219/255, blue: 227/255, alpha: 1) {
        didSet {
            setBackgroundImage(disabledContainerColor.image(), for: .disabled)
        }
    }
    @IBInspectable var cornerRadius: CGFloat = 4 {
        didSet {
            layer.cornerRadius = cornerRadius
        }
    }

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

        if let title = title(for: state) {
            setAttributedTitle(NSAttributedString(string: title, attributes: [NSAttributedString.Key(String(kCTLanguageAttributeName)): "ja"]), for: .normal)
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // need to redraw after subviews are autoresized
        self.adoptFillsIfNeeded(self.props?.fills)
    }

    public func commonInit() {
        isExclusiveTouch = true

        layer.cornerRadius = cornerRadius
        layer.masksToBounds = true

        setBackgroundImage(containerColor.image(), for: .normal)
        setBackgroundImage(highlightedContainerColor.image(), for: .highlighted)
        setBackgroundImage(selectedContainerColor.image(), for: .selected)
        setBackgroundImage(disabledContainerColor.image(), for: .disabled)
    }

    func assign(props: PropType?) {
        self.props = props
        guard let props = self.props else { return }

        self.isHidden = !props.isVisible
        self.containerColor = props.backgroundColor?.uiColor ?? UIColor.clear
        self.cornerRadius = props.radius ?? 0

        self.adoptFillsIfNeeded(props.fills)

        self.setTitle(props.text, for: .normal)

        if let hasIcon = props.hasIcon {
            self.iconImage = hasIcon ? UIImage(named: "DtcGenerated/Icon") : nil
        }

        if let textStyle = props.textStyle {
            self.titleLabel?.font = textStyle.uiFont
            self.setTitleColor(textStyle.fontColor?.uiColor, for: .normal)

            if let alignment = textStyle.alignment {
                var hAlign: UIControl.ContentHorizontalAlignment = .center
                switch alignment {
                case .right:
                    hAlign = .right
                case .center:
                    hAlign = .center
                case .left:
                    hAlign = .left
                case .equalWidth:
                    hAlign = .fill
                }
                self.contentHorizontalAlignment = hAlign
            }

            if let vAlignment = textStyle.verticalAlignment {
                var vAlign: UIControl.ContentVerticalAlignment = .center
                switch vAlignment {
                case .up:
                    vAlign = .top
                case .middle:
                    vAlign = .center
                case .bottom:
                    vAlign = .bottom
                }
                self.contentVerticalAlignment = vAlign
            }

        }
    }
}

extension UIColor {
    func image(_ size: CGSize = CGSize(width: 1, height: 1)) -> UIImage {
        return UIGraphicsImageRenderer(size: size).image { context in
            self.setFill()
            context.fill(CGRect(origin: .zero, size: size))
        }
    }
}
