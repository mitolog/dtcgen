'use strict';

import { Name } from '../entities/Name';

export namespace CoreDomain {
  export interface LintNamingUseCase {
    lintNaming(): Promise<Name[]>;
  }
}
