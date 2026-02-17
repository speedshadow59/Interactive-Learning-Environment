const express = require('express');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const router = express.Router();

router.post('/', (req, res) => {
  const { code = '', language = 'javascript' } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Code is required' });
  }

  if (language === 'javascript') {
    const logs = [];
    const sandbox = {
      console: {
        log: (...args) => logs.push(args.map((arg) => String(arg)).join(' ')),
      },
    };

    try {
      vm.runInNewContext(code, sandbox, { timeout: 1200 });
      return res.json({ success: true, output: logs.join('\n') || '(no output)' });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  if (language === 'python') {
    const py = spawnSync('python', ['-c', code], {
      encoding: 'utf-8',
      timeout: 2000,
    });

    if (py.error) {
      return res.status(400).json({
        success: false,
        error: 'Python runtime is not available in backend container yet.',
      });
    }

    if (py.status !== 0) {
      return res.status(400).json({ success: false, error: py.stderr || 'Python execution failed' });
    }

    return res.json({ success: true, output: py.stdout || '(no output)' });
  }

  return res.status(400).json({ success: false, error: 'Unsupported language' });
});

module.exports = router;
