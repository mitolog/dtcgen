import cac from "Cac";
import { DIContainer } from "../dist/inversify.config";
import {
  ILintNamingUseCase,
  IExtractElementUseCase,
  IGenerateProjectUseCase
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
    // TODO: maintenance after implementing the other commands
    // prettier-ignore
    // const lintNamingUseCase = cliContainer.get<ILintNamingUseCase>(TYPES.ILintNamingUseCase);
    // lintNamingUseCase
    //   .handle(inputPath)
    //   .then(layers => {
    //     console.log("finished linting.");
    //     console.log("--------------------");
    //     console.log(layers);
    //   })
    //   .catch(error => {
    //     console.log(error);
    //   });
  }
);

/**
 * extract
 */
cli
  .command(
    "extract",
    {
      desc: "extract semantic elements for layout file auto generation."
    },
    (input, flag) => {
      const inputPath = flag.input;
      const outputDir = flag.output;
      if (!inputPath) {
        console.log("input option is not detected. see `extract --help`.");
        return;
      }

      const toolType =
        DesignToolTypeValues.find(type => type === flag.tool) ||
        DesignToolType.sketch;

      const cliContainer = new DIContainer(<DesignToolType>(
        toolType
      )).getContainer();
      const extractElementUseCase = cliContainer.get<IExtractElementUseCase>(
        TYPES.IExtractElementUseCase
      );
      extractElementUseCase
        .handle(inputPath, outputDir)
        .then(() => {
          console.log(`file extracted`);
        })
        .catch(error => {
          console.log(error);
        });
    }
  )
  .option("tool [designTool]", "optional. `sketch` as a default.");

/**
 * generate source code
 */
cli
  .command(
    "generate",
    {
      desc: "generate source code from extracted semantic data."
    },
    (input, flag) => {
      const platform =
        OSTypeValues.find(type => type === flag.platform) || OSType.ios;
      const outputDir = flag.output;
      const projectName = flag.project;
      if (!projectName) {
        console.log(
          "`--project` option is not detected. see `extract --help`."
        );
        return;
      }

      const cliContainer = new DIContainer(<OSType>platform).getContainer();
      const generateProjectUseCase = cliContainer.get<IGenerateProjectUseCase>(
        TYPES.IGenerateProjectUseCase
      );
      generateProjectUseCase
        .handle(projectName, outputDir)
        .then(() => {
          console.log(`code generated`);
        })
        .catch(error => {
          console.log(error);
        });
    }
  )
  .option("platform [osType]", "optional. currently `ios` only.")
  .option("project [name]", "required. specify the name for the project.");

cli
  .option(
    "input [relative/absolute path]",
    "required for lint/extract. File path to be executed comamnd."
  )
  .option(
    "output [relative/absolute dir]",
    "optional. but MUST BE SAME BETWEEN COMMANDS. Default dir is set on .env file."
  );

cli.parse();
