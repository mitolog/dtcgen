import * as _ from 'lodash';
import {
  ElementType,
  NavigationBarIOS,
  TreeElement,
  NavigationItemIOS,
  BarButtonItemIOS,
  BarButtonItemSide,
} from '../../../domain/Entities';
import { BaseElementParser } from './BaseElementParser';

export class NavigationBarParser extends BaseElementParser {
  parse(
    nodeOnArtboard: any,
    view: NavigationBarIOS,
    treeElement?: TreeElement,
  ) {
    super.parse(nodeOnArtboard, view, treeElement);
    const elements = this.getSymbolElements(ElementType.NavBar);

    if (!view.navigationItem) {
      view.navigationItem = new NavigationItemIOS();
    }

    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;

      switch (key.toLowerCase()) {
        case 'background':
          this.parseBackground(aLayer, view, nodeOnArtboard);
          break;
        case 'center':
          this.parseTitle(nodeOnArtboard, view, aLayer);
          break;
        case 'left':
        case 'right':
          this.parseNavigationItem(nodeOnArtboard, view, aLayer);
          break;
        default:
          break;
      }
    }
  }

  parseSharedStyle(node: any, styleType: string, view: NavigationBarIOS) {
    throw new Error('Method not implemented.');
  }

  parseOverride(node: any, styleType: string, view: NavigationBarIOS) {}

  private parseTitle(nodeOnArtboard: any, view: NavigationBarIOS, aLayer: any) {
    // suppose title/subTitle will be totally overridden

    // check if there are text overrides first
    const overrideValues: Object[] | null =
      nodeOnArtboard['overrideValues'] || null;
    if (!this.followOverrides || !overrideValues) {
      return;
    }

    const centerInstanceId = aLayer.do_objectID;

    // look for stringValue that has same id with centerInstanceId
    const titleOverrides: Object[] = overrideValues.filter(overrideValue => {
      const overrideName = overrideValue['overrideName'] || null;
      if (!overrideName) return false;
      const matches = overrideName.match(/_stringValue$/);
      if (!matches) return false;
      const ids = overrideName.split('_')[0].split('/');
      for (const id of ids) {
        if (id === centerInstanceId) return true;
      }
      return false;
    });

    for (const titleOverride of titleOverrides) {
      const overrideName = titleOverride['overrideName'];
      const overrideValue = titleOverride['value'];
      const ids = overrideName.split('_')[0].split('/');
      if (ids.length <= 1) continue;

      const symbolId = ids[0];
      const titleOrSubTitleLayerId = ids[1];
      const overrideSymbols = overrideValues.filter(overrideObj => {
        const name = overrideObj['overrideName'] || null;
        return name === symbolId + '_symbolID';
      }, null);

      let centerSymbolMaster: any | null = null;
      if (!overrideSymbols || overrideSymbols.length <= 0) {
        // center symbol is not overridden
        centerSymbolMaster = this.getSymbolWithSymbolID(aLayer.symbolID);
      } else {
        // center symbol is replaced with new one
        const symbolOverrideObj = overrideSymbols[0];
        const symbolId = symbolOverrideObj['value'] || null;
        if (!symbolId) break; // something wrong...
        centerSymbolMaster = this.getSymbolWithSymbolID(symbolId);
      }

      if (!centerSymbolMaster) break; // something wrong...
      const subLayers = centerSymbolMaster.layers || null;
      if (!subLayers) break; // something wrong...
      const targetLayers = subLayers.filter(
        subLayer => subLayer.do_objectID === titleOrSubTitleLayerId,
      );
      if (!targetLayers || targetLayers.length <= 0) break; // something wrong...
      const targetName = targetLayers[0].name;
      if (!targetName) break;
      const matches = targetName.match(/title$|subtitle$/gi);
      if (!matches || matches.length <= 0) break;
      switch (matches[0].toLowerCase()) {
        case 'title':
          view.navigationItem.titleText = overrideValue;
          break;
        case 'subtitle':
          view.navigationItem.subTitleText = overrideValue;
          break;
      }
    }

    // If you want to parse the original titleView, you can utalize below.
    // if (!treeElement || !aLayer) return;
    // const symbolParser = new SymbolParser(
    //   this.sketch,
    //   this.config,
    //   this.pathManager.outputDir,
    // );
    // const takeOverData = new TakeOverData(aLayer);
    // symbolParser.parseSymbol(takeOverData, treeElement, treeElement.uid);
  }

  // retrieve symbolMaster matching with `layerId` parameter from `node.overrideValues`.
  private getOverrideSymbol(node: any, layerId: string): any {
    const overrideValues = node.overrideValues || null;
    if (!overrideValues) return null;

    for (const obj of overrideValues) {
      const overrideName = obj['overrideName'] || null;
      if (!overrideName) continue;
      const symbolOverrides = overrideName.match(/_symbolID$/);
      if (!symbolOverrides || symbolOverrides.length <= 0) continue;
      const symbolInstanceId = overrideName.split('_symbolID')[0];
      const overrideValue = obj['value'] || null;
      if (symbolInstanceId !== layerId || !overrideValue) continue;
      const overrideSymbol = this.getSymbolWithSymbolID(overrideValue);
      if (!overrideSymbol) continue;
      return overrideSymbol;
    }
    return null;
  }

  private parseNavigationItem(
    nodeOnArtboard: any,
    view: NavigationBarIOS,
    aLayer: any,
  ) {
    // suppose `aLayer` is a symbolInstance and will get symbolMaster from it.
    const layerId: string | null = aLayer.do_objectID || null;
    const symbolId: string | null = aLayer.symbolID || null;
    if (aLayer._class !== 'symbolInstance' || !symbolId || !layerId) {
      return;
    }
    const symbolMaster = this.getSymbolWithSymbolID(symbolId);
    if (!symbolMaster) return;

    // check if the symbol itself is overriden, if so, replace it
    const overrideSymbol = this.getOverrideSymbol(nodeOnArtboard, layerId);
    let targetSymbol = overrideSymbol || symbolMaster;

    this.parseBarButtonItems(view, targetSymbol, nodeOnArtboard);
  }

  private parseBarButtonItems(
    view: NavigationBarIOS,
    targetSymbol: any,
    nodeOnArtboard: any,
  ) {
    const itemName: string | null = targetSymbol.name || null;
    if (!itemName) return;

    // i.e) Overrides/Navigation Bar/Right/Text, Overrides/Navigation Bar/Right/Icon
    const itemSideMatches = itemName.match(/left|right/gi);
    if (!itemSideMatches || itemSideMatches.length <= 0) {
      return;
    }

    let itemSide: BarButtonItemSide;
    // suppose "last matched item" would be the intended one
    switch (itemSideMatches[itemSideMatches.length - 1].toLowerCase()) {
      case 'left':
        itemSide = BarButtonItemSide.left;
        break;
      case 'right':
        itemSide = BarButtonItemSide.right;
        break;
      default:
        // skip other than aboves.
        return;
    }

    const subLayers = targetSymbol.layers;
    if (!subLayers || subLayers.length <= 0) return;
    const layerId: string | null = targetSymbol.do_objectID || null;
    if (!layerId) return;

    // be careful to loop "revesely", because `subLayers` is right to left order from index 0,
    // where I want left to right order on navigationItem for convenience.
    for (var i = subLayers.length - 1; i >= 0; i--) {
      const subLayer = subLayers[i];
      const subLayerId = subLayer.do_objectID || null;
      const name = subLayer.name || null;
      if (!name || !subLayerId) continue;

      const item = new BarButtonItemIOS();
      item.side = itemSide;
      // i.e.) 43677F42-E3A7-4C48-82F2-DA4F7A228FBC, 135FCF5D-F3FC-4C63-921E-D39CFFBF4D8D
      item.id = subLayerId;

      const nameMatches = name.match(/label|icon|back/i);

      if (!nameMatches || nameMatches.length <= 0) {
        // name like `Arrow` will be ignored here.
        // just consider it as default back indicator of each platform.
        continue;
      }

      switch (nameMatches[nameMatches.length - 1].toLowerCase()) {
        case 'label':
          // can be sharedStyle
          item.textStyle = this.parseTextStyle(subLayer);
          item.label = _.get(subLayer, 'attributedString.string', null);
          break;
        case 'icon':
          // suppose to be overriden, no op here
          break;
        case 'back':
          item.isBackButton = true;
          break;
        default:
          // exclude other than aboves if attained.
          continue;
      }

      this.parseBarButtonOverride(item, nodeOnArtboard);
      view.navigationItem.addOrReplaceItem(item);
    }
  }

  private parseIcon(item: BarButtonItemIOS, node: any) {
    const name = node.name || null;
    if (!node || !name) return;

    const matches = name.match(/icon|color/i);
    if (!matches || matches.length <= 0) return;

    switch (matches[matches.length - 1].toLowerCase()) {
      case 'icon':
        item.iconPath = 'DtcGenerated/' + name.replace(/\s+/g, '');
        break;
      case 'color':
        // update icon color
        const colorName = 'DtcGenerated/' + name.replace(/\s+/g, '');
        const subLayers = node.layers;
        if (!subLayers) break;
        for (const layer of subLayers) {
          const layerName = layer.name || null;
          if (!layerName) continue;
          const colorMatches = layerName.match(/color/i);
          if (!colorMatches || colorMatches.length <= 0) continue;
          // color object found here and below
          const fillsObj = _.get(layer, 'style.fills', null);
          if (fillsObj) {
            const fills = this.getFills(fillsObj);
            if (fills) {
              item.iconColorFills = fills;
            }
          }
          break;
        }
        break;
    }
  }

  private parseBarButtonOverride(item: BarButtonItemIOS, node: any) {
    const symbolID = node.symbolID || null;
    if (!node.overrideValues || node.overrideValues.length <= 0 || !symbolID) {
      return;
    }

    const layerId = item.id;
    for (const obj of node.overrideValues) {
      const overrideName: string = obj['overrideName'];
      const overrideValue: string = obj['value'];
      if (!overrideName || !overrideValue) continue;
      const suffixMatches = overrideName.match(/_symbolID$|_stringValue$/);
      if (!suffixMatches || suffixMatches.length <= 0) continue;
      // suppose suffix matches just 1.
      const targetSuffix: string = suffixMatches[0];
      const idsString: string = overrideName.split(targetSuffix)[0];
      if (!idsString) continue;
      const ids: string[] = idsString.split('/');
      let isOverridden = false;
      for (const id of ids) {
        if (id === layerId) {
          isOverridden = true;
          break;
        }
      }
      if (!isOverridden) continue;

      switch (targetSuffix) {
        case '_symbolID':
          // should be icon or icon color.
          const overrideSymbol = this.getSymbolWithSymbolID(overrideValue);
          this.parseIcon(item, overrideSymbol);
          break;
        case '_stringValue':
          // text
          item.label = overrideValue;
          break;
      }
    }
  }
}
