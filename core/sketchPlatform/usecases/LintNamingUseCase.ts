'use strict';

import { CoreDomain } from '../../domain/usecases/LintNamingUseCase';
import { Name } from '../../domain/entities/Name';
import { SketchRepository } from '../repositories/SketchRepository';

export class LintNamingUseCase implements CoreDomain.LintNamingUseCase {
  private repository: SketchRepository;

  constructor(repository: SketchRepository) {
    this.repository = repository;
  }

  lintNaming(): Promise<Name[]> {
    throw new Error('Method not implemented.');
    /**
     * 1. プラットフォーム層から元になるjson一覧を取得し、entityオブジェクトの配列(1')に変換
     * 2. Lint用のjsonを取得しentityオブジェクト配列(2')に変換
     * 3. 1'と2'を比較し、各命名規則ごとにマッチした配列(3')と、どの命名規則にもマッチしない配列(3'')を作成
     * 4. 3の結果を出力
     */
  }
}
