import * as Blockly from 'blockly';
import { pythonGenerator, Order } from 'blockly/python';

// ─── Custom Dark Theme ──────────────────────────────────────────────────────

export const PyForgeTheme = Blockly.Theme.defineTheme('pyforge_dark', {
  name: 'pyforge_dark',
  base: Blockly.Themes.Classic,
  blockStyles: {
    logic_blocks: { colourPrimary: '#06b6d4', colourSecondary: '#0891b2', colourTertiary: '#065f76' },
    loop_blocks: { colourPrimary: '#8b5cf6', colourSecondary: '#7c3aed', colourTertiary: '#5b21b6' },
    math_blocks: { colourPrimary: '#f59e0b', colourSecondary: '#d97706', colourTertiary: '#92400e' },
    text_blocks: { colourPrimary: '#10b981', colourSecondary: '#059669', colourTertiary: '#065f46' },
    list_blocks: { colourPrimary: '#ec4899', colourSecondary: '#db2777', colourTertiary: '#9d174d' },
    variable_blocks: { colourPrimary: '#FFD43B', colourSecondary: '#eab308', colourTertiary: '#a16207' },
    procedure_blocks: { colourPrimary: '#6366f1', colourSecondary: '#4f46e5', colourTertiary: '#3730a3' },
    io_blocks: { colourPrimary: '#f97316', colourSecondary: '#ea580c', colourTertiary: '#9a3412' },
    class_blocks: { colourPrimary: '#14b8a6', colourSecondary: '#0d9488', colourTertiary: '#115e59' },
    async_blocks: { colourPrimary: '#a78bfa', colourSecondary: '#8b5cf6', colourTertiary: '#6d28d9' },
    error_blocks: { colourPrimary: '#ef4444', colourSecondary: '#dc2626', colourTertiary: '#991b1b' },
    import_blocks: { colourPrimary: '#22d3ee', colourSecondary: '#06b6d4', colourTertiary: '#0e7490' },
    dict_blocks: { colourPrimary: '#fb923c', colourSecondary: '#f97316', colourTertiary: '#c2410c' },
    builtin_blocks: { colourPrimary: '#84cc16', colourSecondary: '#65a30d', colourTertiary: '#4d7c0f' },
  },
  categoryStyles: {
    logic_category: { colour: '#06b6d4' },
    loop_category: { colour: '#8b5cf6' },
    math_category: { colour: '#f59e0b' },
    text_category: { colour: '#10b981' },
    list_category: { colour: '#ec4899' },
    variable_category: { colour: '#FFD43B' },
    procedure_category: { colour: '#6366f1' },
    io_category: { colour: '#f97316' },
    class_category: { colour: '#14b8a6' },
    async_category: { colour: '#a78bfa' },
    error_category: { colour: '#ef4444' },
    import_category: { colour: '#22d3ee' },
    dict_category: { colour: '#fb923c' },
    builtin_category: { colour: '#84cc16' },
  },
  componentStyles: {
    workspaceBackgroundColour: '#09090b',
    toolboxBackgroundColour: '#18181b',
    toolboxForegroundColour: '#a1a1aa',
    flyoutBackgroundColour: '#18181b',
    flyoutForegroundColour: '#a1a1aa',
    flyoutOpacity: 0.95,
    scrollbarColour: '#3f3f46',
    scrollbarOpacity: 0.5,
    insertionMarkerColour: '#FFD43B',
    insertionMarkerOpacity: 0.5,
    markerColour: '#FFD43B',
    cursorColour: '#FFD43B',
  },
  fontStyle: {
    family: 'JetBrains Mono, monospace',
    weight: '500',
    size: 11,
  },
});

const INDENT = '  ';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Generic builtin block factory (reduces 200+ lines of boilerplate)
// ═══════════════════════════════════════════════════════════════════════════════

function defBuiltin(name, args, hasOutput, style, tooltip) {
  const blockType = `python_builtin_${name}`;
  Blockly.Blocks[blockType] = {
    init: function () {
      if (args.length > 0) {
        this.appendDummyInput()
          .appendField(`${name}(`)
          .appendField(new Blockly.FieldTextInput(args.join(', ')), 'ARGS')
          .appendField(')');
      } else {
        this.appendDummyInput().appendField(`${name}()`);
      }
      if (hasOutput) {
        this.setOutput(true, null);
      } else {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      }
      this.setStyle(style || 'builtin_blocks');
      this.setTooltip(tooltip || `Python builtin: ${name}()`);
    }
  };
  pythonGenerator.forBlock[blockType] = function (block) {
    const a = args.length > 0 ? (block.getFieldValue('ARGS') || '') : '';
    const code = args.length > 0 ? `${name}(${a})` : `${name}()`;
    return hasOutput ? [code, Order.FUNCTION_CALL] : code + '\n';
  };
  return blockType;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE BLOCKS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Print ──────────────────────────────────────────────────────────────────
Blockly.Blocks['python_print'] = {
  init: function () {
    this.appendValueInput('VALUE').appendField('print');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('io_blocks');
    this.setTooltip('Print a value');
  }
};
pythonGenerator.forBlock['python_print'] = function (block, gen) {
  const v = gen.valueToCode(block, 'VALUE', Order.NONE) || "''";
  return `print(${v})\n`;
};

// ─── Input ──────────────────────────────────────────────────────────────────
Blockly.Blocks['python_input'] = {
  init: function () {
    this.appendValueInput('PROMPT').appendField('input');
    this.setOutput(true, 'String');
    this.setStyle('io_blocks');
  }
};
pythonGenerator.forBlock['python_input'] = function (block, gen) {
  const p = gen.valueToCode(block, 'PROMPT', Order.NONE) || "''";
  return [`input(${p})`, Order.FUNCTION_CALL];
};

// ─── Variable Assignment ────────────────────────────────────────────────────
Blockly.Blocks['python_assign'] = {
  init: function () {
    this.appendValueInput('VALUE')
      .appendField('set')
      .appendField(new Blockly.FieldTextInput('x'), 'VAR')
      .appendField('=');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
  }
};
pythonGenerator.forBlock['python_assign'] = function (block, gen) {
  return `${block.getFieldValue('VAR')} = ${gen.valueToCode(block, 'VALUE', Order.NONE) || '0'}\n`;
};

// ─── Variable Get ───────────────────────────────────────────────────────────
Blockly.Blocks['python_variable_get'] = {
  init: function () {
    this.appendDummyInput().appendField(new Blockly.FieldTextInput('x'), 'VAR');
    this.setOutput(true, null);
    this.setStyle('variable_blocks');
  }
};
pythonGenerator.forBlock['python_variable_get'] = function (block) {
  return [block.getFieldValue('VAR'), Order.ATOMIC];
};

// ─── Literals ───────────────────────────────────────────────────────────────
Blockly.Blocks['python_string'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('"')
      .appendField(new Blockly.FieldTextInput('hello'), 'TEXT')
      .appendField('"');
    this.setOutput(true, 'String');
    this.setStyle('text_blocks');
  }
};
pythonGenerator.forBlock['python_string'] = function (block) {
  return [`"${block.getFieldValue('TEXT')}"`, Order.ATOMIC];
};

Blockly.Blocks['python_number'] = {
  init: function () {
    this.appendDummyInput().appendField(new Blockly.FieldNumber(0), 'NUM');
    this.setOutput(true, 'Number');
    this.setStyle('math_blocks');
  }
};
pythonGenerator.forBlock['python_number'] = function (block) {
  return [String(block.getFieldValue('NUM')), Order.ATOMIC];
};

Blockly.Blocks['python_boolean'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([['True', 'True'], ['False', 'False']]), 'BOOL');
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
  }
};
pythonGenerator.forBlock['python_boolean'] = function (block) {
  return [block.getFieldValue('BOOL'), Order.ATOMIC];
};

Blockly.Blocks['python_none'] = {
  init: function () {
    this.appendDummyInput().appendField('None');
    this.setOutput(true, null);
    this.setStyle('logic_blocks');
  }
};
pythonGenerator.forBlock['python_none'] = function () {
  return ['None', Order.ATOMIC];
};

Blockly.Blocks['python_fstring'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('f"')
      .appendField(new Blockly.FieldTextInput('Hello {name}!'), 'TEXT')
      .appendField('"');
    this.setOutput(true, 'String');
    this.setStyle('text_blocks');
  }
};
pythonGenerator.forBlock['python_fstring'] = function (block) {
  return [`f"${block.getFieldValue('TEXT')}"`, Order.ATOMIC];
};

Blockly.Blocks['python_list'] = {
  init: function () {
    this.appendDummyInput().appendField('[').appendField(new Blockly.FieldTextInput('1, 2, 3'), 'ITEMS').appendField(']');
    this.setOutput(true, 'Array');
    this.setStyle('list_blocks');
  }
};
pythonGenerator.forBlock['python_list'] = function (block) {
  return [`[${block.getFieldValue('ITEMS')}]`, Order.ATOMIC];
};

Blockly.Blocks['python_dict'] = {
  init: function () {
    this.appendDummyInput().appendField('{').appendField(new Blockly.FieldTextInput('"key": "value"'), 'ITEMS').appendField('}');
    this.setOutput(true, null);
    this.setStyle('dict_blocks');
  }
};
pythonGenerator.forBlock['python_dict'] = function (block) {
  return [`{${block.getFieldValue('ITEMS')}}`, Order.ATOMIC];
};

Blockly.Blocks['python_tuple'] = {
  init: function () {
    this.appendDummyInput().appendField('(').appendField(new Blockly.FieldTextInput('1, 2, 3'), 'ITEMS').appendField(')');
    this.setOutput(true, null);
    this.setStyle('list_blocks');
  }
};
pythonGenerator.forBlock['python_tuple'] = function (block) {
  return [`(${block.getFieldValue('ITEMS')})`, Order.ATOMIC];
};

