import Cac from "Cac";
import { cliContainer } from "../dist/inversify.config";
import {
  ILintNamingUseCase,
  IExtractElementUseCase,
  IGenerateCodeUseCase
} from "../dist/domain/Domain";
import { TYPES } from "../dist/types";
import { DesignToolType } from "../dist/domain/entities/DesignToolType";
import { OSType } from "../dist/domain/entities/OSType";

const cli = Cac();

/**
 * lint
 */
cli.command(
  "lint",
  {
    desc: "lint design resource file"
  },
  (input, flag) => {
    // todo: config.jsonの読み込み後のnormalizeなり型チェックはeslintのソレを使ってもいいかも
    console.log("now start linting...");
    // prettier-ignore
    const lintNamingUseCase = cliContainer.get<ILintNamingUseCase>(TYPES.ILintNamingUseCase);
    lintNamingUseCase
      .handle()
      .then(layers => {
        console.log("finished linting.");
        console.log("--------------------");
        console.log(layers);
      })
      .catch(error => {
        console.log(error);
      });
  }
);

/**
 * extract
 */
cli.command(
  "extract",
  {
    desc: "extract semantic elements for layout file auto generation."
  },
  (input, flag) => {
    // todo: config.jsonの読み込み後のnormalizeなり型チェックはeslintのソレを使ってもいいかも
    // prettier-ignore
    const extractElementUseCase = cliContainer.get<IExtractElementUseCase>(TYPES.IExtractElementUseCase);
    extractElementUseCase
      .handle()
      .then(() => {
        console.log(`file extracted`);
      })
      .catch(error => {
        console.log(error);
      });
  }
);

/**
 * generate source code
 */
cli.command(
  "generate",
  {
    desc: "auto generate source code from extracted semantic data."
  },
  (input, flag) => {
    // todo: config.jsonの読み込み後のnormalizeなり型チェックはeslintのソレを使ってもいいかも
    // command like node index.js --from sketch --to ios
    // prettier-ignore
    const generateCodeUseCase = cliContainer.get<IGenerateCodeUseCase>(TYPES.IGenerateCodeUseCase);
    generateCodeUseCase
      .handle(DesignToolType.sketch, OSType.ios)
      .then(() => {
        console.log(`code generated`);
      })
      .catch(error => {
        console.log(error);
      });
  }
);

cli.parse();
