import React, { useEffect, useState } from 'react';
import '../styles/BlockEditor.css';

const BlockEditor = ({ initialBlocks, onChange, language = 'javascript' }) => {
  const [blocks, setBlocks] = useState(initialBlocks || []);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const blockTemplates = {
    javascript: [
      { id: 'log', label: 'Print', code: 'console.log(%text%);', params: ['text'] },
      { id: 'var', label: 'Declare Variable', code: 'let %var% = %value%;', params: ['var', 'value'] },
      { id: 'if', label: 'If Statement', code: 'if (%condition%) {\n  %body%\n}', params: ['condition', 'body'] },
      { id: 'for', label: 'For Loop', code: 'for (let i = 0; i < %count%; i++) {\n  %body%\n}', params: ['count', 'body'] },
      { id: 'function', label: 'Function', code: 'function %name%(%params%) {\n  %body%\n}', params: ['name', 'params', 'body'] },
      { id: 'return', label: 'Return', code: 'return %value%;', params: ['value'] },
      { id: 'add', label: 'Add', code: '%a% + %b%', params: ['a', 'b'] },
    ],
    python: [
      { id: 'log', label: 'Print', code: 'print(%text%)', params: ['text'] },
      { id: 'var', label: 'Declare Variable', code: '%var% = %value%', params: ['var', 'value'] },
      { id: 'if', label: 'If Statement', code: 'if %condition%:\n    %body%', params: ['condition', 'body'] },
      { id: 'for', label: 'For Loop', code: 'for i in range(%count%):\n    %body%', params: ['count', 'body'] },
      { id: 'function', label: 'Function', code: 'def %name%(%params%):\n    %body%', params: ['name', 'params', 'body'] },
      { id: 'return', label: 'Return', code: 'return %value%', params: ['value'] },
      { id: 'add', label: 'Add', code: '%a% + %b%', params: ['a', 'b'] },
    ]
  };

  const currentTemplates = blockTemplates[language] || blockTemplates.javascript;

  useEffect(() => {
    setBlocks(initialBlocks || []);
  }, [initialBlocks]);

  const addBlock = (template) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type: template.id,
      label: template.label,
      code: template.code,
      params: template.params.reduce((acc, param) => {
        acc[param] = '';
        return acc;
      }, {})
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const normalizeParamValue = (block, param, value) => {
    if (block.type === 'log' && param === 'text') {
      const trimmed = (value || '').trim();
      if (!trimmed) return '""';
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return trimmed;
      }
      if (!Number.isNaN(Number(trimmed))) {
        return trimmed;
      }
      return JSON.stringify(trimmed);
    }

    return value || `<${param}>`;
  };

  const removeBlock = (blockId) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const updateBlockParam = (blockId, paramName, value) => {
    const newBlocks = blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          params: {
            ...b.params,
            [paramName]: value
          }
        };
      }
      return b;
    });
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const moveBlock = (blockId, direction) => {
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    if (
      (direction === 'up' && currentIndex > 0) ||
      (direction === 'down' && currentIndex < blocks.length - 1)
    ) {
      const newBlocks = [...blocks];
      const moveIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      [newBlocks[currentIndex], newBlocks[moveIndex]] = [
        newBlocks[moveIndex],
        newBlocks[currentIndex]
      ];
      setBlocks(newBlocks);
      onChange(newBlocks);
    }
  };

  const generateCode = () => {
    return blocks
      .map(block => {
        let code = block.code;
        Object.entries(block.params).forEach(([param, value]) => {
          const safeValue = normalizeParamValue(block, param, value);
          code = code.replace(new RegExp(`%${param}%`, 'g'), safeValue);
        });
        return code;
      })
      .join('\n');
  };

  const reorderBlocks = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;

    const fromIndex = blocks.findIndex((item) => item.id === fromId);
    const toIndex = blocks.findIndex((item) => item.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...blocks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setBlocks(next);
    onChange(next);
  };

  const executeCode = async () => {
    setIsRunning(true);
    setOutput('');
    const code = generateCode();

    try {
      const response = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setOutput(data.error || 'Execution failed');
      } else {
        setOutput(data.output || '(no output)');
      }
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="block-editor">
      <div className="block-palette">
        <h4>Block Palette</h4>
        <div className="palette-blocks">
          {currentTemplates.map(template => (
            <button
              key={template.id}
              className="palette-block"
              onClick={() => addBlock(template)}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      <div className="block-workspace">
        <h4>Workspace</h4>
        <div className="blocks-container">
          {blocks.length === 0 ? (
            <p className="empty-workspace">Drag blocks here or click to add</p>
          ) : (
            blocks.map((block, index) => (
              <div
                key={block.id}
                className={`block ${selectedBlock === block.id ? 'selected' : ''} ${draggingId === block.id ? 'dragging' : ''} ${dragOverId === block.id ? 'drag-over' : ''}`}
                onClick={() => setSelectedBlock(block.id)}
                draggable
                onDragStart={() => setDraggingId(block.id)}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (draggingId && draggingId !== block.id) {
                    setDragOverId(block.id);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  reorderBlocks(draggingId, block.id);
                  setDraggingId(null);
                  setDragOverId(null);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverId(null);
                }}
              >
                <div className="block-header">
                  <span className="block-label">{block.label}</span>
                  <div className="block-controls">
                    <button
                      className="btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveBlock(block.id, 'up');
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      className="btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveBlock(block.id, 'down');
                      }}
                      disabled={index === blocks.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      className="btn-small btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBlock(block.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {selectedBlock === block.id && block.params && (
                  <div className="block-params">
                    {Object.entries(block.params).map(([paramName, value]) => (
                      <div key={paramName} className="param">
                        <label>{paramName}:</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            updateBlockParam(block.id, paramName, e.target.value)
                          }
                          placeholder={`Enter ${paramName}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="block-preview">
        <div className="preview-header">
          <h4>Code Preview</h4>
          <button 
            className="btn-run"
            onClick={executeCode}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : '▶ Run Code'}
          </button>
        </div>
        <pre className="code-preview">
          <code>{generateCode()}</code>
        </pre>
        {output && (
          <div className="code-output">
            <h5>Output:</h5>
            <pre className="output-content">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockEditor;
