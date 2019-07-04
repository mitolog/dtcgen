import * as execa from 'execa';

describe('tests for cli commands', () => {
  const testOutputPath = './testOutputs';

  beforeAll(() => {
    jest.setTimeout(20000);
  });

  afterAll(async () => {
    return await execa.shell(`rm -rf ${testOutputPath}`);
  });

  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('common', () => {
    test('help shuold be exists', async () => {
      const helpMessage = await execa.shell('bin/cli --help');
      expect(helpMessage.stdout).toBeDefined();
    });

    test('version shuold be exists', async () => {
      const versionMessage = await execa.shell('bin/cli --version');
      expect(versionMessage.stdout).toBeDefined();
    });
  });

  describe('slice', () => {
    test('`input` option should be exists', async () => {
      const result = await execa.shell('bin/cli slice');
      expect(result.stdout).toBe(
        '`input` option on sketch is required. see `dtcgen slice --help`.',
      );
    });

    test('even if `tool` option is other than enum value, it will succsess with default value.', async () => {
      const result = await execa.shell(
        `bin/cli slice --input "./sample.sketch" --tool "hoge" --output "${testOutputPath}"`,
      );
      expect(result.stdout).toBe('asset extracted\nasset generated');
    });

    test('even if `platform` option is other than enum value, it will succsess with default value.', async () => {
      const result = await execa.shell(
        `bin/cli slice --input "./sample.sketch" --platform "hoge" --output "${testOutputPath}"`,
      );
      expect(result.stdout).toBe('asset extracted\nasset generated');
    });
  });
});
