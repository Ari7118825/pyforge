import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as Blockly from 'blockly';
import { PyForgeTheme, toolboxConfig, pythonGenerator } from '@/blocks/pythonBlocks';

export const BlocklyWorkspace = forwardRef(({ onCodeChange, onWorkspaceChange, extraCategories, settings }, ref) => {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getWorkspace: () => workspaceRef.current,
    getCode: () => {
      if (!workspaceRef.current) return '';
      try { return pythonGenerator.workspaceToCode(workspaceRef.current); } catch (e) { return ''; }
    },
  }));

  const generateCode = useCallback(() => {
    if (!workspaceRef.current) return;
    try {
      const code = pythonGenerator.workspaceToCode(workspaceRef.current);
      onCodeChange?.(code);
    } catch (e) {
      console.warn('Code generation error:', e);
    }
  }, [onCodeChange]);

  useEffect(() => {
    if (!blocklyDiv.current || workspaceRef.current) return;

    const s = settings || {};
    const workspace = Blockly.inject(blocklyDiv.current, {
      toolbox: toolboxConfig,
      theme: PyForgeTheme,
      renderer: 'zelos',
      grid: {
        spacing: 25,
        length: 1,
        colour: '#1a1a1f',
        snap: s.blockSnapToGrid !== false,
      },
      zoom: {
        controls: true,
        wheel: s.zoomOnScroll !== false,
        startScale: s.startScale || 0.9,
        maxScale: 2,
        minScale: 0.3,
        scaleSpeed: 1.1,
        pinch: true,
      },
      move: { scrollbars: true, drag: true, wheel: true },
      trashcan: s.showTrashcan !== false,
      sounds: s.soundEffects || false,
      toolboxPosition: 'start',
    });

    workspaceRef.current = workspace;

    workspace.addChangeListener(() => {
      generateCode();
      onWorkspaceChange?.(workspace);
    });

    const saved = localStorage.getItem('pyforge_workspace');
    if (saved) {
      try {
        const xml = Blockly.utils.xml.textToDom(saved);
        Blockly.Xml.domToWorkspace(xml, workspace);
      } catch (e) {
        console.warn('Failed to load saved workspace');
      }
    }

    generateCode();

    // Enable wheel scrolling through toolbox categories (Scratch-like)
    const toolboxEl = blocklyDiv.current.querySelector('.blocklyToolboxDiv');
    if (toolboxEl) {
      toolboxEl.style.overflowY = 'auto';
      toolboxEl.style.overflowX = 'hidden';
    }

    return () => {
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update toolbox when extraCategories change
  useEffect(() => {
    if (!workspaceRef.current) return;

    const merged = {
      kind: 'categoryToolbox',
      contents: [
        ...toolboxConfig.contents,
        ...(extraCategories && extraCategories.length > 0 ? [{ kind: 'sep' }, ...extraCategories] : []),
      ],
    };

    try {
      workspaceRef.current.updateToolbox(merged);
      // Re-apply scrollable toolbox
      const el = document.querySelector('.blocklyToolboxDiv');
      if (el) {
        el.style.overflowY = 'auto';
        el.style.overflowX = 'hidden';
      }
    } catch (e) {
      console.warn('Failed to update toolbox:', e);
    }
  }, [extraCategories]);

  // Resize handler
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
    });
    if (blocklyDiv.current) observer.observe(blocklyDiv.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={blocklyDiv}
      data-testid="blockly-workspace"
      style={{ width: '100%', height: '100%' }}
    />
  );
});

BlocklyWorkspace.displayName = 'BlocklyWorkspace';

export const saveWorkspace = (workspace) => {
  if (!workspace) return;
  const xml = Blockly.Xml.workspaceToDom(workspace);
  localStorage.setItem('pyforge_workspace', Blockly.Xml.domToText(xml));
};

export const getWorkspaceXml = (workspace) => {
  if (!workspace) return '';
  const xml = Blockly.Xml.workspaceToDom(workspace);
  return Blockly.Xml.domToText(xml);
};
