# Contributing to PyForge Visual

Thank you for your interest in contributing to PyForge Visual! This guide will help you add new blocks, features, and improvements.

## 📋 Table of Contents

- [Adding New Blocks](#adding-new-blocks)
- [Block Structure](#block-structure)
- [Code Generator](#code-generator)
- [Adding to Toolbox](#adding-to-toolbox)
- [Testing Your Blocks](#testing-your-blocks)
- [Best Practices](#best-practices)

## 🧩 Adding New Blocks

Blocks are defined in `/frontend/src/blocks/pythonBlocks.js`. Each block has two parts:
1. **Block Definition** (Blockly.Blocks[...])
2. **Code Generator** (pythonGenerator.forBlock[...])

### Block Structure

Here's the anatomy of a block:

```javascript
// 1. Define the block's appearance and behavior
Blockly.Blocks['python_my_block'] = {
  init: function() {
    // Add inputs (what the user can provide)
    this.appendDummyInput()
      .appendField('my block');  // Label
    
    this.appendValueInput('VALUE')  // Input that accepts another block
      .setCheck('Number');  // Optional: limit input type
    
    // Set block properties
    this.setOutput(true, 'Number');  // This block returns a value
    // OR for statement blocks:
    // this.setPreviousStatement(true, null);
    // this.setNextStatement(true, null);
    
    this.setStyle('math_blocks');  // Color/style category
    this.setTooltip('My custom block tooltip');
  }
};

// 2. Define how to generate Python code
pythonGenerator.forBlock['python_my_block'] = function(block, gen) {
  // Get values from inputs
  const value = gen.valueToCode(block, 'VALUE', Order.NONE) || '0';
  
  // Return generated code
  // For expression blocks: [code, order]
  return [`my_function(${value})`, Order.FUNCTION_CALL];
  
  // For statement blocks: code + '\n'
  // return `my_function(${value})\n`;
};
```

### Example: Adding a Simple Block

Let's add a `capitalize()` string method block:

```javascript
// 1. Block Definition
Blockly.Blocks['python_str_capitalize'] = {
  init: function() {
    this.appendValueInput('STRING')
      .appendField('capitalize');
    this.setInputsInline(true);
    this.setOutput(true, 'String');
    this.setStyle('text_blocks');
    this.setTooltip('Capitalize first letter of string');
  }
};

// 2. Code Generator
pythonGenerator.forBlock['python_str_capitalize'] = function(block, gen) {
  const str = gen.valueToCode(block, 'STRING', Order.MEMBER) || "''";
  return [`${str}.capitalize()`, Order.FUNCTION_CALL];
};
```

### Example: Adding a Statement Block

Let's add a `time.sleep()` block:

```javascript
Blockly.Blocks['python_time_sleep'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('sleep for');
    this.appendValueInput('SECONDS')
      .setCheck('Number');
    this.appendDummyInput()
      .appendField('seconds');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('builtin_blocks');
    this.setTooltip('Pause execution for specified seconds');
  }
};

pythonGenerator.forBlock['python_time_sleep'] = function(block, gen) {
  const seconds = gen.valueToCode(block, 'SECONDS', Order.NONE) || '1';
  return `time.sleep(${seconds})\n`;
};
```

### Example: Adding a Block with Dropdown

```javascript
Blockly.Blocks['python_file_mode'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('file mode:')
      .appendField(new Blockly.FieldDropdown([
        ['read', '"r"'],
        ['write', '"w"'],
        ['append', '"a"'],
        ['binary read', '"rb"'],
        ['binary write', '"wb"']
      ]), 'MODE');
    this.setOutput(true, 'String');
    this.setStyle('io_blocks');
  }
};

pythonGenerator.forBlock['python_file_mode'] = function(block) {
  return [block.getFieldValue('MODE'), Order.ATOMIC];
};
```

### Example: Adding a Block with Text Input

```javascript
Blockly.Blocks['python_regex_match'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('regex match');
    this.appendValueInput('STRING')
      .appendField('string:');
    this.appendDummyInput()
      .appendField('pattern:')
      .appendField(new Blockly.FieldTextInput(r'\d+'), 'PATTERN');
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setStyle('text_blocks');
  }
};

pythonGenerator.forBlock['python_regex_match'] = function(block, gen) {
  const str = gen.valueToCode(block, 'STRING', Order.NONE) || "''";
  const pattern = block.getFieldValue('PATTERN');
  return [`re.match(r'${pattern}', ${str})`, Order.FUNCTION_CALL];
};
```

## 📚 Code Generator

The code generator determines the Python code output. Key concepts:

### Order of Operations

Use `Order` to ensure correct parentheses:

```javascript
Order.ATOMIC         // Literals, variables: x, 42, "hello"
Order.MEMBER         // Member access: obj.attr, list[0]
Order.FUNCTION_CALL  // Function calls: func(args)
Order.EXPONENTIATION // x ** y
Order.UNARY_SIGN     // -x, +x
Order.BITWISE_NOT    // ~x
Order.MULTIPLICATIVE // *, /, //, %
Order.ADDITIVE       // +, -
Order.BITWISE_SHIFT  // <<, >>
Order.BITWISE_AND    // &
Order.BITWISE_XOR    // ^
Order.BITWISE_OR     // |
Order.RELATIONAL     // <, >, <=, >=, !=, ==, in, not in, is, is not
Order.LOGICAL_NOT    // not
Order.LOGICAL_AND    // and
Order.LOGICAL_OR     // or
Order.CONDITIONAL    // x if condition else y
Order.LAMBDA         // lambda x: x
Order.NONE           // No specific order
```

### Getting Input Values

```javascript
// Get value from input (returns code string)
const value = gen.valueToCode(block, 'INPUT_NAME', Order.NONE) || 'default';

// Get field value (text input, dropdown, etc.)
const text = block.getFieldValue('FIELD_NAME');

// Get statement code (for statement inputs)
const body = gen.statementToCode(block, 'DO') || '  pass\n';
```

## 📦 Adding to Toolbox

After creating a block, add it to the toolbox in the `toolboxConfig` object:

```javascript
export const toolboxConfig = {
  kind: 'categoryToolbox',
  contents: [
    // ... existing categories ...
    
    { kind:'category', name:'Text', categorystyle:'text_category', contents:[
      { kind:'block', type:'python_str_method' },
      { kind:'block', type:'python_str_capitalize' },  // ← Add your block here
      // ... more blocks ...
    ]},
    
    // ... more categories ...
  ]
};
```

### Creating a New Category

```javascript
{ kind:'category', name:'My Category', colour:'#FF6B6B', contents:[
  { kind:'block', type:'my_first_block' },
  { kind:'block', type:'my_second_block' },
]},
```

Available category styles:
- `logic_category` (cyan: #06b6d4)
- `loop_category` (purple: #8b5cf6)
- `math_category` (orange: #f59e0b)
- `text_category` (green: #10b981)
- `list_category` (pink: #ec4899)
- `variable_category` (yellow: #FFD43B)
- `procedure_category` (indigo: #6366f1)
- `io_category` (orange: #f97316)
- `class_category` (teal: #14b8a6)
- `error_category` (red: #ef4444)
- `import_category` (cyan: #22d3ee)
- `dict_category` (orange: #fb923c)
- `builtin_category` (lime: #84cc16)

## 🧪 Testing Your Blocks

### Manual Testing

1. Save your changes to `pythonBlocks.js`
2. Reload the frontend (hot reload should work)
3. Check the toolbox for your new block
4. Drag it to the workspace
5. Connect it to other blocks
6. Click "Run" and verify the output
7. Check the generated code in the Code Preview panel

### Testing Checklist

- [ ] Block appears in correct category
- [ ] Block can be dragged to workspace
- [ ] Inputs accept appropriate values
- [ ] Block connects properly to other blocks
- [ ] Generated code is syntactically correct
- [ ] Generated code executes without errors
- [ ] Tooltip is helpful and accurate
- [ ] Block styling matches category

## ✨ Best Practices

### 1. **Naming Conventions**

- Block types: `python_category_name` (e.g., `python_str_capitalize`)
- Use lowercase with underscores
- Be descriptive but concise

### 2. **Styling**

- Use appropriate `setStyle()` for color consistency
- Keep block appearance clean and readable
- Limit the number of inputs per block

### 3. **Code Generation**

- Always provide default values for inputs
- Use proper Order for precedence
- Add newlines (`\n`) for statement blocks
- Return arrays `[code, Order]` for expression blocks

### 4. **Tooltips**

- Explain what the block does
- Mention any important parameters
- Keep it concise (1-2 sentences)

### 5. **Input Validation**

```javascript
// Good: Provide sensible defaults
const value = gen.valueToCode(block, 'VALUE', Order.NONE) || '0';

// Good: Type checking where appropriate
this.appendValueInput('NUMBER').setCheck('Number');
```

### 6. **Documentation**

- Add comments above complex blocks
- Document any non-obvious behavior
- Include examples for tricky generators

## 🔍 Common Patterns

### Pattern 1: Simple Method Block

```javascript
Blockly.Blocks['python_list_append'] = {
  init: function() {
    this.appendValueInput('LIST').appendField('list');
    this.appendDummyInput().appendField('.append(');
    this.appendValueInput('VALUE');
    this.appendDummyInput().appendField(')');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('list_blocks');
  }
};

pythonGenerator.forBlock['python_list_append'] = function(block, gen) {
  const list = gen.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
  const value = gen.valueToCode(block, 'VALUE', Order.NONE) || 'None';
  return `${list}.append(${value})\n`;
};
```

### Pattern 2: Block with Multiple Options

```javascript
Blockly.Blocks['python_str_case'] = {
  init: function() {
    this.appendValueInput('STRING');
    this.appendDummyInput()
      .appendField('.')
      .appendField(new Blockly.FieldDropdown([
        ['upper()', 'upper'],
        ['lower()', 'lower'],
        ['title()', 'title'],
        ['swapcase()', 'swapcase'],
        ['capitalize()', 'capitalize']
      ]), 'METHOD')
      .appendField('()');
    this.setInputsInline(true);
    this.setOutput(true, 'String');
    this.setStyle('text_blocks');
  }
};

pythonGenerator.forBlock['python_str_case'] = function(block, gen) {
  const str = gen.valueToCode(block, 'STRING', Order.MEMBER) || "''";
  const method = block.getFieldValue('METHOD');
  return [`${str}.${method}()`, Order.FUNCTION_CALL];
};
```

### Pattern 3: Batch Creating Similar Blocks

```javascript
// Create multiple similar blocks at once
['sin', 'cos', 'tan', 'sqrt', 'log'].forEach(func => {
  const blockType = `python_math_${func}`;
  
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField(`math.${func}(`);
      this.appendValueInput('VALUE').setCheck('Number');
      this.appendDummyInput().appendField(')');
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setStyle('math_blocks');
    }
  };
  
  pythonGenerator.forBlock[blockType] = function(block, gen) {
    const val = gen.valueToCode(block, 'VALUE', Order.NONE) || '0';
    return [`math.${func}(${val})`, Order.FUNCTION_CALL];
  };
});
```

## 🐛 Debugging

### Common Issues

**Block doesn't appear:**
- Check if it's added to toolboxConfig
- Verify no syntax errors in block definition
- Check browser console for errors

**Code generation fails:**
- Ensure generator returns correct format
- Check Order usage
- Verify input names match

**Block styling wrong:**
- Verify setStyle() uses valid category
- Check if custom styles are defined in theme

### Debug Tips

```javascript
// Add console.log in generator to see what's happening
pythonGenerator.forBlock['python_my_block'] = function(block, gen) {
  const value = gen.valueToCode(block, 'VALUE', Order.NONE) || '0';
  console.log('Generating code for my_block, value:', value);
  return [`my_func(${value})`, Order.FUNCTION_CALL];
};
```

## 📬 Submitting Changes

If you'd like to contribute your blocks:

1. Fork the repository
2. Create a feature branch
3. Add your blocks following these guidelines
4. Test thoroughly
5. Create a pull request with:
   - Description of new blocks
   - Screenshots if applicable
   - Test cases or examples

## 💡 Ideas for New Blocks

- **Regex operations**: findall, sub, search
- **JSON operations**: loads, dumps, pretty print
- **HTTP requests**: GET, POST, etc.
- **Database operations**: SQL queries
- **Image processing**: PIL/Pillow operations
- **Data visualization**: matplotlib/seaborn blocks
- **CSV operations**: reader, writer, DictReader
- **Turtle graphics**: drawing blocks
- **Web scraping**: BeautifulSoup blocks

## 🤝 Get Help

- Check existing blocks for reference
- Review Blockly documentation: https://developers.google.com/blockly
- Open an issue for questions

---

Happy block building! 🎉