Blockly.Blocks['python_set'] = {
  init: function () {
    this.appendDummyInput().appendField('{').appendField(new Blockly.FieldTextInput('1, 2, 3'), 'ITEMS').appendField('}');
    this.setOutput(true, null);
    this.setStyle('list_blocks');
  }
};
pythonGenerator.forBlock['python_set'] = function (block) {
  return [`{${block.getFieldValue('ITEMS')}}`, Order.ATOMIC];
};

// ─── Operators ──────────────────────────────────────────────────────────────
Blockly.Blocks['python_compare'] = {
  init: function () {
    this.appendValueInput('A');
    this.appendDummyInput().appendField(new Blockly.FieldDropdown([
      ['==','=='],['!=','!='],['<','<'],['>','>'],['<=','<='],['>=','>='],
      ['is','is'],['is not','is not'],['in','in'],['not in','not in']
    ]), 'OP');
    this.appendValueInput('B');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
  }
};
pythonGenerator.forBlock['python_compare'] = function (block, gen) {
  const a = gen.valueToCode(block, 'A', Order.RELATIONAL) || '0';
  const b = gen.valueToCode(block, 'B', Order.RELATIONAL) || '0';
  return [`${a} ${block.getFieldValue('OP')} ${b}`, Order.RELATIONAL];
};

Blockly.Blocks['python_arithmetic'] = {
  init: function () {
    this.appendValueInput('A');
    this.appendDummyInput().appendField(new Blockly.FieldDropdown([
      ['+','+'], ['-','-'], ['*','*'], ['/','/'],['//','//'],[' %','%'],['**','**']
    ]), 'OP');
    this.appendValueInput('B');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setStyle('math_blocks');
  }
};
pythonGenerator.forBlock['python_arithmetic'] = function (block, gen) {
  const ops = {'+':Order.ADDITIVE,'-':Order.ADDITIVE,'*':Order.MULTIPLICATIVE,'/':Order.MULTIPLICATIVE,'//':Order.MULTIPLICATIVE,'%':Order.MULTIPLICATIVE,'**':Order.EXPONENTIATION};
  const op = block.getFieldValue('OP');
  const order = ops[op] || Order.ADDITIVE;
  return [`${gen.valueToCode(block,'A',order)||'0'} ${op} ${gen.valueToCode(block,'B',order)||'0'}`, order];
};

Blockly.Blocks['python_logic'] = {
  init: function () {
    this.appendValueInput('A');
    this.appendDummyInput().appendField(new Blockly.FieldDropdown([['and','and'],['or','or']]), 'OP');
    this.appendValueInput('B');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
  }
};
pythonGenerator.forBlock['python_logic'] = function (block, gen) {
  const op = block.getFieldValue('OP');
  const order = op === 'and' ? Order.LOGICAL_AND : Order.LOGICAL_OR;
  return [`${gen.valueToCode(block,'A',order)||'False'} ${op} ${gen.valueToCode(block,'B',order)||'False'}`, order];
};

Blockly.Blocks['python_not'] = {
  init: function () {
    this.appendValueInput('VALUE').appendField('not');
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
  }
};
pythonGenerator.forBlock['python_not'] = function (block, gen) {
  return [`not ${gen.valueToCode(block,'VALUE',Order.LOGICAL_NOT)||'False'}`, Order.LOGICAL_NOT];
};

// ─── Control Flow ───────────────────────────────────────────────────────────
Blockly.Blocks['python_if'] = {
  init: function () {
    this.appendValueInput('IF0').appendField('if');
    this.appendStatementInput('DO0').appendField('do');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('logic_blocks');
  }
};
pythonGenerator.forBlock['python_if'] = function (block, gen) {
  return `if ${gen.valueToCode(block,'IF0',Order.NONE)||'False'}:\n${gen.statementToCode(block,'DO0')||INDENT+'pass\n'}`;
};

Blockly.Blocks['python_if_else'] = {
  init: function () {
    this.appendValueInput('IF0').appendField('if');
    this.appendStatementInput('DO0').appendField('then');
    this.appendStatementInput('ELSE').appendField('else');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('logic_blocks');
  }
};
pythonGenerator.forBlock['python_if_else'] = function (block, gen) {
  return `if ${gen.valueToCode(block,'IF0',Order.NONE)||'False'}:\n${gen.statementToCode(block,'DO0')||INDENT+'pass\n'}else:\n${gen.statementToCode(block,'ELSE')||INDENT+'pass\n'}`;
};

Blockly.Blocks['python_for'] = {
  init: function () {
    this.appendDummyInput().appendField('for').appendField(new Blockly.FieldTextInput('i'),'VAR').appendField('in');
    this.appendValueInput('ITERABLE');
    this.appendStatementInput('DO').appendField('do');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('loop_blocks');
  }
};
pythonGenerator.forBlock['python_for'] = function (block, gen) {
  return `for ${block.getFieldValue('VAR')} in ${gen.valueToCode(block,'ITERABLE',Order.NONE)||'[]'}:\n${gen.statementToCode(block,'DO')||INDENT+'pass\n'}`;
};

Blockly.Blocks['python_while'] = {
  init: function () {
    this.appendValueInput('CONDITION').appendField('while');
    this.appendStatementInput('DO').appendField('do');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('loop_blocks');
  }
};
pythonGenerator.forBlock['python_while'] = function (block, gen) {
  return `while ${gen.valueToCode(block,'CONDITION',Order.NONE)||'False'}:\n${gen.statementToCode(block,'DO')||INDENT+'pass\n'}`;
};

Blockly.Blocks['python_range'] = {
  init: function () {
    this.appendValueInput('STOP').appendField('range(');
    this.appendDummyInput().appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setStyle('loop_blocks');
  }
};
pythonGenerator.forBlock['python_range'] = function (block, gen) {
  return [`range(${gen.valueToCode(block,'STOP',Order.NONE)||'10'})`, Order.FUNCTION_CALL];
};

Blockly.Blocks['python_list_comp'] = {
  init: function () {
    this.appendDummyInput().appendField('[').appendField(new Blockly.FieldTextInput('x * 2'),'EXPR').appendField('for').appendField(new Blockly.FieldTextInput('x'),'VAR').appendField('in');
    this.appendValueInput('ITERABLE');
    this.appendDummyInput().appendField(']');
    this.setInputsInline(true);
    this.setOutput(true, 'Array');
    this.setStyle('list_blocks');
  }
};
pythonGenerator.forBlock['python_list_comp'] = function (block, gen) {
  return [`[${block.getFieldValue('EXPR')} for ${block.getFieldValue('VAR')} in ${gen.valueToCode(block,'ITERABLE',Order.NONE)||'[]'}]`, Order.ATOMIC];
};

['pass','break','continue'].forEach(kw => {
  Blockly.Blocks[`python_${kw}`] = {
    init: function() {
      this.appendDummyInput().appendField(kw);
      this.setPreviousStatement(true,null);
      if(kw==='pass') this.setNextStatement(true,null);
      this.setStyle(kw==='pass'?'logic_blocks':'loop_blocks');
    }
  };
  pythonGenerator.forBlock[`python_${kw}`] = function() { return `${kw}\n`; };
});

// ─── Functions & Classes ────────────────────────────────────────────────────
Blockly.Blocks['python_def'] = {
  init: function () {
    this.appendDummyInput().appendField('def').appendField(new Blockly.FieldTextInput('my_function'),'NAME').appendField('(').appendField(new Blockly.FieldTextInput(''),'PARAMS').appendField(')');
    this.appendStatementInput('BODY');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setStyle('procedure_blocks');
  }
};
pythonGenerator.forBlock['python_def'] = function (block, gen) {
  return `def ${block.getFieldValue('NAME')}(${block.getFieldValue('PARAMS')}):\n${gen.statementToCode(block,'BODY')||INDENT+'pass\n'}\n`;
};

Blockly.Blocks['python_return'] = {
  init: function() {
    this.appendValueInput('VALUE').appendField('return');
    this.setPreviousStatement(true,null);
    this.setStyle('procedure_blocks');
  }
};
pythonGenerator.forBlock['python_return'] = function(block,gen) {
  const v = gen.valueToCode(block,'VALUE',Order.NONE);
  return v ? `return ${v}\n` : 'return\n';
};

Blockly.Blocks['python_call'] = {
  init: function() {
    this.appendDummyInput().appendField(new Blockly.FieldTextInput('my_function'),'NAME').appendField('(').appendField(new Blockly.FieldTextInput(''),'ARGS').appendField(')');
    this.setOutput(true,null);
    this.setStyle('procedure_blocks');
  }
};
pythonGenerator.forBlock['python_call'] = function(block) {
  return [`${block.getFieldValue('NAME')}(${block.getFieldValue('ARGS')})`, Order.FUNCTION_CALL];
};

Blockly.Blocks['python_call_statement'] = {
  init: function() {
    this.appendDummyInput().appendField(new Blockly.FieldTextInput('my_function'),'NAME').appendField('(').appendField(new Blockly.FieldTextInput(''),'ARGS').appendField(')');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setStyle('procedure_blocks');
  }
};
pythonGenerator.forBlock['python_call_statement'] = function(block) {
  return `${block.getFieldValue('NAME')}(${block.getFieldValue('ARGS')})\n`;
};

