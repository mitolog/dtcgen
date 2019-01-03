import cac from "Cac";
import { cliContainer } from "../dist/inversify.config";
import {
  ILintNamingUseCase,
  IExtractElementUseCase,
  IGenerateCodeUseCase
} from "../dist/domain/Domain";
import { TYPES } from "../dist/types";
import {
  DesignToolType,
  DesignToolTypeValues
} from "../dist/domain/entities/DesignToolType";
import { OSType, OSTypeValues } from "../dist/domain/entities/OSType";

const cli = cac();

/**
 * lint
 */
cli.command(
  "lint",
  {
    desc: "lint design resource file"
  },
  (input, flag) => {
    const inputPath = flag.input;
    if (!inputPath) {
      console.log("required option is not detected. see `generate --help`.");
      return;
    }
    console.log("now start linting...");
    // prettier-ignore
    const lintNamingUseCase = cliContainer.get<ILintNamingUseCase>(TYPES.ILintNamingUseCase);
    lintNamingUseCase
      .handle(inputPath)
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
    const matchedSketch = DesignToolTypeValues.find(type => type === flag.tool);
    const inputPath = flag.input;
    const outputDir = flag.output;
    if (!inputPath) {
      console.log("required option is not detected. see `generate --help`.");
      return;
    }

    // prettier-ignore
    const extractElementUseCase = cliContainer.get<IExtractElementUseCase>(TYPES.IExtractElementUseCase);
    extractElementUseCase
      .handle(inputPath, outputDir)
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
    desc: "generate source code from extracted semantic data."
  },
  (input, flag) => {
    const matchedTool = DesignToolTypeValues.find(type => type === flag.tool);
    const matchedPlatform = OSTypeValues.find(type => type === flag.platform);
    const outputDir = flag.output;
    if (!matchedTool || !matchedPlatform) {
      console.log("required option is not detected. see `generate --help`.");
      return;
    }
    // prettier-ignore
    const generateCodeUseCase = cliContainer.get<IGenerateCodeUseCase>(TYPES.IGenerateCodeUseCase);
    generateCodeUseCase
      .handle(<DesignToolType>matchedTool, <OSType>matchedPlatform, outputDir)
      .then(() => {
        console.log(`code generated`);
      })
      .catch(error => {
        console.log(error);
      });
  }
);

cli
  .option("tool [designTool]", "required. currently `sketch` only.")
  .option("platform [osType]", "required. currently `ios` only.")
  .option(
    "input [relative/absolute path]",
    "required for lint/extract. File path to be executed comamnd."
  )
  .option(
    "output [relative/absolute dir]",
    "MUST BE SAME PATH BOTH ON extract/generate. Default dir is set on .env file."
  );

cli.parse();
