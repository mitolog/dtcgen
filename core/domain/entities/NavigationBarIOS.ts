import { View } from './View';
import { TextStyle } from './TextStyle';
import { ColorFill } from './ColorFill';

export enum BarButtonItemType {}

export class BarButtonItemIOS {
  id: string;
  side: BarButtonItemSide;
  isBackButton: boolean = false;

  label?: string;
  textStyle?: TextStyle;
  iconPath?: string;
  iconColorFills?: ColorFill[];
  backIconPath?: string;
}

export enum BarButtonItemSide {
  left = 'LEFT',
  right = 'RIGHT',
}

export class NavigationItemIOS {
  leftItems?: BarButtonItemIOS[];
  rightItems?: BarButtonItemIOS[];

  titleText?: string;
  subTitleText?: string;
  titleTextStyle?: TextStyle;
  titleView?: View;

  addOrReplaceItem(item: BarButtonItemIOS) {
    let items: BarButtonItemIOS[];

    switch (item.side) {
      case BarButtonItemSide.left:
        items = this.leftItems || [];
        break;
      case BarButtonItemSide.right:
        items = this.rightItems || [];
        break;
      default:
        items = null;
        break;
    }

    if (!items) return;

    const sameIdItems = items.filter(current => current.id === item.id);
    if (sameIdItems && sameIdItems.length > 0) {
      // here sameIdItems length should be 1.
      const idx = items.indexOf(sameIdItems[0]);
      items.splice(idx, 1, item);
    } else {
      items.push(item);
    }

    switch (item.side) {
      case BarButtonItemSide.left:
        this.leftItems = items;
        break;
      case BarButtonItemSide.right:
        this.rightItems = items;
        break;
      default:
        break;
    }
  }
}

// The instance of this class corresponds to each `viewcontroller` instance of an iOS app,
// besides native `UINavigationBar` has corresponds to each `UINavigationController`.
export class NavigationBarIOS extends View {
  navigationItem: NavigationItemIOS;
}