Blockly.Blocks['python_lambda'] = {
  init: function() {
    this.appendDummyInput().appendField('lambda').appendField(new Blockly.FieldTextInput('x'),'PARAMS').appendField(':').appendField(new Blockly.FieldTextInput('x * 2'),'EXPR');
    this.setOutput(true,null);
    this.setStyle('procedure_blocks');
  }
};
pythonGenerator.forBlock['python_lambda'] = function(block) {
  return [`lambda ${block.getFieldValue('PARAMS')}: ${block.getFieldValue('EXPR')}`, Order.LAMBDA];
};

Blockly.Blocks['python_decorator'] = {
  init: function() {
    this.appendDummyInput().appendField('@').appendField(new Blockly.FieldTextInput('staticmethod'),'DECORATOR');
    this.appendStatementInput('TARGET');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setStyle('class_blocks');
  }
};
pythonGenerator.forBlock['python_decorator'] = function(block,gen) {
  return `@${block.getFieldValue('DECORATOR')}\n${gen.statementToCode(block,'TARGET')||''}`;
};

Blockly.Blocks['python_class'] = {
  init: function() {
    this.appendDummyInput().appendField('class').appendField(new Blockly.FieldTextInput('MyClass'),'NAME').appendField('(').appendField(new Blockly.FieldTextInput(''),'BASES').appendField(')');
    this.appendStatementInput('BODY');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setStyle('class_blocks');
  }
};
pythonGenerator.forBlock['python_class'] = function(block,gen) {
  const bases = block.getFieldValue('BASES');
  return `class ${block.getFieldValue('NAME')}${bases?`(${bases})`:''  }:\n${gen.statementToCode(block,'BODY')||INDENT+'pass\n'}\n`;
};

// ─── Imports ────────────────────────────────────────────────────────────────
Blockly.Blocks['python_import'] = {
  init: function() {
    this.appendDummyInput().appendField('import').appendField(new Blockly.FieldTextInput('os'),'MODULE');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setStyle('import_blocks');
  }
};
pythonGenerator.forBlock['python_import'] = function(block) {
  return `import ${block.getFieldValue('MODULE')}\n`;
};

Blockly.Blocks['python_from_import'] = {
  init: function() {
    this.appendDummyInput().appendField('from').appendField(new Blockly.FieldTextInput('os'),'MODULE').appendField('import').appendField(new Blockly.FieldTextInput('path'),'NAMES');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setStyle('import_blocks');
  }
};
pythonGenerator.forBlock['python_from_import'] = function(block) {
  return `from ${block.getFieldValue('MODULE')} import ${block.getFieldValue('NAMES')}\n`;
};

// ─── Error Handling ─────────────────────────────────────────────────────────
Blockly.Blocks['python_try'] = {
  init: function() {
    this.appendStatementInput('TRY').appendField('try');
    this.appendDummyInput().appendField('except').appendField(new Blockly.FieldTextInput('Exception'),'EXCEPTION').appendField('as').appendField(new Blockly.FieldTextInput('e'),'AS');
    this.appendStatementInput('EXCEPT');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setStyle('error_blocks');
  }
};
pythonGenerator.forBlock['python_try'] = function(block,gen) {
  return `try:\n${gen.statementToCode(block,'TRY')||INDENT+'pass\n'}except ${block.getFieldValue('EXCEPTION')} as ${block.getFieldValue('AS')}:\n${gen.statementToCode(block,'EXCEPT')||INDENT+'pass\n'}`;
};

Blockly.Blocks['python_raise'] = {
  init: function() {
    this.appendDummyInput().appendField('raise').appendField(new Blockly.FieldTextInput('Exception("error")'),'EXCEPTION');
    this.setPreviousStatement(true,null);
    this.setStyle('error_blocks');
  }
};
pythonGenerator.forBlock['python_raise'] = function(block) {
  return `raise ${block.getFieldValue('EXCEPTION')}\n`;
};

// ─── Context Manager ────────────────────────────────────────────────────────
Blockly.Blocks['python_with'] = {
  init: function() {
    this.appendDummyInput().appendField('with').appendField(new Blockly.FieldTextInput('open("file.txt")'),'EXPR').appendField('as').appendField(new Blockly.FieldTextInput('f'),'AS');
    this.appendStatementInput('BODY');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setStyle('io_blocks');
  }
};
pythonGenerator.forBlock['python_with'] = function(block,gen) {
  return `with ${block.getFieldValue('EXPR')} as ${block.getFieldValue('AS')}:\n${gen.statementToCode(block,'BODY')||INDENT+'pass\n'}`;
};

// ─── Async ──────────────────────────────────────────────────────────────────
Blockly.Blocks['python_async_def'] = {
  init: function() {
    this.appendDummyInput().appendField('async def').appendField(new Blockly.FieldTextInput('my_coroutine'),'NAME').appendField('(').appendField(new Blockly.FieldTextInput(''),'PARAMS').appendField(')');
    this.appendStatementInput('BODY');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setStyle('async_blocks');
  }
};
pythonGenerator.forBlock['python_async_def'] = function(block,gen) {
  return `async def ${block.getFieldValue('NAME')}(${block.getFieldValue('PARAMS')}):\n${gen.statementToCode(block,'BODY')||INDENT+'pass\n'}\n`;
};

Blockly.Blocks['python_await'] = {
  init: function() {
    this.appendValueInput('VALUE').appendField('await');
    this.setOutput(true,null);
    this.setStyle('async_blocks');
  }
};
pythonGenerator.forBlock['python_await'] = function(block,gen) {
  return [`await ${gen.valueToCode(block,'VALUE',Order.AWAIT)||'None'}`, Order.AWAIT];
};

// ─── Index / Method ─────────────────────────────────────────────────────────
Blockly.Blocks['python_index'] = {
  init: function() {
    this.appendValueInput('COLLECTION');
    this.appendDummyInput().appendField('[');
    this.appendValueInput('INDEX');
    this.appendDummyInput().appendField(']');
    this.setInputsInline(true);
    this.setOutput(true,null);
    this.setStyle('list_blocks');
  }
};
pythonGenerator.forBlock['python_index'] = function(block,gen) {
  return [`${gen.valueToCode(block,'COLLECTION',Order.MEMBER)||'[]'}[${gen.valueToCode(block,'INDEX',Order.NONE)||'0'}]`, Order.MEMBER];
};

Blockly.Blocks['python_str_method'] = {
  init: function() {
    this.appendValueInput('STRING');
    this.appendDummyInput().appendField('.').appendField(new Blockly.FieldDropdown([
      ['upper()','upper()'],['lower()','lower()'],['strip()','strip()'],
      ['split()','split()'],['replace()','replace()'],['join()','join()'],
      ['startswith()','startswith()'],['endswith()','endswith()'],
      ['find()','find()'],['count()','count()'],['format()','format()'],
      ['encode()','encode()'],['decode()','decode()'],['title()','title()'],
      ['capitalize()','capitalize()'],['swapcase()','swapcase()'],
      ['center()','center()'],['ljust()','ljust()'],['rjust()','rjust()'],
      ['zfill()','zfill()'],['isdigit()','isdigit()'],['isalpha()','isalpha()'],
      ['isalnum()','isalnum()'],['isspace()','isspace()'],
    ]), 'METHOD');
    this.setInputsInline(true);
    this.setOutput(true,null);
    this.setStyle('text_blocks');
  }
};
pythonGenerator.forBlock['python_str_method'] = function(block,gen) {
  return [`${gen.valueToCode(block,'STRING',Order.MEMBER)||"''"}.${block.getFieldValue('METHOD')}`, Order.FUNCTION_CALL];
};

// ─── Comment ────────────────────────────────────────────────────────────────
Blockly.Blocks['python_comment'] = {
  init: function() {
    this.appendDummyInput().appendField('#').appendField(new Blockly.FieldTextInput('comment'),'TEXT');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setColour('#52525b');
  }
};
pythonGenerator.forBlock['python_comment'] = function(block) {
  return `# ${block.getFieldValue('TEXT')}\n`;
};

// ─── Raw code (single line) ─────────────────────────────────────────────────
Blockly.Blocks['python_raw'] = {
  init: function() {
    this.appendDummyInput().appendField('code:').appendField(new Blockly.FieldTextInput('pass'),'CODE');
    this.setPreviousStatement(true,null);
    this.setNextStatement(true,null);
    this.setColour('#3f3f46');
  }
};
pythonGenerator.forBlock['python_raw'] = function(block) {
  return block.getFieldValue('CODE') + '\n';
};

