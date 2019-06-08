import * as _ from 'lodash';

export class Plist {
  attributes?: { [s: string]: string };

  constructor() {
    this.attributes = {};
  }
}

export class Dependencies {
  sdks?: string[];

  constructor() {
    this.sdks = [];
  }
}

export class ProjectSettings {
  plist: Plist;
  dependencies: Dependencies;
  projectName: string;

  constructor() {
    this.plist = new Plist();
    this.dependencies = new Dependencies();
    this.projectName = '';
  }

  trim(): ProjectSettings {
    // assign null if empty `attributes` is set
    const attributes = _.get(this, 'plist.attributes', null);
    if (attributes && Object.keys(attributes).length <= 0) {
      this.plist.attributes = null;
    }

    // assign null if empty `sdks` is set
    const sdks = _.get(this, 'dependencies.sdks', null);
    if (sdks && sdks.length <= 0) {
      this.dependencies.sdks = null;
    }
    return this;
  }
}
