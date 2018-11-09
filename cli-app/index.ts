// import Cac from "Cac";
import { cliContainer } from "../dist/inversify.config";
import { ILintNamingUseCase } from "../dist/domain/Domain";
import { TYPES } from "../dist/types";

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

// const cli = Cac();
// cli.command(
//   "lint",
//   {
//     desc: "lint design resource file"
//   },
//   (input, flag) => {
//     // todo: config.jsonの読み込み後のnormalizeなり型チェックはeslintのソレを使ってもいいかも
//     console.log("now start linting...");
//     // prettier-ignore
//     const lintNamingUseCase = cliContainer.get<ILintNamingUseCase>(TYPES.ILintNamingUseCase);
//     const layers = lintNamingUseCase.handle();
//     console.log("finished linting.");
//     console.log("--------------------");
//     console.log(layers);
//   }
// );

// cli.parse();