// ─── Multiline Code Block (proper textarea via click-to-edit modal) ─────────
// Uses a FieldTextInput that stores \n-separated lines and displays first line
Blockly.Blocks['python_multiline_code'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('code block')
      .appendField(new Blockly.FieldTextInput('# Click to edit\npass'), 'CODE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#3f3f46');
    this.setTooltip('Write multiline Python code. Use \\n in the text field for new lines.');
  }
};
pythonGenerator.forBlock['python_multiline_code'] = function(block) {
  const code = block.getFieldValue('CODE') || 'pass';
  return code + '\n';
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALL PYTHON BUILT-IN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Type conversion
const bt_int   = defBuiltin('int', ['value'], true, 'builtin_blocks', 'Convert to integer');
const bt_float = defBuiltin('float', ['value'], true, 'builtin_blocks', 'Convert to float');
const bt_str   = defBuiltin('str', ['value'], true, 'builtin_blocks', 'Convert to string');
const bt_bool  = defBuiltin('bool', ['value'], true, 'builtin_blocks', 'Convert to boolean');
const bt_list  = defBuiltin('list', ['iterable'], true, 'builtin_blocks', 'Convert to list');
const bt_tuple = defBuiltin('tuple', ['iterable'], true, 'builtin_blocks', 'Convert to tuple');
const bt_set   = defBuiltin('set', ['iterable'], true, 'builtin_blocks', 'Convert to set');
const bt_dict  = defBuiltin('dict', ['**kwargs'], true, 'builtin_blocks', 'Create dict');
const bt_frozenset = defBuiltin('frozenset', ['iterable'], true, 'builtin_blocks', 'Immutable set');
const bt_bytes = defBuiltin('bytes', ['source'], true, 'builtin_blocks', 'Create bytes');
const bt_bytearray = defBuiltin('bytearray', ['source'], true, 'builtin_blocks', 'Mutable bytes');
const bt_complex = defBuiltin('complex', ['real, imag'], true, 'builtin_blocks', 'Complex number');

// Math builtins
const bt_abs    = defBuiltin('abs', ['x'], true, 'builtin_blocks', 'Absolute value');
const bt_round  = defBuiltin('round', ['number, ndigits'], true, 'builtin_blocks', 'Round number');
const bt_min    = defBuiltin('min', ['*args'], true, 'builtin_blocks', 'Minimum value');
const bt_max    = defBuiltin('max', ['*args'], true, 'builtin_blocks', 'Maximum value');
const bt_sum    = defBuiltin('sum', ['iterable'], true, 'builtin_blocks', 'Sum of iterable');
const bt_pow    = defBuiltin('pow', ['base, exp'], true, 'builtin_blocks', 'Power');
const bt_divmod = defBuiltin('divmod', ['a, b'], true, 'builtin_blocks', 'Quotient and remainder');

// Sequence operations
const bt_len      = defBuiltin('len', ['obj'], true, 'builtin_blocks', 'Length of object');
const bt_sorted   = defBuiltin('sorted', ['iterable'], true, 'builtin_blocks', 'Return sorted list');
const bt_reversed = defBuiltin('reversed', ['seq'], true, 'builtin_blocks', 'Return reversed iterator');
const bt_enumerate= defBuiltin('enumerate', ['iterable'], true, 'builtin_blocks', 'Enumerate with index');
const bt_zip      = defBuiltin('zip', ['*iterables'], true, 'builtin_blocks', 'Zip iterables');
const bt_map      = defBuiltin('map', ['func, iterable'], true, 'builtin_blocks', 'Map function over iterable');
const bt_filter   = defBuiltin('filter', ['func, iterable'], true, 'builtin_blocks', 'Filter iterable');
const bt_all      = defBuiltin('all', ['iterable'], true, 'builtin_blocks', 'All truthy?');
const bt_any      = defBuiltin('any', ['iterable'], true, 'builtin_blocks', 'Any truthy?');
const bt_next     = defBuiltin('next', ['iterator'], true, 'builtin_blocks', 'Next item from iterator');
const bt_iter     = defBuiltin('iter', ['object'], true, 'builtin_blocks', 'Create iterator');
const bt_slice    = defBuiltin('slice', ['start, stop, step'], true, 'builtin_blocks', 'Create slice');

// String/repr
const bt_repr    = defBuiltin('repr', ['obj'], true, 'builtin_blocks', 'String representation');
const bt_format  = defBuiltin('format', ['value, spec'], true, 'builtin_blocks', 'Format value');
const bt_chr     = defBuiltin('chr', ['i'], true, 'builtin_blocks', 'Character from Unicode code');
const bt_ord     = defBuiltin('ord', ['c'], true, 'builtin_blocks', 'Unicode code from char');
const bt_ascii   = defBuiltin('ascii', ['obj'], true, 'builtin_blocks', 'ASCII representation');
const bt_hex     = defBuiltin('hex', ['x'], true, 'builtin_blocks', 'Hex string');
const bt_oct     = defBuiltin('oct', ['x'], true, 'builtin_blocks', 'Octal string');
const bt_bin     = defBuiltin('bin', ['x'], true, 'builtin_blocks', 'Binary string');

// Introspection
const bt_type       = defBuiltin('type', ['obj'], true, 'builtin_blocks', 'Type of object');
const bt_isinstance = defBuiltin('isinstance', ['obj, cls'], true, 'builtin_blocks', 'Instance check');
const bt_issubclass = defBuiltin('issubclass', ['cls, parent'], true, 'builtin_blocks', 'Subclass check');
const bt_hasattr    = defBuiltin('hasattr', ['obj, name'], true, 'builtin_blocks', 'Has attribute?');
const bt_getattr    = defBuiltin('getattr', ['obj, name'], true, 'builtin_blocks', 'Get attribute');
const bt_setattr    = defBuiltin('setattr', ['obj, name, value'], false, 'builtin_blocks', 'Set attribute');
const bt_delattr    = defBuiltin('delattr', ['obj, name'], false, 'builtin_blocks', 'Delete attribute');
const bt_dir        = defBuiltin('dir', ['obj'], true, 'builtin_blocks', 'List attributes');
const bt_vars       = defBuiltin('vars', ['obj'], true, 'builtin_blocks', 'Object __dict__');
const bt_id         = defBuiltin('id', ['obj'], true, 'builtin_blocks', 'Object identity');
const bt_hash       = defBuiltin('hash', ['obj'], true, 'builtin_blocks', 'Hash value');
const bt_callable   = defBuiltin('callable', ['obj'], true, 'builtin_blocks', 'Is callable?');

// I/O
const bt_open  = defBuiltin('open', ['file, mode'], true, 'builtin_blocks', 'Open file');
const bt_exec  = defBuiltin('exec', ['code'], false, 'builtin_blocks', 'Execute code string');
const bt_eval  = defBuiltin('eval', ['expression'], true, 'builtin_blocks', 'Evaluate expression');
const bt_compile = defBuiltin('compile', ['source, filename, mode'], true, 'builtin_blocks', 'Compile source');

// Other
const bt_range2    = defBuiltin('range', ['start, stop, step'], true, 'builtin_blocks', 'Range with start/stop/step');
const bt_super     = defBuiltin('super', [], true, 'builtin_blocks', 'Call parent class');
const bt_property  = defBuiltin('property', ['fget'], true, 'builtin_blocks', 'Property descriptor');
const bt_staticmethod = defBuiltin('staticmethod', ['func'], true, 'builtin_blocks', 'Static method');
const bt_classmethod  = defBuiltin('classmethod', ['func'], true, 'builtin_blocks', 'Class method');
const bt_globals   = defBuiltin('globals', [], true, 'builtin_blocks', 'Global symbol table');
const bt_locals    = defBuiltin('locals', [], true, 'builtin_blocks', 'Local symbol table');
const bt_memoryview = defBuiltin('memoryview', ['obj'], true, 'builtin_blocks', 'Memory view');
const bt_object    = defBuiltin('object', [], true, 'builtin_blocks', 'Base object');

// ═══════════════════════════════════════════════════════════════════════════════
// EXPANDED BLOCKS - TEXT MANIPULATION (30+ blocks)
// ═══════════════════════════════════════════════════════════════════════════════

// Advanced String Methods (with input values)
['split', 'join', 'replace', 'find', 'rfind', 'index', 'rindex', 'count'].forEach(method => {
  const blockType = `python_str_${method}`;
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendValueInput('STRING').appendField('string');
      this.appendDummyInput().appendField(`.${method}(`);
      this.appendValueInput('ARG').setCheck(null);
      this.appendDummyInput().appendField(')');
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setStyle('text_blocks');
      this.setTooltip(`String ${method} method`);
    }
  };
  pythonGenerator.forBlock[blockType] = function(block, gen) {
    const str = gen.valueToCode(block, 'STRING', Order.MEMBER) || "''";
    const arg = gen.valueToCode(block, 'ARG', Order.NONE) || "''";
    return [`${str}.${method}(${arg})`, Order.FUNCTION_CALL];
  };
});

// String slice
Blockly.Blocks['python_str_slice'] = {
  init: function() {
    this.appendValueInput('STRING').appendField('substring of');
    this.appendDummyInput().appendField('[');
    this.appendValueInput('START').setCheck('Number');
    this.appendDummyInput().appendField(':');
    this.appendValueInput('END').setCheck('Number');
    this.appendDummyInput().appendField(']');
    this.setInputsInline(true);
    this.setOutput(true, 'String');
    this.setStyle('text_blocks');
    this.setTooltip('Get substring using slice notation');
  }
};
pythonGenerator.forBlock['python_str_slice'] = function(block, gen) {
  const str = gen.valueToCode(block, 'STRING', Order.MEMBER) || "''";
  const start = gen.valueToCode(block, 'START', Order.NONE) || '0';
  const end = gen.valueToCode(block, 'END', Order.NONE) || '';
  return [`${str}[${start}:${end}]`, Order.MEMBER];
};

// String formatting
Blockly.Blocks['python_str_format_method'] = {
  init: function() {
    this.appendValueInput('STRING').appendField('format');
    this.appendDummyInput().appendField('.format(');
    this.appendValueInput('ARGS');
    this.appendDummyInput().appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, 'String');
    this.setStyle('text_blocks');
  }
};
pythonGenerator.forBlock['python_str_format_method'] = function(block, gen) {
  const str = gen.valueToCode(block, 'STRING', Order.MEMBER) || "''";
  const args = gen.valueToCode(block, 'ARGS', Order.NONE) || '';
  return [`${str}.format(${args})`, Order.FUNCTION_CALL];
};

