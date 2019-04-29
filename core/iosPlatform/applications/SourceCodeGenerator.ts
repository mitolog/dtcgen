import * as path from 'path';
import * as fs from 'fs-extra';
import * as pluralize from 'pluralize';
import { PathManager, OutputType } from '../../utilities/PathManager';
import {
  Container,
  TreeElement,
  View,
  ElementType,
  Size,
} from '../../domain/Entities';
import {
  ContainerConfig,
  DataVariable,
  ListSection,
} from '../entities/ContainerConfig';
import { isString } from 'util';
import { isContainer } from '../../typeGuards';
import { DesignToCodeTemplatePaths } from '../entities/DesignToCodeTemplatePaths';
import { HandlebarsHelpers } from '../../utilities/HandlebarsHelpers';

export class SourceCodeGenerator {
  private pathManager: PathManager;
  private templateHelpers: HandlebarsHelpers;

  constructor(outputDir?: string) {
    this.pathManager = new PathManager(outputDir);
    this.templateHelpers = new HandlebarsHelpers(this.pathManager);
  }

  generateSourceCodes(searchDir: string) {
    const treeJson = this.pathManager.getJson(OutputType.tree);
    // Prepare needed pathes
    const templatePaths = new DesignToCodeTemplatePaths(searchDir);

    // iterate containers and adopt templates
    let outputs: any[] = [];
    let containerNames: Object[] = [];
    for (const treeElement of treeJson) {
      const views: [View?] = [];
      const containerName = treeElement['name'];
      const elements = treeElement['elements'];
      if (
        !containerName ||
        !isString(containerName) ||
        containerName.length <= 0 ||
        !elements
      ) {
        continue;
      }
      this.gatherViewsForContainer(elements, views);

      const containerConfig: ContainerConfig = this.generateContainerConfig(
        treeElement,
        views,
      );

      // cells for list(collectionView)
      for (const variable of containerConfig.dataVariables) {
        if (variable.type !== ElementType.Cell) continue;
        // add extra container info
        variable['container'] = containerConfig.container;
        const cellTemplate = this.templateHelpers.compiledTemplate(
          templatePaths.iosTemplatePaths.cellNameCollectionViewCell,
        );
        const cellOutput = cellTemplate(variable);
        const cellParsed = path.parse(
          templatePaths.iosTemplatePaths.cellNameCollectionViewCell,
        );
        const cellName = variable.classPrefix + 'CollectionViewCell.swift';
        const cellOutputPath = path.join(
          cellParsed.dir,
          '../',
          containerName,
          cellName,
        );
        outputs.push({ filePath: cellOutputPath, content: cellOutput });
      }

      // viewConfigs
      const configTemplate = this.templateHelpers.compiledTemplate(
        templatePaths.iosTemplatePaths.containerNameConfig,
      );
      const configOutput = configTemplate(containerConfig);
      const configParsed = path.parse(
        templatePaths.iosTemplatePaths.containerNameConfig,
      );
      const configName = containerName + 'Config.swift';
      const configOutputPath = path.join(configParsed.dir, configName);

      outputs.push({ filePath: configOutputPath, content: configOutput });

      // viewControllers
      const vcTemplate = this.templateHelpers.compiledTemplate(
        templatePaths.iosTemplatePaths.containerNameViewController,
      );
      const vcOutput = vcTemplate(containerConfig);
      const vcParsed = path.parse(
        templatePaths.iosTemplatePaths.containerNameViewController,
      );
      const vcName = containerName + 'ViewController.swift';
      const vcOutputPath = path.join(
        vcParsed.dir,
        '../',
        containerName,
        vcName,
      );

      outputs.push({ filePath: vcOutputPath, content: vcOutput });

      // for viewController.swift.hbs and
      containerNames.push({ name: containerName });
    }

    // generate iterated files
    for (const output of outputs) {
      fs.ensureFileSync(output.filePath);
      fs.writeFileSync(output.filePath, output.content);
    }

    // generate base view controller
    const viewControllerNames = containerNames.map(obj => {
      return { name: obj['name'] + 'ViewController' };
    });
    this.templateHelpers.searchAndAdoptTemplate(
      path.parse(templatePaths.iosTemplatePaths.viewController).dir,
      `^viewController\.swift\.hbs$`,
      { names: viewControllerNames },
    );

    // generate DesignToCode
    const designToCodeGeneratedDir = path.parse(
      templatePaths.iosTemplatePaths.designToCodeGenerated,
    ).dir;
    this.templateHelpers.searchAndAdoptTemplate(
      designToCodeGeneratedDir,
      `^DesignToCode\.generated\.swift\.hbs$`,
      {
        names: containerNames,
        tree: treeJson,
      },
    );

    // copy tree.json
    const treePath = path.join(designToCodeGeneratedDir, 'tree.json');
    fs.writeFileSync(treePath, JSON.stringify(treeJson));

    // copy dynamic jsons for dummy data.
    const dynamicAttributesDir = this.pathManager.getOutputPath(
      OutputType.dynamicAttributes,
    );
    const lastCompName: string = dynamicAttributesDir
      .split(path.sep)
      .reduce((acc, current) => current, '');
    const dynamicAttributesDestDir: string = path.join(
      designToCodeGeneratedDir,
      lastCompName,
    );
    fs.copySync(dynamicAttributesDir, dynamicAttributesDestDir);

    // remove templates itself
    templatePaths.removeTemplates();
  }

