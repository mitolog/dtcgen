import * as execa from 'execa';

describe('tests for cli commands', () => {
  var testOutputPath: string;
  beforeAll(async () => {
    testOutputPath = './testOutputs';
  });

  describe('common', () => {
    it('help shuold be exists', () => {
      const helpMessage = execa.shellSync('bin/cli --help');
      expect(helpMessage.stdout).toBeDefined();
    });

    it('version shuold be exists', () => {
      const versionMessage = execa.shellSync('bin/cli --version');
      expect(versionMessage.stdout).toBeDefined();
    });
  });

  describe('slice', () => {
    it('`input` option should be exists', () => {
      const result = execa.shellSync('bin/cli slice');
      expect(result.stdout).toBe(
        'input option is not detected. see `dtcgen slice --help`.',
      );
    });

    it('even if `tool` option is other than enum value, it will succsess with default value.', () => {
      const result = execa.shellSync(
        `bin/cli slice --input "./sample.sketch" --tool "hoge" --output "${testOutputPath}"`,
      );
      expect(result.stdout).toBe('asset extracted\nasset generated');
    });

    it('even if `platform` option is other than enum value, it will succsess with default value.', () => {
      const result = execa.shellSync(
        `bin/cli slice --input "./sample.sketch" --platform "hoge" --output "${testOutputPath}"`,
      );
      expect(result.stdout).toBe('asset extracted\nasset generated');
    });
  });

  afterAll(async () => {
    execa.shellSync(`rm -rf ${testOutputPath}`);
  });
});