// String tests (isdigit, isalpha, etc.)
['isdigit', 'isalpha', 'isalnum', 'isspace', 'islower', 'isupper', 'istitle'].forEach(method => {
  const blockType = `python_str_${method}`;
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendValueInput('STRING');
      this.appendDummyInput().appendField(`.${method}()`);
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setStyle('text_blocks');
      this.setTooltip(`Check if string ${method}`);
    }
  };
  pythonGenerator.forBlock[blockType] = function(block, gen) {
    const str = gen.valueToCode(block, 'STRING', Order.MEMBER) || "''";
    return [`${str}.${method}()`, Order.FUNCTION_CALL];
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// MATH MODULE BLOCKS (40+ blocks)
// ═══════════════════════════════════════════════════════════════════════════════

const mathFuncs = [
  ['sqrt', 'Square root'], ['sin', 'Sine'], ['cos', 'Cosine'], ['tan', 'Tangent'],
  ['asin', 'Arc sine'], ['acos', 'Arc cosine'], ['atan', 'Arc tangent'],
  ['sinh', 'Hyperbolic sine'], ['cosh', 'Hyperbolic cosine'], ['tanh', 'Hyperbolic tangent'],
  ['exp', 'Exponential'], ['log', 'Natural log'], ['log10', 'Log base 10'], ['log2', 'Log base 2'],
  ['ceil', 'Ceiling'], ['floor', 'Floor'], ['trunc', 'Truncate'], ['fabs', 'Absolute value (float)'],
  ['factorial', 'Factorial'], ['gcd', 'Greatest common divisor'], ['degrees', 'Radians to degrees'],
  ['radians', 'Degrees to radians'], ['isnan', 'Is NaN'], ['isinf', 'Is infinite'],
  ['copysign', 'Copy sign'], ['fmod', 'Modulo'], ['remainder', 'Remainder'], ['modf', 'Fractional and integer parts']
];

mathFuncs.forEach(([name, desc]) => {
  const blockType = `python_math_${name}`;
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField('math.').appendField(name).appendField('(');
      this.appendValueInput('ARG');
      this.appendDummyInput().appendField(')');
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setStyle('math_blocks');
      this.setTooltip(desc);
    }
  };
  pythonGenerator.forBlock[blockType] = function(block, gen) {
    const arg = gen.valueToCode(block, 'ARG', Order.NONE) || '0';
    return [`math.${name}(${arg})`, Order.FUNCTION_CALL];
  };
});

// Math constants
['pi', 'e', 'tau', 'inf', 'nan'].forEach(const_name => {
  const blockType = `python_math_${const_name}`;
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField(`math.${const_name}`);
      this.setOutput(true, 'Number');
      this.setStyle('math_blocks');
      this.setTooltip(`Math constant: ${const_name}`);
    }
  };
  pythonGenerator.forBlock[blockType] = function() {
    return [`math.${const_name}`, Order.ATOMIC];
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// RANDOM MODULE BLOCKS (10+ blocks)
// ═══════════════════════════════════════════════════════════════════════════════

Blockly.Blocks['python_random_randint'] = {
  init: function() {
    this.appendDummyInput().appendField('random.randint(');
    this.appendValueInput('MIN').setCheck('Number');
    this.appendDummyInput().appendField(',');
    this.appendValueInput('MAX').setCheck('Number');
    this.appendDummyInput().appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setStyle('math_blocks');
    this.setTooltip('Random integer between min and max (inclusive)');
  }
};
pythonGenerator.forBlock['python_random_randint'] = function(block, gen) {
  const min = gen.valueToCode(block, 'MIN', Order.NONE) || '0';
  const max = gen.valueToCode(block, 'MAX', Order.NONE) || '10';
  return [`random.randint(${min}, ${max})`, Order.FUNCTION_CALL];
};

Blockly.Blocks['python_random_choice'] = {
  init: function() {
    this.appendDummyInput().appendField('random.choice(');
    this.appendValueInput('LIST');
    this.appendDummyInput().appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setStyle('math_blocks');
    this.setTooltip('Random item from list');
  }
};
pythonGenerator.forBlock['python_random_choice'] = function(block, gen) {
  const list = gen.valueToCode(block, 'LIST', Order.NONE) || '[]';
  return [`random.choice(${list})`, Order.FUNCTION_CALL];
};

['random', 'uniform', 'shuffle', 'sample', 'seed'].forEach(method => {
  const blockType = `python_random_${method}`;
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField(`random.${method}(`);
      this.appendValueInput('ARG');
      this.appendDummyInput().appendField(')');
      this.setInputsInline(true);
      if (method === 'shuffle' || method === 'seed') {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      } else {
        this.setOutput(true, null);
      }
      this.setStyle('math_blocks');
    }
  };
  pythonGenerator.forBlock[blockType] = function(block, gen) {
    const arg = gen.valueToCode(block, 'ARG', Order.NONE) || '';
    const code = `random.${method}(${arg})`;
    return method === 'shuffle' || method === 'seed' ? code + '\n' : [code, Order.FUNCTION_CALL];
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// FILE I/O BLOCKS (15+ blocks)
// ═══════════════════════════════════════════════════════════════════════════════

Blockly.Blocks['python_file_open'] = {
  init: function() {
    this.appendDummyInput().appendField('open(');
    this.appendValueInput('FILE').setCheck('String').appendField('file:');
    this.appendDummyInput().appendField(', mode:').appendField(new Blockly.FieldDropdown([
      ['read ("r")', '"r"'], ['write ("w")', '"w"'], ['append ("a")', '"a"'],
      ['read binary ("rb")', '"rb"'], ['write binary ("wb")', '"wb"'],
      ['read/write ("r+")', '"r+"'], ['write/read ("w+")', '"w+"']
    ]), 'MODE').appendField(')');
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setStyle('io_blocks');
    this.setTooltip('Open file for reading/writing');
  }
};
pythonGenerator.forBlock['python_file_open'] = function(block, gen) {
  const file = gen.valueToCode(block, 'FILE', Order.NONE) || '"file.txt"';
  const mode = block.getFieldValue('MODE');
  return [`open(${file}, ${mode})`, Order.FUNCTION_CALL];
};

['read', 'readline', 'readlines', 'write', 'writelines', 'close'].forEach(method => {
  const blockType = `python_file_${method}`;
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendValueInput('FILE').appendField('file');
      this.appendDummyInput().appendField(`.${method}(`);
      if (method === 'write' || method === 'writelines') {
        this.appendValueInput('DATA');
      }
      this.appendDummyInput().appendField(')');
      this.setInputsInline(true);
      if (method === 'close' || method === 'write' || method === 'writelines') {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      } else {
        this.setOutput(true, null);
      }
      this.setStyle('io_blocks');
    }
  };
  pythonGenerator.forBlock[blockType] = function(block, gen) {
    const file = gen.valueToCode(block, 'FILE', Order.MEMBER) || 'file';
    const data = gen.valueToCode(block, 'DATA', Order.NONE) || "''";
    const args = (method === 'write' || method === 'writelines') ? data : '';
    const code = `${file}.${method}(${args})`;
    return (method === 'close' || method === 'write' || method === 'writelines') ? code + '\n' : [code, Order.FUNCTION_CALL];
  };
});

// Path operations
['exists', 'isfile', 'isdir', 'listdir', 'mkdir', 'remove', 'rename'].forEach(method => {
  const blockType = `python_os_path_${method}`;
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField(`os.path.${method}(` );
      this.appendValueInput('PATH').setCheck('String');
      if (method === 'rename') {
        this.appendDummyInput().appendField(',');
        this.appendValueInput('NEW');
      }
      this.appendDummyInput().appendField(')');
      this.setInputsInline(true);
      if (method === 'mkdir' || method === 'remove' || method === 'rename') {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      } else {
        this.setOutput(true, null);
      }
      this.setStyle('io_blocks');
    }
  };
  pythonGenerator.forBlock[blockType] = function(block, gen) {
    const path = gen.valueToCode(block, 'PATH', Order.NONE) || '""';
    const newPath = gen.valueToCode(block, 'NEW', Order.NONE) || '""';
    const args = method === 'rename' ? `${path}, ${newPath}` : path;
    const code = `os.path.${method}(${args})`;
    return (method === 'mkdir' || method === 'remove' || method === 'rename') ? code + '\n' : [code, Order.FUNCTION_CALL];
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// DATETIME BLOCKS (12+ blocks)
// ═══════════════════════════════════════════════════════════════════════════════

Blockly.Blocks['python_datetime_now'] = {
  init: function() {
    this.appendDummyInput().appendField('datetime.now()');
    this.setOutput(true, null);
    this.setStyle('builtin_blocks');
    this.setTooltip('Current date and time');
  }
};
pythonGenerator.forBlock['python_datetime_now'] = function() {
  return ['datetime.now()', Order.FUNCTION_CALL];
};

['date', 'time', 'today'].forEach(method => {
  const blockType = `python_datetime_${method}`;
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField(`datetime.${method}()`);
      this.setOutput(true, null);
      this.setStyle('builtin_blocks');
    }
  };
  pythonGenerator.forBlock[blockType] = function() {
    return [`datetime.${method}()`, Order.FUNCTION_CALL];
  };
});

Blockly.Blocks['python_datetime_strftime'] = {
  init: function() {
    this.appendValueInput('DATETIME');
    this.appendDummyInput().appendField('.strftime(');
    this.appendValueInput('FORMAT').setCheck('String');
    this.appendDummyInput().appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, 'String');
    this.setStyle('builtin_blocks');
    this.setTooltip('Format datetime as string');
  }
};
pythonGenerator.forBlock['python_datetime_strftime'] = function(block, gen) {
  const dt = gen.valueToCode(block, 'DATETIME', Order.MEMBER) || 'datetime.now()';
  const fmt = gen.valueToCode(block, 'FORMAT', Order.NONE) || '"%Y-%m-%d"';
  return [`${dt}.strftime(${fmt})`, Order.FUNCTION_CALL];
};