  /**
   * generate config object used within each templates
   * @param treeElement {TreeElement} should be artboard top treeElement
   * @param views {View[]} all views that the treeElement holds
   */
  private generateContainerConfig(
    treeElement: TreeElement,
    views: View[],
  ): ContainerConfig {
    if (!treeElement.properties || !isContainer(treeElement.properties)) return;
    let container = treeElement.properties as Container;
    container.name = treeElement.name; // todo: redandunt assignment. should be either one of these.
    const containerConfig = new ContainerConfig();

    // prepare variables
    const allLists: View[] = views.filter(
      view => view.type === ElementType.List,
    );
    let targetList: View = null;
    if (allLists && allLists.length > 0) {
      // todo: suppose only 1 list exists on 1 artboard.
      targetList = allLists[0];
    }

    const imports: string[] = views
      .filter(view => {
        switch (view.type) {
          case ElementType.Map:
            return true;
        }
        return false;
      })
      .map(view => {
        switch (view.type) {
          case ElementType.Map:
            return 'MapKit';
        }
        return '';
      });

    const dynamicClasses: string[] = [];

    /// cell preparation from here ///
    const allCells: View[] = views.filter(
      view => view.type === ElementType.Cell,
    );
    const uniqueCells: { [name: string]: View } = allCells.reduce(
      (acc, cur) => {
        acc[`${cur.name}`] = cur; // override with latest cur.id
        return acc;
      },
      {},
    );
    const cellClassNames: string[] = Object.keys(uniqueCells).map(name =>
      name.toLowerCamelCase(' '),
    );
    let cellVariables: DataVariable[] = [];
    for (const cellClassName of cellClassNames) {
      const cellPrefix: string = cellClassName.replace('Cell', '');
      const pluralized: string = pluralize(cellPrefix);
      if (!pluralized) continue;
      let variable: DataVariable = {
        classPrefix: cellPrefix.toUpperCamelCase(),
        variableName: pluralized,
        treeName: cellClassName,
        type: ElementType.Cell,
      };
      cellVariables.push(variable);
    }
    let listSections: ListSection[] = [];
    for (const key of Object.keys(uniqueCells)) {
      let view: View = uniqueCells[key];
      const classPrefix: string = key.toUpperCamelCase(' ').replace('Cell', '');
      const cellSize: Size = targetList
        ? { width: targetList.rect.width, height: view.rect.height }
        : { width: view.rect.width, height: view.rect.height };
      if (!view || !classPrefix) continue;
      let listSection: ListSection = {
        classPrefix: classPrefix,
        sectionName: classPrefix + 'Section',
        variableName: pluralize(classPrefix).toLowerCamelCase(),
        size: cellSize,
        insets: { top: 0, left: 0, bottom: 0, right: 0 },
      };
      listSections.push(listSection);
    }
    /// cell preparation to here ///

    /// set content from here ///
    if (imports) {
      containerConfig.imports = imports;
    }
    containerConfig.container = container;
    containerConfig.views = views;
    if (targetList) {
      containerConfig.listName = targetList.name.toUpperCamelCase(' ');
      containerConfig.listViewId = targetList.id;
      containerConfig.listSections = listSections;
    }
    containerConfig.dynamicClasses = [...cellClassNames]; // spread syntax
    containerConfig.dataVariables = [...cellVariables];
    /// set content to here ///

    return containerConfig;
  }

  private gatherViewsForContainer(treeElements: [TreeElement?], views: [any?]) {
    for (const aTreeElement of treeElements) {
      if (aTreeElement.properties) {
        views.push(aTreeElement.properties);
      }
      if (aTreeElement.elements && aTreeElement.elements.length > 0) {
        this.gatherViewsForContainer(aTreeElement.elements, views);
      }
    }
  }
}
