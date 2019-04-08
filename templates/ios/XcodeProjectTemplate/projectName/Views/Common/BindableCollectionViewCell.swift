import UIKit

class BindableCollectionViewCell<E>: UICollectionViewCell, CellBindableType {
    typealias T = E
    func bind(data: E) {}
}