Blockly.Blocks['python_timedelta'] = {
  init: function() {
    this.appendDummyInput().appendField('timedelta(');
    this.appendDummyInput().appendField('days:').appendField(new Blockly.FieldNumber(0), 'DAYS');
    this.appendDummyInput().appendField('hours:').appendField(new Blockly.FieldNumber(0), 'HOURS');
    this.appendDummyInput().appendField('minutes:').appendField(new Blockly.FieldNumber(0), 'MINUTES');
    this.appendDummyInput().appendField(')');
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setStyle('builtin_blocks');
    this.setTooltip('Time duration');
  }
};
pythonGenerator.forBlock['python_timedelta'] = function(block) {
  const days = block.getFieldValue('DAYS');
  const hours = block.getFieldValue('HOURS');
  const minutes = block.getFieldValue('MINUTES');
  return [`timedelta(days=${days}, hours=${hours}, minutes=${minutes})`, Order.FUNCTION_CALL];
};

// ═══════════════════════════════════════════════════════════════════════════════
// LIST/DICT ADVANCED OPERATIONS (20+ blocks)
// ═══════════════════════════════════════════════════════════════════════════════

['append', 'extend', 'insert', 'remove', 'pop', 'clear', 'sort', 'reverse', 'copy', 'index', 'count'].forEach(method => {
  const blockType = `python_list_${method}`;
  const hasArg = ['append', 'extend', 'insert', 'remove', 'index'].includes(method);
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendValueInput('LIST').appendField('list');
      this.appendDummyInput().appendField(`.${method}(`);
      if (hasArg) {
        this.appendValueInput('ARG');
      }
      if (method === 'insert') {
        this.appendDummyInput().appendField(',');
        this.appendValueInput('VALUE');
      }
      this.appendDummyInput().appendField(')');
      this.setInputsInline(true);
      if (['append', 'extend', 'insert', 'remove', 'clear', 'sort', 'reverse'].includes(method)) {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      } else {
        this.setOutput(true, null);
      }
      this.setStyle('list_blocks');
    }
  };
  pythonGenerator.forBlock[blockType] = function(block, gen) {
    const list = gen.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
    let args = '';
    if (hasArg) {
      const arg = gen.valueToCode(block, 'ARG', Order.NONE) || '0';
      args = arg;
      if (method === 'insert') {
        const val = gen.valueToCode(block, 'VALUE', Order.NONE) || 'None';
        args = `${arg}, ${val}`;
      }
    }
    const code = `${list}.${method}(${args})`;
    return ['append', 'extend', 'insert', 'remove', 'clear', 'sort', 'reverse'].includes(method) ? code + '\n' : [code, Order.FUNCTION_CALL];
  };
});

