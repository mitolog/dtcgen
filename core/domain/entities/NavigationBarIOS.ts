import { View } from './View';
import { TextStyle } from './TextStyle';

export class BarButtonItemIOS {
  label?: string;
  icon?: string;
  backIcon?: string;
}

export class NavigationItemIOS {
  leftItems?: BarButtonItemIOS[];
  rightItems?: BarButtonItemIOS[];

  // check `titleText` exists first, then check `titleView` on perser.
  titleText?: string;
  titleTextStyle?: TextStyle;
  titleView?: View; // If titleView is assigned, priorize `titleView` over `titleText`
}

// The instance of this class corresponds to each `viewcontroller` instance of an iOS app,
// besides native `UINavigationBar` has corresponds to each `UINavigationController`.
export class NavigationBarIOS extends View {
  navigationItem: NavigationItemIOS;
}
