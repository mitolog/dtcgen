import * as execa from 'execa';

describe('tests for cli commands', () => {
  const testOutputPath = './testOutputs';

  beforeAll(() => {
    jest.setTimeout(40000);
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
    test('even if no options, `slice` will succeed (default tool: figma)', async () => {
      const result = await execa('bin/cli slice', { shell: true });
      expect(result.stderr).not.toMatch(/✖/);
    });

    test('even if no options, `style` will succeed (default tool: figma)', async () => {
      const result = await execa('bin/cli style', { shell: true });
      expect(result.stderr).not.toMatch(/✖/);
    });

  });
});