// Dict operations
['get', 'pop', 'popitem', 'keys', 'values', 'items', 'update', 'clear', 'setdefault'].forEach(method => {
  const blockType = `python_dict_${method}`;
  const hasArg = ['get', 'pop', 'setdefault'].includes(method);
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendValueInput('DICT').appendField('dict');
      this.appendDummyInput().appendField(`.${method}(`);
      if (hasArg) {
        this.appendValueInput('KEY');
        if (method === 'setdefault') {
          this.appendDummyInput().appendField(',');
          this.appendValueInput('DEFAULT');
        }
      }
      this.appendDummyInput().appendField(')');
      this.setInputsInline(true);
      if (['update', 'clear', 'popitem'].includes(method)) {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      } else {
        this.setOutput(true, null);
      }
      this.setStyle('dict_blocks');
    }
  };
  pythonGenerator.forBlock[blockType] = function(block, gen) {
    const dict = gen.valueToCode(block, 'DICT', Order.MEMBER) || '{}';
    let args = '';
    if (hasArg) {
      const key = gen.valueToCode(block, 'KEY', Order.NONE) || '""';
      args = key;
      if (method === 'setdefault') {
        const def = gen.valueToCode(block, 'DEFAULT', Order.NONE) || 'None';
        args = `${key}, ${def}`;
      }
    }
    const code = `${dict}.${method}(${args})`;
    return ['update', 'clear', 'popitem'].includes(method) ? code + '\n' : [code, Order.FUNCTION_CALL];
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED CONTROL FLOW (10+ blocks)
// ═══════════════════════════════════════════════════════════════════════════════

Blockly.Blocks['python_elif'] = {
  init: function() {
    this.appendValueInput('CONDITION').appendField('elif');
    this.appendStatementInput('DO').appendField('do');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('logic_blocks');
    this.setTooltip('Else-if condition');
  }
};
pythonGenerator.forBlock['python_elif'] = function(block, gen) {
  const cond = gen.valueToCode(block, 'CONDITION', Order.NONE) || 'False';
  return `elif ${cond}:\n${gen.statementToCode(block, 'DO') || INDENT + 'pass\n'}`;
};

Blockly.Blocks['python_assert'] = {
  init: function() {
    this.appendDummyInput().appendField('assert');
    this.appendValueInput('CONDITION');
    this.appendDummyInput().appendField(', message:');
    this.appendValueInput('MESSAGE').setCheck('String');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('error_blocks');
    this.setTooltip('Assert condition with optional message');
  }
};
pythonGenerator.forBlock['python_assert'] = function(block, gen) {
  const cond = gen.valueToCode(block, 'CONDITION', Order.NONE) || 'True';
  const msg = gen.valueToCode(block, 'MESSAGE', Order.NONE);
  return msg ? `assert ${cond}, ${msg}\n` : `assert ${cond}\n`;
};

Blockly.Blocks['python_try_finally'] = {
  init: function() {
    this.appendStatementInput('TRY').appendField('try');
    this.appendDummyInput().appendField('except').appendField(new Blockly.FieldTextInput('Exception'), 'EXCEPTION').appendField('as').appendField(new Blockly.FieldTextInput('e'), 'AS');
    this.appendStatementInput('EXCEPT');
    this.appendStatementInput('FINALLY').appendField('finally');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('error_blocks');
  }
};
pythonGenerator.forBlock['python_try_finally'] = function(block, gen) {
  return `try:\n${gen.statementToCode(block, 'TRY') || INDENT + 'pass\n'}except ${block.getFieldValue('EXCEPTION')} as ${block.getFieldValue('AS')}:\n${gen.statementToCode(block, 'EXCEPT') || INDENT + 'pass\n'}finally:\n${gen.statementToCode(block, 'FINALLY') || INDENT + 'pass\n'}`;
};

Blockly.Blocks['python_global'] = {
  init: function() {
    this.appendDummyInput().appendField('global').appendField(new Blockly.FieldTextInput('variable'), 'VAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
  }
};
pythonGenerator.forBlock['python_global'] = function(block) {
  return `global ${block.getFieldValue('VAR')}\n`;
};

Blockly.Blocks['python_nonlocal'] = {
  init: function() {
    this.appendDummyInput().appendField('nonlocal').appendField(new Blockly.FieldTextInput('variable'), 'VAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
  }
};
pythonGenerator.forBlock['python_nonlocal'] = function(block) {
  return `nonlocal ${block.getFieldValue('VAR')}\n`;
};

Blockly.Blocks['python_yield'] = {
  init: function() {
    this.appendValueInput('VALUE').appendField('yield');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('procedure_blocks');
  }
};
pythonGenerator.forBlock['python_yield'] = function(block, gen) {
  const val = gen.valueToCode(block, 'VALUE', Order.NONE);
  return val ? `yield ${val}\n` : 'yield\n';
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLBOX CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const toolboxConfig = {
  kind: 'categoryToolbox',
  contents: [
    { kind:'category', name:'Variables', categorystyle:'variable_category', contents:[
      { kind:'block', type:'python_assign' },
      { kind:'block', type:'python_variable_get' },
    ]},
    { kind:'category', name:'Values', categorystyle:'math_category', contents:[
      { kind:'block', type:'python_string' },
      { kind:'block', type:'python_number' },
      { kind:'block', type:'python_boolean' },
      { kind:'block', type:'python_none' },
      { kind:'block', type:'python_fstring' },
      { kind:'block', type:'python_list' },
      { kind:'block', type:'python_dict' },
      { kind:'block', type:'python_tuple' },
      { kind:'block', type:'python_set' },
    ]},
    { kind:'category', name:'Logic', categorystyle:'logic_category', contents:[
      { kind:'block', type:'python_if' },
      { kind:'block', type:'python_if_else' },
      { kind:'block', type:'python_elif' },
      { kind:'block', type:'python_compare' },
      { kind:'block', type:'python_logic' },
      { kind:'block', type:'python_not' },
    ]},
    { kind:'category', name:'Loops', categorystyle:'loop_category', contents:[
      { kind:'block', type:'python_for' },
      { kind:'block', type:'python_while' },
      { kind:'block', type:'python_range' },
      { kind:'block', type:'python_break' },
      { kind:'block', type:'python_continue' },
      { kind:'block', type:'python_list_comp' },
    ]},
    { kind:'category', name:'Functions', categorystyle:'procedure_category', contents:[
      { kind:'block', type:'python_def' },
      { kind:'block', type:'python_return' },
      { kind:'block', type:'python_yield' },
      { kind:'block', type:'python_call' },
      { kind:'block', type:'python_call_statement' },
      { kind:'block', type:'python_lambda' },
      { kind:'block', type:'python_decorator' },
      { kind:'block', type:'python_global' },
      { kind:'block', type:'python_nonlocal' },
    ]},
    { kind:'category', name:'Classes', categorystyle:'class_category', contents:[
      { kind:'block', type:'python_class' },
    ]},
    { kind:'category', name:'I/O', categorystyle:'io_category', contents:[
      { kind:'block', type:'python_print' },
      { kind:'block', type:'python_input' },
      { kind:'block', type:'python_with' },
      { kind:'block', type:bt_open },
      { kind:'block', type:'python_file_open' },
      { kind:'block', type:'python_file_read' },
      { kind:'block', type:'python_file_readline' },
      { kind:'block', type:'python_file_readlines' },
      { kind:'block', type:'python_file_write' },
      { kind:'block', type:'python_file_writelines' },
      { kind:'block', type:'python_file_close' },
    ]},
    { kind:'category', name:'File System', categorystyle:'io_category', contents:[
      { kind:'block', type:'python_os_path_exists' },
      { kind:'block', type:'python_os_path_isfile' },
      { kind:'block', type:'python_os_path_isdir' },
      { kind:'block', type:'python_os_path_listdir' },
      { kind:'block', type:'python_os_path_mkdir' },
      { kind:'block', type:'python_os_path_remove' },
      { kind:'block', type:'python_os_path_rename' },
    ]},
    { kind:'category', name:'DateTime', categorystyle:'builtin_category', contents:[
      { kind:'block', type:'python_datetime_now' },
      { kind:'block', type:'python_datetime_date' },
      { kind:'block', type:'python_datetime_time' },
      { kind:'block', type:'python_datetime_today' },
      { kind:'block', type:'python_datetime_strftime' },
      { kind:'block', type:'python_timedelta' },
    ]},
    { kind:'category', name:'Math', categorystyle:'math_category', contents:[
      { kind:'block', type:'python_arithmetic' },
      { kind:'block', type:'python_index' },
      { kind:'block', type:bt_abs },
      { kind:'block', type:bt_round },
      { kind:'block', type:bt_min },
      { kind:'block', type:bt_max },
      { kind:'block', type:bt_sum },
      { kind:'block', type:bt_pow },
      { kind:'block', type:bt_divmod },
      { kind:'block', type:'python_math_sqrt' },
      { kind:'block', type:'python_math_sin' },
      { kind:'block', type:'python_math_cos' },
      { kind:'block', type:'python_math_tan' },
      { kind:'block', type:'python_math_exp' },
      { kind:'block', type:'python_math_log' },
      { kind:'block', type:'python_math_log10' },
      { kind:'block', type:'python_math_ceil' },
      { kind:'block', type:'python_math_floor' },
      { kind:'block', type:'python_math_factorial' },
      { kind:'block', type:'python_math_degrees' },
      { kind:'block', type:'python_math_radians' },
      { kind:'block', type:'python_math_pi' },
      { kind:'block', type:'python_math_e' },
    ]},
    { kind:'category', name:'Random', categorystyle:'math_category', contents:[
      { kind:'block', type:'python_random_randint' },
      { kind:'block', type:'python_random_choice' },
      { kind:'block', type:'python_random_random' },
      { kind:'block', type:'python_random_uniform' },
      { kind:'block', type:'python_random_shuffle' },
      { kind:'block', type:'python_random_sample' },
    ]},
    { kind:'category', name:'Text', categorystyle:'text_category', contents:[
      { kind:'block', type:'python_str_method' },
      { kind:'block', type:'python_str_split' },
      { kind:'block', type:'python_str_join' },
      { kind:'block', type:'python_str_replace' },
      { kind:'block', type:'python_str_find' },
      { kind:'block', type:'python_str_rfind' },
      { kind:'block', type:'python_str_index' },
      { kind:'block', type:'python_str_rindex' },
      { kind:'block', type:'python_str_count' },
      { kind:'block', type:'python_str_slice' },
      { kind:'block', type:'python_str_format_method' },
      { kind:'block', type:'python_str_isdigit' },
      { kind:'block', type:'python_str_isalpha' },
      { kind:'block', type:'python_str_isalnum' },
      { kind:'block', type:'python_str_isspace' },
      { kind:'block', type:'python_str_islower' },
      { kind:'block', type:'python_str_isupper' },
      { kind:'block', type:'python_str_istitle' },
      { kind:'block', type:bt_chr },
      { kind:'block', type:bt_ord },
      { kind:'block', type:bt_ascii },
      { kind:'block', type:bt_repr },
      { kind:'block', type:bt_format },
    ]},
    { kind:'category', name:'Lists & Seqs', categorystyle:'list_category', contents:[
      { kind:'block', type:bt_len },
      { kind:'block', type:bt_sorted },
      { kind:'block', type:bt_reversed },
      { kind:'block', type:bt_enumerate },
      { kind:'block', type:bt_zip },
      { kind:'block', type:bt_map },
      { kind:'block', type:bt_filter },
      { kind:'block', type:bt_all },
      { kind:'block', type:bt_any },
      { kind:'block', type:bt_next },
      { kind:'block', type:bt_iter },
      { kind:'block', type:bt_slice },
      { kind:'block', type:'python_list_append' },
      { kind:'block', type:'python_list_extend' },
      { kind:'block', type:'python_list_insert' },
      { kind:'block', type:'python_list_remove' },
      { kind:'block', type:'python_list_pop' },
      { kind:'block', type:'python_list_clear' },
      { kind:'block', type:'python_list_sort' },
      { kind:'block', type:'python_list_reverse' },
      { kind:'block', type:'python_list_index' },
      { kind:'block', type:'python_list_count' },
    ]},
    { kind:'category', name:'Dictionaries', categorystyle:'dict_category', contents:[
      { kind:'block', type:'python_dict_get' },
      { kind:'block', type:'python_dict_pop' },
      { kind:'block', type:'python_dict_keys' },
      { kind:'block', type:'python_dict_values' },
      { kind:'block', type:'python_dict_items' },
      { kind:'block', type:'python_dict_update' },
      { kind:'block', type:'python_dict_clear' },
      { kind:'block', type:'python_dict_setdefault' },
    ]},
    { kind:'category', name:'Type Convert', categorystyle:'builtin_category', contents:[
      { kind:'block', type:bt_int },
      { kind:'block', type:bt_float },
      { kind:'block', type:bt_str },
      { kind:'block', type:bt_bool },
      { kind:'block', type:bt_list },
      { kind:'block', type:bt_tuple },
      { kind:'block', type:bt_set },
      { kind:'block', type:bt_dict },
      { kind:'block', type:bt_bytes },
      { kind:'block', type:bt_bytearray },
      { kind:'block', type:bt_frozenset },
      { kind:'block', type:bt_complex },
      { kind:'block', type:bt_memoryview },
      { kind:'block', type:bt_hex },
      { kind:'block', type:bt_oct },
      { kind:'block', type:bt_bin },
    ]},
    { kind:'category', name:'Inspect', colour:'#84cc16', contents:[
      { kind:'block', type:bt_type },
      { kind:'block', type:bt_isinstance },
      { kind:'block', type:bt_issubclass },
      { kind:'block', type:bt_hasattr },
      { kind:'block', type:bt_getattr },
      { kind:'block', type:bt_setattr },
      { kind:'block', type:bt_delattr },
      { kind:'block', type:bt_dir },
      { kind:'block', type:bt_vars },
      { kind:'block', type:bt_id },
      { kind:'block', type:bt_hash },
      { kind:'block', type:bt_callable },
      { kind:'block', type:bt_globals },
      { kind:'block', type:bt_locals },
      { kind:'block', type:bt_super },
      { kind:'block', type:bt_eval },
      { kind:'block', type:bt_exec },
      { kind:'block', type:bt_compile },
      { kind:'block', type:bt_range2 },
      { kind:'block', type:bt_object },
    ]},
    { kind:'category', name:'Imports', categorystyle:'import_category', contents:[
      { kind:'block', type:'python_import' },
      { kind:'block', type:'python_from_import' },
    ]},
    { kind:'category', name:'Errors', categorystyle:'error_category', contents:[
      { kind:'block', type:'python_try' },
      { kind:'block', type:'python_try_finally' },
      { kind:'block', type:'python_raise' },
      { kind:'block', type:'python_assert' },
    ]},
    { kind:'category', name:'Async', categorystyle:'async_category', contents:[
      { kind:'block', type:'python_async_def' },
      { kind:'block', type:'python_await' },
    ]},
    { kind:'category', name:'Advanced', colour:'#3f3f46', contents:[
      { kind:'block', type:'python_raw' },
      { kind:'block', type:'python_multiline_code' },
      { kind:'block', type:'python_comment' },
      { kind:'block', type:'python_pass' },
    ]},
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC IMPORT BLOCKS (with arg toggle: compact ↔ expanded)
// ═══════════════════════════════════════════════════════════════════════════════

export function registerImportBlocks(moduleData) {
  const { name: modName, functions = [], classes = [], constants = [] } = moduleData;
  const blocks = [];
  const hue = hashColor(modName);

  functions.forEach((fn) => {
    const blockType = `import_${modName}_${fn.name}`;
    if (Blockly.Blocks[blockType]) {
      blocks.push({ kind: 'block', type: blockType });
      return;
    }
    const params = fn.params || [];

    Blockly.Blocks[blockType] = {
      init: function () {
        this.expandedMode_ = false;
        this.params_ = params;
        this.buildCompact_();
        this.setOutput(true, null);
        this.setColour(hue);
        this.setTooltip(`${modName}.${fn.name}(${params.join(', ')})`);
      },
      buildCompact_: function () {
        this.removeAllInputs_();
        if (this.params_.length > 0) {
          this.appendDummyInput('MAIN')
            .appendField(`${modName}.${fn.name}(`)
            .appendField(new Blockly.FieldTextInput(this.params_.join(', ')), 'ARGS')
            .appendField(')');
        } else {
          this.appendDummyInput('MAIN').appendField(`${modName}.${fn.name}()`);
        }
        this.expandedMode_ = false;
      },
      buildExpanded_: function () {
        this.removeAllInputs_();
        this.appendDummyInput('HEADER').appendField(`${modName}.${fn.name}(`);
        this.params_.forEach((p, i) => {
          this.appendDummyInput('P' + i)
            .appendField('  ' + p + '=')
            .appendField(new Blockly.FieldTextInput(p), 'ARG_' + i);
        });
        this.appendDummyInput('FOOTER').appendField(')');
        this.expandedMode_ = true;
      },
      removeAllInputs_: function () {
        while (this.inputList.length > 0) {
          this.removeInput(this.inputList[0].name);
        }
      },
      customContextMenu: function (options) {
        if (this.params_.length > 1) {
          options.unshift({
            text: this.expandedMode_ ? 'Compact args (single box)' : 'Expand args (one per param)',
            enabled: true,
            callback: () => {
              if (this.expandedMode_) {
                // Collect expanded values
                const vals = this.params_.map((_, i) => this.getFieldValue('ARG_' + i) || this.params_[i]);
                this.buildCompact_();
                const argsField = this.getField('ARGS');
                if (argsField) argsField.setValue(vals.join(', '));
              } else {
                // Split compact value
                const argsStr = this.getFieldValue('ARGS') || this.params_.join(', ');
                const vals = argsStr.split(',').map(s => s.trim());
                this.buildExpanded_();
                this.params_.forEach((_, i) => {
                  const field = this.getField('ARG_' + i);
                  if (field && vals[i]) field.setValue(vals[i]);
                });
              }
            }
          });
        }
      },
    };

    pythonGenerator.forBlock[blockType] = function (block) {
      if (block.expandedMode_) {
        const args = block.params_.map((_, i) => block.getFieldValue('ARG_' + i) || block.params_[i]);
        return [`${modName}.${fn.name}(${args.join(', ')})`, Order.FUNCTION_CALL];
      }
      const a = block.getFieldValue('ARGS') || '';
      return [`${modName}.${fn.name}(${a})`, Order.FUNCTION_CALL];
    };

    blocks.push({ kind: 'block', type: blockType });
  });

  // Statement versions
  functions.slice(0, 20).forEach((fn) => {
    const blockType = `import_${modName}_${fn.name}_stmt`;
    if (Blockly.Blocks[blockType]) {
      blocks.push({ kind: 'block', type: blockType });
      return;
    }
    const params = fn.params || [];

    Blockly.Blocks[blockType] = {
      init: function () {
        this.expandedMode_ = false;
        this.params_ = params;
        this.buildCompact_();
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(hue);
      },
      buildCompact_: function() {
        this.removeAllInputs_();
        if (this.params_.length > 0) {
          this.appendDummyInput('MAIN')
            .appendField(`${modName}.${fn.name}(`)
            .appendField(new Blockly.FieldTextInput(this.params_.join(', ')), 'ARGS')
            .appendField(')');
        } else {
          this.appendDummyInput('MAIN').appendField(`${modName}.${fn.name}()`);
        }
        this.expandedMode_ = false;
      },
      buildExpanded_: function() {
        this.removeAllInputs_();
        this.appendDummyInput('HEADER').appendField(`${modName}.${fn.name}(`);
        this.params_.forEach((p, i) => {
          this.appendDummyInput('P' + i)
            .appendField('  ' + p + '=')
            .appendField(new Blockly.FieldTextInput(p), 'ARG_' + i);
        });
        this.appendDummyInput('FOOTER').appendField(')');
        this.expandedMode_ = true;
      },
      removeAllInputs_: function() {
        while (this.inputList.length > 0) this.removeInput(this.inputList[0].name);
      },
      customContextMenu: function(options) {
        if (this.params_.length > 1) {
          options.unshift({
            text: this.expandedMode_ ? 'Compact args (single box)' : 'Expand args (one per param)',
            enabled: true,
            callback: () => {
              if (this.expandedMode_) {
                const vals = this.params_.map((_,i)=>this.getFieldValue('ARG_'+i)||this.params_[i]);
                this.buildCompact_();
                const f = this.getField('ARGS');
                if(f) f.setValue(vals.join(', '));
              } else {
                const vals = (this.getFieldValue('ARGS')||this.params_.join(', ')).split(',').map(s=>s.trim());
                this.buildExpanded_();
                this.params_.forEach((_,i)=>{const f=this.getField('ARG_'+i);if(f&&vals[i]) f.setValue(vals[i]);});
              }
            }
          });
        }
      },
    };

    pythonGenerator.forBlock[blockType] = function(block) {
      if (block.expandedMode_) {
        const args = block.params_.map((_,i)=>block.getFieldValue('ARG_'+i)||block.params_[i]);
        return `${modName}.${fn.name}(${args.join(', ')})\n`;
      }
      return `${modName}.${fn.name}(${block.getFieldValue('ARGS')||''})\n`;
    };

    blocks.push({ kind: 'block', type: blockType });
  });

  // Classes
  classes.forEach((cls) => {
    const blockType = `import_${modName}_${cls.name}`;
    if (Blockly.Blocks[blockType]) { blocks.push({kind:'block',type:blockType}); return; }
    Blockly.Blocks[blockType] = {
      init: function() {
        this.appendDummyInput().appendField(`${modName}.${cls.name}(`).appendField(new Blockly.FieldTextInput(''),'ARGS').appendField(')');
        this.setOutput(true,null);
        this.setColour(hue);
      }
    };
    pythonGenerator.forBlock[blockType] = function(block) {
      return [`${modName}.${cls.name}(${block.getFieldValue('ARGS')||''})`, Order.FUNCTION_CALL];
    };
    blocks.push({kind:'block',type:blockType});
  });

  // Constants
  constants.slice(0,15).forEach((c) => {
    const blockType = `import_${modName}_const_${c.name}`;
    if (Blockly.Blocks[blockType]) { blocks.push({kind:'block',type:blockType}); return; }
    Blockly.Blocks[blockType] = {
      init: function() {
        this.appendDummyInput().appendField(`${modName}.${c.name}`);
        this.setOutput(true,null);
        this.setColour(hue);
      }
    };
    pythonGenerator.forBlock[blockType] = function() {
      return [`${modName}.${c.name}`, Order.ATOMIC];
    };
    blocks.push({kind:'block',type:blockType});
  });

  return {
    kind: 'category',
    name: modName,
    colour: hueToHex(hue),
    contents: blocks.length > 0 ? blocks : [{kind:'label',text:'No blocks available'}],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM BLOCKS (My Blocks / Scratch-style)
// ═══════════════════════════════════════════════════════════════════════════════

export function registerCustomBlock(blockDef) {
  const { name, params = [], body_code = '', description = '', color = '#8b5cf6' } = blockDef;
  const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_');
  const callerType = `myblock_call_${safeName}`;
  const hue = hexToHue(color);
  const paramList = Array.isArray(params) ? params : [];

  if (!Blockly.Blocks[callerType]) {
    Blockly.Blocks[callerType] = {
      init: function() {
        if (paramList.length > 0) {
          this.appendDummyInput().appendField(safeName + '(').appendField(new Blockly.FieldTextInput(paramList.join(', ')), 'ARGS').appendField(')');
        } else {
          this.appendDummyInput().appendField(safeName + '()');
        }
        this.setPreviousStatement(true,null);
        this.setNextStatement(true,null);
        this.setColour(hue);
        this.setTooltip(description || `Custom block: ${safeName}`);
      }
    };
    pythonGenerator.forBlock[callerType] = function(block) {
      if (paramList.length > 0) return `${safeName}(${block.getFieldValue('ARGS') || paramList.join(', ')})\n`;
      return `${safeName}()\n`;
    };
  }

  const exprType = `myblock_expr_${safeName}`;
  if (!Blockly.Blocks[exprType]) {
    Blockly.Blocks[exprType] = {
      init: function() {
        if (paramList.length > 0) {
          this.appendDummyInput().appendField(safeName + '(').appendField(new Blockly.FieldTextInput(paramList.join(', ')), 'ARGS').appendField(')');
        } else {
          this.appendDummyInput().appendField(safeName + '()');
        }
        this.setOutput(true,null);
        this.setColour(hue);
        this.setTooltip(description || `${safeName} (expression)`);
      }
    };
    pythonGenerator.forBlock[exprType] = function(block) {
      if (paramList.length > 0) return [`${safeName}(${block.getFieldValue('ARGS') || paramList.join(', ')})`, Order.FUNCTION_CALL];
      return [`${safeName}()`, Order.FUNCTION_CALL];
    };
  }

  return [
    { kind: 'block', type: callerType },
    { kind: 'block', type: exprType },
  ];
}

export function getCustomBlockDefinitions(customBlocks) {
  let code = '';
  for (const block of customBlocks) {
    const safeName = block.name.replace(/[^a-zA-Z0-9_]/g, '_');
    const paramList = Array.isArray(block.params) ? block.params : [];
    const bodyLines = (block.body_code || 'pass').split('\n').map(l => INDENT + l).join('\n');
    code += `def ${safeName}(${paramList.join(', ')}):\n${bodyLines}\n\n`;
  }
  return code;
}

// ─── Color helpers ──────────────────────────────────────────────────────────
function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash % 360);
}
function hueToHex(hue) {
  const h=hue/360,s=0.6,l=0.5,a=s*Math.min(l,1-l);
  const f=n=>{const k=(n+h*12)%12;return Math.round(255*(l-a*Math.max(Math.min(k-3,9-k,1),-1))).toString(16).padStart(2,'0');};
  return `#${f(0)}${f(8)}${f(4)}`;
}
function hexToHue(hex) {
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
  let h=0;
  if(mx!==mn){const d=mx-mn;if(mx===r)h=((g-b)/d+(g<b?6:0))/6;else if(mx===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;}
  return Math.round(h*360);
}

export { pythonGenerator };
