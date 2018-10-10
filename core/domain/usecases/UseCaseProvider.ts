'use strict';

import { CoreDomain } from './LintNamingUseCase';

export interface UseCaseProvider {
  makeLintNamingUseCase(): CoreDomain.LintNamingUseCase;
}
