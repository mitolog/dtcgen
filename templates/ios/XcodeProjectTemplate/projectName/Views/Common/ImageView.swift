import Foundation
import UIKit

class ImageView: UIImageView, DtcViewProtocol {
    typealias PropType = ImageProps
    var props: PropType?

    override func layoutSubviews() {
        super.layoutSubviews()
        if (self.props?.backgroundColor == nil) {
            self.adoptFillsIfNeeded(self.props?.fills)
        }
    }

    func assign(props: PropType?) {
        self.props = props
        guard let props = self.props else { return }

        self.isHidden = !props.isVisible
        self.backgroundColor = props.backgroundColor?.uiColor ?? UIColor.clear
        self.layer.cornerRadius = props.radius ?? 0

        if (props.backgroundColor == nil) {
            self.adoptFillsIfNeeded(props.fills)
        }

        if let imagePath = props.getAssetPath() {
            self.image = UIImage(named: imagePath)
        }
    }
}
