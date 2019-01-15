import UIKit

@IBDesignable
class TextView: UITextView {
    @IBInspectable var containerColor: UIColor = UIColor(red: 242/255, green: 97/255, blue: 97/255, alpha: 1) {
        didSet {
            backgroundColor = containerColor
        }
    }

    override init(frame: CGRect, textContainer: NSTextContainer?) {
        super.init(frame: frame, textContainer: textContainer)
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
        layer.masksToBounds = true
        isExclusiveTouch = true
        backgroundColor = containerColor
    }
}

//public protocol BaseComponents {
//    var containerColor: UIColor {
//        get {
//
//        }
//        set() {
//
//        }
//    }
//}
