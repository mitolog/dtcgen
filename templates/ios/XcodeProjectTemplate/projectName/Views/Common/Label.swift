import UIKit

@IBDesignable
class Label: UILabel, DtcViewProtocol {
    typealias PropType = TextViewProps
    @IBInspectable var containerColor: UIColor = UIColor(red: 255/255, green: 255/255, blue: 255/255, alpha: 1) {
        didSet {
            backgroundColor = containerColor
        }
    }
    @IBInspectable var name: String = ""
    @IBInspectable var cornerRadius: CGFloat = 0 {
        didSet {
            layer.cornerRadius = cornerRadius
        }
    }
    @IBInspectable var bgShadowRadius: CGFloat = 0
    @IBInspectable var bgShadowColor: UIColor = .clear
    @IBInspectable var bgShadowOffset: CGSize = .zero
    @IBInspectable var bgShadowOpacity: Float = 0

    var props: PropType?

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

        if let attributedText = attributedText {
            let t = NSMutableAttributedString(attributedString: attributedText)
            t.addAttribute(NSAttributedString.Key(String(kCTLanguageAttributeName)), value: "ja", range: NSRange(location: 0, length: attributedText.string.utf16.count))
            self.attributedText = t
        } else if let text = text {
            attributedText = NSAttributedString(string: text, attributes: [NSAttributedString.Key(String(kCTLanguageAttributeName)): "ja", .foregroundColor: textColor, .font: font])
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // need to redraw after subviews are autoresized
        if (self.props?.backgroundColor == nil) {
            self.adoptFillsIfNeeded(self.props?.fills)
        }
        self.adoptShadowsIfNeeded(self.props?.shadows)
    }

    private func commonInit() {
        isExclusiveTouch = true

        layer.cornerRadius = cornerRadius
        layer.shadowColor = bgShadowColor.cgColor
        layer.shadowOpacity = bgShadowOpacity
        layer.shadowOffset = bgShadowOffset
        layer.shadowRadius = bgShadowRadius
        backgroundColor = containerColor
    }

    func assign(props: PropType?) {
        self.props = props
        guard let props = self.props else { return }

        self.isHidden = !props.isVisible
        self.containerColor = props.backgroundColor?.uiColor ?? UIColor.clear
        self.cornerRadius = props.radius ?? 0

        if (props.backgroundColor == nil) {
            self.adoptFillsIfNeeded(props.fills)
        }
        self.adoptShadowsIfNeeded(props.shadows)

        self.text = props.text

        if let textStyle = props.textStyle {
            self.font = textStyle.uiFont
            self.textColor = textStyle.fontColor?.uiColor

            if let alignment = textStyle.alignment {
                var hAlign: NSTextAlignment = .center
                switch alignment {
                case .right:
                    hAlign = .right
                case .center:
                    hAlign = .center
                case .left:
                    hAlign = .left
                case .equalWidth:
                    hAlign = .justified
                }
                self.textAlignment = hAlign
            }

            if let vAlignment = textStyle.verticalAlignment {
                var vAlign: UIBaselineAdjustment = .none
                switch vAlignment {
                // todo: it's not equally assigned.
                case .up:
                    vAlign = .alignCenters
                case .middle:
                    vAlign = .none
                case .bottom:
                    vAlign = .alignBaselines
                }
                self.baselineAdjustment = vAlign
            }

        }
    }
}
