import * as execa from 'execa';

describe('tests for cli commands', () => {
  const testOutputPath = './testOutputs';

  beforeAll(() => {
    jest.setTimeout(20000);
  });

  afterAll(async () => {
    return await execa(`rm -rf ${testOutputPath}`, { shell: true });
  });

  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('common', () => {
    test('help shuold be exists', async () => {
      const helpMessage = await execa('bin/cli --help', { shell: true });
      expect(helpMessage.stdout).toBeDefined();
    });

    test('version shuold be exists', async () => {
      const versionMessage = await execa('bin/cli --version', { shell: true });
      expect(versionMessage.stdout).toBeDefined();
    });
  });

  describe('slice', () => {
    test('even if no options, it will succeed (default tool: figma)', async () => {
      const result = await execa('bin/cli slice', { shell: true });
      expect(result.stderr).not.toMatch(/✖/);
    });

    test('even if `tool` option is other than enum value, it will succsess with default value.', async () => {
      const result = await execa(
        `bin/cli slice --input "./sample.sketch" --tool "hoge" --output "${testOutputPath}"`,
        { shell: true },
      );
      console.log(result.stderr);
      expect(result.stderr).not.toMatch(/✖/);
    });

    // Let'ts comment out if you added new platforms. currently we only support `iOS`,
    // so we're now opted out `platform` option.
    // test('even if `platform` option is other than enum value, it will succsess with default value.', async () => {
    //   const result = await execa(
    //     `bin/cli slice --input "./sample.sketch" --platform "hoge" --output "${testOutputPath}"`,
    //     { shell: true },
    //   );
    //   expect(result.stdout).toBe('asset extracted\nasset generated');
    // });
  });
});
