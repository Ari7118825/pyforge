import { useState, useCallback, useRef, useEffect } from 'react';
import '@/App.css';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { BlocklyWorkspace, saveWorkspace, getWorkspaceXml } from '@/components/BlocklyWorkspace';
import { Toolbar } from '@/components/Toolbar';
import { TerminalPanel } from '@/components/TerminalPanel';
import { CodePreview } from '@/components/CodePreview';
import { OutputPanel } from '@/components/OutputPanel';
import { StreamPanel } from '@/components/StreamPanel';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { ProjectManager } from '@/components/ProjectManager';
import { SaveAsModal } from '@/components/SaveAsModal';
import { MyBlocksPanel } from '@/components/MyBlocksPanel';
import { SettingsModal } from '@/components/SettingsModal';
import { registerImportBlocks, registerCustomBlock, getCustomBlockDefinitions } from '@/blocks/pythonBlocks';
import {
  Code, Terminal, Monitor, Settings as SettingsIcon,
  PanelBottomOpen, PanelRightOpen
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function App() {
  const [currentCode, setCurrentCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectId, setProjectId] = useState(null);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [showMyBlocks, setShowMyBlocks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [output, setOutput] = useState({ lines: [], exitCode: null, executionTime: 0 });
  const [bottomTab, setBottomTab] = useState('output');
  const [rightTab, setRightTab] = useState('code');
  const [showRight, setShowRight] = useState(true);
  const [showBottom, setShowBottom] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [customBlocks, setCustomBlocks] = useState([]);
  const [myBlocksCategory, setMyBlocksCategory] = useState(null);

  const workspaceRef = useRef(null);
  const blocklyRef = useRef(null);

  // Load custom blocks on mount
  useEffect(() => {
    loadCustomBlocks();
  }, []);

  const loadCustomBlocks = async () => {
    try {
      const res = await axios.get(`${API}/custom-blocks`);
      const blocks = res.data.blocks || [];
      setCustomBlocks(blocks);
      rebuildMyBlocksCategory(blocks);
    } catch (e) {
      // ignore on load failure
    }
  };

  const rebuildMyBlocksCategory = (blocks) => {
    if (blocks.length === 0) {
      setMyBlocksCategory(null);
      return;
    }

    let allBlockEntries = [];
    blocks.forEach(b => {
      const entries = registerCustomBlock(b);
      allBlockEntries = allBlockEntries.concat(entries);
    });

    setMyBlocksCategory({
      kind: 'category',
      name: 'My Blocks',
      colour: '#8b5cf6',
      contents: allBlockEntries,
    });
  };

  // Build the full extra categories list whenever dynamic or custom blocks change
  const extraCategories = [
    ...(myBlocksCategory ? [myBlocksCategory] : []),
    ...dynamicCategories,
  ];

  // Code generation callback
  const handleCodeChange = useCallback((code) => {
    setCurrentCode(code);
  }, []);

  // Workspace change callback
  const handleWorkspaceChange = useCallback((workspace) => {
    workspaceRef.current = workspace;
  }, []);

  // ─── Reload Logic ──────────────────────────────────────────────────────────
  const handleReloadLogic = useCallback(async () => {
    if (!currentCode?.trim() || isReloading) return;
    setIsReloading(true);

    // Also prepend custom block definitions if any
    const fullCode = customBlocks.length > 0
      ? getCustomBlockDefinitions(customBlocks) + currentCode
      : currentCode;

    try {
      const res = await axios.post(`${API}/scanner/scan-imports`, { code: fullCode });
      const imports = res.data.imports || [];

      const newCategories = [];
      for (const mod of imports) {
        if (!mod.available) continue;
        const hasSomething = (mod.functions?.length > 0) || (mod.classes?.length > 0) || (mod.constants?.length > 0);
        if (!hasSomething) continue;

        const category = registerImportBlocks(mod);
        newCategories.push(category);
      }

      setDynamicCategories(newCategories);

      // Show success in output
      const names = imports.filter(m => m.available).map(m => m.name);
      setOutput(prev => ({
        ...prev,
        lines: [
          ...prev.lines,
          { type: 'system', text: `--- Reload Logic: scanned ${imports.length} import(s) ---` },
          ...(names.length > 0
            ? [{ type: 'stdout', text: `Created blocks for: ${names.join(', ')}` }]
            : [{ type: 'stdout', text: 'No importable modules found in code.' }]
          ),
        ],
      }));
      setBottomTab('output');
      setShowBottom(true);
    } catch (e) {
      setOutput(prev => ({
        ...prev,
        lines: [...prev.lines, { type: 'stderr', text: `Reload Logic error: ${e.message}` }],
      }));
    } finally {
      setIsReloading(false);
    }
  }, [currentCode, isReloading, customBlocks]);

  // ─── Run code ──────────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!currentCode?.trim() || isRunning) return;

    setIsRunning(true);
    setOutput({ lines: [{ type: 'system', text: '--- Running... ---' }], exitCode: null, executionTime: 0 });
    setBottomTab('output');
    setShowBottom(true);

    // Prepend custom block function definitions
    const fullCode = customBlocks.length > 0
      ? getCustomBlockDefinitions(customBlocks) + '\n' + currentCode
      : currentCode;

    try {
      const res = await axios.post(`${API}/execute`, { code: fullCode });
      const lines = [];
      if (res.data.stdout) {
        res.data.stdout.split('\n').forEach(line => {
          if (line) lines.push({ type: 'stdout', text: line });
        });
      }
      if (res.data.stderr) {
        res.data.stderr.split('\n').forEach(line => {
          if (line) lines.push({ type: 'stderr', text: line });
        });
      }
      lines.push({
        type: 'system',
        text: `--- Process exited with code ${res.data.exit_code} (${res.data.execution_time.toFixed(3)}s) ---`
      });

      setOutput({ lines, exitCode: res.data.exit_code, executionTime: res.data.execution_time });
    } catch (e) {
      setOutput({ lines: [{ type: 'stderr', text: `Error: ${e.message}` }], exitCode: -1, executionTime: 0 });
    } finally {
      setIsRunning(false);
    }
  }, [currentCode, isRunning, customBlocks]);

  const handleStop = useCallback(async () => {
    try { await axios.post(`${API}/execute/stop`); } catch (e) { /* ignore */ }
    setIsRunning(false);
  }, []);

  // ─── Save project ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const ws = blocklyRef.current?.getWorkspace?.();
    const xml = ws ? getWorkspaceXml(ws) : '';
    if (ws) saveWorkspace(ws);

    if (projectId) {
      try {
        await axios.put(`${API}/projects/${projectId}`, { name: projectName, workspace_xml: xml });
      } catch (e) { console.error('Failed to save project'); }
    } else {
      try {
        const res = await axios.post(`${API}/projects`, { name: projectName });
        setProjectId(res.data.id);
        await axios.put(`${API}/projects/${res.data.id}`, { workspace_xml: xml });
      } catch (e) { console.error('Failed to create project'); }
    }
  }, [projectId, projectName]);

  const handleLoadProject = useCallback((project) => {
    setProjectId(project.id);
    setProjectName(project.name);
    const ws = blocklyRef.current?.getWorkspace?.();
    if (project.workspace_xml && ws) {
      const BlocklyLib = require('blockly');
      ws.clear();
      try {
        const xml = BlocklyLib.utils.xml.textToDom(project.workspace_xml);
        BlocklyLib.Xml.domToWorkspace(xml, ws);
      } catch (e) { console.warn('Failed to load project workspace'); }
    }
  }, []);

  const handleNewProject = useCallback((project) => {
    setProjectId(project.id);
    setProjectName(project.name);
    const ws = blocklyRef.current?.getWorkspace?.();
    if (ws) ws.clear();
    setCurrentCode('');
  }, []);

  // ─── My Blocks callback ───────────────────────────────────────────────────
  const handleBlockCreated = useCallback((newBlock) => {
    const updatedBlocks = [...customBlocks, newBlock];
    setCustomBlocks(updatedBlocks);
    rebuildMyBlocksCategory(updatedBlocks);
  }, [customBlocks]);

  const bottomTabs = [
    { id: 'output', label: 'Output', icon: Code },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'stream', label: 'Desktop', icon: Monitor },
  ];

  const rightTabs = [
    { id: 'code', label: 'Code', icon: Code },
    { id: 'properties', label: 'Props', icon: SettingsIcon },
  ];

  return (
    <div data-testid="pyforge-app" className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: '#09090b' }}>
      <Toolbar
        currentCode={currentCode}
        isRunning={isRunning}
        onRun={handleRun}
        onStop={handleStop}
        onSave={handleSave}
        onSaveAs={() => setShowSaveAs(true)}
        onReloadLogic={handleReloadLogic}
        onOpenProject={() => setShowProjectManager(true)}
        onOpenMyBlocks={() => setShowMyBlocks(true)}
        onOpenSettings={() => setShowSettings(true)}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        isReloading={isReloading}
        importCount={dynamicCategories.length}
      />

      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={showRight ? 72 : 100} minSize={40}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={showBottom ? 65 : 100} minSize={30}>
              <div className="relative w-full h-full">
                <BlocklyWorkspace
                  ref={blocklyRef}
                  onCodeChange={handleCodeChange}
                  onWorkspaceChange={handleWorkspaceChange}
                  extraCategories={extraCategories}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    data-testid="toggle-bottom-btn"
                    onClick={() => setShowBottom(!showBottom)}
                    className="p-1.5 rounded-md glass hover:bg-white/10 active:scale-95"
                    style={{ color: showBottom ? '#FFD43B' : '#3f3f46' }}
                    title={showBottom ? 'Hide bottom panel' : 'Show bottom panel'}
                  >
                    <PanelBottomOpen size={14} />
                  </button>
                  <button
                    data-testid="toggle-right-btn"
                    onClick={() => setShowRight(!showRight)}
                    className="p-1.5 rounded-md glass hover:bg-white/10 active:scale-95"
                    style={{ color: showRight ? '#06b6d4' : '#3f3f46' }}
                    title={showRight ? 'Hide right panel' : 'Show right panel'}
                  >
                    <PanelRightOpen size={14} />
                  </button>
                </div>
              </div>
            </Panel>

            {showBottom && (
              <>
                <PanelResizeHandle className="h-px hover:h-1 bg-[#27272a] hover:bg-[#FFD43B] cursor-row-resize" style={{ transition: 'height 0.15s, background-color 0.15s' }} />
                <Panel defaultSize={35} minSize={15} maxSize={60}>
                  <div className="flex flex-col h-full" style={{ background: '#050505' }}>
                    <div className="flex items-center h-8 border-b" style={{ borderColor: '#1a1a1f', background: '#0a0a0a' }}>
                      {bottomTabs.map(tab => (
                        <button
                          key={tab.id}
                          data-testid={`bottom-tab-${tab.id}`}
                          onClick={() => setBottomTab(tab.id)}
                          className="flex items-center gap-1.5 px-3 h-full text-xs border-r relative"
                          style={{ borderColor: '#1a1a1f', color: bottomTab === tab.id ? '#fafafa' : '#52525b' }}
                        >
                          <tab.icon size={11} />
                          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: '11px' }}>{tab.label}</span>
                          {bottomTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#FFD43B' }} />
                          )}
                        </button>
                      ))}
                      {isRunning && (
                        <div className="flex items-center gap-1.5 px-2 ml-auto">
                          <span className="status-dot status-running" />
                          <span className="text-[10px] font-mono" style={{ color: '#10b981' }}>Running</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {bottomTab === 'output' && (
                        <OutputPanel
                          isRunning={isRunning}
                          output={output}
                          onClear={() => setOutput({ lines: [], exitCode: null, executionTime: 0 })}
                        />
                      )}
                      {bottomTab === 'terminal' && <TerminalPanel />}
                      {bottomTab === 'stream' && <StreamPanel />}
                    </div>
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>

        {showRight && (
          <>
            <PanelResizeHandle className="w-px hover:w-1 bg-[#27272a] hover:bg-[#06b6d4] cursor-col-resize" style={{ transition: 'width 0.15s, background-color 0.15s' }} />
            <Panel defaultSize={28} minSize={18} maxSize={45}>
              <div className="flex flex-col h-full" style={{ background: '#18181b' }}>
                <div className="flex items-center h-8 border-b" style={{ borderColor: '#27272a', background: '#18181b' }}>
                  {rightTabs.map(tab => (
                    <button
                      key={tab.id}
                      data-testid={`right-tab-${tab.id}`}
                      onClick={() => setRightTab(tab.id)}
                      className="flex items-center gap-1.5 px-3 h-full text-xs relative"
                      style={{ color: rightTab === tab.id ? '#fafafa' : '#52525b' }}
                    >
                      <tab.icon size={11} />
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: '11px' }}>{tab.label}</span>
                      {rightTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#06b6d4' }} />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-hidden">
                  {rightTab === 'code' && <CodePreview code={currentCode} />}
                  {rightTab === 'properties' && <PropertiesPanel selectedBlock={selectedBlock} />}
                </div>
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>

      {/* Modals */}
      <ProjectManager
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
        onLoadProject={handleLoadProject}
        onNewProject={handleNewProject}
      />
      <SaveAsModal
        isOpen={showSaveAs}
        onClose={() => setShowSaveAs(false)}
        code={currentCode}
      />
      <MyBlocksPanel
        isOpen={showMyBlocks}
        onClose={() => setShowMyBlocks(false)}
        onBlockCreated={handleBlockCreated}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;
