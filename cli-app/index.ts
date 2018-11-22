import Cac from "Cac";
import { cliContainer } from "../dist/inversify.config";
import {
  ILintNamingUseCase,
  IExtractElementUseCase
} from "../dist/domain/Domain";
import { TYPES } from "../dist/types";

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
    console.log("now start extracting...");
    // prettier-ignore
    const extractElementUseCase = cliContainer.get<IExtractElementUseCase>(TYPES.IExtractElementUseCase);
    extractElementUseCase
      .handle()
      .then(outputs => {
        console.log("finished extracting.");
        console.log("--------------------");
        console.log(outputs);
      })
      .catch(error => {
        console.log(error);
      });
  }
);

cli.parse();
